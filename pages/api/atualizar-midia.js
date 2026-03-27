export const config = {
  api: { responseLimit: '10mb' },
  maxDuration: 60
}

const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'

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
    if (result.status === 'FAILED') throw new Error('Fal.ai falhou')
  }
  throw new Error('Fal.ai timeout')
}

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

async function refinarPromptComFeedback(promptOriginal, feedback, locucaoOriginal, tipo, openrouterKey) {
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
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em criativos de performance para a Seazone.
Dado um material original e um feedback, gere uma versão melhorada.
Para imagens: retorne um novo prompt em inglês otimizado.
Para áudios: retorne o novo texto da locução em português, mantendo as regras Seazone (termos proibidos, sufixo "com aluguel por temporada", PIN de localização).
Responda APENAS com o texto refinado, sem explicações.`
        },
        {
          role: 'user',
          content: tipo === 'estatico'
            ? `Prompt original da imagem:\n${promptOriginal}\n\nFeedback:\n${feedback}\n\nGere um prompt melhorado em inglês:`
            : `Locução original:\n${locucaoOriginal}\n\nFeedback:\n${feedback}\n\nGere a locução melhorada em português:`
        }
      ]
    })
  })

  if (!response.ok) throw new Error(`OpenRouter ${response.status}`)
  const json = await response.json()
  return json.choices?.[0]?.message?.content?.trim() || ''
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { tipo, feedback, promptOriginal, locucaoOriginal, estrutura } = req.body

  if (!tipo) return res.status(400).json({ error: 'tipo é obrigatório (estatico | narrado | apresentadora)' })
  if (!feedback) return res.status(400).json({ error: 'feedback é obrigatório' })

  const falKey       = process.env.FAL_API_KEY
  const elevenKey    = process.env.ELEVENLABS_API_KEY
  const openrouterKey = process.env.ANTHROPIC_API_KEY

  try {
    // 1. Refinar prompt/locução com base no feedback
    const refinado = await refinarPromptComFeedback(
      promptOriginal || '', feedback, locucaoOriginal || '', tipo, openrouterKey
    )

    if (tipo === 'estatico') {
      if (!falKey) throw new Error('FAL_API_KEY não configurada')
      const novaImagem = await gerarImagemFal(refinado, falKey)
      return res.status(200).json({ imagemUrl: novaImagem, promptUsado: refinado })
    }

    if (tipo === 'narrado' || tipo === 'apresentadora') {
      if (!elevenKey) throw new Error('ELEVENLABS_API_KEY não configurada')
      const novoAudio = await gerarAudio(refinado, elevenKey)
      return res.status(200).json({ audio: novoAudio, locucaoUsada: refinado })
    }

    return res.status(400).json({ error: `tipo inválido: ${tipo}` })
  } catch (err) {
    console.error('atualizar-midia erro:', err)
    return res.status(500).json({ error: err.message })
  }
}
