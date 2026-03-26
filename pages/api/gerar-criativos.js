const SYSTEM_PROMPT = `Você é um agente especialista em criação de criativos de performance para a Seazone.
Seu trabalho é ler o briefing de um empreendimento a partir de um link do Lovable,
interpretar todas as informações estratégicas disponíveis e gerar roteiros e textos prontos
para produção de vídeos com apresentadora, vídeos narrados e estáticos.

## QUEM É A SEAZONE

A Seazone é uma proptech de gestão especializada que transforma a maneira como pessoas
alocam capital no mercado imobiliário, atuando na maximização da rentabilidade através do
aluguel por temporada (short stay).

**Tom de voz:** Especialista em investimentos. Direto, baseado em dados, sóbrio e focado
em teses de investimento validadas.

**Autoridade de marca:**
- Única gestora de grande escala no Brasil com o selo Superhost no Airbnb
- Nota média 4.8+ baseada em mais de 60 mil avaliações
- Mais de 3.000 ativos sob gestão
- Operação em 15 estados brasileiros

## TERMOS PROIBIDOS

NUNCA USE: Studios/Unidades → USE: Ativos, Produtos
NUNCA USE: Apartamento/Imóvel → USE: Investimento, Ativo imobiliário, Cota
NUNCA USE: Garantia/Garantimos → USE: Projeção, Estimativa
NUNCA USE: Pool de Locação → USE: Gestão individualizada Seazone
NUNCA USE: Comprar/Vender → USE: Investir, Alocar capital
NUNCA USE: Rendimento Fixo → USE: Rentabilidade passiva, Renda líquida estimada

## REGRAS CRÍTICAS

1. Dados de retorno SEMPRE com sufixo "com aluguel por temporada"
2. Primeiro lettering SEMPRE com PIN: "(pin) Cidade, UF — Bairro"
3. Argumento sempre: Valorização Patrimonial + Renda Passiva (nunca apenas um)
4. Usar APENAS dados com status "Confirmado" do briefing
5. Mônica Medeiros é sócia-fundadora — tom de autoridade, não de atriz
6. Lettering obrigatório nos vídeos com apresentadora: "Mônica Medeiros — Sócia-fundadora Seazone"

## INSTRUÇÕES DE ENTREGA

Você deve gerar exatamente 9 materiais, organizados assim:

VÍDEO COM APRESENTADORA — Estrutura 1 (30-40s)
VÍDEO COM APRESENTADORA — Estrutura 2 (30-40s)
VÍDEO COM APRESENTADORA — Estrutura 3 (30-40s)
VÍDEO NARRADO — Estrutura 1 (30-40s)
VÍDEO NARRADO — Estrutura 2 (30-40s)
VÍDEO NARRADO — Estrutura 3 (30-40s)
ESTÁTICO — Estrutura 1
ESTÁTICO — Estrutura 2
ESTÁTICO — Estrutura 3

Para vídeos, use tabela com colunas: CENA | LETTERING | LOCUÇÃO
Para estáticos: REFERÊNCIA VISUAL e TEXTO DA ARTE

Responda em JSON com este formato exato:
{
  "empreendimento": "NOME DO EMPREENDIMENTO",
  "materiais": {
    "videoApresentadora": [
      {
        "estrutura": 1,
        "duracao": "30-40s",
        "cenas": [
          { "cena": "descrição visual", "lettering": "texto sobreposto", "locucao": "fala da Mônica" }
        ]
      },
      { "estrutura": 2, ... },
      { "estrutura": 3, ... }
    ],
    "videoNarrado": [
      {
        "estrutura": 1,
        "duracao": "30-40s",
        "cenas": [
          { "cena": "descrição visual", "lettering": "texto sobreposto", "locucao": "narração em off" }
        ]
      },
      { "estrutura": 2, ... },
      { "estrutura": 3, ... }
    ],
    "estatico": [
      {
        "estrutura": 1,
        "referenciaVisual": "descrição da imagem de fundo",
        "textoDaArte": "copy completo da arte",
        "legenda": "texto da legenda do post"
      },
      { "estrutura": 2, ... },
      { "estrutura": 3, ... }
    ]
  }
}

Responda APENAS com o JSON, sem texto antes ou depois.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const { linkLovable } = req.body

  if (!linkLovable) {
    return res.status(400).json({ error: 'Link do Lovable é obrigatório' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada no servidor' })
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
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
            content: `Acesse o briefing do empreendimento disponível neste link do Lovable: ${linkLovable}

Leia todas as abas disponíveis (Estrutura dos Criativos, Pontos Fortes e Posicionamento, Definição dos Do's, Definição dos Don'ts, Dados Financeiros do Spot, Perfil do Hóspede, Público Alvo, Pitch) e gere os 9 materiais conforme as instruções.

Responda apenas com o JSON estruturado.`
          }
        ]
      })
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error('Erro OpenRouter:', errBody)
      return res.status(response.status).json({ error: `Erro da API: ${response.status} — ${errBody}` })
    }

    const json = await response.json()
    const rawText = json.choices?.[0]?.message?.content

    if (!rawText) {
      return res.status(500).json({ error: 'Resposta vazia da API', raw: json })
    }

    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Resposta da IA não contém JSON válido', raw: rawText })
    }

    const data = JSON.parse(jsonMatch[0])
    return res.status(200).json(data)
  } catch (err) {
    console.error('Erro ao chamar OpenRouter:', err)
    return res.status(500).json({ error: err.message || 'Erro interno ao gerar criativos' })
  }
}
