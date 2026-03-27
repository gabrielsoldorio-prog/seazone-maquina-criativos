/**
 * Agente de Composição Visual — Canva Connect API
 *
 * Fluxo:
 *   1. Lista imagens da pasta pública do Google Drive
 *   2. GPT-5 vision seleciona a foto mais adequada à sequência visual
 *   3. Baixa a imagem selecionada
 *   4. Faz upload para o Canva como asset
 *   5. Cria um design via Autofill usando o brand template configurado
 *   6. Exporta como PNG e retorna a URL
 *
 * Variáveis de ambiente necessárias:
 *   OPENROUTER_API_KEY     — para seleção por visão via GPT-5
 *   CANVA_ACCESS_TOKEN     — Bearer token do Canva Connect API
 *   CANVA_TEMPLATE_ID      — ID do brand template Seazone no Canva
 *                            (ex: DABcXyz123 — encontrado em canva.com/brand/templates)
 *
 * Mapeamento dos campos do template (nomes devem bater com o template no Canva):
 *   background_image → asset de imagem do Drive
 *   pin_localizacao  → texto do PIN
 *   badge            → texto do badge (ex: LANÇAMENTO)
 *   copy_principal   → texto da arte completo
 *   dado_financeiro  → ROI% ou R$/mês em destaque
 */

export const config = { api: { responseLimit: '12mb' }, maxDuration: 120 }

const DRIVE_FOLDER_ID = '1x5uvswRo5HmoO_suwrrq9zH_5Z35t-_c'
const DRIVE_API_KEY   = 'AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY'
const CANVA_BASE      = 'https://api.canva.com/rest/v1'

// ─── Helpers de espera ────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function pollJob(getStatus, { intervalo = 2000, tentativas = 30, label = 'job' } = {}) {
  for (let i = 0; i < tentativas; i++) {
    const resultado = await getStatus()
    if (resultado.status === 'success') return resultado
    if (resultado.status === 'failed')  throw new Error(`${label} falhou: ${JSON.stringify(resultado.error || {})}`)
    await sleep(intervalo)
  }
  throw new Error(`${label} timeout após ${tentativas} tentativas`)
}

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
    id:        f.id,
    nome:      f.name,
    mimeType:  f.mimeType,
    thumbUrl:  `https://drive.google.com/thumbnail?id=${f.id}&sz=w1600`,
    // URL de download direto via API (funciona com a API key para arquivos públicos)
    downloadUrl: `https://www.googleapis.com/drive/v3/files/${f.id}?alt=media&key=${DRIVE_API_KEY}`
  }))
}

async function baixarImagem(imagem) {
  // Tenta download direto via API primeiro; fallback para thumbnail
  for (const url of [imagem.downloadUrl, imagem.thumbUrl]) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const buffer = Buffer.from(await res.arrayBuffer())
      const mime   = res.headers.get('content-type') || imagem.mimeType || 'image/jpeg'
      if (buffer.length > 1000) return { buffer, mime }
    } catch { /* tenta próxima URL */ }
  }
  throw new Error(`Não foi possível baixar a imagem: ${imagem.nome}`)
}

// ─── Seleção por visão (GPT-5) ────────────────────────────────────────────

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

// ─── Canva Connect API ────────────────────────────────────────────────────

function canvaHeaders(token) {
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
}

/** Upload de imagem para o Canva como asset. Retorna o asset_id. */
async function uploadAssetCanva(buffer, nome, mimeType, token) {
  const nomeSanitizado = nome.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 50)
  const metadataB64    = Buffer.from(JSON.stringify({ name_base64: Buffer.from(nomeSanitizado).toString('base64') })).toString('base64')

  // Inicia o upload job
  const initRes = await fetch(`${CANVA_BASE}/asset-uploads`, {
    method:  'POST',
    headers: {
      'Authorization':          `Bearer ${token}`,
      'Content-Type':           mimeType || 'image/jpeg',
      'Asset-Upload-Metadata':  Buffer.from(nomeSanitizado).toString('base64')
    },
    body: buffer
  })
  const initRaw = await initRes.text()
  if (!initRes.ok) throw new Error(`Canva upload init ${initRes.status}: ${initRaw.slice(0, 300)}`)

  const initJson = JSON.parse(initRaw)
  const jobId    = initJson.job?.id
  if (!jobId) throw new Error(`Canva upload: job ID não retornado. Resposta: ${initRaw.slice(0, 200)}`)

  // Polling até o asset ficar disponível
  const jobDone = await pollJob(
    async () => {
      const res  = await fetch(`${CANVA_BASE}/asset-uploads/${jobId}`, { headers: canvaHeaders(token) })
      const json = JSON.parse(await res.text())
      return { status: json.job?.status, asset: json.job?.asset, error: json.job?.error }
    },
    { label: 'upload-asset', tentativas: 20, intervalo: 2000 }
  )

  const assetId = jobDone.asset?.id
  if (!assetId) throw new Error('Canva upload: asset_id não retornado após conclusão')
  return assetId
}

/**
 * Cria design via Autofill com brand template.
 * Os campos (keys) em `dados` devem corresponder aos campos definidos no template Canva.
 * Retorna o design_id.
 */
async function autofillDesign(templateId, dados, token) {
  const res = await fetch(`${CANVA_BASE}/autofills`, {
    method:  'POST',
    headers: canvaHeaders(token),
    body:    JSON.stringify({ brand_template_id: templateId, title: dados._titulo || 'Seazone Criativo', data: dados })
  })
  const raw = await res.text()
  if (!res.ok) throw new Error(`Canva autofill ${res.status}: ${raw.slice(0, 300)}`)

  const json  = JSON.parse(raw)
  const jobId = json.job?.id
  if (!jobId) throw new Error(`Canva autofill: job ID não retornado. Resposta: ${raw.slice(0, 200)}`)

  // Polling até o design estar pronto
  const jobDone = await pollJob(
    async () => {
      const r = await fetch(`${CANVA_BASE}/autofills/${jobId}`, { headers: canvaHeaders(token) })
      const j = JSON.parse(await r.text())
      return { status: j.job?.status, design: j.job?.design, error: j.job?.error }
    },
    { label: 'autofill', tentativas: 30, intervalo: 3000 }
  )

  const designId = jobDone.design?.id
  if (!designId) throw new Error('Canva autofill: design_id não retornado após conclusão')
  return designId
}

/**
 * Cria design simples com imagem de fundo (sem autofill).
 * Usado como fallback quando CANVA_TEMPLATE_ID não está configurado.
 */
async function criarDesignSimples(assetId, token) {
  const res = await fetch(`${CANVA_BASE}/designs`, {
    method:  'POST',
    headers: canvaHeaders(token),
    body:    JSON.stringify({ asset_id: assetId, width: 1080, height: 1350 })
  })
  const raw = await res.text()
  if (!res.ok) throw new Error(`Canva criar design ${res.status}: ${raw.slice(0, 300)}`)

  const json     = JSON.parse(raw)
  const designId = json.design?.id
  if (!designId) throw new Error(`Canva criar design: design_id não retornado. Resposta: ${raw.slice(0, 200)}`)
  return designId
}

/** Exporta o design como PNG e retorna a URL de download. */
async function exportarDesignPNG(designId, token) {
  const res = await fetch(`${CANVA_BASE}/exports`, {
    method:  'POST',
    headers: canvaHeaders(token),
    body:    JSON.stringify({ design_id: designId, format: { type: 'png', lossless: false } })
  })
  const raw = await res.text()
  if (!res.ok) throw new Error(`Canva export ${res.status}: ${raw.slice(0, 300)}`)

  const json  = JSON.parse(raw)
  const jobId = json.job?.id
  if (!jobId) throw new Error(`Canva export: job ID não retornado. Resposta: ${raw.slice(0, 200)}`)

  // Polling até URL de download disponível
  const jobDone = await pollJob(
    async () => {
      const r = await fetch(`${CANVA_BASE}/exports/${jobId}`, { headers: canvaHeaders(token) })
      const j = JSON.parse(await r.text())
      return { status: j.job?.status, urls: j.job?.urls, error: j.job?.error }
    },
    { label: 'export', tentativas: 30, intervalo: 3000 }
  )

  const url = jobDone.urls?.[0]
  if (!url) throw new Error('Canva export: URL não retornada após conclusão')
  return url
}

// ─── Montagem dos dados do template ──────────────────────────────────────

/**
 * Mapeia os dados do briefing para os campos do brand template Canva.
 * As chaves devem corresponder exatamente aos nomes dos campos no template.
 *
 * Campos padrão do template Seazone:
 *   background_image  → imagem de fundo (asset)
 *   pin_localizacao   → texto do PIN (ex: "(pin) Novo Campeche, Florianópolis/SC")
 *   badge_lancamento  → badge de tipo (ex: "LANÇAMENTO") — omitir se não for lançamento
 *   copy_principal    → copy completo conforme briefing
 *   dado_financeiro   → dado em destaque (ex: "16% ao ano" ou "R$ 5.500/mês")
 *   sufixo_aluguel    → "com aluguel por temporada"
 */
function montarDadosTemplate(assetId, composicao) {
  const dados = { _titulo: composicao.nomeEmpreendimento || 'Seazone Criativo' }

  // Imagem de fundo — sempre
  dados.background_image = { asset_id: assetId }

  // PIN de localização — sempre
  if (composicao.pin) dados.pin_localizacao = composicao.pin

  // Badge — só se for lançamento (briefing indicar)
  const badge = composicao.badge || ''
  if (badge) dados.badge_lancamento = badge

  // Copy principal completo
  if (composicao.textoDaArte) dados.copy_principal = composicao.textoDaArte

  // Extrai dado financeiro mais relevante do textoDaArte
  const matchROI     = composicao.textoDaArte?.match(/(\d+[,.]?\d*%)\s*ao ano/)
  const matchMensal  = composicao.textoDaArte?.match(/R\$\s*[\d.,]+/)
  if (matchROI)    dados.dado_financeiro = matchROI[0]
  else if (matchMensal) dados.dado_financeiro = matchMensal[0]

  // Sufixo legal obrigatório
  dados.sufixo_aluguel = 'com aluguel por temporada'

  // Tracejado até praia — só se briefing mencionar
  const temPraia = /praia|beach|mar\b|litoral/i.test(
    [composicao.textoDaArte, composicao.sequenciaVisual].join(' ')
  )
  if (temPraia) dados.tracejado_praia = true

  return dados
}

// ─── Handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { composicao } = req.body
  // composicao: { pin, badge, textoDaArte, sequenciaVisual, nomeEmpreendimento }

  const openrouterKey = process.env.OPENROUTER_API_KEY
  const canvaToken    = process.env.CANVA_ACCESS_TOKEN
  const templateId    = process.env.CANVA_TEMPLATE_ID

  if (!openrouterKey) return res.status(500).json({ error: 'OPENROUTER_API_KEY não configurada' })
  if (!canvaToken)    return res.status(500).json({ error: 'CANVA_ACCESS_TOKEN não configurada' })

  try {
    // 1. Lista imagens do Drive
    let imagens = []
    let imagemSelecionada = null
    try {
      imagens = await listarImagensDrive()
    } catch (e) {
      console.warn('Drive listing falhou:', e.message)
    }

    // 2. GPT-5 seleciona a foto mais adequada
    if (imagens.length > 0) {
      imagemSelecionada = await selecionarImagem(imagens, composicao?.sequenciaVisual || '', openrouterKey)
    }

    if (!imagemSelecionada) {
      return res.status(422).json({ error: 'Nenhuma imagem disponível no Drive para composição' })
    }

    // 3. Baixa a imagem do Drive
    const { buffer, mime } = await baixarImagem(imagemSelecionada)

    // 4. Upload para o Canva
    const assetId = await uploadAssetCanva(buffer, imagemSelecionada.nome, mime, canvaToken)

    // 5. Cria o design
    let designId
    if (templateId) {
      // Com brand template: composição dinâmica completa
      const dadosTemplate = montarDadosTemplate(assetId, composicao || {})
      designId = await autofillDesign(templateId, dadosTemplate, canvaToken)
    } else {
      // Sem template: design simples com imagem de fundo
      console.warn('CANVA_TEMPLATE_ID não configurado — criando design sem composição de texto')
      designId = await criarDesignSimples(assetId, canvaToken)
    }

    // 6. Exporta como PNG
    const imagemUrl = await exportarDesignPNG(designId, canvaToken)

    return res.status(200).json({
      imagemUrl,
      designId,
      assetId,
      imagemSelecionada: { id: imagemSelecionada.id, nome: imagemSelecionada.nome },
      totalImagensDrive: imagens.length,
      usouTemplate: !!templateId
    })
  } catch (err) {
    console.error('compor-estatico erro:', err)
    return res.status(500).json({ error: err.message })
  }
}
