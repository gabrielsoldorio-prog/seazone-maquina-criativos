/**
 * GET /api/drive-imagens?folderId=FOLDER_ID
 * Retorna lista de imagens da pasta pública do Google Drive.
 * Tenta Drive API v3 primeiro (requer GOOGLE_DRIVE_API_KEY),
 * depois faz scraping do HTML da pasta compartilhada.
 */
export default async function handler(req, res) {
  const { folderId } = req.query
  if (!folderId) return res.status(400).json({ error: 'folderId obrigatório', imagens: [] })

  // ── Tentativa 1: Drive API v3 com chave ───────────────────────────────────
  const driveKey = process.env.GOOGLE_DRIVE_API_KEY
  if (driveKey) {
    try {
      const apiUrl = `https://www.googleapis.com/drive/v3/files?q=%27${folderId}%27+in+parents&fields=files(id,name,mimeType)&key=${driveKey}&pageSize=50`
      const r = await fetch(apiUrl, { headers: { Accept: 'application/json' } })
      if (r.ok) {
        const d = await r.json()
        const imagens = (d.files || [])
          .filter(f => /^image\//i.test(f.mimeType || ''))
          .map(f => ({ id: f.id, nome: f.name, url: thumbUrl(f.id) }))
        if (imagens.length) return res.status(200).json({ imagens })
      }
    } catch { /* continua para fallback */ }
  }

  // ── Tentativa 2: Scraping do HTML da pasta compartilhada ──────────────────
  try {
    const html = await fetch(`https://drive.google.com/drive/folders/${folderId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    }).then(r => r.text())

    const imagens = []
    const seen    = new Set()

    // Padrão A: ["NOME.jpg","FILE_ID" (Drive nested arrays)
    for (const m of html.matchAll(/\["([^"]*\.(?:jpg|jpeg|png|webp|JPG|JPEG|PNG))[^"]*","([A-Za-z0-9_-]{25,50})"/g)) {
      if (!seen.has(m[2])) { seen.add(m[2]); imagens.push({ id: m[2], nome: m[1], url: thumbUrl(m[2]) }) }
    }

    // Padrão B: "FILE_ID","NOME.ext" (ordem inversa)
    if (!imagens.length) {
      for (const m of html.matchAll(/"([A-Za-z0-9_-]{25,50})","([^"]*\.(?:jpg|jpeg|png|webp|JPG|JPEG|PNG))"/g)) {
        if (!seen.has(m[1])) { seen.add(m[1]); imagens.push({ id: m[1], nome: m[2], url: thumbUrl(m[1]) }) }
      }
    }

    // Padrão C: data-id nos nós de arquivo
    if (!imagens.length) {
      for (const m of html.matchAll(/data-id="([A-Za-z0-9_-]{25,50})"/g)) {
        if (!seen.has(m[1])) { seen.add(m[1]); imagens.push({ id: m[1], nome: '', url: thumbUrl(m[1]) }) }
      }
    }

    return res.status(200).json({ imagens: imagens.slice(0, 30) })
  } catch (err) {
    return res.status(500).json({ error: err.message, imagens: [] })
  }
}

function thumbUrl(id) {
  return `https://drive.google.com/thumbnail?id=${id}&sz=w1200`
}
