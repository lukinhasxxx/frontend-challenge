import { test as base, expect, type Page } from '@playwright/test'

type Fixtures = {
  /** Cenário do MSW aplicado antes do app carregar (localStorage `MOCK_SCENARIO`). */
  scenario: string
}

/**
 * Cada teste roda em um contexto novo do navegador, então o localStorage
 * (e com ele o banco simulado) começa vazio e é semeado do zero.
 */
export const test = base.extend<Fixtures>({
  scenario: ['default', { option: true }],
  page: async ({ page, scenario }, use) => {
    await page.addInitScript((value) => {
      window.localStorage.setItem('MOCK_SCENARIO', value)
    }, scenario)
    await use(page)
  },
})

/**
 * Navega e espera o boot terminar. O `load` do navegador dispara antes do
 * service worker do MSW estar ativo; requisições nesse intervalo não seriam mockadas.
 */
export async function gotoApp(page: Page, path = '/') {
  await page.goto(path)
  await page.locator('html[data-app-ready="true"]').waitFor({ state: 'attached' })
}

export { expect }
