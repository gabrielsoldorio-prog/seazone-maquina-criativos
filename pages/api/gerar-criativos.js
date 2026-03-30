const SYSTEM_PROMPT = `Você é um agente especialista em criação de criativos de performance para a Seazone.
Você receberá um briefing estruturado e deve gerar 45 roteiros completos: 3 formatos × 3 estruturas × 5 variações.

## TERMOS PROIBIDOS
NUNCA USE → USE SEMPRE:
- Studios/Unidades → Ativos, Produtos
- Apartamento/Imóvel/Casa → Investimento, Ativo imobiliário, Cota, SPOT
- Garantia/Garantimos/Lucro fixo → Projeção, Estimativa de mercado
- Pool de Locação → Gestão individualizada Seazone
- Exclusivo/Único Lançamento → Localização estratégica, Alta demanda
- Comprar/Vender → Investir, Alocar capital, Garantir cota
- Rendimento Fixo → Rentabilidade passiva, Renda líquida estimada

## REGRAS CRÍTICAS
1. Dados de retorno SEMPRE com sufixo "com aluguel por temporada"
2. Primeiro lettering SEMPRE com PIN: "(pin) Cidade, UF — Bairro"
3. Argumento sempre: Valorização Patrimonial + Renda Passiva
4. Usar APENAS dados confirmados do briefing
5. Mônica Medeiros — lettering: "Mônica Medeiros — Sócia-fundadora Seazone"
6. Vídeo narrado: sem lettering de identificação da Mônica
7. Estático: dado financeiro único por variação (ROI% OU R$/mês, nunca os dois juntos)

## VARIAÇÕES OBRIGATÓRIAS POR ESTRUTURA
Cada estrutura tem exatamente 5 variações:
- variacao 1, 2, 3: tipo "longa", duracao "30-40s" (vídeos)
- variacao 4, 5: tipo "curta", duracao "10-20s" (vídeos)
Total: 15 itens por formato, 45 no total.

## AVALIAÇÃO INDIVIDUAL
Para cada uma das 45 variações, avalie:
- Aderência ao briefing (Do's e Don'ts respeitados)
- Qualidade do copy (clareza, argumento financeiro, CTA)
- Dados financeiros corretos com sufixo
- Tom de voz adequado ao formato e público
Gere notas reais (6.0 a 9.5) com valores DIFERENTES por variação e justificativas curtas (máx 80 chars).

## FORMATO DE RESPOSTA
Responda APENAS com JSON válido com exatamente esta estrutura:
{
  "empreendimento": "...",
  "localizacao": "...",
  "imagemPrompt": "Prompt em inglês para geração de imagem via Fal.ai",
  "materiais": {
    "videoApresentadora": [
      { "estrutura": 1, "variacao": 1, "tipo": "longa", "duracao": "30-40s", "cenas": [{ "cena": "...", "lettering": "...", "locucao": "..." }], "legenda": "..." },
      { "estrutura": 1, "variacao": 2, "tipo": "longa", "duracao": "30-40s", "cenas": [], "legenda": "..." },
      { "estrutura": 1, "variacao": 3, "tipo": "longa", "duracao": "30-40s", "cenas": [], "legenda": "..." },
      { "estrutura": 1, "variacao": 4, "tipo": "curta", "duracao": "10-20s", "cenas": [], "legenda": "..." },
      { "estrutura": 1, "variacao": 5, "tipo": "curta", "duracao": "10-20s", "cenas": [], "legenda": "..." },
      { "estrutura": 2, "variacao": 1, "tipo": "longa", "duracao": "30-40s", "cenas": [], "legenda": "..." },
      { "estrutura": 2, "variacao": 2, "tipo": "longa", "duracao": "30-40s", "cenas": [], "legenda": "..." },
      { "estrutura": 2, "variacao": 3, "tipo": "longa", "duracao": "30-40s", "cenas": [], "legenda": "..." },
      { "estrutura": 2, "variacao": 4, "tipo": "curta", "duracao": "10-20s", "cenas": [], "legenda": "..." },
      { "estrutura": 2, "variacao": 5, "tipo": "curta", "duracao": "10-20s", "cenas": [], "legenda": "..." },
      { "estrutura": 3, "variacao": 1, "tipo": "longa", "duracao": "30-40s", "cenas": [], "legenda": "..." },
      { "estrutura": 3, "variacao": 2, "tipo": "longa", "duracao": "30-40s", "cenas": [], "legenda": "..." },
      { "estrutura": 3, "variacao": 3, "tipo": "longa", "duracao": "30-40s", "cenas": [], "legenda": "..." },
      { "estrutura": 3, "variacao": 4, "tipo": "curta", "duracao": "10-20s", "cenas": [], "legenda": "..." },
      { "estrutura": 3, "variacao": 5, "tipo": "curta", "duracao": "10-20s", "cenas": [], "legenda": "..." }
    ],
    "videoNarrado": [
      { "estrutura": 1, "variacao": 1, "tipo": "longa", "duracao": "30-40s", "cenas": [{ "cena": "...", "lettering": "...", "locucao": "..." }], "legenda": "..." },
      { "estrutura": 1, "variacao": 2, "tipo": "longa", "duracao": "30-40s", "cenas": [], "legenda": "..." },
      { "estrutura": 1, "variacao": 3, "tipo": "longa", "duracao": "30-40s", "cenas": [], "legenda": "..." },
      { "estrutura": 1, "variacao": 4, "tipo": "curta", "duracao": "10-20s", "cenas": [], "legenda": "..." },
      { "estrutura": 1, "variacao": 5, "tipo": "curta", "duracao": "10-20s", "cenas": [], "legenda": "..." },
      { "estrutura": 2, "variacao": 1, "tipo": "longa", "duracao": "30-40s", "cenas": [], "legenda": "..." },
      { "estrutura": 2, "variacao": 2, "tipo": "longa", "duracao": "30-40s", "cenas": [], "legenda": "..." },
      { "estrutura": 2, "variacao": 3, "tipo": "longa", "duracao": "30-40s", "cenas": [], "legenda": "..." },
      { "estrutura": 2, "variacao": 4, "tipo": "curta", "duracao": "10-20s", "cenas": [], "legenda": "..." },
      { "estrutura": 2, "variacao": 5, "tipo": "curta", "duracao": "10-20s", "cenas": [], "legenda": "..." },
      { "estrutura": 3, "variacao": 1, "tipo": "longa", "duracao": "30-40s", "cenas": [], "legenda": "..." },
      { "estrutura": 3, "variacao": 2, "tipo": "longa", "duracao": "30-40s", "cenas": [], "legenda": "..." },
      { "estrutura": 3, "variacao": 3, "tipo": "longa", "duracao": "30-40s", "cenas": [], "legenda": "..." },
      { "estrutura": 3, "variacao": 4, "tipo": "curta", "duracao": "10-20s", "cenas": [], "legenda": "..." },
      { "estrutura": 3, "variacao": 5, "tipo": "curta", "duracao": "10-20s", "cenas": [], "legenda": "..." }
    ],
    "estatico": [
      { "estrutura": 1, "variacao": 1, "referenciaVisual": "vista aérea do bairro...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 1, "variacao": 2, "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 1, "variacao": 3, "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 1, "variacao": 4, "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 1, "variacao": 5, "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 2, "variacao": 1, "referenciaVisual": "fachada do empreendimento...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 2, "variacao": 2, "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 2, "variacao": 3, "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 2, "variacao": 4, "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 2, "variacao": 5, "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 3, "variacao": 1, "referenciaVisual": "rooftop com piscina...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 3, "variacao": 2, "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 3, "variacao": 3, "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 3, "variacao": 4, "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 3, "variacao": 5, "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." }
    ]
  },
  "agentes": {
    "nota": 8.5,
    "justificativa": "Justificativa geral da pontuação",
    "scores": {
      "videoApresentadora": [[8.5,"PIN correto, dados confirmados, tom de autoridade"],[8.2,"..."],[7.9,"..."],[8.1,"..."],[7.5,"..."],[8.3,"..."],[8.0,"..."],[7.8,"..."],[8.4,"..."],[7.6,"..."],[7.8,"..."],[8.1,"..."],[8.3,"..."],[7.7,"..."],[8.0,"..."]],
      "videoNarrado":       [[8.4,"..."],[8.1,"..."],[7.9,"..."],[7.8,"..."],[8.2,"..."],[8.3,"..."],[8.0,"..."],[7.8,"..."],[8.4,"..."],[7.6,"..."],[7.8,"..."],[8.1,"..."],[8.3,"..."],[7.7,"..."],[8.0,"..."]],
      "estatico":           [[9.0,"..."],[8.5,"..."],[8.8,"..."],[8.3,"..."],[8.7,"..."],[8.6,"..."],[8.2,"..."],[8.9,"..."],[8.4,"..."],[8.7,"..."],[8.5,"..."],[8.1,"..."],[8.8,"..."],[8.3,"..."],[8.6,"..."]]
    },
    "revisor": {
      "pinLocalizacao": true,
      "dadosConfirmados": true,
      "sufixoAluguel": true,
      "semTermosProibidos": true,
      "sequenciaVisual": true,
      "dosSeguidos": true,
      "dontsSeguidos": true,
      "tomCorreto": true,
      "comboValorizacaoRenda": true
    }
  }
}`

import { callGemini } from '../../lib/gemini'

export const config = {
  api: { responseLimit: '4mb' },
  maxDuration: 120,
}

// ── Normalização de posição ───────────────────────────────────────────────────
// Garante estrutura/variacao corretos independente do que a IA retornar.
// Posição 0-4 → estrutura 1, variacao 1-5
// Posição 5-9 → estrutura 2, variacao 1-5
// Posição 10-14 → estrutura 3, variacao 1-5
function normalizarPosicao(items, isVideo) {
  return (items || []).map((item, idx) => {
    const est = Math.floor(idx / 5) + 1
    const vrc = (idx % 5) + 1
    const updated = { ...item, estrutura: est, variacao: vrc }
    if (isVideo) {
      updated.tipo   = vrc <= 3 ? 'longa' : 'curta'
      updated.duracao = vrc <= 3 ? '30-40s' : '10-20s'
    }
    return updated
  })
}

function vincularScores(items, scoresArr) {
  return items.map((item, idx) => ({
    ...item,
    score:       scoresArr?.[idx]?.[0] ?? null,
    scoreJustif: scoresArr?.[idx]?.[1] ?? null,
  }))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { briefing } = req.body
  if (!briefing) return res.status(400).json({ error: 'Briefing é obrigatório' })

  const geminiKey = process.env.GROQ_API_KEY
  if (!geminiKey) return res.status(500).json({ error: 'GROQ_API_KEY não configurada' })

  const userPrompt = `Gere os 45 roteiros completos (3 formatos × 3 estruturas × 5 variações) para o seguinte empreendimento Seazone:

${JSON.stringify(briefing, null, 2)}

Siga rigorosamente as regras do sistema. Respeite os Do's e Don'ts específicos do briefing.
Avalie cada uma das 45 variações individualmente com notas DIFERENTES entre si (6.0-9.5) no campo scores.
Responda apenas com o JSON.`

  try {
    const rawText = await callGemini({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      geminiKey,
      maxOutputTokens: 12000,
      jsonMode: true,
    })
    console.log('gerar-criativos: Groq respondeu', rawText.slice(0, 80))

    const parsed = parseRobust(rawText)

    // ── Normaliza posição e vincula scores ────────────────────────────────────
    const sc = parsed.agentes?.scores || {}
    parsed.materiais = parsed.materiais || {}
    parsed.materiais.videoApresentadora = vincularScores(
      normalizarPosicao(parsed.materiais.videoApresentadora, true),
      sc.videoApresentadora
    )
    parsed.materiais.videoNarrado = vincularScores(
      normalizarPosicao(parsed.materiais.videoNarrado, true),
      sc.videoNarrado
    )
    parsed.materiais.estatico = vincularScores(
      normalizarPosicao(parsed.materiais.estatico, false),
      sc.estatico
    )

    return res.status(200).json(parsed)
  } catch (err) {
    console.error('gerar-criativos erro:', err)
    return res.status(500).json({ error: err.message })
  }
}

/**
 * Tenta parsear JSON com pipeline de reparo progressivo.
 */
function parseRobust(raw) {
  let text = raw
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```$/im, '')
    .trim()

  const start = text.indexOf('{')
  const end   = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('Nenhum bloco JSON encontrado na resposta')
  text = text.slice(start, end + 1)

  try { return JSON.parse(text) } catch (_) {}

  text = text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
  try { return JSON.parse(text) } catch (_) {}

  text = text.replace(/,(\s*[}\]])/g, '$1')
  try { return JSON.parse(text) } catch (_) {}

  text = text.replace(/"((?:[^"\\]|\\.)*)"/g, (_, inner) => {
    const fixed = inner.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
    return `"${fixed}"`
  })
  try { return JSON.parse(text) } catch (e) {
    throw new Error(`JSON malformado após tentativas de reparo: ${e.message}`)
  }
}
