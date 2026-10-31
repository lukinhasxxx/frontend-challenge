/**
 * Extrai dados de design do Figma via REST API e gera um relatório de tokens.
 *
 * Uso: node scripts/figma/extract.mjs [--refresh]
 * Lê FIGMA_TOKEN e FIGMA_FILE_KEY de .env.local. Saída em .figma/ (git-ignored).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const OUT = '.figma'
const API = 'https://api.figma.com/v1'

function loadCredentials() {
  const env = Object.fromEntries(
    readFileSync('.env.local', 'utf8')
      .split(/\r?\n/)
      .filter((line) => line.includes('=') && !line.startsWith('#'))
      .map((line) => [line.slice(0, line.indexOf('=')).trim(), line.slice(line.indexOf('=') + 1).trim()]),
  )
  // Aceita os valores mesmo se estiverem trocados: o token sempre começa com "figd_".
  const values = [env.FIGMA_TOKEN, env.FIGMA_FILE_KEY].filter(Boolean)
  const token = values.find((v) => v.startsWith('figd_'))
  const fileKey = values.find((v) => !v.startsWith('figd_'))
  if (!token || !fileKey) throw new Error('Defina FIGMA_TOKEN e FIGMA_FILE_KEY no .env.local')
  return { token, fileKey }
}

async function figma(path, token) {
  const response = await fetch(`${API}${path}`, { headers: { 'X-Figma-Token': token } })
  const body = await response.json().catch(() => null)
  return { status: response.status, body }
}

const toHex = ({ r, g, b }) =>
  '#' + [r, g, b].map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('').toUpperCase()

function colorKey(paint) {
  const alpha = (paint.opacity ?? 1) * (paint.color.a ?? 1)
  return alpha < 0.999 ? `${toHex(paint.color)} @${Math.round(alpha * 100)}%` : toHex(paint.color)
}

function bump(map, key, sample) {
  const entry = map.get(key) ?? { count: 0, samples: new Set() }
  entry.count += 1
  if (sample && entry.samples.size < 4) entry.samples.add(sample)
  map.set(key, entry)
}

function analyze(file) {
  const colors = new Map()
  const strokes = new Map()
  const typography = new Map()
  const radii = new Map()
  const paddings = new Map()
  const gaps = new Map()
  const effects = new Map()
  const variableColors = new Map()
  const imageRefs = new Map()
  const screens = []

  function walk(node, screen, path) {
    if (node.visible === false) return
    const where = `${screen} › ${path.slice(-2).join(' › ')}`

    for (const paint of node.fills ?? []) {
      if (paint.visible === false) continue
      if (paint.type === 'SOLID') {
        bump(colors, colorKey(paint), where)
        const variableId = node.boundVariables?.fills?.find?.(Boolean)?.id
        if (variableId) bump(variableColors, `${variableId} → ${colorKey(paint)}`)
      }
      if (paint.type === 'IMAGE' && paint.imageRef) bump(imageRefs, paint.imageRef, where)
    }
    for (const paint of node.strokes ?? []) {
      if (paint.visible !== false && paint.type === 'SOLID') bump(strokes, `${colorKey(paint)} ${node.strokeWeight ?? 1}px`, where)
    }
    if (node.type === 'TEXT' && node.style) {
      const s = node.style
      const lineHeight = s.lineHeightUnit === 'INTRINSIC_%' ? 'auto' : `${Math.round(s.lineHeightPx * 10) / 10}px`
      const key = [
        s.fontFamily,
        s.fontWeight,
        `${s.fontSize}px`,
        `lh ${lineHeight}`,
        `ls ${Math.round((s.letterSpacing ?? 0) * 100) / 100}px`,
        s.textCase && s.textCase !== 'ORIGINAL' ? s.textCase : '',
        s.textDecoration && s.textDecoration !== 'NONE' ? s.textDecoration : '',
      ]
        .filter(Boolean)
        .join(' · ')
      bump(typography, key, `${screen}: "${(node.characters ?? '').slice(0, 40).replace(/\s+/g, ' ')}"`)
    }
    if (node.cornerRadius) bump(radii, `${node.cornerRadius}px`, where)
    if (node.rectangleCornerRadii && new Set(node.rectangleCornerRadii).size > 1) bump(radii, `${node.rectangleCornerRadii.join('/')}px`, where)
    if (node.layoutMode && node.layoutMode !== 'NONE') {
      const p = [node.paddingTop ?? 0, node.paddingRight ?? 0, node.paddingBottom ?? 0, node.paddingLeft ?? 0]
      if (p.some(Boolean)) bump(paddings, p.join(' '), where)
      if (node.itemSpacing) bump(gaps, `${node.itemSpacing}px`, where)
    }
    for (const effect of node.effects ?? []) {
      if (effect.visible === false) continue
      const c = effect.color ? colorKey({ color: effect.color }) : ''
      bump(effects, `${effect.type} x${effect.offset?.x ?? 0} y${effect.offset?.y ?? 0} blur${effect.radius} spread${effect.spread ?? 0} ${c}`, where)
    }
    for (const child of node.children ?? []) walk(child, screen, [...path, child.name])
  }

  for (const page of file.document.children) {
    for (const frame of page.children ?? []) {
      if (frame.type !== 'FRAME' && frame.type !== 'SECTION' && frame.type !== 'COMPONENT') continue
      const box = frame.absoluteBoundingBox
      screens.push({ page: page.name, name: frame.name, width: box?.width, height: box?.height, id: frame.id })
      walk(frame, frame.name, [frame.name])
    }
  }
  return { colors, strokes, typography, radii, paddings, gaps, effects, variableColors, imageRefs, screens }
}

function table(map, limit = 60) {
  return [...map.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([key, { count, samples }]) => `| ${key} | ${count} | ${[...samples].join('<br>')} |`)
    .join('\n')
}

async function main() {
  const { token, fileKey } = loadCredentials()
  mkdirSync(OUT, { recursive: true })

  const cached = `${OUT}/file.json`
  let file
  if (existsSync(cached) && !process.argv.includes('--refresh')) {
    file = JSON.parse(readFileSync(cached, 'utf8'))
  } else {
    const { status, body } = await figma(`/files/${fileKey}`, token)
    if (status !== 200) throw new Error(`GET /files falhou: ${status} ${JSON.stringify(body)?.slice(0, 200)}`)
    file = body
    writeFileSync(cached, JSON.stringify(file))
  }

  const variables = await figma(`/files/${fileKey}/variables/local`, token)
  if (variables.status === 200) writeFileSync(`${OUT}/variables.json`, JSON.stringify(variables.body, null, 2))

  const result = analyze(file)
  const styles = Object.entries(file.styles ?? {}).map(([id, s]) => `| ${s.name} | ${s.styleType} | ${id} |`)

  const report = `# Relatório Figma — ${file.name}

Gerado em ${new Date().toISOString()} · última modificação do arquivo: ${file.lastModified}
Variables API: HTTP ${variables.status}${variables.status === 200 ? ' (salvo em variables.json)' : ' (indisponível neste plano)'}

## Telas (frames de topo)
| Página | Frame | Largura | Altura |
|---|---|---|---|
${result.screens.map((s) => `| ${s.page} | ${s.name} | ${s.width} | ${s.height} |`).join('\n')}

## Estilos locais
| Nome | Tipo | Id |
|---|---|---|
${styles.join('\n') || '| — | — | — |'}

## Cores de preenchimento (sólidas)
| Cor | Usos | Exemplos |
|---|---|---|
${table(result.colors)}

## Variáveis ligadas a preenchimentos (id → cor resolvida)
| Variável → cor | Usos | |
|---|---|---|
${table(result.variableColors)}

## Bordas
| Borda | Usos | Exemplos |
|---|---|---|
${table(result.strokes, 30)}

## Tipografia
| Estilo | Usos | Exemplos |
|---|---|---|
${table(result.typography, 80)}

## Raios
| Raio | Usos | Exemplos |
|---|---|---|
${table(result.radii, 30)}

## Paddings de auto layout (top right bottom left)
| Padding | Usos | Exemplos |
|---|---|---|
${table(result.paddings, 40)}

## Gaps de auto layout
| Gap | Usos | Exemplos |
|---|---|---|
${table(result.gaps, 30)}

## Efeitos (sombras/blur)
| Efeito | Usos | Exemplos |
|---|---|---|
${table(result.effects, 20)}

## Imagens (imageRef)
${result.imageRefs.size} imagens distintas.
| imageRef | Usos | Exemplos |
|---|---|---|
${table(result.imageRefs, 100)}
`
  writeFileSync(`${OUT}/report.md`, report)
  console.log(`ok: ${result.screens.length} telas, ${result.colors.size} cores, ${result.typography.size} estilos de texto, ${result.imageRefs.size} imagens → ${OUT}/report.md`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
