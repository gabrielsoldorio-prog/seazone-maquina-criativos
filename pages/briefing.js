import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

const C = {
  bg: '#0d0d0d', card: '#111118', border: '#1e1e2e',
  coral: '#E8533A', text: '#e0e0e0', sub: '#888', label: '#555'
}

function Chip({ children, cor }) {
  return (
    <span style={{
      display: 'inline-block',
      background: cor || '#1a1a2e',
      color: cor ? '#fff' : C.sub,
      fontSize: '11px', padding: '3px 8px',
      borderRadius: '4px', marginRight: '6px', marginBottom: '6px',
      border: `1px solid ${cor ? cor + '55' : C.border}`
    }}>
      {children}
    </span>
  )
}

function Secao({ titulo, children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '18px 20px', marginBottom: '12px' }}>
      <p style={{ margin: '0 0 10px', color: C.label, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{titulo}</p>
      {children}
    </div>
  )
}

export default function Briefing() {
  const router = useRouter()
  const [briefing, setBriefing] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progresso, setProgresso] = useState('')
  const [erro, setErro] = useState(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('briefing')
      if (data) setBriefing(JSON.parse(data))
      else router.push('/')
    }
  }, [])

  async function confirmarEGerar() {
    setLoading(true)
    setErro(null)

    const etapas = [
      'Gerando roteiro vídeo com apresentadora...',
      'Gerando roteiro vídeo narrado...',
      'Gerando textos dos estáticos...',
      'Avaliando alinhamento com briefing...',
      'Finalizando checklist do agente revisor...'
    ]
    let idx = 0
    setProgresso(etapas[0])
    const tick = setInterval(() => { idx = (idx + 1) % etapas.length; setProgresso(etapas[idx]) }, 4000)

    try {
      const res = await fetch('/api/gerar-criativos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefing })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar criativos')

      localStorage.setItem('criativos', JSON.stringify(data))
      router.push('/criativos')
    } catch (e) {
      setErro(e.message)
    } finally {
      clearInterval(tick)
      setProgresso('')
      setLoading(false)
    }
  }

  if (!briefing) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.sub, fontSize: '14px' }}>
      Carregando briefing...
    </div>
  )

  const df = briefing.dadosFinanceiros || {}
  const est = briefing.estruturas || {}

  return (
    <>
      <Head>
        <title>Briefing — {briefing.empreendimento || 'Seazone'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: C.text }}>

        {/* Header */}
        <header style={{ borderBottom: `1px solid ${C.border}`, padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '30px', height: '30px', background: C.coral, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#fff', fontSize: '13px' }}>S</div>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Máquina de Conversão</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[{ n: '01', l: 'Briefing', done: true }, { n: '02', l: 'Revisão', active: true }, { n: '03', l: 'Criativos' }].map(({ n, l, done, active }) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: active ? C.coral : done ? '#1a2a1a' : '#1a1a1a',
                  color: active ? '#fff' : done ? '#4ade80' : C.label,
                  border: `1px solid ${active ? C.coral : done ? '#2a5a2a' : C.border}`,
                  fontSize: '10px', fontWeight: '700',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{done ? '✓' : n}</div>
                <span style={{ fontSize: '11px', color: active ? C.text : C.label }}>{l}</span>
                {n !== '03' && <span style={{ color: C.border, fontSize: '14px' }}>›</span>}
              </div>
            ))}
          </div>
        </header>

        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>

          {/* Banner empreendimento */}
          <div style={{
            background: 'linear-gradient(135deg, #1a0a08, #111118)',
            border: `1px solid ${C.coral}33`,
            borderRadius: '14px', padding: '24px 28px', marginBottom: '24px',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'
          }}>
            <div>
              <div style={{ color: C.label, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Empreendimento</div>
              <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '800', color: '#fff' }}>{briefing.empreendimento}</h1>
              <div style={{ color: C.coral, fontSize: '13px' }}>{briefing.localizacao}</div>
            </div>
            {briefing.linkDrive && (
              <a href={briefing.linkDrive} target="_blank" rel="noreferrer" style={{
                background: '#1a1a1a', border: `1px solid ${C.border}`,
                color: C.sub, padding: '8px 14px', borderRadius: '8px',
                fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                Assets Drive ↗
              </a>
            )}
          </div>

          {/* Grid de dados financeiros */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'ROI ao ano', value: df.roi },
              { label: 'Rentabilidade líquida', value: df.rentabilidadeLiquida },
              { label: 'Menor cota', value: df.menorCota },
              { label: 'Ticket médio', value: df.ticketMedio },
              { label: 'Valorização est.', value: df.valorizacaoEstimada },
            ].filter(i => i.value && i.value !== 'A confirmar').map(({ label, value }) => (
              <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ color: C.label, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{label}</div>
                <div style={{ color: C.coral, fontSize: '17px', fontWeight: '700' }}>{value}</div>
                <div style={{ color: C.label, fontSize: '10px', marginTop: '2px' }}>com aluguel por temporada</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>

            {/* Estruturas */}
            <Secao titulo="Estruturas disponíveis">
              {['videoApresentadora', 'videoNarrado', 'estatico'].map(formato => {
                const lista = est[formato] || []
                if (!lista.length) return null
                const nomes = { videoApresentadora: '🎬 Apresentadora', videoNarrado: '🎙️ Narrado', estatico: '🖼️ Estático' }
                return (
                  <div key={formato} style={{ marginBottom: '10px' }}>
                    <div style={{ color: C.sub, fontSize: '12px', marginBottom: '4px' }}>{nomes[formato]}</div>
                    {lista.map(e => (
                      <div key={e.numero} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ color: C.label, fontSize: '11px', minWidth: '16px' }}>{e.numero}.</span>
                        <span style={{ color: '#7ec8e3', fontSize: '11px', fontFamily: 'monospace', background: '#0a0f1a', padding: '1px 6px', borderRadius: '4px' }}>
                          {e.sequencia || e.foco}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </Secao>

            {/* Público-alvo */}
            <Secao titulo="Público-alvo">
              {briefing.publicoAlvo?.core && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ color: C.coral, fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Core</div>
                  <div style={{ color: C.sub, fontSize: '12px', lineHeight: '1.5' }}>{briefing.publicoAlvo.core}</div>
                </div>
              )}
              {briefing.publicoAlvo?.secundario && (
                <div>
                  <div style={{ color: C.label, fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Secundário</div>
                  <div style={{ color: C.label, fontSize: '12px', lineHeight: '1.5' }}>{briefing.publicoAlvo.secundario}</div>
                </div>
              )}
            </Secao>
          </div>

          {/* Do's */}
          {briefing.dos?.length > 0 && (
            <Secao titulo="Do's — reforçar">
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {briefing.dos.map((d, i) => <Chip key={i} cor="#1a3a1a">{d}</Chip>)}
              </div>
            </Secao>
          )}

          {/* Don'ts */}
          {briefing.donts?.length > 0 && (
            <Secao titulo="Don'ts — evitar">
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {briefing.donts.map((d, i) => <Chip key={i} cor="#3a1a1a">{d}</Chip>)}
              </div>
            </Secao>
          )}

          {/* Pontos fortes */}
          {briefing.pontosFortesAprovados?.length > 0 && (
            <Secao titulo="Pontos fortes aprovados">
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {briefing.pontosFortesAprovados.map((p, i) => <Chip key={i}>{p}</Chip>)}
              </div>
            </Secao>
          )}

          {/* Pitch */}
          {briefing.pitch && (
            <Secao titulo="Pitch">
              <p style={{ margin: 0, color: C.sub, fontSize: '13px', lineHeight: '1.6', fontStyle: 'italic' }}>"{briefing.pitch}"</p>
            </Secao>
          )}

          {erro && (
            <div style={{ background: '#1f0a0a', border: '1px solid #5a1a1a', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#f87171', fontSize: '13px' }}>
              {erro}
            </div>
          )}

          {/* Botão confirmar */}
          <div style={{ position: 'sticky', bottom: '24px', marginTop: '24px' }}>
            <button
              onClick={confirmarEGerar}
              disabled={loading}
              style={{
                width: '100%', padding: '16px',
                background: loading ? '#1a1a1a' : C.coral,
                color: loading ? C.label : '#fff',
                border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(232,83,58,0.35)'
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <span style={{ width: '14px', height: '14px', border: '2px solid #444', borderTop: `2px solid ${C.coral}`, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  {progresso}
                </span>
              ) : 'Confirmar e Gerar Criativos →'}
            </button>
          </div>
        </main>
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}
