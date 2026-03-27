import { chamarGPT5Imagem } from '../../lib/gpt5-image'

export const config = { api: { responseLimit: '12mb' }, maxDuration: 60 }

// ─── Configuração da pasta de fotos ──────────────────────────────────────
// Pasta pública: https://drive.google.com/drive/folders/1x5uvswRo5HmoO_suwrrq9zH_5Z35t-_c
const DRIVE_FOLDER_ID = '1x5uvswRo5HmoO_suwrrq9zH_5Z35t-_c'
const DRIVE_API_KEY   = 'AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY'

// ─── Listagem do Drive ────────────────────────────────────────────────────

async function listarImagensDrive() {
  const q      = encodeURIComponent(`'${DRIVE_FOLDER_ID}' in parents and mimeType contains 'image/' and trashed = false`)
  const fields = encodeURIComponent('files(id,name,mimeType)')
  const url    = `https://www.googleapis.com/drive/v3/files?q=${q}&key=${DRIVE_API_KEY}&fields=${fields}&pageSize=30&orderBy=name`

  const res = await fetch(url)
  const raw = await res.text()
  if (!res.ok) throw new Error(`Drive API ${res.status}: ${raw.slice(0, 300)}`)

  const json = JSON.parse(raw)
  if (!json.files?.length) throw new Error('Nenhuma imagem encontrada na pasta do Drive')

  return json.files.map(f => ({
    id:   f.id,
    nome: f.name,
    // thumbnail pública — funciona para qualquer arquivo com "Qualquer pessoa com o link"
    url:  `https://drive.google.com/thumbnail?id=${f.id}&sz=w1600`
  }))
}

// ─── Seleção por visão (GPT-5) ────────────────────────────────────────────

async function selecionarImagem(imagens, sequenciaVisual, openrouterKey) {
  if (imagens.length === 1) return imagens[0]

  // Envia até 8 miniaturas para o GPT-5 escolher a mais adequada
  const content = [
    {
      type: 'text',
      text: `Você é um diretor de arte escolhendo a melhor foto de fundo para um criativo imobiliário.
Sequência visual desejada: "${sequenciaVisual || 'imagem aérea de empreendimento imobiliário no Brasil'}".
Analise as imagens abaixo e responda APENAS com o número do índice (0, 1, 2...) da mais adequada. Nada mais além do número.`
    },
    ...imagens.slice(0, 8).map(img => ({
      type:      'image_url',
      image_url: { url: img.url, detail: 'low' }
    }))
  ]

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${openrouterKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      model:      'openai/gpt-5',
      messages:   [{ role: 'user', content }],
      max_tokens: 5
    })
  })

  const raw = await res.text()
  if (!res.ok) {
    console.warn('GPT-5 seleção falhou, usando primeira imagem:', raw.slice(0, 150))
    return imagens[0]
  }

  let json
  try { json = JSON.parse(raw) } catch { return imagens[0] }

  const texto = json.choices?.[0]?.message?.content || '0'
  const idx   = parseInt(texto.match(/\d+/)?.[0] || '0', 10)
  return imagens[Math.min(idx, imagens.length - 1)] || imagens[0]
}

// ─── Composição visual (GPT-5) ────────────────────────────────────────────

async function compor(imagemBase, composicao, openrouterKey) {
  const {
    pin                = '',
    badge              = 'LANÇAMENTO',
    textoDaArte        = '',
    nomeEmpreendimento = '',
    sequenciaVisual    = ''
  } = composicao

  const instrucoesFundo = imagemBase
    ? 'Use the provided Drive photo as the background. Keep its content visible through the overlay.'
    : `Generate background: ${sequenciaVisual || 'aerial view of modern Brazilian coastal real estate development, golden hour'}.`

  const prompt = `You are a Brazilian real estate art director composing a marketing static ad for social media (portrait 4:5 ratio, 1080×1350px).

BACKGROUND: ${instrucoesFundo}
Apply a semi-transparent dark overlay (≈40% black) over the background so text is legible.

OVERLAY ELEMENTS — place exactly as described, preserve all Portuguese text verbatim:

① TOP-LEFT: location pin emoji 📍 + "${pin}" — white, small (≈12px), clean sans-serif
② BADGE: rounded pill tag "${badge}" — coral/red fill (#E8533A), white bold text, near top
③ MAIN COPY (centered, large, bold white):
${textoDaArte}
④ Any financial figure (ROI %, R$ values) must be rendered in coral (#E8533A) and larger than surrounding text
⑤ BOTTOM: thin white horizontal rule → "SEAZONE" logotype in white to the left, and a small circular "S" mark to the right

Style: luxury premium real estate, clean modern typography, dark cinematic aesthetic.
Output the final composed image — nothing else.`

  const messages = imagemBase
    ? [{
        role: 'user',
        content: [
          { type: 'text',      text: prompt },
          { type: 'image_url', image_url: { url: imagemBase.url, detail: 'high' } }
        ]
      }]
    : [{ role: 'user', content: prompt }]

  return chamarGPT5Imagem(messages, openrouterKey)
}

// ─── Handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  // composicao: { pin, badge, textoDaArte, sequenciaVisual, nomeEmpreendimento }
  const { composicao } = req.body

  const openrouterKey = process.env.OPENROUTER_API_KEY
  if (!openrouterKey) return res.status(500).json({ error: 'OPENROUTER_API_KEY não configurada' })

  try {
    // 1. Lista imagens da pasta pública do Drive
    let imagens     = []
    let imagemBase  = null

    try {
      imagens = await listarImagensDrive()
    } catch (driveErr) {
      console.warn('Drive listing falhou, compondo sem foto base:', driveErr.message)
    }

    // 2. GPT-5 seleciona a foto mais adequada à sequência visual
    if (imagens.length > 0) {
      imagemBase = await selecionarImagem(
        imagens,
        composicao?.sequenciaVisual || '',
        openrouterKey
      )
    }

    // 3. GPT-5 compõe o estático com a foto selecionada (ou fundo gerado)
    const imagemUrl = await compor(imagemBase, composicao || {}, openrouterKey)

    return res.status(200).json({
      imagemUrl,
      imagemSelecionada: imagemBase ? { id: imagemBase.id, nome: imagemBase.nome } : null,
      totalImagensDrive: imagens.length
    })
  } catch (err) {
    console.error('compor-estatico erro:', err)
    return res.status(500).json({ error: err.message })
  }
}
