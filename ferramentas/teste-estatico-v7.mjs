/**
 * Teste v7 — TAG photo como fundo (pin já na foto), tracejado + zona escura via Sharp
 * Uso: node --env-file=.env.local ferramentas/teste-estatico-v7.mjs
 */

import sharp from 'sharp'
import fs    from 'fs'
import path  from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.join(__dirname, '..')

// ═══════════════════════════════════════════════════════════════
// DIMENSÕES E CONSTANTES
// ═══════════════════════════════════════════════════════════════

const W       = 1080
const H       = 1350
const PHOTO_H = Math.round(H * 0.62)   // 837px — zona foto (62%)
const DARK_Y  = PHOTO_H                 // 837px — início zona escura
const DARK_H  = H - PHOTO_H            // 513px
const CORAL   = '#E8533A'
const DARK_BG = { r: 17, g: 17, b: 24, alpha: 1 }  // #111118

// ── Thumbnail "Acesso à praia" (canto superior esquerdo) ──────
const THUMB_X = 50,  THUMB_Y = 50
const THUMB_W = 180, THUMB_H = 140
const PILL_Y  = THUMB_Y + THUMB_H + 6   // 196
const PILL_H  = 28

// ── Posição do pin do SPOT na foto TAG após crop ──────────────
// TAG original: 2048×1152. Crop cover → 1080×837:
//   scale = 837/1152 = 0.7266, new_w = 1489, crop_left = 204
//   pin no original ≈ (750, 490) → cropped ≈ (340, 356)
const DPIN_X = 340, DPIN_Y = 356   // posição visual do pin na foto
const DPIN_DRAW_X = DPIN_X + 30   // deslocamento: tracejado sai da borda direita do badge

// ── Praia (ponto final do tracejado, topo da foto) ────────────
const BEACH_X = 660, BEACH_Y = 85

// ── Pill "Acesso à praia" sobre a miniatura ───────────────────
// Seta da pill → beach area
const ARR_SX = THUMB_X + THUMB_W + 4   // 234
const ARR_SY = PILL_Y + PILL_H / 2     // 210
const ARR_EX = BEACH_X - 20            // 640
const ARR_EY = BEACH_Y                 // 85

// ── Zona escura ───────────────────────────────────────────────
const BAR_H     = 66
const BAR_MID_Y = DARK_Y + BAR_H / 2      // 870

const ROW2_Y    = DARK_Y + BAR_H + 12     // 915
const BADGE_LX  = 40,  BADGE_LY = ROW2_Y + 3
const BADGE_LW  = 155, BADGE_LH = 34
const COPY_X    = BADGE_LX + BADGE_LW + 14  // 209
const COPY_Y1   = ROW2_Y + 16             // 931
const COPY_Y2   = ROW2_Y + 42             // 957

// Financeiro
const FIN_TOP   = ROW2_Y + 82            // 997
const NUM_BASE  = FIN_TOP + 100          // 1097  — baseline "16,4%"
const NUM_FS    = 108

// "ao" e "ano" — coluna imediatamente após "16,4%"
// "16,4%" a 108px começa em x=40, vai até ≈ x=365
const AO_X  = 372, AO_Y  = NUM_BASE - 60  // 1037
const ANO_X = 372, ANO_Y = NUM_BASE - 28  // 1069
const AO_FS = 21

// Divider vertical entre ao/ano e retorno
const DIV_X = AO_X + 42  // 414

// "de retorno líquido" e "com aluguel por temporada"
const RET_X  = DIV_X + 16  // 430
const RET_Y1 = AO_Y         // 1037 — mesmo baseline de "ao"
const RET_Y2 = ANO_Y        // 1069 — mesmo baseline de "ano"

// Coral rect atrás de "retorno líquido"
const RL_X  = RET_X + 26   // depois de "de " (~25px @ 18px font)
const RL_W  = 182           // largura estimada de "retorno líquido" em 18px bold
const RL_RY = RET_Y1 - 19  // topo do rect

// Disclaimer
const DISC_FS = 14
const DISC_LH = 20
const DISC_Y  = NUM_BASE + 50  // 1147

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

async function baixar(url, label) {
  process.stdout.write(`   ⬇  ${label}...`)
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!r.ok) throw new Error(`HTTP ${r.status} em ${label}`)
  const buf = Buffer.from(await r.arrayBuffer())
  console.log(` ${Math.round(buf.length/1024)}KB`)
  return buf
}

// ═══════════════════════════════════════════════════════════════
// SVG OVERLAY (sem pin e sem badge — já estão na foto)
// ═══════════════════════════════════════════════════════════════

function buildSVG() {
  // Bezier tracejado: borda do badge do SPOT → praia
  const tracejado = `M ${DPIN_DRAW_X} ${DPIN_Y} C 430,280 560,180 ${BEACH_X} ${BEACH_Y}`

  const disc = [
    '*Este material tem caráter exclusivamente informativo e não constitui uma promessa de rentabilidade futura ou garantia de retorno',
    'financeiro. Os resultados financeiros do investimento dependem da performance do empreendimento após sua conclusão, especialmente',
    'da futura valorização patrimonial do imóvel e da renda gerada por sua eventual locação. A Seazone não oferece garantia de',
    'rendimento fixo, retorno mínimo ou qualquer tipo de remuneração automática sobre o capital investido.',
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <style>text { font-family: Arial, Helvetica, sans-serif; }</style>
  <marker id="arr" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
    <polygon points="0 0, 7 2.5, 0 5" fill="white" opacity="0.8"/>
  </marker>
  <!-- Blend suave foto → zona escura -->
  <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"   stop-color="#111118" stop-opacity="0"/>
    <stop offset="100%" stop-color="#111118" stop-opacity="1"/>
  </linearGradient>
</defs>

<!-- ══ ZONA FOTO ════════════════════════════════════════════ -->

<!-- Blend suave na borda inferior da foto (60px) -->
<rect x="0" y="${PHOTO_H - 60}" width="${W}" height="60" fill="url(#fg)"/>

<!-- Borda branca da miniatura (a imagem thumb é inserida via sharp.composite) -->
<rect x="${THUMB_X - 3}" y="${THUMB_Y - 3}"
      width="${THUMB_W + 6}" height="${THUMB_H + 6}"
      rx="7" fill="none" stroke="white" stroke-width="2.8"/>

<!-- Pill "Acesso à praia →" abaixo da miniatura -->
<rect x="${THUMB_X}" y="${PILL_Y}" width="${THUMB_W}" height="${PILL_H}"
      rx="${PILL_H / 2}" fill="white" opacity="0.93"/>
<text x="${THUMB_X + THUMB_W / 2}" y="${PILL_Y + 19}"
      font-size="12" font-weight="600" fill="#111" text-anchor="middle">Acesso à praia →</text>

<!-- Seta da pill → praia -->
<line x1="${ARR_SX}" y1="${ARR_SY}" x2="${ARR_EX}" y2="${ARR_EY}"
      stroke="white" stroke-width="1.6" opacity="0.75" marker-end="url(#arr)"/>

<!-- Tracejado pontilhado branco: badge SPOT → praia -->
<path d="${tracejado}" fill="none" stroke="white" stroke-width="2.6"
      stroke-dasharray="7,5" stroke-linecap="round" opacity="0.88"/>

<!-- Ponto de chegada na praia (círculo branco) -->
<circle cx="${BEACH_X}" cy="${BEACH_Y}" r="7" fill="white" opacity="0.9"/>
<circle cx="${BEACH_X}" cy="${BEACH_Y}" r="3.5" fill="${CORAL}"/>

<!-- ══ ZONA ESCURA ══════════════════════════════════════════ -->

<!-- Linha separadora topo -->
<line x1="0" y1="${DARK_Y}" x2="${W}" y2="${DARK_Y}"
      stroke="white" stroke-width="0.7" opacity="0.18"/>

<!-- ── BARRA LOCALIZAÇÃO ─────────────────────────────────── -->
<!-- Pin coral teardrop -->
<circle cx="40" cy="${BAR_MID_Y - 7}" r="9" fill="${CORAL}"/>
<polygon points="31,${BAR_MID_Y - 1} 49,${BAR_MID_Y - 1} 40,${BAR_MID_Y + 10}" fill="${CORAL}"/>
<circle cx="40" cy="${BAR_MID_Y - 8}" r="4" fill="white"/>
<!-- Texto localização -->
<text x="58" y="${BAR_MID_Y + 6}"
      font-size="15" font-weight="400" fill="white">Novo Campeche, Florianópolis - SC</text>
<!-- Separador base da barra (logo Seazone inserido via sharp.composite) -->
<line x1="0" y1="${DARK_Y + BAR_H}" x2="${W}" y2="${DARK_Y + BAR_H}"
      stroke="white" stroke-width="0.5" opacity="0.1"/>

<!-- ── BADGE LANÇAMENTO + COPY ──────────────────────────── -->
<rect x="${BADGE_LX}" y="${BADGE_LY}" width="${BADGE_LW}" height="${BADGE_LH}"
      rx="4" fill="#161620" stroke="white" stroke-width="1.2"/>
<text x="${BADGE_LX + BADGE_LW / 2}" y="${BADGE_LY + 22}"
      font-size="12.5" font-weight="700" fill="white" text-anchor="middle" letter-spacing="2">LANÇAMENTO</text>

<!-- Copy linha 1 -->
<text x="${COPY_X}" y="${COPY_Y1}" font-size="17" fill="white">Tenha <tspan font-weight="700">renda passiva</tspan> com um airbnb</text>
<!-- Copy linha 2 -->
<text x="${COPY_X}" y="${COPY_Y2}" font-size="17" fill="white">em um dos bairros com <tspan font-weight="700">maior faturamento</tspan> de Florianópolis</text>

<!-- ── DADO FINANCEIRO ──────────────────────────────────── -->
<!-- "16,4%" grande coral -->
<text x="40" y="${NUM_BASE}"
      font-size="${NUM_FS}" font-weight="800" fill="${CORAL}">16,4%</text>

<!-- "ao" — separado e com espaço -->
<text x="${AO_X}" y="${AO_Y}" font-size="${AO_FS}" font-weight="400" fill="white">ao</text>
<!-- "ano" — separado abaixo de "ao" -->
<text x="${ANO_X}" y="${ANO_Y}" font-size="${AO_FS}" font-weight="400" fill="white">ano</text>

<!-- Divider vertical sutil -->
<line x1="${DIV_X}" y1="${FIN_TOP + 14}" x2="${DIV_X}" y2="${NUM_BASE + 8}"
      stroke="white" stroke-width="0.8" opacity="0.22"/>

<!-- "de" branco -->
<text x="${RET_X}" y="${RET_Y1}" font-size="18" fill="white">de</text>

<!-- Highlight coral atrás de "retorno líquido" -->
<rect x="${RL_X}" y="${RL_RY}" width="${RL_W}" height="24"
      rx="3" fill="${CORAL}" opacity="0.92"/>
<text x="${RL_X + 5}" y="${RET_Y1}" font-size="17" font-weight="700" fill="white">retorno líquido</text>

<!-- "com aluguel por temporada" -->
<text x="${RET_X}" y="${RET_Y2}" font-size="18" fill="white">com <tspan font-weight="700">aluguel por temporada</tspan></text>

<!-- ── DISCLAIMER ───────────────────────────────────────── -->
${disc.map((l, i) => `<text x="22" y="${DISC_Y + i * DISC_LH}" font-size="${DISC_FS}" fill="rgba(255,255,255,0.48)">${esc(l)}</text>`).join('\n')}

</svg>`
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('═'.repeat(58))
  console.log('  TESTE v7 — TAG photo (pin incluso), tracejado Sharp')
  console.log('═'.repeat(58))

  // 1. Foto TAG (já tem o pin e badge do SPOT) — carrega local
  console.log('\n📸  Foto TAG (fundo)...')
  const tagPath = path.join(ROOT, 'referencias/logos/V07/Novo Campeche Spot II_06_Inserção_TAG.png')
  const tagBuf  = fs.readFileSync(tagPath)
  const tagMeta = await sharp(tagBuf).metadata()
  console.log(`   Original: ${tagMeta.width}×${tagMeta.height}`)

  // Crop cover para 1080×PHOTO_H (preserva centro, onde está o pin)
  const fotoCrop = await sharp(tagBuf)
    .resize(W, PHOTO_H, { fit: 'cover', position: 'centre' })
    .toBuffer()
  console.log(`   → crop cover: ${W}×${PHOTO_H}`)

  // 2. Miniatura "Acesso à praia" — foto drone mostrando a praia
  console.log('\n🖼   Miniatura praia...')
  const thumbBuf = await baixar(
    'https://drive.google.com/thumbnail?id=1wgiWhkevUfDKrOK8sWZs_2qYGWH3604b&sz=w400',
    'foto drone praia'
  )
  const thumb = await sharp(thumbBuf)
    .resize(THUMB_W, THUMB_H, { fit: 'cover', position: 'centre' })
    .toBuffer()

  // 3. Logo Seazone branco (proporcional à barra)
  console.log('\n🎨  Logo Seazone...')
  const logoRaw  = fs.readFileSync(path.join(ROOT, 'referencias/logos/logo-seazone-padrao-branco.png.png'))
  const logoMeta = await sharp(logoRaw).metadata()
  const LOGO_H   = 44
  const LOGO_W   = Math.round(logoMeta.width * (LOGO_H / logoMeta.height))
  const logo     = await sharp(logoRaw)
    .resize(LOGO_W, LOGO_H, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } })
    .png()
    .toBuffer()
  const LOGO_X = W - LOGO_W - 24
  const LOGO_Y = DARK_Y + Math.round((BAR_H - LOGO_H) / 2)
  console.log(`   ${LOGO_W}×${LOGO_H}px @ (${LOGO_X}, ${LOGO_Y})`)

  // 4. Canvas: foto crop + extend zona escura
  console.log('\n🔧  Montando canvas...')
  const base = await sharp(fotoCrop)
    .extend({ bottom: DARK_H, background: DARK_BG })
    .toBuffer()

  // 5. SVG overlay + composite
  const svg = Buffer.from(buildSVG())

  const destino = path.join(ROOT, 'outputs/estatico/teste-v7.png')
  fs.mkdirSync(path.dirname(destino), { recursive: true })

  await sharp(base)
    .composite([
      { input: svg,   top: 0,       left: 0      },   // SVG (formas + texto)
      { input: thumb, top: THUMB_Y,  left: THUMB_X },  // miniatura praia
      { input: logo,  top: LOGO_Y,   left: LOGO_X  },  // logo Seazone
    ])
    .png({ compressionLevel: 8 })
    .toFile(destino)

  const size = fs.statSync(destino).size
  console.log(`\n✅  outputs/estatico/teste-v7.png (${Math.round(size/1024)}KB)`)
  console.log('═'.repeat(58))
}

main().catch(e => {
  console.error('\n❌  ERRO:', e.message)
  console.error(e.stack)
  process.exit(1)
})
