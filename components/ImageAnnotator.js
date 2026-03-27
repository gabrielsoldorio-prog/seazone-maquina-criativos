import { useState, useRef } from 'react'

const C = { coral: '#E8533A', border: '#1e1e2e', sub: '#888', text: '#e0e0e0' }

function Spinner() {
  return <span style={{ width: '12px', height: '12px', border: '2px solid #333', borderTop: `2px solid ${C.coral}`, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
}

export default function ImageAnnotator({ src, alt, tipo = 'estatico', estrutura, promptOriginal, onNovosDados }) {
  const [pins, setPins]           = useState([])
  const [ativoId, setAtivoId]     = useState(null)
  const [atualizando, setAtu]     = useState(false)
  const [erro, setErro]           = useState(null)
  const containerRef              = useRef(null)

  function handleClick(e) {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    const novo = { id: Date.now(), x, y, texto: '' }
    setPins(prev => [...prev, novo])
    setAtivoId(novo.id)
  }

  function setTexto(id, texto) {
    setPins(prev => prev.map(p => p.id === id ? { ...p, texto } : p))
  }

  function remover(id, e) {
    e.stopPropagation()
    setPins(prev => prev.filter(p => p.id !== id))
    if (ativoId === id) setAtivoId(null)
  }

  async function atualizar() {
    if (!pins.length || atualizando) return
    setAtu(true)
    setErro(null)
    const feedback = pins
      .map((p, i) => `Pin ${i + 1} (posição ${Math.round(p.x)}%×${Math.round(p.y)}%): ${p.texto || 'sem descrição'}`)
      .join('\n')
    try {
      const res = await fetch('/api/atualizar-midia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, feedback, estrutura, promptOriginal: promptOriginal || '', locucaoOriginal: '' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPins([])
      setAtivoId(null)
      onNovosDados?.(data)
    } catch (e) {
      setErro(e.message)
    } finally {
      setAtu(false)
    }
  }

  if (!src) return (
    <div style={{ background: '#0a0a12', border: '1px dashed #2a2a3e', borderRadius: '10px', padding: '40px', textAlign: 'center', color: '#555', fontSize: '13px' }}>
      Imagem não gerada
    </div>
  )

  return (
    <div>
      <p style={{ margin: '0 0 8px', color: '#555', fontSize: '11px' }}>
        Clique na imagem para adicionar um PIN de comentário
      </p>

      {/* Imagem com pins sobrepostos */}
      <div
        ref={containerRef}
        onClick={handleClick}
        style={{ position: 'relative', cursor: 'crosshair', borderRadius: '10px', overflow: 'hidden', userSelect: 'none', lineHeight: 0 }}
      >
        <img src={src} alt={alt || 'Estático gerado'} style={{ width: '100%', display: 'block' }} />

        {pins.map((p, i) => (
          <div
            key={p.id}
            onClick={e => { e.stopPropagation(); setAtivoId(p.id) }}
            style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)', zIndex: 10, cursor: 'pointer' }}
          >
            {/* Pulso */}
            <div style={{
              position: 'absolute', inset: '-6px',
              borderRadius: '50%',
              background: `${C.coral}33`,
              animation: ativoId === p.id ? 'pulse 1.5s infinite' : 'none'
            }} />
            {/* Pin */}
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: ativoId === p.id ? C.coral : '#c0392b',
              color: '#fff', fontSize: '11px', fontWeight: '800',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #fff', boxShadow: '0 2px 10px rgba(0,0,0,0.7)',
              position: 'relative'
            }}>
              {i + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Lista de pins */}
      {pins.length > 0 && (
        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {pins.map((p, i) => (
            <div
              key={p.id}
              onClick={() => setAtivoId(p.id)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                background: ativoId === p.id ? '#13131f' : '#0f0f1a',
                border: `1px solid ${ativoId === p.id ? C.coral + '55' : C.border}`,
                borderRadius: '8px', padding: '10px 12px', cursor: 'pointer', transition: 'border-color 0.15s'
              }}
            >
              {/* Número */}
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                background: C.coral, color: '#fff', fontSize: '10px', fontWeight: '800',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>{i + 1}</div>

              {/* Campo de texto */}
              <textarea
                value={p.texto}
                onChange={e => setTexto(p.id, e.target.value)}
                onClick={e => e.stopPropagation()}
                placeholder="Descreva o ajuste neste ponto..."
                rows={2}
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  color: C.text, fontSize: '12px', resize: 'none',
                  fontFamily: 'inherit', outline: 'none', lineHeight: '1.5'
                }}
              />

              {/* Remover */}
              <button
                onClick={e => remover(p.id, e)}
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
              {atualizando ? <><Spinner /> Gerando nova imagem...</> : `Atualizar Imagem (${pins.length} pin${pins.length > 1 ? 's' : ''})`}
            </button>
            {erro && <p style={{ margin: '6px 0 0', color: '#f87171', fontSize: '11px' }}>{erro}</p>}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.4); opacity: 0.2; } }
      `}</style>
    </div>
  )
}
