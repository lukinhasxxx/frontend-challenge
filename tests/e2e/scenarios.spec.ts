import { test, expect, gotoApp } from '../support/test'

async function timedFetch(page: import('@playwright/test').Page, url: string, headers: Record<string, string> = {}) {
  return page.evaluate(
    async ([target, extraHeaders]) => {
      const start = performance.now()
      const response = await fetch(target, { headers: extraHeaders })
      return { status: response.status, ms: performance.now() - start }
    },
    [url, headers] as const,
  )
}

test.describe('cenário error-500', () => {
  test.use({ scenario: 'error-500' })

  test('API responde 500 e o header pode sobrescrever o cenário', async ({ page }) => {
    await gotoApp(page)
    expect((await timedFetch(page, '/api/health')).status).toBe(500)
    expect((await timedFetch(page, '/api/health', { 'x-mock-scenario': 'default' })).status).toBe(200)
  })
})

test.describe('cenário slow', () => {
  test.use({ scenario: 'slow' })

  test('respostas demoram ~2,5 s', async ({ page }) => {
    await gotoApp(page)
    const { status, ms } = await timedFetch(page, '/api/health')
    expect(status).toBe(200)
    expect(ms).toBeGreaterThanOrEqual(2_400)
  })
})

test('cenário default responde rápido e o banco é semeado', async ({ page }) => {
  await gotoApp(page)
  const { status, ms } = await timedFetch(page, '/api/health')
  expect(status).toBe(200)
  expect(ms).toBeLessThan(1_000)
  const dbKeys = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('mock-db:v1') ?? '{}')))
  expect(dbKeys).toEqual(expect.arrayContaining(['users', 'nfts', 'carts', 'orders']))
})
