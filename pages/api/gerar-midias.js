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

// DALL-E 3 (opcional — se OPENAI_API_KEY disponível)
async function gerarImagemDalle(prompt, openaiKey) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024', quality: 'standard' })
  })
  if (!res.ok) throw new Error(`DALL-E 3 ${res.status}: ${await res.text()}`)
  const json = await res.json()
  return json.data?.[0]?.url || null
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

  const falKey    = process.env.FAL_API_KEY
  const elevenKey = process.env.ELEVENLABS_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  if (!falKey)    return res.status(500).json({ error: 'FAL_API_KEY não configurada' })
  if (!elevenKey) return res.status(500).json({ error: 'ELEVENLABS_API_KEY não configurada' })

  const prompt = roteiros.imagemPrompt ||
    'Aerial view of modern Brazilian real estate development, coastal city, professional sober palette, dark overlay, cinematic photography'

  const resultado = {}

  // 1. Imagem: Fal.ai (primário) + DALL-E 3 (se disponível)
  await Promise.allSettled([
    gerarImagemFal(prompt, falKey).then(url => { resultado.imagemFal = url }),
    openaiKey
      ? gerarImagemDalle(prompt, openaiKey).then(url => { resultado.imagemDalle = url })
      : Promise.resolve()
  ]).then(results => {
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        if (i === 0) resultado.imagemFalErro = r.reason?.message
        if (i === 1) resultado.imagemDalleErro = r.reason?.message
      }
    })
  })

  // Melhor imagem = Fal.ai (padrão) — se ambas disponíveis, retorna as duas para o usuário escolher
  resultado.imagemUrl = resultado.imagemFal || resultado.imagemDalle || null

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
