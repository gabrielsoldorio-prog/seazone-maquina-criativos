/**
 * Composição de estático via Sharp — 100% programático
 * Foto do Drive como fundo + SVG overlay + logo Seazone local
 */

import sharp from 'sharp'
import fs    from 'fs'
import path  from 'path'

// ── Drive IDs (Novo Campeche SPOT II) ────────────────────────────────────
const DRIVE = {
  // Foto aérea com badge "NOVO CAMPECHE II / SPOT" já posicionado
  tagPhoto:   '1PcU22f3-12-TlBcd1le6zoqxQl9zsMdC',
  // Foto drone com praia visível (miniatura "Acesso à praia")
  praiaThumb: '1wgiWhkevUfDKrOK8sWZs_2qYGWH3604b',
}

// ── Canvas ────────────────────────────────────────────────────────────────
const W       = 1080
const H       = 1350
const PHOTO_H = Math.round(H * 0.62)   // 837px — zona foto (62%)
const DARK_Y  = PHOTO_H                 // 837px
const DARK_H  = H - PHOTO_H            // 513px
const CORAL   = '#E8533A'
const DARK_BG = { r: 17, g: 17, b: 24, alpha: 1 }

// ── Posições fixas (calibradas para TAG do Novo Campeche após crop 1080×837)
const THUMB_X = 50, THUMB_Y = 50, THUMB_W = 180, THUMB_H = 140
const PILL_Y  = THUMB_Y + THUMB_H + 6    // 196
const PILL_H  = 28
const BEACH_X = 660, BEACH_Y = 85        // ponto de chegada do tracejado
const DPIN_DRAW_X = 370, DPIN_DRAW_Y = 356   // saída do tracejado (borda do badge)
const BAR_H   = 66
const BAR_MID_Y = DARK_Y + BAR_H / 2     // 870

// ── Layout zona escura ────────────────────────────────────────────────────
const ROW2_Y   = DARK_Y + BAR_H + 12     // 915
const BADGE_LX = 40, BADGE_LY = ROW2_Y + 3
const BADGE_LW = 155, BADGE_LH = 34
const COPY_X   = BADGE_LX + BADGE_LW + 14  // 209
const COPY_Y1  = ROW2_Y + 16             // 931
const COPY_Y2  = ROW2_Y + 42             // 957

const FIN_TOP  = ROW2_Y + 82             // 997
const NUM_BASE = FIN_TOP + 100           // 1097
const NUM_FS   = 108

const AO_X  = 372, AO_Y  = NUM_BASE - 60  // 1037
const ANO_X = 372, ANO_Y = NUM_BASE - 28  // 1069
const AO_FS = 21
const DIV_X = AO_X + 42                  // 414
const RET_X = DIV_X + 16                 // 430
const RET_Y1 = AO_Y                      // 1037
const RET_Y2 = ANO_Y                     // 1069
const RL_X  = RET_X + 26                 // 456
const RL_W  = 182
const RL_RY = RET_Y1 - 19               // 1018

const DISC_FS = 14
const DISC_LH = 20
const DISC_Y  = NUM_BASE + 50            // 1147

// ── Helpers ───────────────────────────────────────────────────────────────

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

async function baixar(url, label = '') {
  console.log(`[sharp-estatico] baixando ${label || url.slice(0, 60)}...`)
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!r.ok) throw new Error(`HTTP ${r.status} ao baixar ${label || url}`)
  const buf = Buffer.from(await r.arrayBuffer())
  console.log(`[sharp-estatico] ${label || 'arquivo'}: ${Math.round(buf.length / 1024)}KB`)
  return buf
}

/**
 * Parseia textoDaArte para extrair copy lines e dado financeiro.
 * textoDaArte pode ser multi-linha (com \n) ou bloco de texto.
 */
function parsearTexto(textoDaArte) {
  const raw = textoDaArte || ''

  // Dado financeiro: "16,4%" ou "16.4%"
  const matchPct = raw.match(/(\d+[,\.]\d+)\s*%/)
  const dadoFinanceiro = matchPct ? `${matchPct[1].replace('.', ',')}%` : null

  // Linhas de copy: exclui PIN, "LANÇAMENTO", linhas com dado financeiro
  const linhas = raw
    .split('\n')
    .map(l => l.trim())
    .filter(l =>
      l.length > 0 &&
      !l.includes('(pin)') &&
      !/lan[çc]amento/i.test(l) &&
      !l.match(/\d+[,\.]\d+\s*%/) &&
      !l.match(/R\$\s*[\d\.]+/)
    )

  return {
    copy1: linhas[0] || '',
    copy2: linhas[1] || '',
    dadoFinanceiro,
  }
}

// ── SVG overlay ───────────────────────────────────────────────────────────

function buildSVG({ pin, badge, copy1, copy2, dadoFinanceiro }) {
  const tracejado = `M ${DPIN_DRAW_X} ${DPIN_DRAW_Y} C 430,280 560,180 ${BEACH_X} ${BEACH_Y}`
  const dado = dadoFinanceiro || '—'

  const disc = [
    '*Este material tem caráter exclusivamente informativo e não constitui uma promessa de rentabilidade futura ou garantia de retorno',
    'financeiro. Os resultados dependem da performance do empreendimento após sua conclusão, especialmente da futura valorização',
    'patrimonial do imóvel e da renda gerada por sua eventual locação. A Seazone não oferece garantia de rendimento fixo, retorno',
    'mínimo ou qualquer tipo de remuneração automática sobre o capital investido.',
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <style>text { font-family: Arial, Helvetica, sans-serif; }</style>
  <marker id="arr" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
    <polygon points="0 0, 7 2.5, 0 5" fill="white" opacity="0.8"/>
  </marker>
  <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"   stop-color="#111118" stop-opacity="0"/>
    <stop offset="100%" stop-color="#111118" stop-opacity="1"/>
  </linearGradient>
</defs>

<!-- Blend foto → zona escura -->
<rect x="0" y="${PHOTO_H - 60}" width="${W}" height="60" fill="url(#fg)"/>

<!-- Borda miniatura (imagem inserida via composite) -->
<rect x="${THUMB_X - 3}" y="${THUMB_Y - 3}" width="${THUMB_W + 6}" height="${THUMB_H + 6}" rx="7" fill="none" stroke="white" stroke-width="2.8"/>

<!-- Pill "Acesso à praia" -->
<rect x="${THUMB_X}" y="${PILL_Y}" width="${THUMB_W}" height="${PILL_H}" rx="${PILL_H / 2}" fill="white" opacity="0.93"/>
<text x="${THUMB_X + THUMB_W / 2}" y="${PILL_Y + 19}" font-size="12" font-weight="600" fill="#111" text-anchor="middle">Acesso à praia →</text>

<!-- Seta pill → praia -->
<line x1="${THUMB_X + THUMB_W + 4}" y1="${PILL_Y + PILL_H / 2}" x2="${BEACH_X - 20}" y2="${BEACH_Y}"
      stroke="white" stroke-width="1.6" opacity="0.75" marker-end="url(#arr)"/>

<!-- Tracejado pontilhado badge → praia -->
<path d="${tracejado}" fill="none" stroke="white" stroke-width="2.6"
      stroke-dasharray="7,5" stroke-linecap="round" opacity="0.88"/>

<!-- Ponto de chegada na praia -->
<circle cx="${BEACH_X}" cy="${BEACH_Y}" r="7" fill="white" opacity="0.9"/>
<circle cx="${BEACH_X}" cy="${BEACH_Y}" r="3.5" fill="${CORAL}"/>

<!-- ── Zona escura ── -->
<line x1="0" y1="${DARK_Y}" x2="${W}" y2="${DARK_Y}" stroke="white" stroke-width="0.7" opacity="0.18"/>

<!-- Pin localização -->
<circle cx="40" cy="${BAR_MID_Y - 7}" r="9" fill="${CORAL}"/>
<polygon points="31,${BAR_MID_Y - 1} 49,${BAR_MID_Y - 1} 40,${BAR_MID_Y + 10}" fill="${CORAL}"/>
<circle cx="40" cy="${BAR_MID_Y - 8}" r="4" fill="white"/>
<text x="58" y="${BAR_MID_Y + 6}" font-size="15" fill="white">${esc(pin)}</text>

<!-- Separador barra -->
<line x1="0" y1="${DARK_Y + BAR_H}" x2="${W}" y2="${DARK_Y + BAR_H}" stroke="white" stroke-width="0.5" opacity="0.1"/>

<!-- Badge LANÇAMENTO -->
<rect x="${BADGE_LX}" y="${BADGE_LY}" width="${BADGE_LW}" height="${BADGE_LH}" rx="4" fill="#161620" stroke="white" stroke-width="1.2"/>
<text x="${BADGE_LX + BADGE_LW / 2}" y="${BADGE_LY + 22}" font-size="12.5" font-weight="700" fill="white" text-anchor="middle" letter-spacing="2">${esc(badge)}</text>

<!-- Copy linha 1 -->
<text x="${COPY_X}" y="${COPY_Y1}" font-size="17" fill="white">${esc(copy1)}</text>
<!-- Copy linha 2 -->
<text x="${COPY_X}" y="${COPY_Y2}" font-size="17" fill="white">${esc(copy2)}</text>

<!-- Dado financeiro grande -->
<text x="40" y="${NUM_BASE}" font-size="${NUM_FS}" font-weight="800" fill="${CORAL}">${esc(dado)}</text>

<!-- "ao" -->
<text x="${AO_X}" y="${AO_Y}" font-size="${AO_FS}" fill="white">ao</text>
<!-- "ano" (separado) -->
<text x="${ANO_X}" y="${ANO_Y}" font-size="${AO_FS}" fill="white">ano</text>

<!-- Divider vertical -->
<line x1="${DIV_X}" y1="${FIN_TOP + 14}" x2="${DIV_X}" y2="${NUM_BASE + 8}" stroke="white" stroke-width="0.8" opacity="0.22"/>

<!-- "de retorno líquido" -->
<text x="${RET_X}" y="${RET_Y1}" font-size="18" fill="white">de</text>
<rect x="${RL_X}" y="${RL_RY}" width="${RL_W}" height="24" rx="3" fill="${CORAL}" opacity="0.92"/>
<text x="${RL_X + 5}" y="${RET_Y1}" font-size="17" font-weight="700" fill="white">retorno líquido</text>

<!-- "com aluguel por temporada" -->
<text x="${RET_X}" y="${RET_Y2}" font-size="18" fill="white">com <tspan font-weight="700">aluguel por temporada</tspan></text>

<!-- Disclaimer -->
${disc.map((l, i) => `<text x="22" y="${DISC_Y + i * DISC_LH}" font-size="${DISC_FS}" fill="rgba(255,255,255,0.48)">${esc(l)}</text>`).join('\n')}

</svg>`
}

// ── Export principal ───────────────────────────────────────────────────────

/**
 * Gera imagem estática no estilo Seazone para Novo Campeche SPOT II.
 *
 * @param {object} params
 * @param {string} params.nomeEmpreendimento
 * @param {string} params.pin             — ex: "Novo Campeche, Florianópolis - SC"
 * @param {string} params.badge           — ex: "LANÇAMENTO"
 * @param {string} params.textoDaArte     — bloco de copy gerado pelo agente
 * @returns {Promise<string>}             — data URL base64 PNG
 */
export async function gerarEstaticoSharp({
  nomeEmpreendimento = '',
  pin = '',
  badge = 'LANÇAMENTO',
  textoDaArte = '',
}) {
  console.log('[sharp-estatico] ▶ nomeEmpreendimento:', nomeEmpreendimento)

  // 1. Foto de fundo (TAG foto com badge já posicionado)
  const fotoBuf  = await baixar(`https://drive.google.com/thumbnail?id=${DRIVE.tagPhoto}&sz=w2048`, 'foto TAG')
  const fotoCrop = await sharp(fotoBuf)
    .resize(W, PHOTO_H, { fit: 'cover', position: 'centre' })
    .toBuffer()

  // 2. Thumbnail praia
  const thumbBuf = await baixar(`https://drive.google.com/thumbnail?id=${DRIVE.praiaThumb}&sz=w400`, 'thumb praia')
  const thumb    = await sharp(thumbBuf)
    .resize(THUMB_W, THUMB_H, { fit: 'cover', position: 'centre' })
    .toBuffer()

  // 3. Logo Seazone (commitado em public/)
  const logoPath = path.join(process.cwd(), 'public', 'logo-seazone.png')
  const logoRaw  = fs.readFileSync(logoPath)
  const logoMeta = await sharp(logoRaw).metadata()
  const LOGO_H_PX = 44
  const LOGO_W_PX = Math.round(logoMeta.width * (LOGO_H_PX / logoMeta.height))
  const logo     = await sharp(logoRaw)
    .resize(LOGO_W_PX, LOGO_H_PX, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  const LOGO_X = W - LOGO_W_PX - 24
  const LOGO_Y = DARK_Y + Math.round((BAR_H - LOGO_H_PX) / 2)
  console.log(`[sharp-estatico] logo: ${LOGO_W_PX}×${LOGO_H_PX}px @ (${LOGO_X}, ${LOGO_Y})`)

  // 4. Parseia copy e dado financeiro
  const { copy1, copy2, dadoFinanceiro } = parsearTexto(textoDaArte)
  console.log(`[sharp-estatico] copy1: "${copy1}" | copy2: "${copy2}" | dado: ${dadoFinanceiro}`)

  // 5. Canvas base: foto + zona escura
  const base = await sharp(fotoCrop)
    .extend({ bottom: DARK_H, background: DARK_BG })
    .toBuffer()

  // 6. SVG overlay
  const svg = Buffer.from(buildSVG({ pin, badge, copy1, copy2, dadoFinanceiro }))

  // 7. Composite final
  const result = await sharp(base)
    .composite([
      { input: svg,   top: 0,       left: 0      },
      { input: thumb, top: THUMB_Y, left: THUMB_X },
      { input: logo,  top: LOGO_Y,  left: LOGO_X  },
    ])
    .png({ compressionLevel: 8 })
    .toBuffer()

  console.log(`[sharp-estatico] ✓ PNG: ${Math.round(result.length / 1024)}KB`)
  return `data:image/png;base64,${result.toString('base64')}`
}
