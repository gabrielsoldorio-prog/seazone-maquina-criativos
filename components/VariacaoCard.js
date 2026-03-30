import { useState, useRef } from 'react'
import { ChevronDown, ChevronUp, Copy, Download, Video, Loader, X, FileImage, Maximize2 } from 'lucide-react'

// ── Field ─────────────────────────────────────────────────────────────────────
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

// ── VideoModal ────────────────────────────────────────────────────────────────
function VideoModal({ variacao, tipo, campos, setCampos, setCena, videoUrl, videoStatus, videoProgress, onGerarVideo, onClose }) {
  const [dur, setDur] = useState(variacao.duracao || '30-40s')

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF1EE] text-[#E85D3A]">
              V{variacao.variacao}
            </span>
            <span className="text-sm font-semibold text-[#0F172A]">
              {tipo === 'narrado' ? 'Vídeo Narrado' : 'Vídeo Apresentadora'} — Estrutura {variacao.estrutura}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[#F8FAFC] rounded-lg transition-colors">
            <X size={16} color="#64748B" />
          </button>
        </div>

        <div className="p-6">
          {/* Duration selector */}
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Duração:</span>
            {['10-20s', '30-40s'].map(d => (
              <button
                key={d}
                onClick={() => setDur(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  dur === d
                    ? 'bg-[#E85D3A] text-white'
                    : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] hover:border-[#E85D3A]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Video player or placeholder */}
          {videoUrl ? (
            <video controls className="w-full rounded-xl mb-5 border border-[#E2E8F0]">
              <source src={videoUrl} type="video/mp4" />
            </video>
          ) : (
            <div className="bg-[#F8FAFC] border border-dashed border-[#E2E8F0] rounded-xl h-44 flex flex-col items-center justify-center mb-5 gap-2">
              {videoStatus === 'loading' ? (
                <>
                  <Loader size={20} color="#E85D3A" style={{ animation: 'spin 1s linear infinite' }} />
                  <span className="text-xs text-[#94A3B8]">Gerando vídeo… {videoProgress}%</span>
                  <div className="w-40 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div className="h-full bg-[#E85D3A] rounded-full transition-all duration-500" style={{ width: `${videoProgress}%` }} />
                  </div>
                </>
              ) : (
                <>
                  <Video size={24} color="#94A3B8" />
                  <span className="text-xs text-[#94A3B8]">Nenhum vídeo gerado</span>
                  <button
                    onClick={onGerarVideo}
                    className="mt-1 flex items-center gap-1.5 px-4 py-2 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Video size={12} /> Gerar Vídeo
                  </button>
                  {videoStatus === 'error' && (
                    <span className="text-xs text-red-500 mt-1">Erro. Tente novamente.</span>
                  )}
                </>
              )}
            </div>
          )}

          {/* Editable scenes */}
          {(campos.cenas || []).map((cena, i) => (
            <div key={i} className="mb-4 p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-3">Cena {i + 1}</p>
              {[
                { field: 'cena',      label: 'Cena',      rows: 2 },
                { field: 'lettering', label: 'Lettering', rows: 2 },
                { field: 'locucao',   label: 'Locução',   rows: 3 },
              ].map(({ field, label, rows }) => (
                <div key={field} className="mb-3">
                  <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">{label}</label>
                  <textarea
                    value={cena[field] || ''}
                    onChange={e => setCena(i, field, e.target.value)}
                    rows={rows}
                    className="w-full border border-[#E2E8F0] rounded-lg p-2.5 text-sm text-[#0F172A] resize-y focus:outline-none focus:ring-2 focus:ring-[#E85D3A] transition-shadow bg-white"
                  />
                </div>
              ))}
            </div>
          ))}

          {/* Legenda */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Legenda</label>
            <textarea
              value={campos.legenda || ''}
              onChange={e => setCampos(p => ({ ...p, legenda: e.target.value }))}
              rows={4}
              className="w-full border border-[#E2E8F0] rounded-lg p-3 text-sm text-[#0F172A] resize-y focus:outline-none focus:ring-2 focus:ring-[#E85D3A] transition-shadow bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── CanvaEditor ───────────────────────────────────────────────────────────────
const CANVA_ZONES = [
  { id: 'pin',      label: 'PIN / Localização', top: '4%',  left: '3%', right: '50%', height: '9%' },
  { id: 'headline', label: 'Headline',           top: '55%', left: '3%', right: '3%',  height: '16%' },
  { id: 'roi',      label: 'Dado Financeiro',    top: '73%', left: '3%', right: '3%',  height: '12%' },
]

function CanvaEditor({ imageUrl, campos, setCampos }) {
  const [activeZone, setActiveZone] = useState(null)
  const [floatPos,   setFloatPos]   = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)

  const lines = (campos.textoDaArte || '').split('\n')

  function getZoneText(id) {
    if (id === 'pin')      return lines[0] || ''
    if (id === 'roi')      return lines[lines.length - 1] || ''
    return lines.slice(1, lines.length - 1).join('\n') || ''
  }

  function setZoneText(id, val) {
    let updated
    if (id === 'pin')      updated = [val, ...lines.slice(1)]
    else if (id === 'roi') updated = [...lines.slice(0, -1), val]
    else                   updated = [lines[0] || '', val, lines[lines.length - 1] || '']
    setCampos(p => ({ ...p, textoDaArte: updated.join('\n') }))
  }

  function handleZoneClick(e, zoneId) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = Math.min(e.clientX - rect.left, rect.width - 252)
    const y = Math.min(e.clientY - rect.top, rect.height - 130)
    setFloatPos({ x, y })
    setActiveZone(prev => prev === zoneId ? null : zoneId)
  }

  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Editor Visual</p>
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden bg-[#0F172A] select-none"
        style={{ aspectRatio: '4/5' }}
      >
        <img src={imageUrl} alt="" className="w-full h-full object-cover" draggable={false} />

        {CANVA_ZONES.map(z => (
          <div
            key={z.id}
            onClick={e => handleZoneClick(e, z.id)}
            className={`absolute cursor-pointer rounded border-2 transition-all duration-150 ${
              activeZone === z.id
                ? 'border-[#E85D3A] bg-[#E85D3A]/10'
                : 'border-transparent hover:border-white/60 hover:bg-white/10'
            }`}
            style={{ top: z.top, left: z.left, right: z.right, height: z.height }}
            title={`Editar: ${z.label}`}
          />
        ))}

        {activeZone && (
          <div
            className="absolute z-10 bg-white rounded-xl shadow-xl border border-[#E2E8F0] p-3 w-60"
            style={{ left: floatPos.x, top: floatPos.y }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-[#0F172A]">
                {CANVA_ZONES.find(z => z.id === activeZone)?.label}
              </span>
              <button onClick={() => setActiveZone(null)} className="p-0.5 hover:bg-[#F8FAFC] rounded">
                <X size={11} color="#94A3B8" />
              </button>
            </div>
            <textarea
              value={getZoneText(activeZone)}
              onChange={e => setZoneText(activeZone, e.target.value)}
              rows={3}
              autoFocus
              className="w-full border border-[#E2E8F0] rounded-lg p-2 text-xs text-[#0F172A] resize-none focus:outline-none focus:ring-2 focus:ring-[#E85D3A]"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ── VariacaoCard ──────────────────────────────────────────────────────────────
export default function VariacaoCard({ variacao, tipo, score, imagemPrompt }) {
  const [expanded,      setExpanded]      = useState(false)
  const [showModal,     setShowModal]     = useState(false)
  const [imageUrl,      setImageUrl]      = useState(null)
  const [imageLoading,  setImageLoading]  = useState(false)
  const [videoUrl,      setVideoUrl]      = useState(null)
  const [videoStatus,   setVideoStatus]   = useState(null)
  const [videoProgress, setVideoProgress] = useState(0)

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

  const vLabel  = `V${variacao.variacao}`
  const isLonga = variacao.tipo !== 'curta'
  const duracao = variacao.duracao || (isLonga ? '30-40s' : '10-20s')
  const isVideo = tipo !== 'estatico'

  function getPreview() {
    if (tipo === 'estatico') {
      return (campos.textoDaArte || campos.referenciaVisual || '').slice(0, 120)
    }
    const c = (campos.cenas || [])[0]
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
      ...(campos.cenas || []).map((c, i) =>
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

  async function handleGerarImagem() {
    if (imageLoading) return
    setImageLoading(true)
    try {
      const prompt = imagemPrompt || campos.referenciaVisual || 'Luxury real estate property, Brazil, modern architecture'
      const res    = await fetch('/api/gerar-imagem', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro')
      setImageUrl(data.imageUrl)
    } catch {
      // fail silently
    } finally {
      setImageLoading(false)
    }
  }

  async function handleGerarVideo() {
    if (videoStatus === 'loading') return
    setVideoStatus('loading')
    setVideoProgress(15)

    const prompt = (campos.cenas || []).map(c => c.cena).filter(Boolean).join('. ')
      || imagemPrompt || 'Real estate property promotional video Brazil'

    try {
      const res  = await fetch('/api/gerar-video', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro')

      const { requestId } = data
      setVideoProgress(25)

      const poll = setInterval(async () => {
        try {
          const sr    = await fetch(`/api/gerar-video?requestId=${requestId}`)
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
      const cenas = (p.cenas || []).map((c, idx) => idx === i ? { ...c, [field]: val } : c)
      return { ...p, cenas }
    })
  }

  const scoreLabel = score != null ? `${Number(score).toFixed(1)}/10` : null

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 transition-shadow duration-200 hover:shadow-md">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF1EE] text-[#E85D3A]">
              {vLabel}
            </span>
            {/* Duration only for video types */}
            {isVideo && (
              <>
                <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-[#64748B]">{duracao}</span>
                <span className="text-xs text-[#94A3B8]">{isLonga ? 'Longa' : 'Curta'}</span>
              </>
            )}
            {scoreLabel && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                {scoreLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {isVideo && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1 text-xs text-[#64748B] hover:text-[#0F172A] transition-colors px-2 py-1 rounded-lg hover:bg-[#F8FAFC]"
              >
                <Maximize2 size={11} /> Abrir
              </button>
            )}
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs text-[#64748B] hover:text-[#0F172A] transition-colors duration-200"
            >
              {expanded
                ? <><ChevronUp size={13} /> Recolher</>
                : <><ChevronDown size={13} /> Expandir</>}
            </button>
          </div>
        </div>

        {/* Image preview for estáticos */}
        {tipo === 'estatico' && (
          <div className="mb-3">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                className="w-full rounded-xl object-cover border border-[#E2E8F0]"
                style={{ height: '140px' }}
              />
            ) : (
              <div className="rounded-xl bg-[#F8FAFC] border border-dashed border-[#E2E8F0] flex items-center justify-center gap-2 py-3">
                <FileImage size={13} color="#94A3B8" />
                <span className="text-xs text-[#94A3B8]">Sem imagem</span>
                <button
                  onClick={handleGerarImagem}
                  disabled={imageLoading}
                  className="flex items-center gap-1 text-xs text-[#E85D3A] font-medium hover:underline disabled:opacity-50 ml-1"
                >
                  {imageLoading
                    ? <><Loader size={10} style={{ animation: 'spin 1s linear infinite' }} /> Gerando...</>
                    : 'Gerar imagem'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Preview text */}
        {!expanded && (
          <p className="text-sm text-[#64748B] leading-relaxed line-clamp-2 min-h-[2.5rem]">
            {getPreview() || 'Clique em Expandir para ver o conteúdo.'}
          </p>
        )}

        {/* Expanded */}
        {expanded && (
          <div className="border-t border-[#E2E8F0] pt-4 mt-1">
            {tipo === 'estatico' ? (
              <>
                {imageUrl && <CanvaEditor imageUrl={imageUrl} campos={campos} setCampos={setCampos} />}
                {!imageUrl && (
                  <button
                    onClick={handleGerarImagem}
                    disabled={imageLoading}
                    className="w-full mb-4 flex items-center justify-center gap-2 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {imageLoading
                      ? <><Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Gerando imagem...</>
                      : <><FileImage size={12} /> Gerar Imagem</>}
                  </button>
                )}
                <Field label="Referência Visual" value={campos.referenciaVisual}
                  onChange={v => setCampos(p => ({ ...p, referenciaVisual: v }))} rows={2} />
                <Field label="Texto da Arte" value={campos.textoDaArte}
                  onChange={v => setCampos(p => ({ ...p, textoDaArte: v }))} rows={5} />
                <Field label="Legenda" value={campos.legenda}
                  onChange={v => setCampos(p => ({ ...p, legenda: v }))} rows={4} />
              </>
            ) : (
              <>
                {(campos.cenas || []).map((cena, i) => (
                  <div key={i} className="mb-5 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-3">Cena {i + 1}</p>
                    <Field label="Cena"      value={cena.cena || ''}      rows={2} onChange={v => setCena(i, 'cena', v)} />
                    <Field label="Lettering" value={cena.lettering || ''} rows={2} onChange={v => setCena(i, 'lettering', v)} />
                    <Field label="Locução"   value={cena.locucao || ''}   rows={3} onChange={v => setCena(i, 'locucao', v)} />
                  </div>
                ))}
                <Field label="Legenda" value={campos.legenda}
                  onChange={v => setCampos(p => ({ ...p, legenda: v }))} rows={4} />

                {/* Inline video generation */}
                <div className="mb-4">
                  {videoStatus === 'loading' && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-[#64748B] mb-1">
                        <span>Gerando vídeo…</span><span>{videoProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div className="h-full bg-[#E85D3A] rounded-full transition-all duration-500" style={{ width: `${videoProgress}%` }} />
                      </div>
                    </div>
                  )}
                  {videoUrl && (
                    <video controls className="w-full rounded-xl mb-3 border border-[#E2E8F0]">
                      <source src={videoUrl} type="video/mp4" />
                    </video>
                  )}
                  {videoStatus !== 'done' && (
                    <button
                      onClick={handleGerarVideo}
                      disabled={videoStatus === 'loading'}
                      className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
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
              </>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#64748B] border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] transition-all">
                <Copy size={12} /> Copiar
              </button>
              <button onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#64748B] border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] transition-all">
                <Download size={12} /> Baixar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen modal for video types */}
      {showModal && isVideo && (
        <VideoModal
          variacao={variacao}
          tipo={tipo}
          campos={campos}
          setCampos={setCampos}
          setCena={setCena}
          videoUrl={videoUrl}
          videoStatus={videoStatus}
          videoProgress={videoProgress}
          onGerarVideo={handleGerarVideo}
          onClose={() => setShowModal(false)}
        />
      )}

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}
