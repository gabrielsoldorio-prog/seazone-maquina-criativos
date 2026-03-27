/**
 * Helper para chamar a API do OpenRouter.
 * Modelo padrão: anthropic/claude-3-haiku
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL          = 'anthropic/claude-3-haiku'

/**
 * @param {object} opts
 * @param {string}  opts.systemPrompt     — instrução de sistema
 * @param {string}  opts.userPrompt       — mensagem do usuário
 * @param {string}  opts.openrouterKey    — OPENROUTER_API_KEY
 * @param {number}  [opts.maxTokens=2048]
 * @param {boolean} [opts.jsonMode=false] — response_format json_object
 * @returns {Promise<string>}             — texto bruto da resposta
 */
export async function callOpenRouter({
  systemPrompt,
  userPrompt,
  openrouterKey,
  maxTokens = 2048,
  jsonMode  = false,
}) {
  const messages = []
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
  messages.push({ role: 'user', content: userPrompt })

  const body = {
    model:      MODEL,
    max_tokens: maxTokens,
    messages,
  }

  if (jsonMode) body.response_format = { type: 'json_object' }

  const res = await fetch(OPENROUTER_URL, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${openrouterKey}`,
      'Content-Type':  'application/json',
      'HTTP-Referer':  'https://seazone.com.br',
      'X-Title':       'Seazone Máquina de Criativos',
    },
    body: JSON.stringify(body),
  })

  const raw = await res.text()
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${raw.slice(0, 300)}`)

  let json
  try { json = JSON.parse(raw) } catch {
    throw new Error(`OpenRouter resposta não é JSON: ${raw.slice(0, 200)}`)
  }

  const text = json.choices?.[0]?.message?.content
  if (text == null) throw new Error(`OpenRouter retornou resposta vazia: ${raw.slice(0, 300)}`)

  return text
}
