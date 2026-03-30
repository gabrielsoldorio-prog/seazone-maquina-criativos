/**
 * API: /api/gerar-video
 * POST { prompt } → { requestId }
 * GET  ?requestId=xxx → { status, url? }
 *
 * Usa Fal.ai Kling Video via fila (queue).
 */

const MODEL = 'fal-ai/kling-video/v1.6/standard/text-to-video'

export const config = { maxDuration: 10 }

export default async function handler(req, res) {
  const falKey = process.env.FAL_KEY
  if (!falKey) return res.status(500).json({ erro: 'FAL_KEY não configurada' })

  // ── POST: submete job ────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { prompt } = req.body || {}
    if (!prompt) return res.status(400).json({ erro: 'prompt é obrigatório' })

    try {
      const r = await fetch(`https://queue.fal.run/${MODEL}`, {
        method: 'POST',
        headers: { 'Authorization': `Key ${falKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, duration: '5', aspect_ratio: '9:16' }),
      })
      const raw = await r.text()
      if (!r.ok) throw new Error(`Fal.ai ${r.status}: ${raw.slice(0, 200)}`)
      const data = JSON.parse(raw)
      return res.status(200).json({ requestId: data.request_id })
    } catch (e) {
      return res.status(500).json({ erro: e.message })
    }
  }

  // ── GET: checa status ────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { requestId } = req.query
    if (!requestId) return res.status(400).json({ erro: 'requestId é obrigatório' })

    try {
      const r = await fetch(
        `https://queue.fal.run/${MODEL}/requests/${requestId}/status`,
        { headers: { 'Authorization': `Key ${falKey}` } }
      )
      const data = await r.json()

      if (data.status === 'COMPLETED') {
        const rr = await fetch(
          `https://queue.fal.run/${MODEL}/requests/${requestId}`,
          { headers: { 'Authorization': `Key ${falKey}` } }
        )
        const result = await rr.json()
        return res.status(200).json({ status: 'COMPLETED', url: result.video?.url || null })
      }

      if (data.status === 'FAILED') {
        return res.status(200).json({ status: 'FAILED' })
      }

      return res.status(200).json({ status: data.status || 'IN_QUEUE' })
    } catch (e) {
      return res.status(500).json({ erro: e.message })
    }
  }

  return res.status(405).json({ erro: 'Método não permitido' })
}
