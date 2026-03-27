import { chamarGPT5Imagem } from '../../lib/gpt5-image'

export const config = { api: { responseLimit: '12mb' }, maxDuration: 120 }

const DRIVE_FOLDER_ID = '1x5uvswRo5HmoO_suwrrq9zH_5Z35t-_c'
const DRIVE_API_KEY   = 'AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY'

// ─── Google Drive ─────────────────────────────────────────────────────────

async function listarImagensDrive() {
  const q      = encodeURIComponent(`'${DRIVE_FOLDER_ID}' in parents and mimeType contains 'image/' and trashed = false`)
  const fields = encodeURIComponent('files(id,name,mimeType)')
  const url    = `https://www.googleapis.com/drive/v3/files?q=${q}&key=${DRIVE_API_KEY}&fields=${fields}&pageSize=30&orderBy=name`

  const res = await fetch(url)
  const raw = await res.text()
  if (!res.ok) throw new Error(`Drive API ${res.status}: ${raw.slice(0, 200)}`)

  const json = JSON.parse(raw)
  if (!json.files?.length) throw new Error('Nenhuma imagem encontrada na pasta do Drive')

  return json.files.map(f => ({
    id:          f.id,
    nome:        f.name,
    mimeType:    f.mimeType,
    thumbUrl:    `https://drive.google.com/thumbnail?id=${f.id}&sz=w1600`,
    downloadUrl: `https://www.googleapis.com/drive/v3/files/${f.id}?alt=media&key=${DRIVE_API_KEY}`
  }))
}

/** Baixa a imagem e retorna base64 data URL — para enviar ao GPT-5 como visão */
async function baixarComoBase64(imagem) {
  for (const url of [imagem.downloadUrl, imagem.thumbUrl]) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const buf  = Buffer.from(await res.arrayBuffer())
      if (buf.length < 1000) continue
      const mime = res.headers.get('content-type') || imagem.mimeType || 'image/jpeg'
      return `data:${mime};base64,${buf.toString('base64')}`
    } catch { /* tenta próxima */ }
  }
  throw new Error(`Não foi possível baixar a imagem: ${imagem.nome}`)
}

// ─── Seleção por visão ────────────────────────────────────────────────────

async function selecionarImagem(imagens, sequenciaVisual, openrouterKey) {
  if (imagens.length === 1) return imagens[0]

  const content = [
    {
      type: 'text',
      text: `Você é um diretor de arte escolhendo a melhor foto de fundo para um criativo imobiliário.
Sequência visual desejada: "${sequenciaVisual || 'imagem aérea de empreendimento imobiliário brasileiro'}".
Analise as imagens abaixo e responda APENAS com o número do índice (0, 1, 2...) da mais adequada. Só o número.`
    },
    ...imagens.slice(0, 8).map(img => ({
      type:      'image_url',
      image_url: { url: img.thumbUrl, detail: 'low' }
    }))
  ]

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${openrouterKey}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ model: 'openai/gpt-5', messages: [{ role: 'user', content }], max_tokens: 5 })
    })
    if (!res.ok) return imagens[0]
    const json = JSON.parse(await res.text())
    const idx  = parseInt((json.choices?.[0]?.message?.content || '0').match(/\d+/)?.[0] || '0', 10)
    return imagens[Math.min(idx, imagens.length - 1)] || imagens[0]
  } catch {
    return imagens[0]
  }
}

// ─── Composição via GPT-5 visão ───────────────────────────────────────────

function montarPromptComposicao(composicao) {
  const {
    pin             = '',
    badge           = 'LANÇAMENTO',
    textoDaArte     = '',
    sequenciaVisual = '',
    nomeEmpreendimento = ''
  } = composicao

  // Detecta elementos condicionais pelo conteúdo do briefing
  const mencaonaProia = /praia|beach|mar\b|litoral|beira.mar/i.test(textoDaArte + ' ' + sequenciaVisual)

  // Elementos condicionais
  const elementosPraia = mencaonaProia ? `
• DOTTED WHITE LINE: draw a curved dashed/dotted white line from the red PIN marker toward the beach/sea visible in the photo — label it "Acesso à praia" in a small white pill badge with an arrow at the end` : ''

  return `You are a Brazilian luxury real estate art director. Your task: use the provided aerial photo as the base and compose a complete marketing static image in the exact Seazone brand style.

OUTPUT FORMAT: portrait 4:5 ratio (1080×1350px), social media ready.

━━━ BASE IMAGE ━━━
• Use the provided photo as the background. Keep its aerial perspective and content visible.
• Apply a dark gradient overlay from bottom (60% opacity black) fading to transparent at the top — so the sky/top remains clear and the lower copy area is readable.

━━━ REQUIRED ELEMENTS (place exactly as described) ━━━

① RED PIN MARKER + SPOT LOGO (top area, over the development):
  • Place a bold red/coral (#E8533A) location pin icon directly over the visible development/buildings in the photo
  • Next to it, add a small white rectangular tag/badge with "SPOT" in bold dark text
  • This marks the exact location of the development${elementosPraia}

② BOTTOM BAR (fixed dark bar at the very bottom, full width):
  • Dark charcoal/near-black background (#111118)
  • LEFT SIDE: 📍 pin icon + "${pin}" in white, 13px clean sans-serif
  • RIGHT SIDE: "Seazone" logotype in white with a small circular "S" icon
  • Thin white horizontal line separating bar from image above

③ BADGE (upper area, prominent):
  • Rounded pill/capsule shape
  • Coral/red fill (#E8533A)
  • Bold white text: "${badge}"

④ MAIN FINANCIAL COPY (center of dark gradient zone, lower 40% of image):
${textoDaArte}
  • Render financial figures (ROI%, R$ values) in coral (#E8533A), larger and bolder than surrounding text
  • All other text in white
  • Typography: modern premium sans-serif, hierarchy: headline biggest → supporting data → small disclaimer

⑤ LEGAL DISCLAIMER (very bottom, above the bottom bar):
  • "Dados estimados. Rentabilidade não garantida. Consulte o material de vendas."
  • Tiny white text, 9px, semi-transparent (70% opacity)

━━━ STYLE REFERENCES ━━━
• Overall: cinematic, premium, dark luxury real estate marketing
• Color palette: very dark overlays + white text + coral (#E8533A) accents
• Clean grid layout, generous whitespace in the lower copy area
• The aerial photo must remain the visual hero — do not obscure it completely

━━━ IMPORTANT ━━━
• Preserve ALL Portuguese text verbatim — do not translate or paraphrase
• Only include elements listed above — do not add anything not specified
• Output the final composed image only`
}

// ─── Handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { composicao } = req.body
  // composicao: { pin, badge, textoDaArte, sequenciaVisual, nomeEmpreendimento }

  const openrouterKey = process.env.OPENROUTER_API_KEY
  if (!openrouterKey) return res.status(500).json({ error: 'OPENROUTER_API_KEY não configurada' })

  try {
    // 1. Lista imagens do Drive
    let imagens = []
    try {
      imagens = await listarImagensDrive()
    } catch (e) {
      console.warn('Drive listing falhou:', e.message)
    }

    if (!imagens.length) {
      return res.status(422).json({ error: 'Nenhuma imagem disponível no Drive para composição' })
    }

    // 2. GPT-5 seleciona a foto mais adequada à sequência visual
    const imagemSelecionada = await selecionarImagem(
      imagens,
      composicao?.sequenciaVisual || '',
      openrouterKey
    )

    // 3. Baixa a imagem como base64 para enviar ao GPT-5
    const imagemBase64 = await baixarComoBase64(imagemSelecionada)

    // 4. GPT-5 compõe o estático no estilo Seazone usando a foto como base
    const prompt = montarPromptComposicao(composicao || {})

    const imagemUrl = await chamarGPT5Imagem([
      {
        role: 'user',
        content: [
          { type: 'text',      text: prompt },
          { type: 'image_url', image_url: { url: imagemBase64, detail: 'high' } }
        ]
      }
    ], openrouterKey)

    return res.status(200).json({
      imagemUrl,
      imagemSelecionada: { id: imagemSelecionada.id, nome: imagemSelecionada.nome },
      totalImagensDrive: imagens.length
    })
  } catch (err) {
    console.error('compor-estatico erro:', err)
    return res.status(500).json({ error: err.message })
  }
}
