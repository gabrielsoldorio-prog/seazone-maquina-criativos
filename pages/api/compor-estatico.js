import { chamarGPT5Imagem } from '../../lib/gpt5-image'

export const config = { api: { responseLimit: '12mb' }, maxDuration: 60 }

// ─── Drive helpers ────────────────────────────────────────────────────────

function parseFolderId(url) {
  const match = url?.match(/\/folders\/([a-zA-Z0-9_-]+)/)
  return match?.[1] || null
}

/** Lista imagens de uma pasta pública do Drive via API v3 + API key */
async function listarImagensDrive(folderId, googleKey) {
  const q       = encodeURIComponent(`'${folderId}' in parents and mimeType contains 'image/' and trashed = false`)
  const fields  = encodeURIComponent('files(id,name)')
  const apiUrl  = `https://www.googleapis.com/drive/v3/files?q=${q}&key=${googleKey}&fields=${fields}&pageSize=20&orderBy=name`

  const res     = await fetch(apiUrl)
  const raw     = await res.text()
  if (!res.ok)  throw new Error(`Drive API ${res.status}: ${raw.slice(0, 200)}`)

  const json = JSON.parse(raw)
  return (json.files || []).map(f => ({
    id:   f.id,
    nome: f.name,
    // URL pública via CDN do Google (funciona para arquivos compartilhados publicamente)
    url:  `https://lh3.googleusercontent.com/d/${f.id}=w1280`
  }))
}

// ─── Seleção por visão ────────────────────────────────────────────────────

/**
 * Usa GPT-5 vision para escolher a imagem mais adequada dado a
 * sequência visual desejada. Retorna o objeto imagem selecionado.
 */
async function selecionarImagem(imagens, sequenciaVisual, openrouterKey) {
  if (imagens.length === 1) return imagens[0]

  const content = [
    {
      type: 'text',
      text: `Você é um diretor de arte selecionando a melhor foto para um criativo imobiliário.
Sequência visual desejada: "${sequenciaVisual}".
Analise as imagens numeradas abaixo e responda APENAS com o número do índice (0, 1, 2...) da mais adequada. Nada mais.`
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

  const raw  = await res.text()
  if (!res.ok) {
    console.warn('Seleção de imagem falhou, usando primeira:', raw.slice(0, 100))
    return imagens[0]
  }

  const json  = JSON.parse(raw)
  const texto = json.choices?.[0]?.message?.content || '0'
  const idx   = parseInt(texto.match(/\d+/)?.[0] || '0', 10)
  return imagens[Math.min(idx, imagens.length - 1)] || imagens[0]
}

// ─── Composição visual ────────────────────────────────────────────────────

/**
 * Compõe o estático usando GPT-5 image generation.
 * Se imagemBase fornecida, usa como fundo (visão + geração).
 * Caso contrário, gera cena de fundo por prompt.
 */
async function compor(imagemBase, composicao, openrouterKey) {
  const {
    pin                = '',
    badge              = 'LANÇAMENTO',
    textoDaArte        = '',
    nomeEmpreendimento = '',
    sequenciaVisual    = ''
  } = composicao

  const instrucoesFundo = imagemBase
    ? 'Use the provided photo as the background image.'
    : `Generate background: ${sequenciaVisual || 'aerial view of modern Brazilian coastal real estate development'}.`

  const prompt = `You are composing a luxury Brazilian real estate marketing static for social media (portrait 4:5).

${instrucoesFundo}

APPLY a 40% dark overlay on the background for text readability.

OVERLAY these elements exactly (do not invent or change the copy):
1. TOP: small location pin icon + text "${pin}" — white, 11px, top-left
2. BADGE: pill/tag "${badge}" — coral background (#E8533A), white text, top area
3. MAIN COPY (center, large bold white):
${textoDaArte}
4. BOTTOM BAR: thin white horizontal line + "SEAZONE" in white (bottom-left) + small logo mark

Typography: modern sans-serif, premium feel. Hierarchy: headline large, financial data in coral (#E8533A), subtitles in white/grey.
Output: the final composed image only.`

  const messages = imagemBase
    ? [{
        role: 'user',
        content: [
          { type: 'text',      text: prompt },
          { type: 'image_url', image_url: { url: imagemBase.url } }
        ]
      }]
    : [{ role: 'user', content: prompt }]

  return chamarGPT5Imagem(messages, openrouterKey)
}

// ─── Handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { driveUrl, composicao } = req.body
  // driveUrl:  link público da pasta do Google Drive (opcional)
  // composicao: { pin, badge, textoDaArte, sequenciaVisual, nomeEmpreendimento }

  const openrouterKey = process.env.OPENROUTER_API_KEY
  const googleKey     = process.env.GOOGLE_API_KEY

  if (!openrouterKey) return res.status(500).json({ error: 'OPENROUTER_API_KEY não configurada' })

  try {
    let imagemBase     = null
    let totalDrive     = 0

    // 1. Tenta listar imagens do Drive (requer GOOGLE_API_KEY + pasta pública)
    if (driveUrl && googleKey) {
      const folderId = parseFolderId(driveUrl)
      if (folderId) {
        try {
          const imagens = await listarImagensDrive(folderId, googleKey)
          totalDrive = imagens.length
          if (imagens.length > 0) {
            // 2. GPT-5 seleciona a mais adequada para a sequência visual
            imagemBase = await selecionarImagem(
              imagens,
              composicao?.sequenciaVisual || '',
              openrouterKey
            )
          }
        } catch (driveErr) {
          // Drive indisponível — continua sem foto de fundo
          console.warn('Drive listing falhou:', driveErr.message)
        }
      }
    }

    // 3. Compõe o estático
    const imagemUrl = await compor(imagemBase, composicao || {}, openrouterKey)

    return res.status(200).json({
      imagemUrl,
      imagemSelecionada: imagemBase,
      totalImagensDrive: totalDrive
    })
  } catch (err) {
    console.error('compor-estatico erro:', err)
    return res.status(500).json({ error: err.message })
  }
}
