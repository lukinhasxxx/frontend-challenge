/**
 * Baixa as imagens originais (imageRef) do arquivo Figma para .figma/images/.
 * Uso: node scripts/figma/images.mjs
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

const response = await fetch(`https://api.figma.com/v1/files/${fileKey}/images`, { headers: { 'X-Figma-Token': token } })
const { meta } = await response.json()
mkdirSync('.figma/images', { recursive: true })
for (const [ref, url] of Object.entries(meta.images)) {
  const image = await fetch(url)
  const type = image.headers.get('content-type') ?? ''
  const ext = type.includes('png') ? 'png' : type.includes('jpeg') ? 'jpg' : 'bin'
  const buffer = Buffer.from(await image.arrayBuffer())
  writeFileSync(`.figma/images/${ref}.${ext}`, buffer)
  console.log(ref, ext, `${(buffer.length / 1024).toFixed(0)} KB`)
}
