export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const { prompt } = req.body
  if (!prompt) return res.status(400).json({ error: 'Prompt é obrigatório' })

  const falKey = process.env.FAL_KEY
  if (!falKey) return res.status(500).json({ error: 'FAL_KEY não configurada' })

  try {
    const response = await fetch('https://fal.run/fal-ai/flux/dev', {
      method:  'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        num_images:  1,
        image_size:  'portrait_4_3',
      }),
    })

    const raw = await response.text()
    if (!response.ok) {
      return res.status(500).json({ error: `Fal.ai error ${response.status}: ${raw.slice(0, 200)}` })
    }

    let data
    try { data = JSON.parse(raw) } catch {
      return res.status(500).json({ error: 'Resposta inválida do Fal.ai' })
    }

    const imageUrl = data.images?.[0]?.url
    if (!imageUrl) return res.status(500).json({ error: 'Nenhuma imagem retornada' })

    return res.status(200).json({ imageUrl })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
