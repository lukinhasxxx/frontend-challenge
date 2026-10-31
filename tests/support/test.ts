import { test as base, expect } from '@playwright/test'

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

export { expect }
