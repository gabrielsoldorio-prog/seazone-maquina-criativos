import { useState } from 'react'
import { ChevronDown, ChevronUp, Copy, Download, Video, Loader } from 'lucide-react'

function Field({ label, value, onChange, rows = 3 }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        className="w-full border border-[#E2E8F0] rounded-lg p-3 text-sm text-[#0F172A] resize-y focus:outline-none focus:ring-2 focus:ring-[#E85D3A] transition-shadow duration-200 bg-white"
      />
    </div>
  )
}

export default function VariacaoCard({ variacao, tipo }) {
  const [expanded, setExpanded] = useState(false)

  const [campos, setCampos] = useState(() => {
    if (tipo === 'estatico') {
      return {
        referenciaVisual: variacao.referenciaVisual || '',
        textoDaArte:      variacao.textoDaArte || '',
        legenda:          variacao.legenda || '',
      }
    }
    return {
      cenas:   (variacao.cenas || []).map(c => ({ ...c })),
      legenda: variacao.legenda || '',
    }
  })

  const [videoUrl,      setVideoUrl]      = useState(null)
  const [videoStatus,   setVideoStatus]   = useState(null)
  const [videoProgress, setVideoProgress] = useState(0)

  const vLabel   = `V${variacao.variacao}`
  const isLonga  = variacao.tipo !== 'curta'
  const duracao  = variacao.duracao || (isLonga ? '30-40s' : '10-20s')

  function getPreview() {
    if (tipo === 'estatico') {
      return (campos.textoDaArte || campos.referenciaVisual || '').slice(0, 120)
    }
    const c = campos.cenas[0]
    return (c?.locucao || c?.cena || '').slice(0, 120)
  }

  function buildText() {
    if (tipo === 'estatico') {
      return [
        `REFERÊNCIA VISUAL:\n${campos.referenciaVisual}`,
        `TEXTO DA ARTE:\n${campos.textoDaArte}`,
        `LEGENDA:\n${campos.legenda}`,
      ].join('\n\n')
    }
    return [
      ...campos.cenas.map((c, i) =>
        `CENA ${i + 1}:\nCena: ${c.cena || ''}\nLettering: ${c.lettering || ''}\nLocução: ${c.locucao || ''}`
      ),
      `LEGENDA:\n${campos.legenda}`,
    ].join('\n\n')
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildText()).catch(() => {})
  }

  function handleDownload() {
    const blob = new Blob([buildText()], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${tipo}-${vLabel}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleGerarVideo() {
    if (videoStatus === 'loading') return
    setVideoStatus('loading')
    setVideoProgress(15)

    const prompt = campos.cenas.map(c => c.cena).filter(Boolean).join('. ')
      || variacao.imagemPrompt || 'Real estate property promotional video'

    try {
      const res  = await fetch('/api/gerar-video', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.erro || 'Erro')

      const { requestId } = data
      setVideoProgress(25)

      const poll = setInterval(async () => {
        try {
          const sr   = await fetch(`/api/gerar-video?requestId=${requestId}`)
          const sData = await sr.json()

          if (sData.status === 'COMPLETED') {
            clearInterval(poll)
            setVideoUrl(sData.url)
            setVideoStatus('done')
            setVideoProgress(100)
          } else if (sData.status === 'FAILED') {
            clearInterval(poll)
            setVideoStatus('error')
          } else {
            setVideoProgress(p => Math.min(p + 8, 90))
          }
        } catch {
          clearInterval(poll)
          setVideoStatus('error')
        }
      }, 3000)
    } catch {
      setVideoStatus('error')
    }
  }

  function setCena(i, field, val) {
    setCampos(p => {
      const cenas = p.cenas.map((c, idx) => idx === i ? { ...c, [field]: val } : c)
      return { ...p, cenas }
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 transition-shadow duration-200 hover:shadow-md">

      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF1EE] text-[#E85D3A]">
            {vLabel}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-[#64748B]">
            {duracao}
          </span>
          {isLonga
            ? <span className="text-xs text-[#94A3B8]">Longa</span>
            : <span className="text-xs text-[#94A3B8]">Curta</span>}
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-xs text-[#64748B] hover:text-[#0F172A] transition-colors duration-200"
        >
          {expanded
            ? <><ChevronUp size={13} /> Recolher</>
            : <><ChevronDown size={13} /> Expandir</>}
        </button>
      </div>

      {/* Preview */}
      {!expanded && (
        <p className="text-sm text-[#64748B] leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {getPreview() || 'Clique em Expandir para ver o conteúdo.'}
        </p>
      )}

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-[#E2E8F0] pt-4 mt-1 transition-all duration-300 ease-in-out">

          {tipo === 'estatico' ? (
            <>
              <Field label="Referência Visual" value={campos.referenciaVisual}
                onChange={v => setCampos(p => ({ ...p, referenciaVisual: v }))} rows={2} />
              <Field label="Texto da Arte" value={campos.textoDaArte}
                onChange={v => setCampos(p => ({ ...p, textoDaArte: v }))} rows={5} />
              <Field label="Legenda" value={campos.legenda}
                onChange={v => setCampos(p => ({ ...p, legenda: v }))} rows={4} />
            </>
          ) : (
            <>
              {campos.cenas.map((cena, i) => (
                <div key={i} className="mb-5 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-3">Cena {i + 1}</p>
                  <Field label="Cena" value={cena.cena || ''} rows={2}
                    onChange={v => setCena(i, 'cena', v)} />
                  <Field label="Lettering" value={cena.lettering || ''} rows={2}
                    onChange={v => setCena(i, 'lettering', v)} />
                  <Field label="Locução" value={cena.locucao || ''} rows={3}
                    onChange={v => setCena(i, 'locucao', v)} />
                </div>
              ))}
              <Field label="Legenda" value={campos.legenda}
                onChange={v => setCampos(p => ({ ...p, legenda: v }))} rows={4} />
            </>
          )}

          {/* Video generation */}
          {(tipo === 'narrado' || tipo === 'apresentadora') && (
            <div className="mb-5">
              {videoStatus === 'loading' && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-[#64748B] mb-1">
                    <span>Gerando vídeo via Fal.ai...</span>
                    <span>{videoProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#E85D3A] rounded-full transition-all duration-500"
                      style={{ width: `${videoProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {videoUrl && (
                <video
                  controls
                  className="w-full rounded-xl mb-3 border border-[#E2E8F0]"
                >
                  <source src={videoUrl} type="video/mp4" />
                </video>
              )}

              {videoStatus !== 'done' && (
                <button
                  onClick={handleGerarVideo}
                  disabled={videoStatus === 'loading'}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {videoStatus === 'loading'
                    ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Gerando...</>
                    : <><Video size={13} /> Gerar Vídeo</>}
                </button>
              )}

              {videoStatus === 'error' && (
                <p className="text-xs text-red-500 mt-2">Erro ao gerar vídeo. Tente novamente.</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#64748B] border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] transition-all duration-200"
            >
              <Copy size={12} /> Copiar
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#64748B] border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] transition-all duration-200"
            >
              <Download size={12} /> Baixar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
