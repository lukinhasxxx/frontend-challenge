/**
 * Exporta nós do Figma como SVG/PNG.
 * Uso: node scripts/figma/export-nodes.mjs <svg|png> <saida/dir> <nome>=<nodeId> ...
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
const values = [env.FIGMA_TOKEN, env.FIGMA_FILE_KEY].filter(Boolean)
const token = values.find((v) => v.startsWith('figd_'))
const fileKey = values.find((v) => !v.startsWith('figd_'))

const [format, outDir, ...pairs] = process.argv.slice(2)
const nodes = Object.fromEntries(pairs.map((p) => [p.slice(p.indexOf('=') + 1), p.slice(0, p.indexOf('='))]))
const ids = Object.keys(nodes).join(',')
const response = await fetch(`https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(ids)}&format=${format}&scale=2`, {
  headers: { 'X-Figma-Token': token },
})
const { images, err } = await response.json()
if (err) throw new Error(err)
mkdirSync(outDir, { recursive: true })
for (const [id, url] of Object.entries(images)) {
  const body = Buffer.from(await (await fetch(url)).arrayBuffer())
  writeFileSync(`${outDir}/${nodes[id]}.${format}`, body)
  console.log(`${nodes[id]}.${format}`, body.length)
}
