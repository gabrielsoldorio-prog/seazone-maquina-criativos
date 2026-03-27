/**
 * API: /api/compor-estatico
 * Composição de imagem estática via Sharp (100% programático).
 * Recebe os dados da composição e retorna a imagem como base64 PNG.
 */

import { gerarEstaticoSharp } from '../../lib/sharp-estatico'

export const config = { api: { responseLimit: '12mb' }, maxDuration: 120 }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' })
  }

  const { composicao } = req.body
  if (!composicao) {
    return res.status(400).json({ erro: 'Campo "composicao" é obrigatório' })
  }

  const {
    pin                = '',
    badge              = 'LANÇAMENTO',
    textoDaArte        = '',
    nomeEmpreendimento = '',
  } = composicao

  console.log('[compor-estatico] iniciando composição Sharp')
  console.log('[compor-estatico] empreendimento:', nomeEmpreendimento)
  console.log('[compor-estatico] pin:', pin)

  try {
    const imagemUrl = await gerarEstaticoSharp({
      nomeEmpreendimento,
      pin,
      badge,
      textoDaArte,
    })

    console.log('[compor-estatico] composição concluída, retornando base64')
    return res.status(200).json({
      imagemUrl,
      metodo: 'sharp',
    })
  } catch (err) {
    console.error('[compor-estatico] ERRO:', err.message)
    return res.status(500).json({
      erro: err.message,
      detalhe: err.stack?.split('\n')[1] || '',
    })
  }
}
