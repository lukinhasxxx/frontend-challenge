/**
 * Renderiza os frames de topo (telas) do Figma como PNG em .figma/screens/.
 * Uso: node scripts/figma/screens.mjs [escala=1]
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
const scale = Number(process.argv[2] ?? 1)

const file = JSON.parse(readFileSync('.figma/file.json', 'utf8'))
const frames = file.document.children.flatMap((page) => (page.children ?? []).filter((n) => n.type === 'FRAME'))
const ids = frames.map((f) => f.id).join(',')

const response = await fetch(`https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(ids)}&format=png&scale=${scale}`, {
  headers: { 'X-Figma-Token': token },
})
const { images, err } = await response.json()
if (err) throw new Error(err)

mkdirSync('.figma/screens', { recursive: true })
for (const frame of frames) {
  const url = images[frame.id]
  if (!url) continue
  const name = frame.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  writeFileSync(`.figma/screens/${name}.png`, Buffer.from(await (await fetch(url)).arrayBuffer()))
  console.log(name)
}
