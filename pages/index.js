import { useState } from 'react'
import Head from 'next/head'
import CenaTable from '../components/CenaTable'

// ─── Estilos base ──────────────────────────────────────────────────────────
const S = {
  card: {
    background: '#0f0f1a',
    border: '1px solid #2a2a3e',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px'
  },
  badge: (cor) => ({
    background: cor || '#1e3a5f',
    color: '#7ec8e3',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.06em',
    textTransform: 'uppercase'
  }),
  label: {
    display: 'block',
    color: '#666',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '8px'
  },
  textarea: {
    width: '100%',
    background: '#13131f',
    border: '1px solid #2a2a3e',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#c0c0d0',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box'
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid #333',
    borderTop: '2px solid #7ec8e3',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.8s linear infinite'
  }
}

// ─── Spinner inline ────────────────────────────────────────────────────────
function Spinner() {
  return <span style={S.spinner} />
}

// ─── Card de roteiro com feedback ─────────────────────────────────────────
function RoteiroCard({ titulo, badge, badgeColor, tipo, dados, feedback, onFeedback }) {
  return (
    <div style={S.card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span style={S.badge(badgeColor)}>{badge}</span>
        <h3 style={{ margin: 0, color: '#fff', fontSize: '15px', fontWeight: '600' }}>{titulo}</h3>
        {dados?.duracao && (
          <span style={{ marginLeft: 'auto', color: '#555', fontSize: '12px' }}>{dados.duracao}</span>
        )}
      </div>

      {tipo === 'video' && dados?.cenas && <CenaTable cenas={dados.cenas} />}

      {tipo === 'estatico' && dados && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {dados.referenciaVisual && (
            <div style={{ background: '#13131f', border: '1px solid #2a2a3e', borderRadius: '8px', padding: '14px' }}>
              <p style={{ ...S.label, marginBottom: '6px' }}>Referência Visual</p>
              <p style={{ margin: 0, color: '#a0a0b0', fontSize: '13px', lineHeight: '1.5' }}>{dados.referenciaVisual}</p>
            </div>
          )}
          {dados.textoDaArte && (
            <div style={{ background: '#13131f', border: '1px solid #2a2a3e', borderRadius: '8px', padding: '14px' }}>
              <p style={{ ...S.label, marginBottom: '6px' }}>Texto da Arte</p>
              <p style={{ margin: 0, color: '#e0e0f0', fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-line', fontWeight: '500' }}>{dados.textoDaArte}</p>
            </div>
          )}
          {dados.legenda && (
            <div style={{ background: '#13131f', border: '1px solid #2a2a3e', borderRadius: '8px', padding: '14px' }}>
              <p style={{ ...S.label, marginBottom: '6px' }}>Legenda</p>
              <p style={{ margin: 0, color: '#a0a0b0', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{dados.legenda}</p>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '16px' }}>
        <label style={S.label}>Feedback</label>
        <textarea
          rows={2}
          value={feedback}
          onChange={e => onFeedback(e.target.value)}
          placeholder="Deixe seu feedback antes de aprovar..."
          style={S.textarea}
        />
      </div>
    </div>
  )
}

// ─── Seção de roteiros (1 formato, 3 estruturas) ───────────────────────────
function SecaoRoteiros({ titulo, icone, badge, badgeColor, tipo, materiais, feedbacks, onFeedback }) {
  if (!materiais?.length) return null
  return (
    <section style={{ marginBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #2a2a3e' }}>
        <span style={{ fontSize: '20px' }}>{icone}</span>
        <h2 style={{ margin: 0, color: '#fff', fontSize: '17px', fontWeight: '700' }}>{titulo}</h2>
      </div>
      {materiais.map((m, i) => (
        <RoteiroCard
          key={i}
          titulo={`Estrutura ${m.estrutura}`}
          badge={badge}
          badgeColor={badgeColor}
          tipo={tipo}
          dados={m}
          feedback={feedbacks[i] || ''}
          onFeedback={v => onFeedback(i, v)}
        />
      ))}
    </section>
  )
}

// ─── Etapa 2: card de mídia gerada ────────────────────────────────────────
function MidiaCard({ titulo, badge, badgeColor, icone, children }) {
  return (
    <div style={{ ...S.card, marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <span style={{ fontSize: '20px' }}>{icone}</span>
        <span style={S.badge(badgeColor)}>{badge}</span>
        <h3 style={{ margin: 0, color: '#fff', fontSize: '15px', fontWeight: '600' }}>{titulo}</h3>
      </div>
      {children}
    </div>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────
export default function Home() {
  const [link, setLink] = useState('')
  const [etapa, setEtapa] = useState(1) // 1 = roteiros, 2 = mídias
  const [loadingRoteiros, setLoadingRoteiros] = useState(false)
  const [loadingMidias, setLoadingMidias] = useState(false)
  const [progresso, setProgresso] = useState('')
  const [roteiros, setRoteiros] = useState(null)
  const [midias, setMidias] = useState(null)
  const [erro, setErro] = useState(null)

  // feedbacks: { apresentadora: ['','',''], narrado: ['','',''], estatico: ['','',''] }
  const [feedbacks, setFeedbacks] = useState({
    apresentadora: ['', '', ''],
    narrado: ['', '', ''],
    estatico: ['', '', '']
  })

  function setFeedback(formato, idx, valor) {
    setFeedbacks(prev => ({
      ...prev,
      [formato]: prev[formato].map((v, i) => i === idx ? valor : v)
    }))
  }

  // ── Etapa 1: gerar roteiros ──
  async function gerarRoteiros() {
    if (!link.trim()) { setErro('Insira o link do Lovable.'); return }
    setLoadingRoteiros(true)
    setErro(null)

    const etapas = [
      'Lendo o briefing do Lovable...',
      'Analisando pontos fortes e posicionamento...',
      "Verificando Do's e Don'ts...",
      'Extraindo dados financeiros confirmados...',
      'Gerando roteiros de vídeo com apresentadora...',
      'Gerando roteiros de vídeo narrado...',
      'Gerando textos para estáticos...',
      'Finalizando e validando materiais...'
    ]
    let idx = 0
    setProgresso(etapas[0])
    const tick = setInterval(() => { idx = (idx + 1) % etapas.length; setProgresso(etapas[idx]) }, 3500)

    try {
      const res = await fetch('/api/gerar-criativos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkLovable: link })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar roteiros')
      setRoteiros(data)
    } catch (e) {
      setErro(e.message)
    } finally {
      clearInterval(tick)
      setProgresso('')
      setLoadingRoteiros(false)
    }
  }

  // ── Etapa 2: gerar mídias ──
  async function aprovarEGerarMidias() {
    setLoadingMidias(true)
    setEtapa(2)
    setErro(null)

    const etapas = [
      'Gerando imagem estática via Fal.ai...',
      'Processando imagem...',
      'Gerando narração em off via ElevenLabs...',
      'Gerando voz da Mônica via ElevenLabs...',
      'Finalizando materiais...'
    ]
    let idx = 0
    setProgresso(etapas[0])
    const tick = setInterval(() => { idx = (idx + 1) % etapas.length; setProgresso(etapas[idx]) }, 4000)

    try {
      const res = await fetch('/api/gerar-midias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roteiros })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar mídias')
      setMidias(data)
    } catch (e) {
      setErro(e.message)
      setEtapa(1)
    } finally {
      clearInterval(tick)
      setProgresso('')
      setLoadingMidias(false)
    }
  }

  function reiniciar() {
    setLink('')
    setEtapa(1)
    setRoteiros(null)
    setMidias(null)
    setErro(null)
    setFeedbacks({ apresentadora: ['', '', ''], narrado: ['', '', ''], estatico: ['', '', ''] })
  }

  return (
    <>
      <Head>
        <title>Máquina de Conversão — Seazone</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ minHeight: '100vh', background: '#080810', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#e0e0f0' }}>

        {/* Header */}
        <header style={{ borderBottom: '1px solid #1a1a2e', padding: '18px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#080810', zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, #1e3a5f, #7ec8e3)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#fff', fontSize: '15px' }}>S</div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Máquina de Conversão</div>
              <div style={{ fontSize: '11px', color: '#555', letterSpacing: '0.05em' }}>SEAZONE — CRIATIVOS DE PERFORMANCE</div>
            </div>
          </div>

          {/* Indicador de etapas */}
          {roteiros && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {[
                { n: 1, label: 'Roteiros' },
                { n: 2, label: 'Mídias' }
              ].map(({ n, label }) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', fontSize: '11px', fontWeight: '700',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: etapa >= n ? '#1e3a5f' : '#1a1a2e',
                    color: etapa >= n ? '#7ec8e3' : '#444',
                    border: `1px solid ${etapa >= n ? '#2a5a8f' : '#2a2a3e'}`
                  }}>{n}</div>
                  <span style={{ fontSize: '12px', color: etapa >= n ? '#7ec8e3' : '#444' }}>{label}</span>
                  {n < 2 && <span style={{ color: '#333', fontSize: '14px' }}>›</span>}
                </div>
              ))}
              <button onClick={reiniciar} style={{ marginLeft: '16px', background: 'transparent', border: '1px solid #2a2a3e', color: '#666', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>
                Novo briefing
              </button>
            </div>
          )}
        </header>

        <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>

          {/* ── INPUT: sem roteiros ainda ── */}
          {!roteiros && (
            <div style={{ ...S.card, padding: '40px' }}>
              <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '700', color: '#fff' }}>Gerar Criativos</h2>
              <p style={{ margin: '0 0 28px', color: '#666', fontSize: '14px' }}>
                Cole o link do briefing no Lovable para gerar os 9 roteiros de performance.
              </p>

              <label style={S.label}>Link do Lovable</label>
              <input
                type="url"
                value={link}
                onChange={e => setLink(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !loadingRoteiros && gerarRoteiros()}
                placeholder="https://lovable.dev/..."
                disabled={loadingRoteiros}
                style={{ ...S.textarea, marginBottom: '16px', opacity: loadingRoteiros ? 0.5 : 1 }}
              />

              {erro && (
                <div style={{ background: '#1f0a0a', border: '1px solid #5a1a1a', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#f87171', fontSize: '13px' }}>
                  {erro}
                </div>
              )}

              <button
                onClick={gerarRoteiros}
                disabled={loadingRoteiros}
                style={{
                  width: '100%', padding: '15px',
                  background: loadingRoteiros ? '#1a1a2e' : 'linear-gradient(135deg, #1e3a5f, #2a5a8f)',
                  color: loadingRoteiros ? '#555' : '#7ec8e3',
                  border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700',
                  cursor: loadingRoteiros ? 'not-allowed' : 'pointer'
                }}
              >
                {loadingRoteiros
                  ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><Spinner /> {progresso || 'Gerando...'}</span>
                  : 'Gerar Roteiros'}
              </button>

              {loadingRoteiros && (
                <div style={{ marginTop: '16px', background: '#0a0a15', border: '1px solid #1a1a2e', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#7ec8e3', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    <span style={{ color: '#7ec8e3', fontSize: '13px' }}>{progresso}</span>
                  </div>
                  <p style={{ margin: 0, color: '#444', fontSize: '12px' }}>Aguarde 30–60 segundos...</p>
                </div>
              )}
            </div>
          )}

          {/* ── ETAPA 1: Roteiros gerados ── */}
          {roteiros && etapa === 1 && (
            <div>
              {/* Banner */}
              <div style={{ background: 'linear-gradient(135deg, #0d1f35, #0f0f1a)', border: '1px solid #2a3a5e', borderRadius: '12px', padding: '20px 28px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: '#555', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Empreendimento</div>
                  <div style={{ fontSize: '19px', fontWeight: '700', color: '#fff' }}>{roteiros.empreendimento || 'Empreendimento Seazone'}</div>
                  {roteiros.localizacao && <div style={{ color: '#7ec8e3', fontSize: '13px', marginTop: '4px' }}>{roteiros.localizacao}</div>}
                </div>
                <div style={{ background: '#0f1a2a', border: '1px solid #1e3a5f', borderRadius: '8px', padding: '10px 20px', textAlign: 'center' }}>
                  <div style={{ color: '#7ec8e3', fontSize: '22px', fontWeight: '700' }}>9</div>
                  <div style={{ color: '#555', fontSize: '10px', textTransform: 'uppercase' }}>Roteiros</div>
                </div>
              </div>

              <div style={{ background: '#0a0f1a', border: '1px solid #1e2a3e', borderRadius: '8px', padding: '12px 16px', marginBottom: '28px', fontSize: '13px', color: '#7ec8e3' }}>
                Revise cada roteiro abaixo. Deixe feedback se necessário e clique em <strong>Aprovar e Criar Materiais</strong> quando estiver pronto.
              </div>

              <SecaoRoteiros
                titulo="Vídeo com Apresentadora"
                icone="🎬"
                badge="Apresentadora"
                badgeColor="#1e2a5e"
                tipo="video"
                materiais={roteiros.materiais?.videoApresentadora}
                feedbacks={feedbacks.apresentadora}
                onFeedback={(i, v) => setFeedback('apresentadora', i, v)}
              />

              <SecaoRoteiros
                titulo="Vídeo Narrado"
                icone="🎙️"
                badge="Narrado"
                badgeColor="#1e3a2e"
                tipo="video"
                materiais={roteiros.materiais?.videoNarrado}
                feedbacks={feedbacks.narrado}
                onFeedback={(i, v) => setFeedback('narrado', i, v)}
              />

              <SecaoRoteiros
                titulo="Estático"
                icone="🖼️"
                badge="Estático"
                badgeColor="#3a2a1e"
                tipo="estatico"
                materiais={roteiros.materiais?.estatico}
                feedbacks={feedbacks.estatico}
                onFeedback={(i, v) => setFeedback('estatico', i, v)}
              />

              {/* Botão aprovar */}
              <div style={{ position: 'sticky', bottom: '24px', zIndex: 50, marginTop: '32px' }}>
                <button
                  onClick={aprovarEGerarMidias}
                  style={{
                    width: '100%', padding: '18px',
                    background: 'linear-gradient(135deg, #0d3a1e, #1a5c30)',
                    color: '#4ade80',
                    border: '1px solid #1e5a2e',
                    borderRadius: '12px',
                    fontSize: '16px', fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.6)'
                  }}
                >
                  Aprovar e Criar Materiais
                </button>
              </div>
            </div>
          )}

          {/* ── ETAPA 2: Mídias ── */}
          {etapa === 2 && (
            <div>
              {/* Banner */}
              <div style={{ background: 'linear-gradient(135deg, #0d1f35, #0f0f1a)', border: '1px solid #2a3a5e', borderRadius: '12px', padding: '20px 28px', marginBottom: '32px' }}>
                <div style={{ color: '#555', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Produção</div>
                <div style={{ fontSize: '19px', fontWeight: '700', color: '#fff' }}>{roteiros?.empreendimento || 'Empreendimento Seazone'}</div>
              </div>

              {/* Loading */}
              {loadingMidias && (
                <div style={{ ...S.card, textAlign: 'center', padding: '48px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <Spinner />
                  </div>
                  <p style={{ color: '#7ec8e3', fontSize: '15px', fontWeight: '600', margin: '0 0 8px' }}>
                    Gerando imagens e áudios...
                  </p>
                  <p style={{ color: '#555', fontSize: '13px', margin: 0 }}>{progresso}</p>
                  <p style={{ color: '#444', fontSize: '12px', marginTop: '12px' }}>Esse processo leva entre 30 e 60 segundos.</p>
                </div>
              )}

              {erro && (
                <div style={{ background: '#1f0a0a', border: '1px solid #5a1a1a', borderRadius: '8px', padding: '14px 18px', marginBottom: '20px', color: '#f87171', fontSize: '13px' }}>
                  {erro}
                </div>
              )}

              {/* Mídias geradas */}
              {midias && !loadingMidias && (
                <div>
                  {/* Estático */}
                  <MidiaCard titulo="Estático — Estrutura 1" badge="Estático" badgeColor="#3a2a1e" icone="🖼️">
                    {midias.imagemUrl ? (
                      <div>
                        <img
                          src={midias.imagemUrl}
                          alt="Imagem estática gerada"
                          style={{ width: '100%', maxWidth: '420px', borderRadius: '10px', display: 'block', margin: '0 auto' }}
                        />
                        <a
                          href={midias.imagemUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'block', textAlign: 'center', marginTop: '12px', color: '#7ec8e3', fontSize: '13px' }}
                        >
                          Abrir em tamanho original ↗
                        </a>
                      </div>
                    ) : (
                      <div style={{ color: '#f87171', fontSize: '13px' }}>
                        Imagem não gerada. {midias.imagemErro || ''}
                      </div>
                    )}

                    {roteiros?.materiais?.estatico?.[0]?.textoDaArte && (
                      <div style={{ marginTop: '16px', background: '#13131f', border: '1px solid #2a2a3e', borderRadius: '8px', padding: '14px' }}>
                        <p style={{ ...S.label, marginBottom: '6px' }}>Texto da Arte</p>
                        <p style={{ margin: 0, color: '#e0e0f0', fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-line', fontWeight: '500' }}>
                          {roteiros.materiais.estatico[0].textoDaArte}
                        </p>
                      </div>
                    )}
                  </MidiaCard>

                  {/* Vídeo Narrado */}
                  <MidiaCard titulo="Vídeo Narrado — Estrutura 1" badge="Narrado" badgeColor="#1e3a2e" icone="🎙️">
                    {midias.narradoAudio ? (
                      <div>
                        <p style={{ color: '#888', fontSize: '12px', marginBottom: '10px' }}>Narração em off gerada via ElevenLabs</p>
                        <audio
                          controls
                          src={midias.narradoAudio}
                          style={{ width: '100%', borderRadius: '8px' }}
                        />
                      </div>
                    ) : (
                      <div style={{ color: '#f87171', fontSize: '13px' }}>
                        Áudio não gerado. {midias.narradoErro || ''}
                      </div>
                    )}
                  </MidiaCard>

                  {/* Vídeo com Apresentadora */}
                  <MidiaCard titulo="Vídeo com Apresentadora — Estrutura 1" badge="Apresentadora" badgeColor="#1e2a5e" icone="🎬">
                    {midias.apresentadoraAudio ? (
                      <div>
                        <p style={{ color: '#888', fontSize: '12px', marginBottom: '10px' }}>
                          Voz da Mônica gerada via ElevenLabs — lip-sync gerado via script de produção
                        </p>
                        <audio
                          controls
                          src={midias.apresentadoraAudio}
                          style={{ width: '100%', borderRadius: '8px' }}
                        />
                        <div style={{ marginTop: '12px', background: '#0a0f1a', border: '1px solid #1e2a3e', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#7ec8e3' }}>
                          Para gerar o MP4 com lip-sync da Mônica, execute:<br />
                          <code style={{ color: '#a0c8e0', fontFamily: 'monospace' }}>node ferramentas/gerar-lipsync-var2.mjs</code>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#f87171', fontSize: '13px' }}>
                        Áudio não gerado. {midias.apresentadoraErro || ''}
                      </div>
                    )}
                  </MidiaCard>

                  <div style={{ marginTop: '32px', padding: '20px', background: '#0f0f1a', border: '1px solid #2a2a3e', borderRadius: '12px', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 14px', color: '#888', fontSize: '14px' }}>
                      Materiais da Estrutura 1 gerados. Avance para as variações completas após aprovação.
                    </p>
                    <button
                      onClick={reiniciar}
                      style={{ background: 'transparent', border: '1px solid #2a3a5e', color: '#7ec8e3', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                    >
                      Novo briefing
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        input:focus, textarea:focus { border-color: #3a5a8f !important; }
      `}</style>
    </>
  )
}
