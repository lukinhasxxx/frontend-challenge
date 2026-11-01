import { defineConfig, devices } from '@playwright/test'

const PORT = 5174
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  // Baselines sem sufixo de sistema operacional (o projeto desktop/mobile entra no nome, em visual.spec.ts).
  // A tolerância de 3% absorve a diferença de renderização de fontes entre Windows, Linux e macOS.
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  expect: {
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.03 },
  },
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Funções puras (ex.: lib/eth) — sem navegador.
    { name: 'unit', testMatch: 'unit/**/*.spec.ts' },
    { name: 'desktop', testMatch: 'e2e/**/*.spec.ts', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', testMatch: 'e2e/**/*.spec.ts', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
  },
})
