export const config = {
  api: { responseLimit: '10mb' },
  maxDuration: 60
}

const VOICE_ID = '21m00Tcm4TlvDq8ikWAM' // Rachel — ElevenLabs multilingual

// ─── Fal.ai: gerar imagem ──────────────────────────────────────────────────
async function gerarImagem(prompt, falKey) {
  const submitRes = await fetch('https://queue.fal.run/fal-ai/flux/schnell', {
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

  if (!submitRes.ok) {
    throw new Error(`Fal.ai submit ${submitRes.status}: ${await submitRes.text()}`)
  }

  const { request_id } = await submitRes.json()

  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 3000))

    const statusRes = await fetch(
      `https://queue.fal.run/fal-ai/flux/schnell/requests/${request_id}`,
      { headers: { 'Authorization': `Key ${falKey}` } }
    )

    if (!statusRes.ok) continue
    const result = await statusRes.json()

    if (result.status === 'COMPLETED') {
      return result.output?.images?.[0]?.url || null
    }
    if (result.status === 'FAILED') {
      throw new Error('Fal.ai falhou: ' + JSON.stringify(result))
    }
  }

  throw new Error('Fal.ai timeout: imagem não concluída em 60s')
}

// ─── ElevenLabs: gerar áudio ──────────────────────────────────────────────
async function gerarAudio(texto, elevenKey) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': elevenKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: texto,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.80,
          style: 0.3,
          use_speaker_boost: true
        }
      })
    }
  )

  if (!res.ok) {
    throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`)
  }

  const buffer = Buffer.from(await res.arrayBuffer())
  return `data:audio/mpeg;base64,${buffer.toString('base64')}`
}

// ─── Extrai locução de um array de cenas ──────────────────────────────────
function extrairLocucao(cenas) {
  if (!Array.isArray(cenas)) return ''
  return cenas.map(c => c.locucao || '').filter(Boolean).join('\n\n')
}

// ─── Handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const { roteiros } = req.body

  if (!roteiros?.materiais) {
    return res.status(400).json({ error: 'roteiros inválidos ou ausentes' })
  }

  const falKey = process.env.FAL_API_KEY
  const elevenKey = process.env.ELEVENLABS_API_KEY

  if (!falKey)    return res.status(500).json({ error: 'FAL_API_KEY não configurada' })
  if (!elevenKey) return res.status(500).json({ error: 'ELEVENLABS_API_KEY não configurada' })

  const resultado = {}

  // 1. Imagem estática via Fal.ai
  const imagemPrompt = roteiros.imagemPrompt ||
    `Aerial view of a modern Brazilian real estate development, coastal city, sober professional palette, dark overlay, cinematic real estate photography`

  try {
    resultado.imagemUrl = await gerarImagem(imagemPrompt, falKey)
  } catch (err) {
    console.error('Fal.ai erro:', err.message)
    resultado.imagemUrl = null
    resultado.imagemErro = err.message
  }

  // 2. Áudio vídeo narrado (estrutura 1)
  const cenasNarrado = roteiros.materiais?.videoNarrado?.[0]?.cenas || []
  const textoNarrado = extrairLocucao(cenasNarrado)

  if (textoNarrado) {
    try {
      resultado.narradoAudio = await gerarAudio(textoNarrado, elevenKey)
    } catch (err) {
      console.error('ElevenLabs narrado erro:', err.message)
      resultado.narradoAudio = null
      resultado.narradoErro = err.message
    }
  }

  // 3. Áudio vídeo com apresentadora (estrutura 1)
  const cenasApresentadora = roteiros.materiais?.videoApresentadora?.[0]?.cenas || []
  const textoApresentadora = extrairLocucao(cenasApresentadora)

  if (textoApresentadora) {
    try {
      resultado.apresentadoraAudio = await gerarAudio(textoApresentadora, elevenKey)
    } catch (err) {
      console.error('ElevenLabs apresentadora erro:', err.message)
      resultado.apresentadoraAudio = null
      resultado.apresentadoraErro = err.message
    }
  }

  return res.status(200).json(resultado)
}
