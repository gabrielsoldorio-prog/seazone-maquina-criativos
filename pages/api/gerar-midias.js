/**
 * API: /api/gerar-midias
 * Gera imagem estática (Sharp) + áudios narrado e apresentadora (ElevenLabs).
 * Todos os erros retornam JSON válido — nunca texto/HTML.
 */

import { gerarEstaticoSharp } from '../../lib/sharp-estatico'

export const config = {
  api: { responseLimit: '12mb' },
  maxDuration: 120,
}

const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'

// ─── Helpers ──────────────────────────────────────────────────────────────

function extrairLocucao(cenas) {
  return (cenas || []).map(c => c.locucao || '').filter(Boolean).join('\n\n')
}

// ─── ElevenLabs TTS ───────────────────────────────────────────────────────

async function gerarAudio(texto, elevenKey) {
  console.log('[gerar-midias] ElevenLabs TTS, texto:', texto.slice(0, 80) + '...')
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
  console.log('[gerar-midias] ElevenLabs status:', res.status, '— tamanho resposta:', raw.length)

  if (!res.ok) {
    throw new Error(`ElevenLabs ${res.status}: ${raw.slice(0, 200)}`)
  }

  // ElevenLabs retorna áudio binário, não JSON
  const buf = Buffer.from(raw, 'binary')
  return `data:audio/mpeg;base64,${buf.toString('base64')}`
}

// ─── Composição estático ──────────────────────────────────────────────────

async function gerarEstatico(roteiros) {
  const estatico   = roteiros.materiais?.estatico?.[0]
  const composicao = {
    nomeEmpreendimento: roteiros.empreendimento || '',
    pin:                roteiros.localizacao    || '',
    badge:              'LANÇAMENTO',
    textoDaArte:        estatico?.textoDaArte   || '',
  }

  console.log('[gerar-midias] gerarEstatico — empreendimento:', composicao.nomeEmpreendimento)
  console.log('[gerar-midias] textoDaArte (início):', composicao.textoDaArte.slice(0, 120))

  const imagemUrl = await gerarEstaticoSharp(composicao)
  return { imagemUrl, composicaoUsada: composicao }
}

// ─── Handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Garante que qualquer exceção inesperada ainda retorna JSON
  try {
    return await _handler(req, res)
  } catch (err) {
    console.error('[gerar-midias] ERRO NÃO CAPTURADO:', err.message, err.stack)
    return res.status(500).json({
      erro:    err.message,
      detalhe: err.stack?.split('\n')[1] || '',
    })
  }
}

async function _handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' })
  }

  const { roteiros } = req.body
  if (!roteiros?.materiais) {
    return res.status(400).json({ erro: 'Campo "roteiros" com "materiais" é obrigatório' })
  }

  const elevenKey = process.env.ELEVENLABS_API_KEY

  if (!elevenKey) return res.status(500).json({ erro: 'ELEVENLABS_API_KEY não configurada' })

  console.log('[gerar-midias] ▶ iniciando — empreendimento:', roteiros.empreendimento)

  const resultado = {}

  // 1. Imagem estática via Sharp
  try {
    console.log('[gerar-midias] 1/3 — gerando imagem estática (Sharp)...')
    const { imagemUrl, composicaoUsada } = await gerarEstatico(roteiros)
    resultado.imagemUrl       = imagemUrl
    resultado.composicaoUsada = composicaoUsada
    console.log('[gerar-midias] 1/3 ✓ imagem gerada')
  } catch (e) {
    console.error('[gerar-midias] 1/3 ✗ erro na imagem:', e.message)
    resultado.imagemErro = e.message
  }

  // 2. Áudio narrado (Estrutura 1)
  const textoNarrado = extrairLocucao(roteiros.materiais?.videoNarrado?.[0]?.cenas)
  if (textoNarrado) {
    try {
      console.log('[gerar-midias] 2/3 — gerando áudio narrado...')
      resultado.narradoAudio = await gerarAudio(textoNarrado, elevenKey)
      console.log('[gerar-midias] 2/3 ✓ áudio narrado gerado')
    } catch (e) {
      console.error('[gerar-midias] 2/3 ✗ erro no áudio narrado:', e.message)
      resultado.narradoErro = e.message
    }
  } else {
    console.log('[gerar-midias] 2/3 — sem texto narrado, pulando')
  }

  // 3. Áudio apresentadora (Estrutura 1)
  const textoApresentadora = extrairLocucao(roteiros.materiais?.videoApresentadora?.[0]?.cenas)
  if (textoApresentadora) {
    try {
      console.log('[gerar-midias] 3/3 — gerando áudio apresentadora...')
      resultado.apresentadoraAudio = await gerarAudio(textoApresentadora, elevenKey)
      console.log('[gerar-midias] 3/3 ✓ áudio apresentadora gerado')
    } catch (e) {
      console.error('[gerar-midias] 3/3 ✗ erro no áudio apresentadora:', e.message)
      resultado.apresentadoraErro = e.message
    }
  } else {
    console.log('[gerar-midias] 3/3 — sem texto apresentadora, pulando')
  }

  console.log('[gerar-midias] ✓ concluído — campos retornados:', Object.keys(resultado).join(', '))
  return res.status(200).json(resultado)
}
