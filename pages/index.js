import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

const C = {
  bg: '#0d0d0d',
  card: '#111118',
  border: '#1e1e2e',
  coral: '#E8533A',
  text: '#e0e0e0',
  sub: '#888',
  label: '#555'
}

export default function Home() {
  const router = useRouter()
  const [linkLovable, setLinkLovable] = useState('')
  const [linkDrive, setLinkDrive] = useState('')
  const [loading, setLoading] = useState(false)
  const [progresso, setProgresso] = useState('')
  const [erro, setErro] = useState(null)

  async function analisarBriefing() {
    if (!linkLovable.trim()) { setErro('Insira o link do Lovable.'); return }
    setLoading(true)
    setErro(null)

    const etapas = [
      'Acessando o briefing do Lovable...',
      'Extraindo estruturas e sequências...',
      "Mapeando Do's e Don'ts...",
      'Lendo dados financeiros confirmados...',
      'Identificando público-alvo e perfil do hóspede...',
      'Estruturando briefing resumido...'
    ]
    let idx = 0
    setProgresso(etapas[0])
    const tick = setInterval(() => { idx = (idx + 1) % etapas.length; setProgresso(etapas[idx]) }, 3000)

    try {
      const res = await fetch('/api/analisar-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkLovable, linkDrive })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao analisar briefing')

      if (typeof window !== 'undefined') {
        localStorage.setItem('briefing', JSON.stringify(data))
      }
      router.push('/briefing')
    } catch (e) {
      setErro(e.message)
    } finally {
      clearInterval(tick)
      setProgresso('')
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Máquina de Conversão — Seazone</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: C.text }}>

        {/* Header */}
        <header style={{ borderBottom: `1px solid ${C.border}`, padding: '18px 40px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '32px', height: '32px', background: C.coral, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#fff', fontSize: '14px' }}>S</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Máquina de Conversão</div>
            <div style={{ fontSize: '10px', color: C.label, letterSpacing: '0.06em' }}>SEAZONE — CRIATIVOS DE PERFORMANCE</div>
          </div>
        </header>

        {/* Main */}
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ width: '100%', maxWidth: '520px' }}>

            {/* Etapas */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px', justifyContent: 'center' }}>
              {[
                { n: '01', label: 'Briefing' },
                { n: '02', label: 'Revisão' },
                { n: '03', label: 'Criativos' }
              ].map(({ n, label }, i) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: i === 0 ? C.coral : '#1a1a1a',
                    color: i === 0 ? '#fff' : C.label,
                    border: `1px solid ${i === 0 ? C.coral : C.border}`,
                    fontSize: '11px', fontWeight: '700',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>{n}</div>
                  <span style={{ fontSize: '12px', color: i === 0 ? C.text : C.label }}>{label}</span>
                  {i < 2 && <span style={{ color: C.border, fontSize: '16px', margin: '0 4px' }}>›</span>}
                </div>
              ))}
            </div>

            <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: '800', color: '#fff', textAlign: 'center' }}>
              Analisar Briefing
            </h1>
            <p style={{ margin: '0 0 32px', color: C.sub, fontSize: '14px', textAlign: 'center' }}>
              Cole os links do Lovable e do Google Drive para começar
            </p>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '28px' }}>

              <label style={{ display: 'block', color: C.label, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                Link do Lovable
              </label>
              <input
                type="url"
                value={linkLovable}
                onChange={e => setLinkLovable(e.target.value)}
                placeholder="https://lovable.dev/projects/..."
                disabled={loading}
                style={{
                  width: '100%', background: '#0d0d14', border: `1px solid ${C.border}`,
                  borderRadius: '8px', padding: '12px 14px', color: C.text,
                  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                  marginBottom: '16px', fontFamily: 'inherit',
                  opacity: loading ? 0.5 : 1
                }}
              />

              <label style={{ display: 'block', color: C.label, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                Link do Google Drive (assets) — opcional
              </label>
              <input
                type="url"
                value={linkDrive}
                onChange={e => setLinkDrive(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !loading && analisarBriefing()}
                placeholder="https://drive.google.com/drive/folders/..."
                disabled={loading}
                style={{
                  width: '100%', background: '#0d0d14', border: `1px solid ${C.border}`,
                  borderRadius: '8px', padding: '12px 14px', color: C.text,
                  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                  marginBottom: '20px', fontFamily: 'inherit',
                  opacity: loading ? 0.5 : 1
                }}
              />

              {erro && (
                <div style={{ background: '#1f0a0a', border: '1px solid #5a1a1a', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#f87171', fontSize: '13px' }}>
                  {erro}
                </div>
              )}

              <button
                onClick={analisarBriefing}
                disabled={loading}
                style={{
                  width: '100%', padding: '14px',
                  background: loading ? '#1a1a1a' : C.coral,
                  color: loading ? C.label : '#fff',
                  border: 'none', borderRadius: '10px',
                  fontSize: '15px', fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s'
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <span style={{ width: '14px', height: '14px', border: '2px solid #444', borderTop: `2px solid ${C.coral}`, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                    {progresso || 'Analisando...'}
                  </span>
                ) : 'Analisar Briefing →'}
              </button>

              {loading && (
                <p style={{ margin: '12px 0 0', color: C.label, fontSize: '12px', textAlign: 'center' }}>
                  Aguarde 30–60 segundos...
                </p>
              )}
            </div>
          </div>
        </main>
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:focus { border-color: #E8533A !important; }
      `}</style>
    </>
  )
}
