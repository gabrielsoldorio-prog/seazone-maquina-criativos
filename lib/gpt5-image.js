/**
 * Utilitários compartilhados para geração de imagem via GPT-5 / OpenRouter
 */

/** Extrai URL ou base64 de imagem da resposta do chat completions */
export function extrairImagem(message) {
  if (!message) return null

  // tool_calls com resultado de image_generation
  if (message.tool_calls) {
    for (const tc of message.tool_calls) {
      const result = tc.result || tc.output
      if (result?.url) return result.url
      if (result?.b64_json) return `data:image/png;base64,${result.b64_json}`
    }
  }

  // content multimodal (array)
  const content = message.content
  if (Array.isArray(content)) {
    for (const item of content) {
      if (item.type === 'image_url') return item.image_url?.url || null
      if (item.type === 'image')     return item.source?.url  || item.url || null
    }
  }

  // content string — extrai primeira URL de imagem
  if (typeof content === 'string') {
    const match = content.match(/https?:\/\/[^\s"')]+\.(?:png|jpg|jpeg|webp)[^\s"')\]]*/i)
    if (match) return match[0]
  }

  return null
}

/**
 * Chama GPT-5 via OpenRouter com image_generation tool.
 * Aceita messages no formato OpenAI (pode incluir image_url para visão).
 * Lança Error com contexto de debug se falhar.
 */
export async function chamarGPT5Imagem(messages, openrouterKey) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openrouterKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-5',
      messages,
      tools: [{ type: 'image_generation' }]
    })
  })

  const rawText = await res.text()

  if (!res.ok) {
    throw new Error(`OpenRouter ${res.status}: ${rawText.slice(0, 300)}`)
  }

  let json
  try {
    json = JSON.parse(rawText)
  } catch {
    throw new Error(`Resposta não é JSON válido. Status ${res.status}. Início: ${rawText.slice(0, 200)}`)
  }

  const message = json.choices?.[0]?.message
  const url = extrairImagem(message)

  if (!url) {
    throw new Error(`GPT-5 não retornou imagem. Resposta: ${JSON.stringify(message).slice(0, 300)}`)
  }

  return url
}
