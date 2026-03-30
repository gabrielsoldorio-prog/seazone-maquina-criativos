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
- variacao 1, 2, 3: tipo "longa", duracao "30-40s" (vídeos) — versões completas com todas as cenas
- variacao 4, 5: tipo "curta", duracao "10-20s" (vídeos) — versões reduzidas, 2-3 cenas máximo
Total obrigatório: 15 itens por formato, 45 no total.

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
      { "estrutura": 1, "variacao": 1, "tipo": "longa", "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 1, "variacao": 2, "tipo": "longa", "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 1, "variacao": 3, "tipo": "longa", "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 1, "variacao": 4, "tipo": "curta", "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 1, "variacao": 5, "tipo": "curta", "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 2, "variacao": 1, "tipo": "longa", "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 2, "variacao": 2, "tipo": "longa", "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 2, "variacao": 3, "tipo": "longa", "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 2, "variacao": 4, "tipo": "curta", "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 2, "variacao": 5, "tipo": "curta", "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 3, "variacao": 1, "tipo": "longa", "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 3, "variacao": 2, "tipo": "longa", "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 3, "variacao": 3, "tipo": "longa", "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 3, "variacao": 4, "tipo": "curta", "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." },
      { "estrutura": 3, "variacao": 5, "tipo": "curta", "referenciaVisual": "...", "textoDaArte": "...", "legenda": "..." }
    ]
  },
  "agentes": {
    "nota": 8.5,
    "justificativa": "Justificativa da pontuação em relação ao alinhamento com briefing e público-alvo",
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { briefing } = req.body
  if (!briefing) return res.status(400).json({ error: 'Briefing é obrigatório' })

  const geminiKey = process.env.GROQ_API_KEY
  if (!geminiKey) return res.status(500).json({ error: 'GROQ_API_KEY não configurada' })

  const userPrompt = `Gere os 9 roteiros completos para o seguinte empreendimento Seazone:

${JSON.stringify(briefing, null, 2)}

Siga rigorosamente as regras do sistema. Respeite os Do's e Don'ts específicos do briefing.
Após gerar os roteiros, avalie seu próprio trabalho com o agente nota (0-10) e o agente revisor (checklist).
Responda apenas com o JSON.`

  try {
    const rawText = await callGemini({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      geminiKey,
      maxOutputTokens: 12000,
      jsonMode: true,
    })
    console.log('gerar-criativos: Gemini respondeu', rawText.slice(0, 80))

    const parsed = parseRobust(rawText)
    return res.status(200).json(parsed)
  } catch (err) {
    console.error('gerar-criativos erro:', err)
    return res.status(500).json({ error: err.message })
  }
}

/**
 * Tenta parsear JSON com pipeline de reparo progressivo.
 * Lida com: markdown fences, caracteres de controle, vírgulas trailing.
 */
function parseRobust(raw) {
  // 1. Remove markdown code fences (```json ... ```)
  let text = raw
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```$/im, '')
    .trim()

  // 2. Extrai o bloco JSON mais externo
  const start = text.indexOf('{')
  const end   = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('Nenhum bloco JSON encontrado na resposta')
  text = text.slice(start, end + 1)

  // 3. Tentativa direta (caminho feliz)
  try { return JSON.parse(text) } catch (_) {}

  // 4. Remove caracteres de controle que não são \n \r \t
  text = text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
  try { return JSON.parse(text) } catch (_) {}

  // 5. Remove vírgulas trailing antes de } ou ]
  text = text.replace(/,(\s*[}\]])/g, '$1')
  try { return JSON.parse(text) } catch (_) {}

  // 6. Converte quebras de linha literais dentro de strings em \n escapado
  text = text.replace(/"((?:[^"\\]|\\.)*)"/g, (_, inner) => {
    const fixed = inner.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
    return `"${fixed}"`
  })
  try { return JSON.parse(text) } catch (e) {
    throw new Error(`JSON malformado após tentativas de reparo: ${e.message}`)
  }
}
