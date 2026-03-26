import { useState } from 'react'
import Head from 'next/head'
import SecaoMateriais from '../components/SecaoMateriais'

export default function Home() {
  const [link, setLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState(null)
  const [progresso, setProgresso] = useState('')

  async function gerarCriativos() {
    if (!link.trim()) {
      setErro('Insira o link do Lovable antes de continuar.')
      return
    }

    setLoading(true)
    setErro(null)
    setResultado(null)

    const etapas = [
      'Lendo o briefing do Lovable...',
      'Analisando pontos fortes e posicionamento...',
      'Verificando Do\'s e Don\'ts...',
      'Extraindo dados financeiros confirmados...',
      'Gerando roteiros de vídeo com apresentadora...',
      'Gerando roteiros de vídeo narrado...',
      'Gerando textos para estáticos...',
      'Finalizando e validando materiais...'
    ]

    let etapaIdx = 0
    setProgresso(etapas[0])
    const intervalo = setInterval(() => {
      etapaIdx = (etapaIdx + 1) % etapas.length
      setProgresso(etapas[etapaIdx])
    }, 3500)

    try {
      const res = await fetch('/api/gerar-criativos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkLovable: link })
      })

      const data = await res.json()

      if (!res.ok) {
        setErro(data.error || 'Erro desconhecido ao gerar criativos.')
      } else {
        setResultado(data)
      }
    } catch (e) {
      setErro('Falha na conexão com o servidor. Verifique sua conexão e tente novamente.')
    } finally {
      clearInterval(intervalo)
      setProgresso('')
      setLoading(false)
    }
  }

  function limpar() {
    setLink('')
    setResultado(null)
    setErro(null)
  }

  return (
    <>
      <Head>
        <title>Máquina de Conversão — Seazone</title>
        <meta name="description" content="Gerador de criativos de performance para empreendimentos Seazone" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: '#080810',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#e0e0f0'
      }}>
        {/* Header */}
        <header style={{
          borderBottom: '1px solid #1a1a2e',
          padding: '20px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: '#080810',
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #1e3a5f, #7ec8e3)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>S</div>
            <div>
              <h1 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
                Máquina de Conversão
              </h1>
              <p style={{ margin: 0, fontSize: '11px', color: '#666', letterSpacing: '0.05em' }}>
                SEAZONE — CRIATIVOS DE PERFORMANCE
              </p>
            </div>
          </div>
          {resultado && (
            <button
              onClick={limpar}
              style={{
                background: 'transparent',
                border: '1px solid #2a2a3e',
                color: '#888',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Novo briefing
            </button>
          )}
        </header>

        <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>

          {/* Input Section */}
          {!resultado && (
            <div style={{
              background: '#0f0f1a',
              border: '1px solid #2a2a3e',
              borderRadius: '16px',
              padding: '40px',
              marginBottom: '32px'
            }}>
              <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '700', color: '#ffffff' }}>
                Gerar Criativos
              </h2>
              <p style={{ margin: '0 0 28px', color: '#666', fontSize: '14px' }}>
                Insira o link do briefing no Lovable para gerar os 9 materiais de performance.
              </p>

              <label style={{
                display: 'block',
                color: '#888',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '8px'
              }}>
                Link do Lovable
              </label>
              <input
                type="url"
                value={link}
                onChange={e => setLink(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !loading && gerarCriativos()}
                placeholder="https://lovable.dev/..."
                disabled={loading}
                style={{
                  width: '100%',
                  background: '#13131f',
                  border: '1px solid #2a2a3e',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  color: '#e0e0f0',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: '20px',
                  fontFamily: 'inherit',
                  opacity: loading ? 0.5 : 1
                }}
              />

              {erro && (
                <div style={{
                  background: '#1f0a0a',
                  border: '1px solid #5a1a1a',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  color: '#f87171',
                  fontSize: '13px'
                }}>
                  {erro}
                </div>
              )}

              <button
                onClick={gerarCriativos}
                disabled={loading}
                style={{
                  width: '100%',
                  background: loading
                    ? '#1a1a2e'
                    : 'linear-gradient(135deg, #1e3a5f 0%, #2a5a8f 100%)',
                  color: loading ? '#555' : '#7ec8e3',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '16px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.03em',
                  transition: 'all 0.2s'
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <span style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #333',
                      borderTop: '2px solid #7ec8e3',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    {progresso || 'Gerando...'}
                  </span>
                ) : 'Gerar 9 Criativos'}
              </button>

              {loading && (
                <div style={{
                  marginTop: '20px',
                  background: '#0a0a15',
                  border: '1px solid #1a1a2e',
                  borderRadius: '8px',
                  padding: '14px 18px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{
                      width: '8px', height: '8px',
                      borderRadius: '50%',
                      background: '#7ec8e3',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }} />
                    <span style={{ color: '#7ec8e3', fontSize: '13px', fontWeight: '500' }}>
                      {progresso}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: '#444', fontSize: '12px' }}>
                    Esse processo pode levar 30 a 60 segundos. Por favor, aguarde.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Resultados */}
          {resultado && (
            <div>
              {/* Banner do empreendimento */}
              <div style={{
                background: 'linear-gradient(135deg, #0d1f35 0%, #0f0f1a 100%)',
                border: '1px solid #2a3a5e',
                borderRadius: '12px',
                padding: '24px 32px',
                marginBottom: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <p style={{ margin: '0 0 4px', color: '#666', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Empreendimento
                  </p>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#ffffff' }}>
                    {resultado.empreendimento || 'Empreendimento Seazone'}
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { n: resultado.materiais?.videoApresentadora?.length || 0, label: 'Vídeos' },
                    { n: resultado.materiais?.videoNarrado?.length || 0, label: 'Narrados' },
                    { n: resultado.materiais?.estatico?.length || 0, label: 'Estáticos' }
                  ].map((item, i) => (
                    <div key={i} style={{
                      background: '#0f1a2a',
                      border: '1px solid #1e3a5f',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: '#7ec8e3', fontSize: '20px', fontWeight: '700' }}>{item.n}</div>
                      <div style={{ color: '#666', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <SecaoMateriais
                titulo="Vídeo com Apresentadora"
                badge="Apresentadora"
                badgeColor="#1e2a5e"
                icone="🎬"
                materiais={resultado.materiais?.videoApresentadora}
                tipo="video"
              />

              <SecaoMateriais
                titulo="Vídeo Narrado"
                badge="Narrado"
                badgeColor="#1e3a2e"
                icone="🎙️"
                materiais={resultado.materiais?.videoNarrado}
                tipo="video"
              />

              <SecaoMateriais
                titulo="Estático"
                badge="Estático"
                badgeColor="#3a2a1e"
                icone="🖼️"
                materiais={resultado.materiais?.estatico}
                tipo="estatico"
              />

              <div style={{
                marginTop: '40px',
                padding: '24px',
                background: '#0f0f1a',
                border: '1px solid #2a2a3e',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <p style={{ margin: '0 0 16px', color: '#888', fontSize: '14px' }}>
                  Todos os 9 materiais foram gerados. Após validação, avance para as variações completas.
                </p>
                <button
                  onClick={limpar}
                  style={{
                    background: 'transparent',
                    border: '1px solid #2a3a5e',
                    color: '#7ec8e3',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  Gerar novo briefing
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        input:focus { border-color: #3a5a8f !important; }
        textarea:focus { border-color: #3a5a8f !important; }
        textarea { resize: vertical; }
      `}</style>
    </>
  )
}
