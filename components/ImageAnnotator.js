import { useState, useRef } from 'react'

export default function ImageAnnotator({ src, alt }) {
  const [anotacoes, setAnotacoes] = useState([])
  const [ativa, setAtiva] = useState(null)
  const containerRef = useRef(null)

  function handleClick(e) {
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    const nova = { id: Date.now(), x, y, texto: '' }
    setAnotacoes(prev => [...prev, nova])
    setAtiva(nova.id)
  }

  function atualizarTexto(id, texto) {
    setAnotacoes(prev => prev.map(a => a.id === id ? { ...a, texto } : a))
  }

  function remover(id) {
    setAnotacoes(prev => prev.filter(a => a.id !== id))
    if (ativa === id) setAtiva(null)
  }

  if (!src) return (
    <div style={{
      background: '#0a0a12',
      border: '1px dashed #2a2a3e',
      borderRadius: '10px',
      padding: '40px',
      textAlign: 'center',
      color: '#555',
      fontSize: '13px'
    }}>
      Imagem não gerada
    </div>
  )

  return (
    <div>
      <p style={{ margin: '0 0 8px', color: '#666', fontSize: '11px' }}>
        Clique na imagem para adicionar um comentário no ponto exato
      </p>
      <div
        ref={containerRef}
        onClick={handleClick}
        style={{ position: 'relative', cursor: 'crosshair', borderRadius: '10px', overflow: 'hidden', userSelect: 'none' }}
      >
        <img src={src} alt={alt || 'Estático gerado'} style={{ width: '100%', display: 'block', maxWidth: '480px', margin: '0 auto' }} />

        {anotacoes.map((a, i) => (
          <div
            key={a.id}
            onClick={e => { e.stopPropagation(); setAtiva(a.id) }}
            style={{
              position: 'absolute',
              left: `${a.x}%`,
              top: `${a.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10
            }}
          >
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%',
              background: '#E8533A',
              color: '#fff',
              fontSize: '11px', fontWeight: '700',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
              cursor: 'pointer'
            }}>
              {i + 1}
            </div>
          </div>
        ))}
      </div>

      {anotacoes.length > 0 && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {anotacoes.map((a, i) => (
            <div
              key={a.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                background: ativa === a.id ? '#13131f' : '#0f0f1a',
                border: `1px solid ${ativa === a.id ? '#E8533A55' : '#1e1e2e'}`,
                borderRadius: '8px', padding: '10px'
              }}
            >
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%',
                background: '#E8533A', color: '#fff',
                fontSize: '10px', fontWeight: '700', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>{i + 1}</div>
              <textarea
                value={a.texto}
                onChange={e => atualizarTexto(a.id, e.target.value)}
                placeholder="Descreva o ajuste neste ponto..."
                rows={2}
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  color: '#c0c0d0', fontSize: '12px', resize: 'none',
                  fontFamily: 'inherit', outline: 'none'
                }}
              />
              <button
                onClick={() => remover(a.id)}
                style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontSize: '14px', padding: '0' }}
              >×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
