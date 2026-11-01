/**
 * Auditoria Lighthouse sobre o build de produção (`vite preview`).
 *
 * Para cada página × perfil (mobile/desktop), faz 3 execuções em um Chrome limpo,
 * escolhe a execução mediana (mesmo critério do Lighthouse CI) e salva HTML + JSON
 * em reports/lighthouse/, além de um resumo em reports/lighthouse/README.md.
 *
 * Uso: `npm run lighthouse` (gera o build antes). Chrome: CHROME_PATH ou o Chromium do Playwright.
 */
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import { chromium } from '@playwright/test'
import * as chromeLauncher from 'chrome-launcher'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import { computeMedianRun } from 'lighthouse/core/lib/median-run.js'

const PORT = 4173
const ORIGIN = `http://localhost:${PORT}`
const RUNS = 3
const OUT_DIR = 'reports/lighthouse'
const PAGES = [
  { id: 'inicio', name: 'Início', path: '/' },
  { id: 'detalhe', name: 'Detalhe do NFT', path: '/nft/nft-01' },
]
const PROFILES = [
  { id: 'mobile', name: 'Mobile', config: undefined }, // padrão do Lighthouse: Moto G Power, 4G lento, CPU 4×
  { id: 'desktop', name: 'Desktop', config: desktopConfig },
]
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']
const TARGETS = { performance: 90, accessibility: 95, 'best-practices': 95, seo: 90 }
const LABELS = { performance: 'Performance', accessibility: 'Acessibilidade', 'best-practices': 'Boas práticas', seo: 'SEO' }

const chromePath = process.env.CHROME_PATH || chromium.executablePath()

async function waitForServer(url, timeoutMs = 30_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // ainda subindo
    }
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  throw new Error(`Servidor de preview não respondeu em ${url}`)
}

async function audit(url, config) {
  const chrome = await chromeLauncher.launch({ chromePath, chromeFlags: ['--headless=new', '--no-sandbox'] })
  try {
    const result = await lighthouse(url, { port: chrome.port, output: ['html', 'json'], logLevel: 'error' }, config)
    return { lhr: result.lhr, html: result.report[0], json: result.report[1] }
  } finally {
    await chrome.kill()
  }
}

const score = (lhr, category) => Math.round(lhr.categories[category].score * 100)
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
const ms = (lhr, audit) => `${Math.round(lhr.audits[audit].numericValue).toLocaleString('pt-BR')} ms`

const preview = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', shell: true })
const results = []
try {
  await waitForServer(ORIGIN)
  mkdirSync(OUT_DIR, { recursive: true })
  for (const page of PAGES) {
    for (const profile of PROFILES) {
      const runs = []
      for (let i = 1; i <= RUNS; i++) {
        process.stdout.write(`${page.name} · ${profile.name} · execução ${i}/${RUNS}… `)
        const run = await audit(ORIGIN + page.path, profile.config)
        runs.push(run)
        console.log(CATEGORIES.map((c) => score(run.lhr, c)).join(' / '))
      }
      const medianLhr = computeMedianRun(runs.map((r) => r.lhr))
      const chosen = runs.find((r) => r.lhr === medianLhr)
      const base = `${OUT_DIR}/${page.id}-${profile.id}`
      writeFileSync(`${base}.report.html`, chosen.html)
      writeFileSync(`${base}.report.json`, chosen.json)
      results.push({ page, profile, runs: runs.map((r) => r.lhr), median: medianLhr })
    }
  }
} finally {
  // `shell: true` no Windows: encerra a árvore do processo de preview.
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(preview.pid), '/t', '/f'], { stdio: 'ignore' })
  else preview.kill()
}

// ---------- Resumo ----------
const first = results[0].median
const lhVersion = JSON.parse(readFileSync('node_modules/lighthouse/package.json', 'utf8')).version
const failures = []
const rows = results.map(({ page, profile, runs, median: lhr }) => {
  const medians = CATEGORIES.map((c) => median(runs.map((r) => score(r, c))))
  CATEGORIES.forEach((c, i) => {
    if (medians[i] < TARGETS[c]) failures.push(`${page.name} (${profile.name}): ${LABELS[c]} ${medians[i]} < ${TARGETS[c]}`)
  })
  const cls = lhr.audits['cumulative-layout-shift'].numericValue.toFixed(3)
  return `| ${page.name} | ${profile.name} | ${medians.join(' | ')} | ${ms(lhr, 'first-contentful-paint')} | ${ms(lhr, 'largest-contentful-paint')} | ${cls} | ${ms(lhr, 'total-blocking-time')} | [HTML](./${page.id}-${profile.id}.report.html) · [JSON](./${page.id}-${profile.id}.report.json) |`
})
const runRows = results.map(
  ({ page, profile, runs }) => `| ${page.name} | ${profile.name} | ${runs.map((r) => CATEGORIES.map((c) => score(r, c)).join(' / ')).join(' — ')} |`,
)

const markdown = `# Relatório Lighthouse

Gerado por \`npm run lighthouse\` (\`scripts/lighthouse.mjs\`) sobre o build de produção servido por \`vite preview\`, com os mocks (MSW) ativos, como no deploy de demonstração.

## Medianas (${RUNS} execuções por página e perfil)

Metas: Performance ≥ ${TARGETS.performance} · Acessibilidade ≥ ${TARGETS.accessibility} · Boas práticas ≥ ${TARGETS['best-practices']} · SEO ≥ ${TARGETS.seo}.

| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | FCP | LCP | CLS | TBT | Relatório |
|---|---|---|---|---|---|---|---|---|---|---|
${rows.join('\n')}

As notas são a mediana de cada categoria nas ${RUNS} execuções. FCP, LCP, CLS, TBT e os relatórios HTML/JSON são da execução mediana (escolhida pelo mesmo critério do Lighthouse CI: a mais próxima da mediana de FCP e TTI).

${failures.length ? `**Abaixo da meta:**\n\n${failures.map((f) => `- ${f}`).join('\n')}` : '**Todas as metas foram atingidas.**'}

## Todas as execuções

Notas na ordem Performance / Acessibilidade / Boas práticas / SEO.

| Página | Perfil | Execuções 1 — 2 — 3 |
|---|---|---|
${runRows.join('\n')}

## Ambiente

- Data: ${new Date(first.fetchTime).toISOString().slice(0, 10)}
- Lighthouse ${lhVersion} (Node API), Chrome headless ${first.environment.hostUserAgent.match(/Chrome\/([\d.]+)/)?.[1] ?? '?'}
- Node ${process.version}, ${os.type()} ${os.release()} (${os.arch()})
- CPU: ${os.cpus()[0]?.model.trim()} (${os.cpus().length} threads), ${Math.round(os.totalmem() / 1024 ** 3)} GB de RAM — benchmark index do Lighthouse: ${Math.round(first.environment.benchmarkIndex)}
- Mobile: emulação padrão do Lighthouse (Moto G Power, 4G lento simulado, CPU 4× mais lenta)
- Desktop: configuração \`desktop\` do Lighthouse (1350×940, sem limitação de CPU, rede de banda larga simulada)
- Servidor: \`vite preview\` local, sem CDN. A rede e a CPU são simuladas (throttling do Lighthouse), então as notas refletem mais o tamanho e a ordem dos recursos do que o servidor.

Os resultados variam com a máquina; por isso a mediana de ${RUNS} execuções.
`
writeFileSync(`${OUT_DIR}/README.md`, markdown)
console.log(`\nResumo salvo em ${OUT_DIR}/README.md`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exitCode = 1
}
