/**
 * Utilitários compartilhados para geração de imagem via Fal.ai
 */

/**
 * Extrai o texto de prompt das mensagens no formato OpenAI
 */
function extrairPromptDasMensagens(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.role === 'user') {
      if (typeof msg.content === 'string') return msg.content
      if (Array.isArray(msg.content)) {
        const textPart = msg.content.find(c => c.type === 'text')
        if (textPart) return textPart.text
      }
    }
  }
  return messages.map(m => typeof m.content === 'string' ? m.content : '').filter(Boolean).join('\n')
}

/**
 * Gera imagem via Fal.ai (fal-ai/flux/dev).
 * Aceita messages no formato OpenAI — extrai o prompt da última mensagem do usuário.
 * Lança Error com contexto de debug se falhar.
 */
export async function chamarGPT5Imagem(messages, falKey) {
  const prompt = extrairPromptDasMensagens(messages)

  const res = await fetch('https://fal.run/fal-ai/flux/dev', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${falKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      num_images: 1,
      image_size: 'landscape_16_9',
    }),
  })

  const rawText = await res.text()

  if (!res.ok) {
    throw new Error(`Fal.ai ${res.status}: ${rawText.slice(0, 300)}`)
  }

  let json
  try {
    json = JSON.parse(rawText)
  } catch {
    throw new Error(`Resposta não é JSON válido. Status ${res.status}. Início: ${rawText.slice(0, 200)}`)
  }

  const url = json.images?.[0]?.url
  if (!url) {
    throw new Error(`Fal.ai não retornou imagem. Resposta: ${JSON.stringify(json).slice(0, 300)}`)
  }

  return url
}
