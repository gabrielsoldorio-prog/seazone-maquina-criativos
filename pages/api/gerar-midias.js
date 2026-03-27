export const config = {
  api: { responseLimit: '12mb' },
  maxDuration: 60
}

const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'

function extrairLocucao(cenas) {
  return (cenas || []).map(c => c.locucao || '').filter(Boolean).join('\n\n')
}

// GPT-5 via OpenRouter — geração nativa de imagem
async function gerarImagemGPT5(prompt, openrouterKey) {
  let rawText = ''
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-5',
        messages: [{ role: 'user', content: `Generate an image: ${prompt}` }],
        tools: [{ type: 'image_generation' }]
      })
    })

    rawText = await res.text()

    if (!res.ok) {
      throw new Error(`OpenRouter ${res.status}: ${rawText}`)
    }

    let json
    try {
      json = JSON.parse(rawText)
    } catch {
      throw new Error(`Resposta não é JSON válido. Status ${res.status}. Início: ${rawText.slice(0, 200)}`)
    }

    const message = json.choices?.[0]?.message

    // tool_calls com dados de imagem
    if (message?.tool_calls) {
      for (const tc of message.tool_calls) {
        const result = tc.result || tc.output
        if (result?.url) return result.url
        if (result?.b64_json) return `data:image/png;base64,${result.b64_json}`
      }
    }

    // content multimodal (array)
    const content = message?.content
    if (Array.isArray(content)) {
      for (const item of content) {
        if (item.type === 'image_url') return item.image_url?.url
        if (item.type === 'image') return item.source?.url || item.url
      }
    }

    // content string — extrai URL de imagem
    if (typeof content === 'string') {
      const match = content.match(/https?:\/\/[^\s"')]+\.(?:png|jpg|jpeg|webp)[^\s"')\]]*/i)
      if (match) return match[0]
    }

    throw new Error(`GPT-5 não retornou imagem. Resposta: ${JSON.stringify(message).slice(0, 300)}`)
  } catch (err) {
    // Re-lança com contexto suficiente para debug
    throw new Error(`gerarImagemGPT5: ${err.message}`)
  }
}

// ElevenLabs: TTS → base64
async function gerarAudio(texto, elevenKey) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: { 'xi-api-key': elevenKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
    body: JSON.stringify({
      text: texto,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.45, similarity_boost: 0.80, style: 0.3, use_speaker_boost: true }
    })
  })
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`)
  const buf = Buffer.from(await res.arrayBuffer())
  return `data:audio/mpeg;base64,${buf.toString('base64')}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { roteiros } = req.body
  if (!roteiros?.materiais) return res.status(400).json({ error: 'roteiros inválidos' })

  const elevenKey     = process.env.ELEVENLABS_API_KEY
  const openrouterKey = process.env.OPENROUTER_API_KEY

  if (!elevenKey)     return res.status(500).json({ error: 'ELEVENLABS_API_KEY não configurada' })
  if (!openrouterKey) return res.status(500).json({ error: 'OPENROUTER_API_KEY não configurada' })

  const prompt = roteiros.imagemPrompt ||
    'Aerial view of modern Brazilian real estate development, coastal city, professional sober palette, dark overlay, cinematic photography'

  const resultado = {}

  // 1. Imagem via GPT-5
  try {
    resultado.imagemUrl = await gerarImagemGPT5(prompt, openrouterKey)
  } catch (e) {
    resultado.imagemErro = e.message
  }

  // 2. Áudio narrado (estrutura 1)
  const textoNarrado = extrairLocucao(roteiros.materiais?.videoNarrado?.[0]?.cenas)
  if (textoNarrado) {
    try { resultado.narradoAudio = await gerarAudio(textoNarrado, elevenKey) }
    catch (e) { resultado.narradoErro = e.message }
  }

  // 3. Áudio apresentadora (estrutura 1)
  const textoApresentadora = extrairLocucao(roteiros.materiais?.videoApresentadora?.[0]?.cenas)
  if (textoApresentadora) {
    try { resultado.apresentadoraAudio = await gerarAudio(textoApresentadora, elevenKey) }
    catch (e) { resultado.apresentadoraErro = e.message }
  }

  return res.status(200).json(resultado)
}
