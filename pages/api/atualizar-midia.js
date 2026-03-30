/**
 * API: /api/atualizar-midia
 * Atualiza um material (estático, narrado ou apresentadora) com base em feedback/pins.
 *
 * Para estáticos: interpreta os pins como instruções Sharp e recompõe a imagem.
 * Para áudios: refina a locução e gera novo áudio via ElevenLabs.
 */

import { gerarEstaticoSharp } from '../../lib/sharp-estatico'
import { callGemini }         from '../../lib/gemini'

export const config = {
  api: { responseLimit: '12mb' },
  maxDuration: 120,
}

const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'

// ─── ElevenLabs TTS ───────────────────────────────────────────────────────

async function gerarAudio(texto, elevenKey) {
  console.log('[atualizar-midia] ElevenLabs TTS...')
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method:  'POST',
    headers: {
      'xi-api-key':   elevenKey,
      'Content-Type': 'application/json',
      'Accept':       'audio/mpeg',
    },
    body: JSON.stringify({
      text: texto,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.45, similarity_boost: 0.80, style: 0.3, use_speaker_boost: true },
    }),
  })

  const raw = await res.text()
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${raw.slice(0, 200)}`)

  const buf = Buffer.from(raw, 'binary')
  return `data:audio/mpeg;base64,${buf.toString('base64')}`
}

// ─── Claude: interpreta pins → parâmetros Sharp ────────────────────────────
//
// Os "pins com comentários" chegam como texto livre (ex: "copy muito longa",
// "trocar 16,4% por 18,2%", "pin: Campeche, Florianópolis - SC").
// Claude interpreta e retorna os campos atualizados para gerarEstaticoSharp.

async function parsearPinsParaSharp(composicaoOriginal, feedback, geminiKey) {
  console.log('[atualizar-midia] interpretando pins com Gemini...')

  const systemPrompt = `Você é um assistente que interpreta feedback e pins de revisão sobre um criativo estático Seazone.
Dado os parâmetros originais e o feedback do usuário, retorne APENAS um JSON com os parâmetros atualizados.

Campos disponíveis:
- nomeEmpreendimento: nome do empreendimento (string)
- pin: texto da localização na barra inferior (ex: "Novo Campeche, Florianópolis - SC")
- badge: texto do badge (normalmente "LANÇAMENTO")
- textoDaArte: bloco de copy completo, incluindo headline e dado financeiro (ex: "16,4%")

Regras:
- Altere APENAS os campos mencionados no feedback
- Mantenha os demais iguais ao original
- O dado financeiro deve estar embutido em textoDaArte (ex: "16,4% ao ano de retorno líquido com aluguel por temporada")
- Responda SOMENTE com o JSON, sem explicações`

  const userPrompt = `Parâmetros originais da composição:
${JSON.stringify(composicaoOriginal, null, 2)}

Feedback / pins do usuário:
${feedback}

Retorne os parâmetros atualizados em JSON:`

  const content = await callGemini({ systemPrompt, userPrompt, geminiKey, maxOutputTokens: 600, jsonMode: true })
  console.log('[atualizar-midia] Gemini retornou:', content.slice(0, 200))

  const match = content.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(`Claude não retornou JSON: ${content.slice(0, 200)}`)

  let params
  try { params = JSON.parse(match[0]) } catch (e) {
    throw new Error(`JSON dos parâmetros malformado: ${e.message}`)
  }

  return params
}

// ─── Claude: refina locução com feedback ─────────────────────────────────

async function refinarLocucao(locucaoOriginal, feedback, geminiKey) {
  console.log('[atualizar-midia] refinando locução com Gemini...')

  const systemPrompt = `Você é um especialista em criativos de performance para a Seazone.
Dado uma locução original e um feedback, gere a locução melhorada em português.
Regras Seazone: sem termos proibidos, sufixo "com aluguel por temporada" em dados financeiros, PIN de localização no início.
Responda APENAS com o texto da locução melhorada, sem explicações.`

  const userPrompt = `Locução original:\n${locucaoOriginal}\n\nFeedback:\n${feedback}\n\nLocução melhorada:`

  return callGemini({ systemPrompt, userPrompt, geminiKey, maxOutputTokens: 600 })
}

// ─── Handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  try {
    return await _handler(req, res)
  } catch (err) {
    console.error('[atualizar-midia] ERRO NÃO CAPTURADO:', err.message)
    return res.status(500).json({ erro: err.message, detalhe: err.stack?.split('\n')[1] || '' })
  }
}

async function _handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' })
  }

  const {
    tipo,
    feedback,
    composicao,        // parâmetros originais da composição Sharp (estático)
    promptOriginal,    // fallback: textoDaArte anterior (compatibilidade)
    locucaoOriginal,   // para tipo narrado/apresentadora
  } = req.body

  if (!tipo)     return res.status(400).json({ erro: 'tipo é obrigatório (estatico | narrado | apresentadora)' })
  if (!feedback) return res.status(400).json({ erro: 'feedback é obrigatório' })

  const elevenKey = process.env.ELEVENLABS_API_KEY
  const geminiKey = process.env.GROQ_API_KEY

  if (!geminiKey) return res.status(500).json({ erro: 'GROQ_API_KEY não configurada' })

  console.log('[atualizar-midia] ▶ tipo:', tipo)
  console.log('[atualizar-midia] feedback:', feedback.slice(0, 120))

  // ── ESTÁTICO: recompõe via Sharp com pins interpretados ────────────────
  if (tipo === 'estatico') {
    // Composição base: usa composicao se enviada, senão monta do promptOriginal
    const composicaoBase = composicao || {
      nomeEmpreendimento: '',
      pin:                '',
      badge:              'LANÇAMENTO',
      textoDaArte:        promptOriginal || '',
    }

    console.log('[atualizar-midia] composicaoBase:', JSON.stringify(composicaoBase).slice(0, 200))

    // Interpreta os pins como instruções para atualizar os campos Sharp
    const composicaoAtualizada = await parsearPinsParaSharp(composicaoBase, feedback, geminiKey)

    // Garante que campos obrigatórios existem (fallback para base)
    const composicaoFinal = {
      nomeEmpreendimento: composicaoAtualizada.nomeEmpreendimento ?? composicaoBase.nomeEmpreendimento,
      pin:                composicaoAtualizada.pin                ?? composicaoBase.pin,
      badge:              composicaoAtualizada.badge              ?? composicaoBase.badge,
      textoDaArte:        composicaoAtualizada.textoDaArte        ?? composicaoBase.textoDaArte,
    }

    console.log('[atualizar-midia] composicaoFinal:', JSON.stringify(composicaoFinal).slice(0, 200))

    const novaImagem = await gerarEstaticoSharp(composicaoFinal)

    return res.status(200).json({
      imagemUrl:         novaImagem,
      composicaoUsada:   composicaoFinal,
    })
  }

  // ── ÁUDIO (narrado / apresentadora) ───────────────────────────────────
  if (tipo === 'narrado' || tipo === 'apresentadora') {
    if (!elevenKey) return res.status(500).json({ erro: 'ELEVENLABS_API_KEY não configurada' })

    const locucaoRefinada = await refinarLocucao(locucaoOriginal || '', feedback, geminiKey)
    const novoAudio       = await gerarAudio(locucaoRefinada, elevenKey)

    return res.status(200).json({
      audio:        novoAudio,
      locucaoUsada: locucaoRefinada,
    })
  }

  return res.status(400).json({ erro: `tipo inválido: ${tipo}` })
}
