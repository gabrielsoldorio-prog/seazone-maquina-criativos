import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import AgentPanel from '../components/AgentPanel'
import VariacaoCard from '../components/VariacaoCard'
import { useToast } from '../components/Toast'
import { Loader, Plus } from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────

function agruparPorEstrutura(materiais) {
  const grupos = {}
  ;(materiais || []).forEach(m => {
    const e = m.estrutura || 1
    if (!grupos[e]) grupos[e] = []
    grupos[e].push(m)
  })
  return grupos
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCards() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] p-4 animate-pulse">
          <div className="flex gap-2 mb-3">
            <div className="h-5 w-8 bg-gray-200 rounded-full" />
            <div className="h-5 w-12 bg-gray-200 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── EstruturaSection ──────────────────────────────────────────────────────────

function EstruturaSection({ numero, variacoes, tipo, score, imagemPrompt, loading }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Estrutura {numero}</h2>
      {loading ? (
        <SkeletonCards />
      ) : variacoes.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {variacoes.map((v, i) => (
            <VariacaoCard
              key={v.variacao ?? i}
              variacao={v}
              tipo={tipo}
              score={score}
              imagemPrompt={imagemPrompt}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 text-sm text-[#94A3B8] text-center">
          Nenhuma variação disponível para esta estrutura.
        </div>
      )}
    </section>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'estatico',      label: 'Estáticos' },
  { id: 'narrado',       label: 'Narrados' },
  { id: 'apresentadora', label: 'Apresentadora' },
]

export default function Criativos() {
  const router   = useRouter()
  const addToast = useToast()

  const [criativos, setCriativos] = useState(null)
  const [abaAtiva,  setAbaAtiva]  = useState('estatico')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const data = localStorage.getItem('criativos')
    if (!data) { router.push('/'); return }
    setCriativos(JSON.parse(data))
  }, [])

  if (!criativos) {
    return (
      <Layout title="Criativos">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse space-y-3 w-full max-w-2xl">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-48 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </Layout>
    )
  }

  const mat = criativos.materiais || {}

  const mapaAbas = {
    estatico:      mat.estatico           || [],
    narrado:       mat.videoNarrado       || [],
    apresentadora: mat.videoApresentadora || [],
  }

  const gruposAtivos = agruparPorEstrutura(mapaAbas[abaAtiva])

  const totalMateriais = [
    ...(mat.estatico || []),
    ...(mat.videoNarrado || []),
    ...(mat.videoApresentadora || []),
  ].length

  const overallScore  = criativos.agentes?.nota ?? null
  const imagemPrompt  = criativos.imagemPrompt  || null

  return (
    <>
      <Head>
        <title>Criativos — {criativos.empreendimento || 'Seazone'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout title="Criativos" subtitle={criativos.empreendimento}>

        {/* Stats bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-2xl font-bold text-[#0F172A]">{totalMateriais}</span>
              <span className="text-sm text-[#94A3B8] ml-1">materiais gerados</span>
            </div>
            <div className="h-5 w-px bg-[#E2E8F0]" />
            <div className="text-sm text-[#64748B]">
              3 formatos × 3 estruturas × 5 variações
            </div>
          </div>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors duration-200"
          >
            <Plus size={13} /> Novo projeto
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#E2E8F0] mb-8">
          <div className="flex gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setAbaAtiva(tab.id)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                  abaAtiva === tab.id
                    ? 'text-[#E85D3A] border-[#E85D3A]'
                    : 'text-[#94A3B8] border-transparent hover:text-[#64748B]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Estruturas */}
        {[1, 2, 3].map(e => (
          <EstruturaSection
            key={e}
            numero={e}
            variacoes={gruposAtivos[e] || []}
            tipo={abaAtiva}
            score={overallScore}
            imagemPrompt={imagemPrompt}
            loading={false}
          />
        ))}

        {/* Agent Panel — inline */}
        <section className="mt-4 mb-8">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Agentes</h2>
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <AgentPanel agentes={criativos.agentes} criativos={criativos} />
          </div>
        </section>

        {/* Footer */}
        <div className="mt-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm px-6 py-5 text-center">
          <p className="text-sm text-[#64748B] mb-3">
            {totalMateriais} criativos gerados para {criativos.empreendimento}.
            Expanda cada card para editar e exportar.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 border border-[#E85D3A] text-[#E85D3A] hover:bg-orange-50 rounded-lg text-sm font-semibold transition-colors duration-200"
          >
            Novo empreendimento
          </button>
        </div>
      </Layout>

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}
