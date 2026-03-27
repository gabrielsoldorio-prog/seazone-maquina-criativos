import { chamarGPT5Imagem } from '../../lib/gpt5-image'

export const config = {
  api: { responseLimit: '12mb' },
  maxDuration: 60
}

const VOICE_ID        = '21m00Tcm4TlvDq8ikWAM'
const DRIVE_FOLDER_ID = '1x5uvswRo5HmoO_suwrrq9zH_5Z35t-_c'
const DRIVE_API_KEY   = 'AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY'

function extrairLocucao(cenas) {
  return (cenas || []).map(c => c.locucao || '').filter(Boolean).join('\n\n')
}

// ─── Drive helpers ────────────────────────────────────────────────────────

async function listarImagensDrive() {
  const q      = encodeURIComponent(`'${DRIVE_FOLDER_ID}' in parents and mimeType contains 'image/' and trashed = false`)
  const fields = encodeURIComponent('files(id,name)')
  const apiUrl = `https://www.googleapis.com/drive/v3/files?q=${q}&key=${DRIVE_API_KEY}&fields=${fields}&pageSize=30&orderBy=name`
  const res    = await fetch(apiUrl)
  const raw    = await res.text()
  if (!res.ok) throw new Error(`Drive API ${res.status}: ${raw.slice(0, 200)}`)
  let json
  try { json = JSON.parse(raw) } catch (e) {
    throw new Error(`Drive API retornou resposta inválida: ${raw.slice(0, 200)}`)
  }
  return (json.files || []).map(f => ({
    id: f.id, nome: f.name,
    url: `https://drive.google.com/thumbnail?id=${f.id}&sz=w1600`
  }))
}

async function selecionarImagem(imagens, sequenciaVisual, openrouterKey) {
  if (imagens.length === 1) return imagens[0]
  const content = [
    { type: 'text', text: `Selecione a melhor foto para a sequência visual: "${sequenciaVisual}". Responda só com o índice (0, 1, 2...).` },
    ...imagens.slice(0, 8).map(img => ({ type: 'image_url', image_url: { url: img.url, detail: 'low' } }))
  ]
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${openrouterKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'openai/gpt-5', messages: [{ role: 'user', content }], max_tokens: 5 })
  })
  if (!res.ok) return imagens[0]
  const raw2 = await res.text()
  let json
  try { json = JSON.parse(raw2) } catch { return imagens[0] }
  const idx  = parseInt((json.choices?.[0]?.message?.content || '0').match(/\d+/)?.[0] || '0', 10)
  return imagens[Math.min(idx, imagens.length - 1)] || imagens[0]
}

// ─── Composição do estático ───────────────────────────────────────────────

async function gerarEstatico(roteiros, openrouterKey) {
  const estatico   = roteiros.materiais?.estatico?.[0]
  const composicao = {
    pin:                roteiros.localizacao || '',
    badge:              'LANÇAMENTO',
    textoDaArte:        estatico?.textoDaArte || '',
    sequenciaVisual:    estatico?.referenciaVisual || roteiros.imagemPrompt || '',
    nomeEmpreendimento: roteiros.empreendimento || ''
  }

  let imagemBase = null
  try {
    const imagens = await listarImagensDrive()
    if (imagens.length > 0) {
      imagemBase = await selecionarImagem(imagens, composicao.sequenciaVisual, openrouterKey)
    }
  } catch (e) {
    console.warn('Drive indisponível, compondo sem foto base:', e.message)
  }

  const instrucoesFundo = imagemBase
    ? 'Use the provided Drive photo as the background. Keep its content visible through the overlay.'
    : `Generate background: ${composicao.sequenciaVisual || 'aerial view of modern Brazilian coastal real estate development'}.`

  const prompt = `You are a Brazilian real estate art director composing a marketing static ad for social media (portrait 4:5 ratio, 1080×1350px).

BACKGROUND: ${instrucoesFundo}
Apply a semi-transparent dark overlay (≈40% black) over the background so text is legible.

OVERLAY ELEMENTS — place exactly as described, preserve all Portuguese text verbatim:

① TOP-LEFT: location pin emoji 📍 + "${composicao.pin}" — white, small (≈12px), clean sans-serif
② BADGE: rounded pill tag "${composicao.badge}" — coral/red fill (#E8533A), white bold text, near top
③ MAIN COPY (centered, large, bold white):
${composicao.textoDaArte}
④ Any financial figure (ROI %, R$ values) must be rendered in coral (#E8533A) and larger than surrounding text
⑤ BOTTOM: thin white horizontal rule → "SEAZONE" logotype in white to the left, and a small circular "S" mark to the right

Style: luxury premium real estate, clean modern typography, dark cinematic aesthetic.
Output the final composed image — nothing else.`

  const messages = imagemBase
    ? [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: imagemBase.url, detail: 'high' } }] }]
    : [{ role: 'user', content: prompt }]

  return chamarGPT5Imagem(messages, openrouterKey)
}

// ─── ElevenLabs TTS ──────────────────────────────────────────────────────

async function gerarAudio(texto, elevenKey) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: { 'xi-api-key': elevenKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
    body: JSON.stringify({
      text: texto,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.45, similarity_boost: 0.80, style: 0.3, use_speaker_boost: true }
    })
  })
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`)
  const buf = Buffer.from(await res.arrayBuffer())
  return `data:audio/mpeg;base64,${buf.toString('base64')}`
}

// ─── Handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { roteiros } = req.body
  if (!roteiros?.materiais) return res.status(400).json({ error: 'roteiros inválidos' })

  const elevenKey     = process.env.ELEVENLABS_API_KEY
  const openrouterKey = process.env.OPENROUTER_API_KEY

  if (!elevenKey)     return res.status(500).json({ error: 'ELEVENLABS_API_KEY não configurada' })
  if (!openrouterKey) return res.status(500).json({ error: 'OPENROUTER_API_KEY não configurada' })

  const resultado = {}

  // 1. Estático — composição com agente visual (Estrutura 1 apenas)
  try {
    resultado.imagemUrl = await gerarEstatico(roteiros, openrouterKey)
  } catch (e) {
    resultado.imagemErro = e.message
  }

  // 2. Áudio narrado (Estrutura 1)
  const textoNarrado = extrairLocucao(roteiros.materiais?.videoNarrado?.[0]?.cenas)
  if (textoNarrado) {
    try { resultado.narradoAudio = await gerarAudio(textoNarrado, elevenKey) }
    catch (e) { resultado.narradoErro = e.message }
  }

  // 3. Áudio apresentadora (Estrutura 1)
  const textoApresentadora = extrairLocucao(roteiros.materiais?.videoApresentadora?.[0]?.cenas)
  if (textoApresentadora) {
    try { resultado.apresentadoraAudio = await gerarAudio(textoApresentadora, elevenKey) }
    catch (e) { resultado.apresentadoraErro = e.message }
  }

  return res.status(200).json(resultado)
}
