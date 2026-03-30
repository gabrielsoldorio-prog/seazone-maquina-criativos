import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { useToast } from '../components/Toast'
import { Link2, FolderOpen, Loader } from 'lucide-react'

export default function Home() {
  const router   = useRouter()
  const addToast = useToast()

  const [linkLovable, setLinkLovable] = useState('')
  const [linkDrive,   setLinkDrive]   = useState('')
  const [loading,     setLoading]     = useState(false)
  const [progresso,   setProgresso]   = useState('')
  const [erro,        setErro]        = useState(null)

  async function analisarBriefing() {
    if (!linkLovable.trim()) { setErro('Insira o link do Lovable.'); return }
    setLoading(true)
    setErro(null)

    const etapas = [
      'Acessando o briefing do Lovable...',
      'Extraindo estruturas e sequências...',
      "Mapeando Do's e Don'ts...",
      'Lendo dados financeiros confirmados...',
      'Identificando público-alvo...',
      'Estruturando briefing resumido...',
    ]
    let idx = 0
    setProgresso(etapas[0])
    const tick = setInterval(() => {
      idx = (idx + 1) % etapas.length
      setProgresso(etapas[idx])
    }, 3000)

    try {
      const res  = await fetch('/api/analisar-briefing', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ linkLovable, linkDrive }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao analisar briefing')

      localStorage.setItem('briefing', JSON.stringify(data))
      addToast('Briefing analisado com sucesso!')
      router.push('/briefing')
    } catch (e) {
      setErro(e.message)
      addToast(e.message, 'error')
    } finally {
      clearInterval(tick)
      setProgresso('')
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Gerar Criativos — Seazone</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout title="Gerar Criativos">
        <div
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 73px)', margin: '-32px -32px', padding: '32px' }}
        >
          <div className="w-full max-w-2xl">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8">
              <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Gerar Criativos</h1>
              <p className="text-sm text-[#64748B] mb-8">
                Cole os links do Lovable e do Google Drive para gerar os 45 criativos de performance.
              </p>

              {/* Skeleton while loading */}
              {loading && (
                <div className="animate-pulse space-y-4 mb-6">
                  <div className="h-11 bg-gray-200 rounded-lg" />
                  <div className="h-11 bg-gray-200 rounded-lg" />
                </div>
              )}

              {!loading && (
                <>
                  {/* Link Lovable */}
                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
                      Link do Lovable
                    </label>
                    <div className="relative">
                      <Link2 size={15} color="#94A3B8" className="absolute left-3 top-3.5 pointer-events-none" />
                      <input
                        type="url"
                        value={linkLovable}
                        onChange={e => setLinkLovable(e.target.value)}
                        placeholder="https://lovable.dev/projects/..."
                        className="w-full pl-10 pr-4 py-3 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#E85D3A] transition-shadow duration-200"
                      />
                    </div>
                  </div>

                  {/* Link Drive */}
                  <div className="mb-6">
                    <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
                      Link do Google Drive — opcional
                    </label>
                    <div className="relative">
                      <FolderOpen size={15} color="#94A3B8" className="absolute left-3 top-3.5 pointer-events-none" />
                      <input
                        type="url"
                        value={linkDrive}
                        onChange={e => setLinkDrive(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && analisarBriefing()}
                        placeholder="https://drive.google.com/drive/folders/..."
                        className="w-full pl-10 pr-4 py-3 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#E85D3A] transition-shadow duration-200"
                      />
                    </div>
                  </div>

                  {erro && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-5">
                      {erro}
                    </div>
                  )}
                </>
              )}

              <button
                onClick={analisarBriefing}
                disabled={loading}
                className="w-full py-3 px-6 bg-[#E85D3A] hover:bg-[#D04D2A] text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <span className="text-sm">{progresso || 'Analisando...'}</span>
                  </>
                ) : 'Gerar Criativos'}
              </button>

              {loading && (
                <p className="text-center text-xs text-[#94A3B8] mt-3">Aguarde 30–60 segundos...</p>
              )}
            </div>
          </div>
        </div>
      </Layout>

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}
