/**
 * Imprime a árvore de um nó do Figma (a partir de .figma/file.json) com medidas.
 * Uso: node scripts/figma/inspect.mjs "<frame>" "<nome do nó>" [profundidade=3]
 */
import { readFileSync } from 'node:fs'

const [frameName, nodeName, depthArg] = process.argv.slice(2)
const maxDepth = Number(depthArg ?? 3)
const file = JSON.parse(readFileSync('.figma/file.json', 'utf8'))

const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase()

function find(node, predicate) {
  if (predicate(node)) return node
  for (const child of node.children ?? []) {
    const hit = find(child, predicate)
    if (hit) return hit
  }
  return null
}

function describe(node, origin) {
  const b = node.absoluteBoundingBox
  const parts = [`${node.type} "${node.name}"`]
  if (b) parts.push(`${Math.round(b.x - origin.x)},${Math.round(b.y - origin.y)} ${Math.round(b.width)}×${Math.round(b.height)}`)
  if (node.layoutMode && node.layoutMode !== 'NONE') {
    parts.push(`${node.layoutMode === 'HORIZONTAL' ? 'row' : 'col'} gap${node.itemSpacing ?? 0}`)
    const p = [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft].map((v) => v ?? 0)
    if (p.some(Boolean)) parts.push(`pad ${p.join(' ')}`)
    if (node.primaryAxisAlignItems) parts.push(`main:${node.primaryAxisAlignItems}`)
    if (node.counterAxisAlignItems) parts.push(`cross:${node.counterAxisAlignItems}`)
  }
  const fill = node.fills?.find((f) => f.visible !== false && f.type === 'SOLID')
  if (fill) parts.push(`bg ${hex(fill.color)}${fill.opacity < 1 ? `@${Math.round(fill.opacity * 100)}%` : ''}`)
  if (node.fills?.some((f) => f.type === 'IMAGE')) parts.push('IMAGE')
  if (node.fills?.some((f) => f.type?.startsWith('GRADIENT'))) {
    const g = node.fills.find((f) => f.type?.startsWith('GRADIENT'))
    parts.push(`gradient ${g.gradientStops.map((s) => hex(s.color)).join('→')}`)
  }
  const stroke = node.strokes?.find((s) => s.visible !== false && s.type === 'SOLID')
  if (stroke) parts.push(`border ${node.strokeWeight}px ${hex(stroke.color)}`)
  if (node.cornerRadius) parts.push(`r${node.cornerRadius}`)
  if (node.rectangleCornerRadii) parts.push(`r${node.rectangleCornerRadii.join('/')}`)
  if (node.effects?.length) parts.push(`fx:${node.effects.filter((e) => e.visible !== false).map((e) => e.type).join(',')}`)
  if (node.type === 'TEXT') {
    const s = node.style
    parts.push(`"${node.characters.slice(0, 50).replace(/\s+/g, ' ')}" ${s.fontWeight} ${s.fontSize}px lh${Math.round(s.lineHeightPx)} ls${s.letterSpacing ?? 0}${s.textCase ? ' ' + s.textCase : ''}`)
  }
  return parts.join(' · ')
}

function print(node, origin, depth) {
  if (node.visible === false) return
  console.log(`${'  '.repeat(depth)}${describe(node, origin)}`)
  if (depth < maxDepth) for (const child of node.children ?? []) print(child, origin, depth + 1)
}

const frame = find(file.document, (n) => n.type === 'FRAME' && n.name === frameName)
if (!frame) throw new Error(`Frame não encontrado: ${frameName}`)
const target = nodeName ? find(frame, (n) => n.name === nodeName) : frame
if (!target) throw new Error(`Nó não encontrado: ${nodeName}`)
print(target, frame.absoluteBoundingBox, 0)
