import { callGemini } from '../../lib/gemini'

export const config = {
  api: { responseLimit: '4mb' },
  maxDuration: 120,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { linkLovable, linkDrive } = req.body
  if (!linkLovable) return res.status(400).json({ error: 'Link do Lovable é obrigatório' })

  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) return res.status(500).json({ error: 'GEMINI_API_KEY não configurada' })

  // Tenta buscar conteúdo da página
  let paginaConteudo = ''
  try {
    const fetchRes = await fetch(linkLovable, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SeazoneBot/1.0)' },
      signal: AbortSignal.timeout(8000)
    })
    const html = await fetchRes.text()
    paginaConteudo = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 20000)
  } catch {
    paginaConteudo = `[Conteúdo não acessível diretamente — URL: ${linkLovable}]`
  }

  const systemPrompt = `Você é um analista de briefings de empreendimentos imobiliários de temporada da Seazone.
Analise o conteúdo do briefing fornecido (link do Lovable) e extraia todas as informações estruturadas.

Retorne APENAS um JSON válido com exatamente esta estrutura:
{
  "empreendimento": "Nome do empreendimento",
  "localizacao": "Cidade, UF — Bairro",
  "estruturas": {
    "videoApresentadora": [
      { "numero": 1, "sequencia": "L|F|RO|RE", "descricao": "Sequência: Localização, Fachada, ROI, Rentabilidade, Encerramento" },
      { "numero": 2, "sequencia": "...", "descricao": "..." },
      { "numero": 3, "sequencia": "...", "descricao": "..." }
    ],
    "videoNarrado": [
      { "numero": 1, "sequencia": "...", "descricao": "..." },
      { "numero": 2, "sequencia": "...", "descricao": "..." },
      { "numero": 3, "sequencia": "...", "descricao": "..." }
    ],
    "estatico": [
      { "numero": 1, "foco": "Localização + Financeiro" },
      { "numero": 2, "foco": "Localização + Aspiracional" },
      { "numero": 3, "foco": "Fachada + Financeiro" }
    ]
  },
  "dos": ["Ponto a reforçar 1", "Ponto a reforçar 2", "Ponto a reforçar 3"],
  "donts": ["Ponto a evitar 1 — substituto: X", "Ponto a evitar 2 — substituto: Y"],
  "publicoAlvo": {
    "core": "Descrição do público core com maior potencial de conversão",
    "secundario": "Descrição do público secundário"
  },
  "dadosFinanceiros": {
    "roi": "X,XX% ao ano",
    "rentabilidadeLiquida": "R$ X.XXX mensais",
    "ticketMedio": "R$ X.XXX por noite",
    "menorCota": "R$ X.XXX",
    "valorizacaoEstimada": "X% ao ano"
  },
  "pontosFortesAprovados": ["Diferencial 1", "Diferencial 2", "Diferencial 3"],
  "imagemPrompt": "Prompt em inglês para geração de imagem. Descreva: vista aérea do bairro/região, render da fachada do empreendimento, paleta sóbria e profissional, dark overlay para contraste de texto, estilo cinematic real estate photography.",
  "pitch": "Pitch resumido em 2-3 frases do empreendimento",
  "perfilHospede": "Descrição do perfil do hóspede típico e fatores de decisão",
  "resumoRegiao": "Resumo da região, demanda turística e contexto de mercado"
}

Se algum dado não estiver disponível no conteúdo, use "A confirmar" para dados financeiros e inferências razoáveis para demais campos.`

  const userPrompt = `Analise o briefing deste empreendimento Seazone:

URL Lovable: ${linkLovable}
Link Google Drive (assets): ${linkDrive || 'não fornecido'}

Conteúdo extraído da página:
${paginaConteudo}

Extraia todas as informações e retorne o JSON estruturado.`

  try {
    const rawText = await callGemini({ systemPrompt, userPrompt, geminiKey, maxOutputTokens: 3000 })
    console.log('analisar-briefing: Gemini respondeu', rawText.slice(0, 100))

    const match = rawText.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('JSON não encontrado na resposta')

    let data
    try { data = JSON.parse(match[0]) } catch (e) {
      throw new Error(`JSON do briefing malformado: ${e.message}`)
    }
    data.linkDrive   = linkDrive || ''
    data.linkLovable = linkLovable

    return res.status(200).json(data)
  } catch (err) {
    console.error('analisar-briefing erro:', err)
    return res.status(500).json({ error: err.message })
  }
}
