/**
 * Helper para chamar a API do Groq (compatível com OpenAI).
 * Modelo: llama-3.3-70b-versatile
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL    = 'llama-3.3-70b-versatile'

/**
 * @param {object} opts
 * @param {string}  opts.systemPrompt     — instrução de sistema (opcional)
 * @param {string}  opts.userPrompt       — mensagem do usuário
 * @param {string}  opts.geminiKey        — GROQ_API_KEY
 * @param {number}  [opts.maxOutputTokens=2048]
 * @param {boolean} [opts.jsonMode=false] — response_format json_object
 * @returns {Promise<string>}             — texto bruto da resposta
 */
export async function callGemini({
  systemPrompt,
  userPrompt,
  geminiKey,
  maxOutputTokens = 2048,
  jsonMode = false,
}) {
  const messages = []
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
  messages.push({ role: 'user', content: userPrompt })

  const body = {
    model: MODEL,
    max_tokens: maxOutputTokens,
    messages,
  }

  if (jsonMode) body.response_format = { type: 'json_object' }

  const res = await fetch(GROQ_URL, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${geminiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(body),
  })

  const raw = await res.text()
  if (!res.ok) throw new Error(`Groq ${res.status}: ${raw.slice(0, 300)}`)

  let json
  try { json = JSON.parse(raw) } catch {
    throw new Error(`Groq resposta não é JSON: ${raw.slice(0, 200)}`)
  }

  const text = json.choices?.[0]?.message?.content
  if (text == null) throw new Error(`Groq retornou resposta vazia: ${raw.slice(0, 300)}`)

  return text
}
