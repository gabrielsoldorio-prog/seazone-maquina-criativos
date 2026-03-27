import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import CenaTable from '../components/CenaTable'
import ImageAnnotator from '../components/ImageAnnotator'
import VideoPlayer from '../components/VideoPlayer'
import AgenteCard from '../components/AgenteCard'

const C = {
  bg: '#0d0d0d', card: '#111118', border: '#1e1e2e',
  coral: '#E8533A', text: '#e0e0e0', sub: '#888', label: '#555'
}

const TABS = [
  { id: 'estatico',       label: 'Estáticos',          icone: '🖼️' },
  { id: 'narrado',        label: 'Vídeos Narrados',     icone: '🎙️' },
  { id: 'apresentadora',  label: 'Vídeos Apresentadora',icone: '🎬' },
]

function Spinner() {
  return <span style={{ width: '14px', height: '14px', border: '2px solid #333', borderTop: `2px solid ${C.coral}`, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
}

// ─── Card de material individual ──────────────────────────────────────────
function MaterialCard({ tipo, estrutura, material, midia, onAtualizar }) {
  const [feedback, setFeedback] = useState('')
  const [atualizando, setAtualizando] = useState(false)
  const [erroAtualizar, setErroAtualizar] = useState(null)

  async function atualizar() {
    if (!feedback.trim()) return
    setAtualizando(true)
    setErroAtualizar(null)
    try {
      const res = await fetch('/api/atualizar-midia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          feedback,
          estrutura,
          promptOriginal:   midia?.promptUsado   || '',
          locucaoOriginal:  tipo !== 'estatico'
            ? (material?.cenas || []).map(c => c.locucao).join('\n\n')
            : ''
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onAtualizar(data)
      setFeedback('')
    } catch (e) {
      setErroAtualizar(e.message)
    } finally {
      setAtualizando(false)
    }
  }

  const btnLabel = tipo === 'estatico' ? 'Atualizar Imagem' : 'Atualizar Vídeo'

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '22px', marginBottom: '20px' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span style={{
          background: '#1a1010', color: C.coral, border: `1px solid ${C.coral}44`,
          padding: '3px 9px', borderRadius: '5px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em'
        }}>
          Estrutura {estrutura}
        </span>
        {material?.duracao && (
          <span style={{ color: C.label, fontSize: '12px' }}>{material.duracao}</span>
        )}
      </div>

      {/* Conteúdo por tipo */}
      {tipo === 'estatico' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Imagem GPT-5 */}
          <ImageAnnotator src={midia?.imagemUrl} alt={`Estático estrutura ${estrutura}`} />

          {midia?.imagemErro && (
            <p style={{ margin: 0, fontSize: '11px', color: '#f87171' }}>Erro ao gerar imagem: {midia.imagemErro}</p>
          )}

          {material?.textoDaArte && (
            <div style={{ background: '#0d0d14', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '14px' }}>
              <p style={{ margin: '0 0 6px', color: C.label, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Texto da Arte</p>
              <p style={{ margin: 0, color: C.text, fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-line', fontWeight: '500' }}>{material.textoDaArte}</p>
            </div>
          )}

          {material?.referenciaVisual && (
            <div style={{ background: '#0d0d14', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '14px' }}>
              <p style={{ margin: '0 0 6px', color: C.label, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Referência Visual</p>
              <p style={{ margin: 0, color: C.sub, fontSize: '13px', lineHeight: '1.5' }}>{material.referenciaVisual}</p>
            </div>
          )}
        </div>
      )}

      {(tipo === 'narrado' || tipo === 'apresentadora') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <VideoPlayer
            src={tipo === 'narrado' ? midia?.narradoAudio : midia?.apresentadoraAudio}
            tipo="audio"
            label={tipo === 'narrado'
              ? 'Narração em off — ElevenLabs'
              : 'Voz da Mônica — ElevenLabs (lip-sync via script de produção)'}
          />
          {tipo === 'apresentadora' && (
            <div style={{ background: '#0d0d14', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px 14px', fontSize: '12px', color: '#7ec8e3' }}>
              Para gerar o MP4 com lip-sync: <code style={{ fontFamily: 'monospace', color: '#a0c8e0' }}>node ferramentas/gerar-lipsync-var2.mjs</code>
            </div>
          )}
          {material?.cenas && <CenaTable cenas={material.cenas} />}
        </div>
      )}

      {/* Legenda */}
      {material?.legenda && (
        <div style={{ marginTop: '14px', background: '#0d0d14', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '14px' }}>
          <p style={{ margin: '0 0 6px', color: C.label, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Legenda do Post</p>
          <p style={{ margin: 0, color: C.sub, fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{material.legenda}</p>
        </div>
      )}

      {/* Feedback + botão atualizar */}
      <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          placeholder={`Descreva o ajuste para ${tipo === 'estatico' ? 'a imagem' : 'o áudio'}...`}
          rows={2}
          style={{
            flex: 1, background: '#0d0d14', border: `1px solid ${C.border}`,
            borderRadius: '8px', padding: '10px 12px', color: C.text,
            fontSize: '13px', resize: 'none', fontFamily: 'inherit', outline: 'none'
          }}
        />
        <button
          onClick={atualizar}
          disabled={atualizando || !feedback.trim()}
          style={{
            background: atualizando ? '#1a1a1a' : '#1a0a08',
            border: `1px solid ${C.coral}55`, color: C.coral,
            padding: '0 14px', borderRadius: '8px',
            fontSize: '12px', fontWeight: '600', cursor: atualizando ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px',
            opacity: !feedback.trim() ? 0.4 : 1
          }}
        >
          {atualizando ? <><Spinner /> Atualizando...</> : btnLabel}
        </button>
      </div>

      {erroAtualizar && (
        <p style={{ margin: '8px 0 0', color: '#f87171', fontSize: '12px' }}>{erroAtualizar}</p>
      )}
    </div>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────
export default function Criativos() {
  const router = useRouter()
  const [criativos, setCriativos] = useState(null)
  const [midias, setMidias] = useState(null)
  const [abaAtiva, setAbaAtiva] = useState('estatico')
  const [loadingMidias, setLoadingMidias] = useState(false)
  const [erroMidias, setErroMidias] = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const data = localStorage.getItem('criativos')
    if (!data) { router.push('/'); return }
    const parsed = JSON.parse(data)
    setCriativos(parsed)
    gerarMidias(parsed)
  }, [])

  async function gerarMidias(roteiros) {
    setLoadingMidias(true)
    setErroMidias(null)
    try {
      const res = await fetch('/api/gerar-midias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roteiros })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMidias(data)
    } catch (e) {
      setErroMidias(e.message)
    } finally {
      setLoadingMidias(false)
    }
  }

  function handleAtualizarMidia(tipo, novosDados) {
    setMidias(prev => ({ ...prev, ...novosDados }))
  }

  if (!criativos) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.sub, fontSize: '14px' }}>
      Carregando criativos...
    </div>
  )

  const mat = criativos.materiais || {}
  const mapaAbas = {
    estatico:      { materiais: mat.estatico,           tipo: 'estatico' },
    narrado:       { materiais: mat.videoNarrado,        tipo: 'narrado' },
    apresentadora: { materiais: mat.videoApresentadora,  tipo: 'apresentadora' },
  }
  const abaAtual = mapaAbas[abaAtiva]

  return (
    <>
      <Head>
        <title>Criativos — {criativos.empreendimento || 'Seazone'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: C.text }}>

        {/* Header */}
        <header style={{ borderBottom: `1px solid ${C.border}`, padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: C.bg, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '30px', height: '30px', background: C.coral, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#fff', fontSize: '13px' }}>S</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{criativos.empreendimento}</div>
              {criativos.localizacao && <div style={{ fontSize: '11px', color: C.label }}>{criativos.localizacao}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[{ n: '01', l: 'Briefing', done: true }, { n: '02', l: 'Revisão', done: true }, { n: '03', l: 'Criativos', active: true }].map(({ n, l, done, active }) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: active ? C.coral : done ? '#1a2a1a' : '#1a1a1a',
                  color: active ? '#fff' : done ? '#4ade80' : C.label,
                  border: `1px solid ${active ? C.coral : done ? '#2a5a2a' : C.border}`,
                  fontSize: '10px', fontWeight: '700',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{done ? '✓' : n}</div>
                <span style={{ fontSize: '11px', color: active ? C.text : C.label }}>{l}</span>
                {n !== '03' && <span style={{ color: C.border, fontSize: '12px' }}>›</span>}
              </div>
            ))}
          </div>
        </header>

        <main style={{ maxWidth: '860px', margin: '0 auto', padding: '28px 20px' }}>

          {/* Banner loading mídias */}
          {loadingMidias && (
            <div style={{ background: '#0f0f14', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Spinner />
              <span style={{ color: C.coral, fontSize: '13px', fontWeight: '500' }}>Gerando imagem via GPT-5 e áudios via ElevenLabs...</span>
            </div>
          )}
          {erroMidias && (
            <div style={{ background: '#1f0a0a', border: '1px solid #5a1a1a', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#f87171', fontSize: '13px' }}>
              Erro ao gerar mídias: {erroMidias}
            </div>
          )}

          {/* Abas */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: `1px solid ${C.border}`, paddingBottom: '0' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setAbaAtiva(tab.id)}
                style={{
                  background: abaAtiva === tab.id ? C.card : 'transparent',
                  border: `1px solid ${abaAtiva === tab.id ? C.border : 'transparent'}`,
                  borderBottom: `2px solid ${abaAtiva === tab.id ? C.coral : 'transparent'}`,
                  color: abaAtiva === tab.id ? C.text : C.label,
                  padding: '10px 18px', borderRadius: '8px 8px 0 0',
                  fontSize: '13px', fontWeight: abaAtiva === tab.id ? '600' : '400',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.15s'
                }}
              >
                <span>{tab.icone}</span> {tab.label}
              </button>
            ))}
          </div>

          {/* Materiais da aba ativa */}
          {(abaAtual?.materiais || []).map((material, idx) => (
            <MaterialCard
              key={idx}
              tipo={abaAtual.tipo}
              estrutura={material.estrutura || idx + 1}
              material={material}
              midia={midias}
              onAtualizar={(dados) => handleAtualizarMidia(abaAtual.tipo, dados)}
            />
          ))}

          {/* Agentes (nota + revisor) */}
          <AgenteCard agentes={criativos.agentes} />

          {/* Rodapé */}
          <div style={{ marginTop: '40px', padding: '20px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 12px', color: C.sub, fontSize: '13px' }}>
              Estrutura 1 de cada formato gerada. Após aprovação, avance para as variações completas.
            </p>
            <button
              onClick={() => router.push('/')}
              style={{ background: 'transparent', border: `1px solid ${C.coral}55`, color: C.coral, padding: '9px 22px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
            >
              Novo empreendimento
            </button>
          </div>
        </main>
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        textarea:focus { border-color: #E8533A !important; outline: none; }
        audio { accent-color: #E8533A; }
      `}</style>
    </>
  )
}
