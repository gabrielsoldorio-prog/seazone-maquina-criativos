const SYSTEM_PROMPT = `Você é um agente especialista em criação de criativos de performance para a Seazone.
Você receberá um briefing estruturado de um empreendimento e deve gerar 9 roteiros completos.

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

## FORMATO DE RESPOSTA
Responda APENAS com JSON válido:
{
  "empreendimento": "...",
  "localizacao": "...",
  "imagemPrompt": "Prompt em inglês para geração de imagem estática via Fal.ai ou DALL-E 3",
  "materiais": {
    "videoApresentadora": [
      {
        "estrutura": 1,
        "duracao": "30-40s",
        "cenas": [
          { "cena": "descrição visual", "lettering": "texto sobreposto", "locucao": "fala da Mônica" }
        ]
      },
      { "estrutura": 2, "duracao": "30-40s", "cenas": [] },
      { "estrutura": 3, "duracao": "30-40s", "cenas": [] }
    ],
    "videoNarrado": [
      {
        "estrutura": 1,
        "duracao": "30-40s",
        "cenas": [
          { "cena": "descrição visual", "lettering": "texto sobreposto", "locucao": "narração em off" }
        ]
      },
      { "estrutura": 2, "duracao": "30-40s", "cenas": [] },
      { "estrutura": 3, "duracao": "30-40s", "cenas": [] }
    ],
    "estatico": [
      {
        "estrutura": 1,
        "referenciaVisual": "descrição da imagem de fundo",
        "textoDaArte": "copy completo com PIN, badge Lançamento, headline, dado financeiro",
        "legenda": "texto da legenda do post"
      },
      { "estrutura": 2, "referenciaVisual": "", "textoDaArte": "", "legenda": "" },
      { "estrutura": 3, "referenciaVisual": "", "textoDaArte": "", "legenda": "" }
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { briefing } = req.body
  if (!briefing) return res.status(400).json({ error: 'Briefing é obrigatório' })

  const openrouterKey = process.env.ANTHROPIC_API_KEY
  if (!openrouterKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada' })

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://seazone.com.br',
        'X-Title': 'Seazone Máquina de Criativos'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-opus-4-5',
        max_tokens: 8000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Gere os 9 roteiros completos para o seguinte empreendimento Seazone:

${JSON.stringify(briefing, null, 2)}

Siga rigorosamente as regras do sistema. Respeite os Do's e Don'ts específicos do briefing.
Após gerar os roteiros, avalie seu próprio trabalho com o agente nota (0-10) e o agente revisor (checklist).
Responda apenas com o JSON.`
          }
        ]
      })
    })

    if (!response.ok) throw new Error(`OpenRouter ${response.status}: ${await response.text()}`)

    const json = await response.json()
    const rawText = json.choices?.[0]?.message?.content
    if (!rawText) throw new Error('Resposta vazia')

    const match = rawText.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('JSON não encontrado')

    return res.status(200).json(JSON.parse(match[0]))
  } catch (err) {
    console.error('gerar-criativos erro:', err)
    return res.status(500).json({ error: err.message })
  }
}
