import { chamarGPT5Imagem } from '../../lib/gpt5-image'

export const config = {
  api: { responseLimit: '12mb' },
  maxDuration: 60
}

const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'

function extrairLocucao(cenas) {
  return (cenas || []).map(c => c.locucao || '').filter(Boolean).join('\n\n')
}

// ─── Helpers Drive (espelhado de compor-estatico para uso interno) ──────

function parseFolderId(url) {
  const match = url?.match(/\/folders\/([a-zA-Z0-9_-]+)/)
  return match?.[1] || null
}

async function listarImagensDrive(folderId, googleKey) {
  const q      = encodeURIComponent(`'${folderId}' in parents and mimeType contains 'image/' and trashed = false`)
  const fields = encodeURIComponent('files(id,name)')
  const apiUrl = `https://www.googleapis.com/drive/v3/files?q=${q}&key=${googleKey}&fields=${fields}&pageSize=20&orderBy=name`
  const res    = await fetch(apiUrl)
  const raw    = await res.text()
  if (!res.ok) throw new Error(`Drive API ${res.status}: ${raw.slice(0, 200)}`)
  const json   = JSON.parse(raw)
  return (json.files || []).map(f => ({
    id: f.id, nome: f.name,
    url: `https://lh3.googleusercontent.com/d/${f.id}=w1280`
  }))
}

async function selecionarImagem(imagens, sequenciaVisual, openrouterKey) {
  if (imagens.length === 1) return imagens[0]
  const content = [
    { type: 'text', text: `Selecione a melhor foto para a sequência visual: "${sequenciaVisual}". Responda só com o índice (0, 1, 2...).` },
    ...imagens.slice(0, 8).map(img => ({ type: 'image_url', image_url: { url: img.url, detail: 'low' } }))
  ]
  const res  = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${openrouterKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'openai/gpt-5', messages: [{ role: 'user', content }], max_tokens: 5 })
  })
  if (!res.ok) return imagens[0]
  const json = JSON.parse(await res.text())
  const idx  = parseInt((json.choices?.[0]?.message?.content || '0').match(/\d+/)?.[0] || '0', 10)
  return imagens[Math.min(idx, imagens.length - 1)] || imagens[0]
}

// ─── Composição do estático ───────────────────────────────────────────────

async function gerarEstatico(roteiros, openrouterKey, googleKey) {
  const estatico  = roteiros.materiais?.estatico?.[0]
  const composicao = {
    pin:                roteiros.localizacao || '',
    badge:              'LANÇAMENTO',
    textoDaArte:        estatico?.textoDaArte || '',
    sequenciaVisual:    estatico?.referenciaVisual || roteiros.imagemPrompt || '',
    nomeEmpreendimento: roteiros.empreendimento || ''
  }

  let imagemBase = null

  // Tenta usar fotos do Drive se URL e chave disponíveis
  if (roteiros.driveUrl && googleKey) {
    const folderId = parseFolderId(roteiros.driveUrl)
    if (folderId) {
      try {
        const imagens = await listarImagensDrive(folderId, googleKey)
        if (imagens.length > 0) {
          imagemBase = await selecionarImagem(imagens, composicao.sequenciaVisual, openrouterKey)
        }
      } catch (e) {
        console.warn('Drive indisponível, compondo sem foto base:', e.message)
      }
    }
  }

  // Prompt de composição
  const instrucoesFundo = imagemBase
    ? 'Use the provided photo as the background image.'
    : `Generate background: ${composicao.sequenciaVisual || 'aerial view of modern Brazilian coastal real estate development'}.`

  const prompt = `You are composing a luxury Brazilian real estate marketing static for social media (portrait 4:5).

${instrucoesFundo}

APPLY a 40% dark overlay on the background for text readability.

OVERLAY these elements exactly (do not invent or change the copy):
1. TOP: small location pin icon + text "${composicao.pin}" — white, 11px, top-left
2. BADGE: pill/tag "${composicao.badge}" — coral background (#E8533A), white text, top area
3. MAIN COPY (center, large bold white):
${composicao.textoDaArte}
4. BOTTOM BAR: thin white horizontal line + "SEAZONE" in white (bottom-left) + small logo mark

Typography: modern sans-serif, premium feel. Hierarchy: headline large, financial data in coral (#E8533A), subtitles in white/grey.
Output: the final composed image only.`

  const messages = imagemBase
    ? [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: imagemBase.url } }] }]
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
  const googleKey     = process.env.GOOGLE_API_KEY   // opcional — habilita fotos do Drive

  if (!elevenKey)     return res.status(500).json({ error: 'ELEVENLABS_API_KEY não configurada' })
  if (!openrouterKey) return res.status(500).json({ error: 'OPENROUTER_API_KEY não configurada' })

  const resultado = {}

  // 1. Estático — composição com agente visual (Estrutura 1 apenas)
  try {
    resultado.imagemUrl = await gerarEstatico(roteiros, openrouterKey, googleKey)
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
