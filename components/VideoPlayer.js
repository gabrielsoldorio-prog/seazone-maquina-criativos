import { useState, useRef } from 'react'

const C = { coral: '#E8533A', border: '#1e1e2e', bg: '#0f0f1a', text: '#c0c0d0' }

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function Spinner() {
  return <span style={{ width: '12px', height: '12px', border: '2px solid #333', borderTop: `2px solid ${C.coral}`, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
}

export default function VideoPlayer({ src, tipo = 'audio', label, tipoMidia, estrutura, locucaoOriginal, onNovosDados }) {
  const mediaRef                  = useRef(null)
  const [comentarios, setCom]     = useState([])
  const [tempoAtual, setTempo]    = useState(0)
  const [duracao, setDur]         = useState(0)
  const [atualizando, setAtu]     = useState(false)
  const [erro, setErro]           = useState(null)

  function addComentarioEmTempo(t) {
    const novo = { id: Date.now(), tempo: t, texto: '' }
    setCom(prev => [...prev, novo])
    if (mediaRef.current) {
      mediaRef.current.currentTime = t
      mediaRef.current.pause()
    }
    // Foca no textarea do novo comentário após render
    setTimeout(() => {
      document.getElementById(`vc-${novo.id}`)?.focus()
    }, 50)
  }

  function handleBarraClick(e) {
    if (!duracao) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const t = x * duracao
    addComentarioEmTempo(t)
  }

  function setTexto(id, texto) {
    setCom(prev => prev.map(c => c.id === id ? { ...c, texto } : c))
  }

  function irPara(t) {
    if (mediaRef.current) {
      mediaRef.current.currentTime = t
      mediaRef.current.play()
    }
  }

  function remover(id) {
    setCom(prev => prev.filter(c => c.id !== id))
  }

  async function atualizar() {
    if (!comentarios.length || atualizando) return
    setAtu(true)
    setErro(null)
    const feedback = comentarios
      .sort((a, b) => a.tempo - b.tempo)
      .map(c => `${formatTime(c.tempo)} — ${c.texto || 'sem descrição'}`)
      .join('\n')
    try {
      const res = await fetch('/api/atualizar-midia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: tipoMidia || tipo,
          feedback,
          estrutura,
          promptOriginal: '',
          locucaoOriginal: locucaoOriginal || ''
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCom([])
      onNovosDados?.(data)
    } catch (e) {
      setErro(e.message)
    } finally {
      setAtu(false)
    }
  }

  if (!src) return (
    <div style={{ background: '#0a0a12', border: '1px dashed #2a2a3e', borderRadius: '10px', padding: '32px', textAlign: 'center', color: '#555', fontSize: '13px' }}>
      {tipoMidia === 'apresentadora'
        ? 'Áudio gerado — vídeo com lip-sync via script de produção'
        : 'Áudio não gerado'}
    </div>
  )

  const comentariosOrdenados = [...comentarios].sort((a, b) => a.tempo - b.tempo)

  return (
    <div>
      {label && <p style={{ margin: '0 0 8px', color: '#555', fontSize: '11px' }}>{label}</p>}

      {/* Player */}
      {tipo === 'video' ? (
        <video
          ref={mediaRef}
          src={src}
          controls
          onTimeUpdate={() => setTempo(mediaRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDur(mediaRef.current?.duration || 0)}
          style={{ width: '100%', borderRadius: '10px', background: '#000' }}
        />
      ) : (
        <audio
          ref={mediaRef}
          src={src}
          controls
          onTimeUpdate={() => setTempo(mediaRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDur(mediaRef.current?.duration || 0)}
          style={{ width: '100%', borderRadius: '8px' }}
        />
      )}

      {/* Timeline clicável */}
      {duracao > 0 && (
        <div style={{ marginTop: '10px' }}>
          <p style={{ margin: '0 0 6px', color: '#555', fontSize: '11px' }}>
            Clique na timeline para pausar e adicionar comentário naquele ponto
          </p>

          {/* Barra */}
          <div
            onClick={handleBarraClick}
            style={{
              position: 'relative', height: '28px',
              background: C.bg, border: `1px solid ${C.border}`,
              borderRadius: '6px', overflow: 'visible', cursor: 'crosshair'
            }}
          >
            {/* Preenchimento de progresso */}
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: `${(tempoAtual / duracao) * 100}%`,
              background: `${C.coral}22`, borderRadius: '5px',
              transition: 'width 0.1s', pointerEvents: 'none'
            }} />

            {/* Cabeçote de posição atual */}
            <div style={{
              position: 'absolute', top: '-3px', bottom: '-3px',
              left: `${(tempoAtual / duracao) * 100}%`,
              width: '2px', background: C.coral + '88',
              transform: 'translateX(-50%)', pointerEvents: 'none'
            }} />

            {/* Marcadores de comentários */}
            {comentarios.map(c => (
              <div
                key={c.id}
                title={`${formatTime(c.tempo)} — ${c.texto || 'clique para ver'}`}
                style={{
                  position: 'absolute', top: '-4px', bottom: '-4px',
                  left: `${(c.tempo / duracao) * 100}%`,
                  width: '3px', background: C.coral,
                  transform: 'translateX(-50%)',
                  borderRadius: '2px', pointerEvents: 'none',
                  boxShadow: `0 0 6px ${C.coral}88`
                }}
              />
            ))}

            {/* Timestamp flutuante à direita */}
            <span style={{
              position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
              color: '#555', fontSize: '10px', pointerEvents: 'none', fontVariantNumeric: 'tabular-nums'
            }}>
              {formatTime(tempoAtual)} / {formatTime(duracao)}
            </span>
          </div>
        </div>
      )}

      {/* Lista de comentários */}
      {comentariosOrdenados.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {comentariosOrdenados.map(c => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '8px',
              background: C.bg, border: `1px solid ${C.border}`,
              borderRadius: '8px', padding: '8px 10px'
            }}>
              {/* Badge de tempo — clica para ouvir naquele ponto */}
              <button
                onClick={() => irPara(c.tempo)}
                title="Ouvir neste ponto"
                style={{
                  background: '#1a1010', border: `1px solid ${C.coral}55`,
                  color: C.coral, padding: '3px 8px',
                  borderRadius: '4px', fontSize: '11px', fontWeight: '700',
                  cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                ▶ {formatTime(c.tempo)}
              </button>

              {/* Campo de texto */}
              <textarea
                id={`vc-${c.id}`}
                value={c.texto}
                onChange={e => setTexto(c.id, e.target.value)}
                placeholder="Descreva o ajuste neste ponto..."
                rows={1}
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  color: C.text, fontSize: '12px', resize: 'none',
                  fontFamily: 'inherit', outline: 'none', lineHeight: '1.5'
                }}
              />

              {/* Remover */}
              <button
                onClick={() => remover(c.id)}
                style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontSize: '16px', padding: '0', lineHeight: 1, flexShrink: 0 }}
              >×</button>
            </div>
          ))}

          {/* Botão Atualizar */}
          <div style={{ marginTop: '4px' }}>
            <button
              onClick={atualizar}
              disabled={atualizando}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: atualizando ? '#1a1a1a' : '#1a0a08',
                border: `1px solid ${C.coral}55`, color: C.coral,
                padding: '9px 18px', borderRadius: '8px',
                fontSize: '12px', fontWeight: '700', cursor: atualizando ? 'not-allowed' : 'pointer',
                opacity: atualizando ? 0.6 : 1
              }}
            >
              {atualizando
                ? <><Spinner /> Gerando novo áudio...</>
                : `Atualizar Vídeo (${comentarios.length} comentário${comentarios.length > 1 ? 's' : ''})`}
            </button>
            {erro && <p style={{ margin: '6px 0 0', color: '#f87171', fontSize: '11px' }}>{erro}</p>}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
