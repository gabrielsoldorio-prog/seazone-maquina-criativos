import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { useToast } from '../components/Toast'
import { Loader, ExternalLink, TrendingUp, Users, CheckCircle, XCircle } from 'lucide-react'

function Chip({ children, color = 'gray' }) {
  const cls = {
    gray:  'bg-slate-100 text-[#64748B]',
    green: 'bg-green-100 text-green-700',
    red:   'bg-red-100 text-red-600',
  }
  return (
    <span className={`inline-block text-xs px-2.5 py-1 rounded-lg font-medium mr-2 mb-2 ${cls[color] || cls.gray}`}>
      {children}
    </span>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 mb-4">
      <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">{title}</p>
      {children}
    </div>
  )
}

export default function Briefing() {
  const router   = useRouter()
  const addToast = useToast()

  const [briefing,   setBriefing]   = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [progresso,  setProgresso]  = useState('')
  const [erro,       setErro]       = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const data = localStorage.getItem('briefing')
    if (data) setBriefing(JSON.parse(data))
    else router.push('/')
  }, [])

  useEffect(() => {
    if (briefing && !loading) confirmarEGerar()
  }, [briefing])

  async function confirmarEGerar() {
    setLoading(true)
    setErro(null)

    const etapas = [
      'Gerando roteiro vídeo com apresentadora...',
      'Gerando roteiro vídeo narrado...',
      'Gerando textos dos estáticos...',
      'Avaliando alinhamento com briefing...',
      'Finalizando checklist do agente revisor...',
    ]
    let idx = 0
    setProgresso(etapas[0])
    const tick = setInterval(() => {
      idx = (idx + 1) % etapas.length
      setProgresso(etapas[idx])
    }, 4000)

    try {
      const res  = await fetch('/api/gerar-criativos', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ briefing }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar criativos')

      localStorage.setItem('criativos', JSON.stringify(data))
      addToast('45 criativos gerados com sucesso!')
      router.push('/criativos')
    } catch (e) {
      setErro(e.message)
      addToast(e.message, 'error')
    } finally {
      clearInterval(tick)
      setProgresso('')
      setLoading(false)
    }
  }

  if (!briefing) return (
    <Layout title="Briefing">
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse space-y-3 w-full max-w-2xl">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-32 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    </Layout>
  )

  const df  = briefing.dadosFinanceiros || {}
  const est = briefing.estruturas || {}

  return (
    <>
      <Head>
        <title>Briefing — {briefing.empreendimento || 'Seazone'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout title="Briefing" subtitle={briefing.empreendimento}>
        <div className="max-w-3xl mx-auto">

          {/* Banner empreendimento */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 mb-5 flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Empreendimento</p>
              <h1 className="text-2xl font-bold text-[#0F172A] mb-1">{briefing.empreendimento}</h1>
              <p className="text-sm font-medium text-[#E85D3A]">{briefing.localizacao}</p>
            </div>
            {briefing.linkDrive && (
              <a
                href={briefing.linkDrive}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs text-[#64748B] hover:bg-[#F8FAFC] transition-colors no-underline"
              >
                <ExternalLink size={13} />
                Assets Drive
              </a>
            )}
          </div>

          {/* Dados financeiros */}
          {Object.values(df).some(v => v && v !== 'A confirmar') && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              {[
                { label: 'ROI ao ano',             value: df.roi },
                { label: 'Rentabilidade líquida',  value: df.rentabilidadeLiquida },
                { label: 'Menor cota',             value: df.menorCota },
                { label: 'Ticket médio',           value: df.ticketMedio },
                { label: 'Valorização est.',       value: df.valorizacaoEstimada },
              ]
                .filter(i => i.value && i.value !== 'A confirmar')
                .map(({ label, value }) => (
                  <div key={label} className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4">
                    <p className="text-xs text-[#94A3B8] mb-1">{label}</p>
                    <p className="text-base font-bold text-[#E85D3A]">{value}</p>
                    <p className="text-[10px] text-[#94A3B8] mt-0.5">aluguel por temporada</p>
                  </div>
                ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Estruturas */}
            <Section title="Estruturas disponíveis">
              {['videoApresentadora', 'videoNarrado', 'estatico'].map(fmt => {
                const lista = est[fmt] || []
                if (!lista.length) return null
                const nomes = { videoApresentadora: 'Apresentadora', videoNarrado: 'Narrado', estatico: 'Estático' }
                return (
                  <div key={fmt} className="mb-3">
                    <p className="text-xs font-semibold text-[#64748B] mb-1">{nomes[fmt]}</p>
                    {lista.map(e => (
                      <div key={e.numero} className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-[#94A3B8] w-4">{e.numero}.</span>
                        <code className="text-xs text-[#E85D3A] bg-orange-50 px-2 py-0.5 rounded font-mono">
                          {e.sequencia || e.foco}
                        </code>
                      </div>
                    ))}
                  </div>
                )
              })}
            </Section>

            {/* Público-alvo */}
            <Section title="Público-alvo">
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} color="#E85D3A" />
                <span className="text-xs font-semibold text-[#E85D3A]">Core</span>
              </div>
              {briefing.publicoAlvo?.core && (
                <p className="text-sm text-[#64748B] leading-relaxed mb-3">{briefing.publicoAlvo.core}</p>
              )}
              {briefing.publicoAlvo?.secundario && (
                <>
                  <p className="text-xs font-semibold text-[#94A3B8] mb-1">Secundário</p>
                  <p className="text-sm text-[#94A3B8] leading-relaxed">{briefing.publicoAlvo.secundario}</p>
                </>
              )}
            </Section>
          </div>

          {/* Do's */}
          {briefing.dos?.length > 0 && (
            <Section title="Do's — reforçar">
              <div className="flex flex-wrap">
                {briefing.dos.map((d, i) => (
                  <Chip key={i} color="green">
                    <span className="flex items-center gap-1"><CheckCircle size={10} /> {d}</span>
                  </Chip>
                ))}
              </div>
            </Section>
          )}

          {/* Don'ts */}
          {briefing.donts?.length > 0 && (
            <Section title="Don'ts — evitar">
              <div className="flex flex-wrap">
                {briefing.donts.map((d, i) => (
                  <Chip key={i} color="red">
                    <span className="flex items-center gap-1"><XCircle size={10} /> {d}</span>
                  </Chip>
                ))}
              </div>
            </Section>
          )}

          {/* Pitch */}
          {briefing.pitch && (
            <Section title="Pitch">
              <p className="text-sm text-[#64748B] leading-relaxed italic">"{briefing.pitch}"</p>
            </Section>
          )}

          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-4">
              {erro}
            </div>
          )}

          {/* Botão / progress */}
          <div className="sticky bottom-6 mt-6">
            <button
              onClick={confirmarEGerar}
              disabled={loading}
              className="w-full py-4 bg-[#E85D3A] hover:bg-[#D04D2A] text-white font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center gap-3 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ boxShadow: loading ? 'none' : '0 4px 20px rgba(232,93,58,0.35)' }}
            >
              {loading ? (
                <>
                  <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span className="text-sm">{progresso || 'Gerando criativos...'}</span>
                </>
              ) : (
                'Confirmar e Gerar 45 Criativos'
              )}
            </button>
            {loading && (
              <p className="text-center text-xs text-[#94A3B8] mt-2">Aguarde 60–90 segundos...</p>
            )}
          </div>
        </div>
      </Layout>

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}
