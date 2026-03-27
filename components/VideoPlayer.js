import { useState, useRef, useEffect } from 'react'

const C = {
  coral:    '#E8533A',
  bg:       '#0b0b14',
  track:    '#1a1a2e',
  border:   '#1e1e30',
  text:     '#d0d0e0',
  sub:      '#666',
  card:     '#111120',
}

const PLACEHOLDER_DURATION = 35  // segundos para modo sem src

function formatTime(s) {
  const m   = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function Spinner() {
  return (
    <span style={{
      width: '13px', height: '13px',
      border: '2px solid #2a2a3a', borderTop: `2px solid ${C.coral}`,
      borderRadius: '50%', display: 'inline-block',
      animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  )
}

export default function VideoPlayer({
  src,
  tipo       = 'audio',
  label,
  tipoMidia,
  estrutura,
  locucaoOriginal,
  onNovosDados,
}) {
  const mediaRef                    = useRef(null)
  const trackRef                    = useRef(null)
  const [comentarios,  setCom]      = useState([])
  const [tempoAtual,   setTempo]    = useState(0)
  const [duracao,      setDur]      = useState(0)
  const [tocando,      setTocando]  = useState(false)
  const [atualizando,  setAtu]      = useState(false)
  const [erro,         setErro]     = useState(null)
  const [inputAtivo,   setInput]    = useState(null)   // id do comentário com input aberto

  // Modo placeholder: sem src, mas timeline interativa com duração fixa
  const placeholder = !src
  useEffect(() => {
    if (placeholder) setDur(PLACEHOLDER_DURATION)
  }, [placeholder])

  // ── playback real ──────────────────────────────────────────────
  function handleTimeUpdate() {
    setTempo(mediaRef.current?.currentTime || 0)
  }
  function handleMetadata() {
    setDur(mediaRef.current?.duration || 0)
  }
  function handlePlay()  { setTocando(true)  }
  function handlePause() { setTocando(false) }
  function handleEnded() { setTocando(false) }

  function togglePlay() {
    if (!mediaRef.current) return
    tocando ? mediaRef.current.pause() : mediaRef.current.play()
  }

  function irPara(t) {
    if (placeholder) { setTempo(t); return }
    if (mediaRef.current) {
      mediaRef.current.currentTime = t
      mediaRef.current.play()
    }
  }

  // ── timeline click ─────────────────────────────────────────────
  function handleTrackClick(e) {
    if (!duracao) return
    const rect  = trackRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const t     = ratio * duracao

    if (!placeholder && mediaRef.current) {
      mediaRef.current.currentTime = t
      mediaRef.current.pause()
    }
    setTempo(t)

    const novo = { id: Date.now(), tempo: t, texto: '' }
    setCom(prev => [...prev, novo])
    setInput(novo.id)
    setTimeout(() => document.getElementById(`vc-${novo.id}`)?.focus(), 50)
  }

  function setTexto(id, texto) {
    setCom(prev => prev.map(c => c.id === id ? { ...c, texto } : c))
  }

  function remover(id) {
    setCom(prev => prev.filter(c => c.id !== id))
    if (inputAtivo === id) setInput(null)
  }

  // ── atualizar via API ──────────────────────────────────────────
  async function atualizar() {
    if (!comentarios.length || atualizando) return
    setAtu(true)
    setErro(null)
    const feedback = [...comentarios]
      .sort((a, b) => a.tempo - b.tempo)
      .map(c => `${formatTime(c.tempo)} — ${c.texto || 'sem descrição'}`)
      .join('\n')
    try {
      const res = await fetch('/api/atualizar-midia', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo:            tipoMidia || tipo,
          feedback,
          estrutura,
          promptOriginal:  '',
          locucaoOriginal: locucaoOriginal || '',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.erro || data.error)
      setCom([])
      setInput(null)
      onNovosDados?.(data)
    } catch (e) {
      setErro(e.message)
    } finally {
      setAtu(false)
    }
  }

  const progress    = duracao > 0 ? (tempoAtual / duracao) * 100 : 0
  const ordenados   = [...comentarios].sort((a, b) => a.tempo - b.tempo)
  const temComent   = comentarios.length > 0

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {label && (
        <p style={{ margin: '0 0 10px', color: C.sub, fontSize: '11px', letterSpacing: '0.04em' }}>
          {label}
        </p>
      )}

      {/* ── Área de vídeo / áudio ── */}
      <div style={{
        background: '#06060f',
        borderRadius: '10px 10px 0 0',
        border: `1px solid ${C.border}`,
        borderBottom: 'none',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Player real (audio) — oculto visualmente mas funcional */}
        {!placeholder && (
          <audio
            ref={mediaRef}
            src={src}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleMetadata}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0 }}
          />
        )}

        {/* Tela do "vídeo" — waveform placeholder visual */}
        <div style={{
          height: '180px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', position: 'relative',
          background: 'linear-gradient(135deg, #08080f 0%, #10101e 100%)',
        }}>
          {/* Ondas de áudio decorativas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', opacity: 0.18 }}>
            {Array.from({ length: 48 }, (_, i) => {
              const h = 10 + Math.abs(Math.sin(i * 0.7) * 55 + Math.cos(i * 1.3) * 25)
              return (
                <div key={i} style={{
                  width: '3px', height: `${h}px`,
                  background: i / 48 < progress / 100 ? C.coral : '#5a5a8a',
                  borderRadius: '2px', transition: 'background 0.1s',
                }} />
              )
            })}
          </div>

          {/* Ícone central */}
          {placeholder ? (
            <div style={{
              position: 'absolute', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '8px',
            }}>
              <div style={{ color: '#3a3a5a', fontSize: '32px' }}>▶</div>
              <span style={{ color: '#2a2a4a', fontSize: '11px', letterSpacing: '0.06em' }}>
                {tipoMidia === 'apresentadora'
                  ? 'VÍDEO EM PRODUÇÃO — ANOTAÇÕES ATIVAS'
                  : 'ÁUDIO EM PRODUÇÃO — ANOTAÇÕES ATIVAS'}
              </span>
            </div>
          ) : (
            <button
              onClick={togglePlay}
              style={{
                position: 'absolute',
                width: '48px', height: '48px', borderRadius: '50%',
                background: `${C.coral}cc`, border: `2px solid ${C.coral}`,
                color: '#fff', fontSize: '18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 20px ${C.coral}44`,
                transition: 'transform 0.1s',
              }}
            >
              {tocando ? '⏸' : '▶'}
            </button>
          )}

          {/* Timestamp overlay */}
          <span style={{
            position: 'absolute', bottom: '10px', right: '12px',
            color: '#3a3a5a', fontSize: '11px', fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.05em',
          }}>
            {formatTime(tempoAtual)} / {formatTime(duracao || 0)}
          </span>
        </div>
      </div>

      {/* ── Timeline Frame.io ── */}
      <div style={{
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderTop: `1px solid #0f0f1f`,
        borderRadius: '0 0 10px 10px',
        padding: '12px 14px 14px',
      }}>
        {/* Label */}
        <p style={{ margin: '0 0 8px', color: C.sub, fontSize: '10px', letterSpacing: '0.06em' }}>
          CLIQUE NA TIMELINE PARA ADICIONAR ANOTAÇÃO
        </p>

        {/* Track */}
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          style={{
            position: 'relative', height: '8px',
            background: C.track, borderRadius: '4px',
            cursor: 'crosshair', userSelect: 'none',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
          }}
        >
          {/* Preenchimento de progresso */}
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0,
            width: `${progress}%`, background: C.coral,
            borderRadius: '4px', transition: 'width 0.1s',
            pointerEvents: 'none',
          }} />

          {/* Marcadores Frame.io (bandeiras vermelhas) */}
          {duracao > 0 && comentarios.map(c => (
            <div
              key={c.id}
              title={`${formatTime(c.tempo)} — ${c.texto || 'sem descrição'}`}
              style={{
                position: 'absolute',
                left: `${(c.tempo / duracao) * 100}%`,
                top: '-10px',
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}
            >
              {/* Flag vermelha */}
              <div style={{
                width: '10px', height: '8px',
                background: C.coral, borderRadius: '2px 2px 0 0',
                boxShadow: `0 0 6px ${C.coral}88`,
              }} />
              {/* Haste */}
              <div style={{
                width: '2px', height: '18px',
                background: C.coral, opacity: 0.85,
              }} />
            </div>
          ))}

          {/* Cabeçote de posição atual */}
          {duracao > 0 && (
            <div style={{
              position: 'absolute', top: '-5px', bottom: '-5px',
              left: `${progress}%`,
              width: '2px', background: '#fff',
              transform: 'translateX(-50%)', pointerEvents: 'none',
              borderRadius: '1px',
            }} />
          )}
        </div>

        {/* Timestamps abaixo da timeline */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
          <span style={{ color: '#2a2a4a', fontSize: '9px', fontVariantNumeric: 'tabular-nums' }}>00:00</span>
          {duracao > 0 && <span style={{ color: '#2a2a4a', fontSize: '9px', fontVariantNumeric: 'tabular-nums' }}>{formatTime(duracao)}</span>}
        </div>
      </div>

      {/* ── Lista de anotações ── */}
      {ordenados.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p style={{ margin: '0 0 6px', color: C.sub, fontSize: '10px', letterSpacing: '0.06em' }}>
            ANOTAÇÕES ({ordenados.length})
          </p>

          {ordenados.map(c => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              background: inputAtivo === c.id ? '#13131f' : C.card,
              border: `1px solid ${inputAtivo === c.id ? C.coral + '44' : C.border}`,
              borderRadius: '8px', padding: '9px 12px',
              transition: 'border-color 0.15s',
            }}>
              {/* Badge de tempo */}
              <button
                onClick={() => irPara(c.tempo)}
                title="Ir para este ponto"
                style={{
                  background: '#16060a', border: `1px solid ${C.coral}55`,
                  color: C.coral, padding: '3px 9px',
                  borderRadius: '4px', fontSize: '11px', fontWeight: '700',
                  cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
                  fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em',
                }}
              >
                ▶ {formatTime(c.tempo)}
              </button>

              {/* Textarea */}
              <textarea
                id={`vc-${c.id}`}
                value={c.texto}
                onFocus={() => setInput(c.id)}
                onChange={e => setTexto(c.id, e.target.value)}
                placeholder="Descreva o ajuste neste ponto..."
                rows={1}
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  color: C.text, fontSize: '12px', resize: 'none',
                  fontFamily: 'inherit', outline: 'none', lineHeight: '1.6',
                  paddingTop: '2px',
                }}
              />

              {/* Remover */}
              <button
                onClick={() => remover(c.id)}
                style={{
                  background: 'transparent', border: 'none',
                  color: '#444', cursor: 'pointer',
                  fontSize: '18px', padding: '0', lineHeight: 1, flexShrink: 0,
                }}
              >×</button>
            </div>
          ))}

          {/* Botão Atualizar Vídeo */}
          <div style={{ marginTop: '6px' }}>
            <button
              onClick={atualizar}
              disabled={atualizando}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: atualizando ? '#111' : '#180b09',
                border: `1px solid ${C.coral}${atualizando ? '33' : '66'}`,
                color: atualizando ? '#555' : C.coral,
                padding: '10px 20px', borderRadius: '8px',
                fontSize: '12px', fontWeight: '700',
                cursor: atualizando ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {atualizando
                ? <><Spinner /> Gerando novo áudio...</>
                : `Atualizar Vídeo — ${comentarios.length} anotaç${comentarios.length > 1 ? 'ões' : 'ão'}`}
            </button>
            {erro && (
              <p style={{ margin: '6px 0 0', color: '#f87171', fontSize: '11px' }}>{erro}</p>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
