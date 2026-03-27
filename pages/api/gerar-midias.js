export const config = {
  api: { responseLimit: '12mb' },
  maxDuration: 60
}

const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'

function extrairLocucao(cenas) {
  return (cenas || []).map(c => c.locucao || '').filter(Boolean).join('\n\n')
}

// Fal.ai: submit + poll
async function gerarImagemFal(prompt, falKey) {
  const sub = await fetch('https://queue.fal.run/fal-ai/flux/schnell', {
    method: 'POST',
    headers: { 'Authorization': `Key ${falKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, image_size: 'portrait_4_3', num_inference_steps: 4, num_images: 1, enable_safety_checker: false })
  })
  if (!sub.ok) throw new Error(`Fal submit ${sub.status}: ${await sub.text()}`)
  const { request_id } = await sub.json()

  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 3000))
    const poll = await fetch(`https://queue.fal.run/fal-ai/flux/schnell/requests/${request_id}`, {
      headers: { 'Authorization': `Key ${falKey}` }
    })
    if (!poll.ok) continue
    const result = await poll.json()
    if (result.status === 'COMPLETED') return result.output?.images?.[0]?.url || null
    if (result.status === 'FAILED') throw new Error('Fal.ai falhou: ' + JSON.stringify(result))
  }
  throw new Error('Fal.ai timeout')
}

// GPT-5 via OpenRouter
async function gerarImagemGPT5(prompt, openrouterKey) {
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
  if (!res.ok) throw new Error(`GPT-5/OpenRouter ${res.status}: ${await res.text()}`)
  const json = await res.json()

  const message = json.choices?.[0]?.message

  // Verifica tool_calls com dados de imagem
  if (message?.tool_calls) {
    for (const tc of message.tool_calls) {
      const result = tc.result || tc.output
      if (result?.url) return result.url
      if (result?.b64_json) return `data:image/png;base64,${result.b64_json}`
    }
  }

  // Verifica content em formato array (multimodal)
  const content = message?.content
  if (Array.isArray(content)) {
    for (const item of content) {
      if (item.type === 'image_url') return item.image_url?.url
      if (item.type === 'image') return item.source?.url || item.url
    }
  }

  // Fallback: extrai URL de imagem de string de texto
  if (typeof content === 'string') {
    const match = content.match(/https?:\/\/[^\s"')]+\.(?:png|jpg|jpeg|webp)[^\s"')\]]*/)
    if (match) return match[0]
  }

  throw new Error('GPT-5 não retornou imagem reconhecível')
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

  const falKey         = process.env.FAL_API_KEY
  const elevenKey      = process.env.ELEVENLABS_API_KEY
  const openrouterKey  = process.env.OPENROUTER_API_KEY

  if (!falKey)    return res.status(500).json({ error: 'FAL_API_KEY não configurada' })
  if (!elevenKey) return res.status(500).json({ error: 'ELEVENLABS_API_KEY não configurada' })

  const prompt = roteiros.imagemPrompt ||
    'Aerial view of modern Brazilian real estate development, coastal city, professional sober palette, dark overlay, cinematic photography'

  const resultado = {}

  // 1. Imagens em paralelo: Fal.ai + GPT-5 via OpenRouter
  await Promise.allSettled([
    gerarImagemFal(prompt, falKey).then(url => { resultado.imagemFal = url }),
    openrouterKey
      ? gerarImagemGPT5(prompt, openrouterKey).then(url => { resultado.imagemGPT5 = url })
      : Promise.resolve()
  ]).then(results => {
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        if (i === 0) resultado.imagemFalErro   = r.reason?.message
        if (i === 1) resultado.imagemGPT5Erro  = r.reason?.message
      }
    })
  })

  // imagemUrl = Fal.ai por padrão (usuário pode trocar via "Usar esta")
  resultado.imagemUrl = resultado.imagemFal || resultado.imagemGPT5 || null

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
