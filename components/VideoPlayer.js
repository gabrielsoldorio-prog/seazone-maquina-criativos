import { useState, useRef } from 'react'

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function VideoPlayer({ src, tipo = 'audio', label }) {
  const mediaRef = useRef(null)
  const [comentarios, setComentarios] = useState([])
  const [tempoAtual, setTempoAtual] = useState(0)
  const [duracao, setDuracao] = useState(0)

  function addComentario() {
    if (!mediaRef.current) return
    const t = mediaRef.current.currentTime
    setComentarios(prev => [...prev, { id: Date.now(), tempo: t, texto: '' }])
    mediaRef.current.pause()
  }

  function atualizarTexto(id, texto) {
    setComentarios(prev => prev.map(c => c.id === id ? { ...c, texto } : c))
  }

  function irParaTempo(t) {
    if (mediaRef.current) {
      mediaRef.current.currentTime = t
      mediaRef.current.play()
    }
  }

  function remover(id) {
    setComentarios(prev => prev.filter(c => c.id !== id))
  }

  if (!src) return (
    <div style={{
      background: '#0a0a12', border: '1px dashed #2a2a3e',
      borderRadius: '10px', padding: '32px', textAlign: 'center',
      color: '#555', fontSize: '13px'
    }}>
      {tipo === 'apresentadora'
        ? 'Áudio gerado — vídeo com lip-sync via script de produção'
        : 'Áudio não gerado'}
    </div>
  )

  return (
    <div>
      {label && (
        <p style={{ margin: '0 0 8px', color: '#666', fontSize: '11px' }}>{label}</p>
      )}

      {tipo === 'video' ? (
        <video
          ref={mediaRef}
          src={src}
          controls
          onTimeUpdate={() => setTempoAtual(mediaRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuracao(mediaRef.current?.duration || 0)}
          style={{ width: '100%', borderRadius: '10px', background: '#000' }}
        />
      ) : (
        <audio
          ref={mediaRef}
          src={src}
          controls
          onTimeUpdate={() => setTempoAtual(mediaRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuracao(mediaRef.current?.duration || 0)}
          style={{ width: '100%', borderRadius: '8px' }}
        />
      )}

      {/* Barra de marcação */}
      {duracao > 0 && (
        <div style={{ marginTop: '10px' }}>
          <div style={{
            position: 'relative',
            height: '24px',
            background: '#0f0f1a',
            border: '1px solid #1e1e2e',
            borderRadius: '6px',
            overflow: 'hidden',
            cursor: 'pointer'
          }}
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = (e.clientX - rect.left) / rect.width
              if (mediaRef.current) mediaRef.current.currentTime = x * duracao
            }}
          >
            {/* Progresso */}
            <div style={{
              height: '100%',
              width: `${(tempoAtual / duracao) * 100}%`,
              background: '#E8533A22',
              transition: 'width 0.1s'
            }} />

            {/* Marcadores de comentários */}
            {comentarios.map(c => (
              <div
                key={c.id}
                title={`${formatTime(c.tempo)} — ${c.texto || 'sem texto'}`}
                style={{
                  position: 'absolute',
                  left: `${(c.tempo / duracao) * 100}%`,
                  top: 0, bottom: 0,
                  width: '2px',
                  background: '#E8533A',
                  transform: 'translateX(-50%)'
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <span style={{ color: '#666', fontSize: '11px' }}>
              {formatTime(tempoAtual)} / {formatTime(duracao)}
            </span>
            <button
              onClick={addComentario}
              style={{
                background: '#1a1010', border: '1px solid #E8533A55',
                color: '#E8533A', padding: '4px 10px',
                borderRadius: '6px', fontSize: '11px', fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              + Comentar em {formatTime(tempoAtual)}
            </button>
          </div>
        </div>
      )}

      {/* Lista de comentários */}
      {comentarios.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {comentarios
            .sort((a, b) => a.tempo - b.tempo)
            .map(c => (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                background: '#0f0f1a', border: '1px solid #1e1e2e',
                borderRadius: '8px', padding: '8px 10px'
              }}>
                <button
                  onClick={() => irParaTempo(c.tempo)}
                  style={{
                    background: '#1a1010', border: '1px solid #E8533A55',
                    color: '#E8533A', padding: '2px 7px',
                    borderRadius: '4px', fontSize: '10px', fontWeight: '700',
                    cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap'
                  }}
                >
                  {formatTime(c.tempo)}
                </button>
                <textarea
                  value={c.texto}
                  onChange={e => atualizarTexto(c.id, e.target.value)}
                  placeholder="Descreva o ajuste..."
                  rows={1}
                  style={{
                    flex: 1, background: 'transparent', border: 'none',
                    color: '#c0c0d0', fontSize: '12px',
                    resize: 'none', fontFamily: 'inherit', outline: 'none'
                  }}
                />
                <button
                  onClick={() => remover(c.id)}
                  style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontSize: '14px' }}
                >×</button>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
