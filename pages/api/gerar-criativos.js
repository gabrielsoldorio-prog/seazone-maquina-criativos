const SYSTEM_PROMPT = `Você é um agente especialista em criação de criativos de performance para a Seazone.
Seu trabalho é acessar o briefing de um empreendimento via link do Lovable,
interpretar todas as informações estratégicas e gerar roteiros prontos para produção.

## QUEM É A SEAZONE

A Seazone é uma proptech de gestão especializada que transforma a maneira como pessoas
alocam capital no mercado imobiliário via aluguel por temporada (short stay).

Autoridade de marca:
- Única gestora de grande escala no Brasil com o selo Superhost no Airbnb
- Nota média 4.8+ com mais de 60 mil avaliações
- Mais de 3.000 ativos sob gestão em 15 estados brasileiros

Tom de voz: especialista em investimentos. Direto, baseado em dados, sóbrio.

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
3. Argumento sempre: Valorização Patrimonial + Renda Passiva (nunca apenas um)
4. Usar APENAS dados com status "Confirmado" do briefing
5. Mônica Medeiros é sócia-fundadora — tom de autoridade, não de atriz
6. Lettering obrigatório nos vídeos com apresentadora: "Mônica Medeiros — Sócia-fundadora Seazone"

## ABAS DO LOVABLE QUE VOCÊ DEVE LER

Acesse o link e leia TODAS as abas disponíveis nesta ordem:
1. Estrutura dos Criativos (sequências visuais, formatos, diretrizes)
2. Pontos Fortes e Posicionamento (argumentos aprovados)
3. Definição dos Do's (o que reforçar)
4. Definição dos Don'ts (o que evitar + substitutos)
5. Dados Financeiros do Spot (apenas status "Confirmado")
6. Perfil do Hóspede
7. Público Alvo
8. Pitch

## FORMATOS A GERAR

### Vídeo com Apresentadora
A Mônica fala diretamente para a câmera. Tom de autoridade.
Estrutura de cena: CENA | LETTERING | LOCUÇÃO

### Vídeo Narrado
Narração em off. Mônica aparece em b-roll (sem falar para a câmera).
Lettering de identificação da Mônica NÃO é necessário neste formato.
Estrutura de cena: CENA | LETTERING | LOCUÇÃO

### Estático
Imagem com copy sobreposto. Sem vídeo, sem locução.
Estrutura: referenciaVisual + textoDaArte + legenda
- Começa com PIN de localização
- Badge "Lançamento"
- Dado financeiro único (ROI% OU R$/mês — nunca os dois juntos)
- Sufixo obrigatório: "com aluguel por temporada"

## FORMATO DE RESPOSTA

Responda APENAS com este JSON, sem texto antes ou depois:

{
  "empreendimento": "NOME DO EMPREENDIMENTO",
  "localizacao": "Cidade, UF — Bairro",
  "imagemPrompt": "Prompt em inglês para geração de imagem estática via Fal.ai. Descreva: vista aérea do bairro/região, render da fachada do empreendimento, paleta sóbria e profissional com overlay escuro para contraste de texto, estilo cinematic real estate photography.",
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
        "textoDaArte": "copy completo que vai na imagem",
        "legenda": "texto da legenda do post"
      },
      { "estrutura": 2, "referenciaVisual": "", "textoDaArte": "", "legenda": "" },
      { "estrutura": 3, "referenciaVisual": "", "textoDaArte": "", "legenda": "" }
    ]
  }
}`

async function chamarOpenRouter(linkLovable, apiKey) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
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

Leia todas as abas (Estrutura dos Criativos, Pontos Fortes e Posicionamento, Definição dos Do's, Definição dos Don'ts, Dados Financeiros do Spot, Perfil do Hóspede, Público Alvo, Pitch) e gere os 9 materiais conforme as instruções.

Responda apenas com o JSON estruturado.`
        }
      ]
    })
  })

  if (!response.ok) {
    const errBody = await response.text()
    throw new Error(`OpenRouter ${response.status}: ${errBody}`)
  }

  const json = await response.json()
  const rawText = json.choices?.[0]?.message?.content

  if (!rawText) throw new Error('Resposta vazia do OpenRouter')

  const match = rawText.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('JSON não encontrado na resposta da IA')

  return JSON.parse(match[0])
}

async function gerarImagemFal(prompt, falKey) {
  const response = await fetch('https://queue.fal.run/fal-ai/flux/schnell', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${falKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      image_size: 'portrait_4_3',
      num_inference_steps: 4,
      num_images: 1,
      enable_safety_checker: false
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Fal.ai submit ${response.status}: ${err}`)
  }

  const { request_id } = await response.json()

  // Poll até completar
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 3000))

    const statusRes = await fetch(`https://queue.fal.run/fal-ai/flux/schnell/requests/${request_id}`, {
      headers: { 'Authorization': `Key ${falKey}` }
    })

    if (!statusRes.ok) continue

    const result = await statusRes.json()

    if (result.status === 'COMPLETED') {
      return result.output?.images?.[0]?.url || null
    }
    if (result.status === 'FAILED') {
      throw new Error('Fal.ai geração falhou: ' + JSON.stringify(result))
    }
  }

  throw new Error('Fal.ai timeout: imagem não gerada em 90s')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const { linkLovable } = req.body

  if (!linkLovable) {
    return res.status(400).json({ error: 'Link do Lovable é obrigatório' })
  }

  const openrouterKey = process.env.ANTHROPIC_API_KEY
  const falKey = process.env.FAL_API_KEY

  if (!openrouterKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada' })
  }

  try {
    // 1. Gerar roteiros via OpenRouter
    const roteiros = await chamarOpenRouter(linkLovable, openrouterKey)

    // 2. Gerar imagem estática via Fal.ai (se chave disponível)
    let imagemUrl = null
    if (falKey && roteiros.imagemPrompt) {
      try {
        imagemUrl = await gerarImagemFal(roteiros.imagemPrompt, falKey)
      } catch (falErr) {
        console.error('Fal.ai erro (não fatal):', falErr.message)
      }
    }

    return res.status(200).json({
      ...roteiros,
      imagemGerada: imagemUrl
    })
  } catch (err) {
    console.error('Erro em gerar-criativos:', err)
    return res.status(500).json({ error: err.message || 'Erro interno' })
  }
}
