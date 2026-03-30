/**
 * Helper para chamar a API do Google Gemini diretamente.
 * Modelo: gemini-2.0-flash
 */

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'

/**
 * @param {object} opts
 * @param {string}  opts.systemPrompt     — instrução de sistema (opcional)
 * @param {string}  opts.userPrompt       — mensagem do usuário
 * @param {string}  opts.geminiKey        — GEMINI_API_KEY
 * @param {number}  [opts.maxOutputTokens=2048]
 * @param {boolean} [opts.jsonMode=false] — define responseMimeType application/json
 * @returns {Promise<string>}             — texto bruto da resposta
 */
export async function callGemini({
  systemPrompt,
  userPrompt,
  geminiKey,
  maxOutputTokens = 2048,
  jsonMode = false,
}) {
  const body = {
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: { maxOutputTokens },
  }

  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] }
  }

  if (jsonMode) {
    body.generationConfig.responseMimeType = 'application/json'
  }

  const res = await fetch(GEMINI_URL, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'x-goog-api-key': geminiKey,
    },
    body: JSON.stringify(body),
  })

  const raw = await res.text()
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${raw.slice(0, 300)}`)

  let json
  try { json = JSON.parse(raw) } catch {
    throw new Error(`Gemini resposta não é JSON: ${raw.slice(0, 200)}`)
  }

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text
  if (text == null) throw new Error(`Gemini retornou resposta vazia: ${raw.slice(0, 300)}`)

  return text
}
