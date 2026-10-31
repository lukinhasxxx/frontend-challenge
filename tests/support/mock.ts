import type { Page } from '@playwright/test'

/**
 * Chama a API mockada de dentro da página (passa pelo service worker do MSW).
 * O header força o cenário `default`, para o controle funcionar em qualquer cenário.
 */
export function callApi<T = unknown>(page: Page, method: string, url: string, body?: unknown) {
  return page.evaluate(
    async ({ method, url, body }) => {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-mock-scenario': 'default' },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      const text = await response.text()
      return { status: response.status, body: (text ? JSON.parse(text) : null) as T }
    },
    { method, url, body },
  )
}

/** Nomes dos NFTs que a API devolve para a query string informada. */
export async function apiNames(page: Page, query: string) {
  const { body } = await callApi<{ items: { name: string }[] }>(page, 'GET', `/api/nfts?pageSize=9&${query}`)
  return body.items.map((item) => item.name)
}

export async function waitForRealtime(page: Page) {
  await page.locator('html[data-realtime="connected"]').waitFor({ state: 'attached' })
}
