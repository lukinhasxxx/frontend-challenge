import type { Page } from '@playwright/test'
import { test, expect, gotoApp } from '../support/test'
import { callApi, waitForRealtime } from '../support/mock'

const card = (page: Page, name: string) => page.getByRole('article').filter({ hasText: name })

async function setPrice(page: Page, nftId: string, editionId: string, priceEth: string) {
  const { status } = await callApi(page, 'POST', `/__mock/nfts/${nftId}`, { editionId, priceEth })
  expect(status).toBe(200)
}

test.beforeEach(async ({ page }) => {
  await gotoApp(page)
  await expect(card(page, 'Emerald Ape #042')).toContainText('1.19 ETH')
  await waitForRealtime(page)
})

test('nft.updated atualiza o catálogo sem recarregar', async ({ page }) => {
  await setPrice(page, 'nft-01', 'nft-01-1of50', '0.5000')
  await expect(card(page, 'Emerald Ape #042')).toContainText('0.50 ETH')
  await expect(page.getByRole('status').filter({ hasText: 'Emerald Ape #042 atualizado' })).toBeAttached()
})

test('duplicata e evento antigo não alteram o estado mais recente', async ({ page }) => {
  await setPrice(page, 'nft-01', 'nft-01-1of50', '0.5000')
  await expect(card(page, 'Emerald Ape #042')).toContainText('0.50 ETH')

  // Mesmo eventId reenviado.
  expect((await callApi(page, 'POST', '/__mock/events/replay-last')).status).toBe(200)
  // Evento novo com a versão anterior (preço 1.19).
  expect((await callApi(page, 'POST', '/__mock/events/stale')).status).toBe(200)

  await page.waitForTimeout(500)
  await expect(card(page, 'Emerald Ape #042')).toContainText('0.50 ETH')
})

test('após reconectar, reconcilia com a API o que mudou durante a queda', async ({ page }) => {
  await callApi(page, 'POST', '/__mock/socket/drop', { downForMs: 3_000 })
  await page.locator('html[data-realtime="disconnected"]').waitFor({ state: 'attached' })

  // Mudança feita enquanto o cliente está desconectado: o evento se perde.
  await setPrice(page, 'nft-02', 'nft-02-1of50', '0.7500')
  await expect(card(page, 'Sage Nomad #009')).toContainText('1.69 ETH')

  await waitForRealtime(page)
  await expect(card(page, 'Sage Nomad #009')).toContainText('0.75 ETH', { timeout: 10_000 })
})

test('detalhe aberto recebe a atualização', async ({ page, isMobile }) => {
  await page.goto('/nft/nft-01')
  await waitForRealtime(page)
  await setPrice(page, 'nft-01', 'nft-01-1of50', '0.9000')
  const price = isMobile ? page.getByText('0.90 ETH').last() : page.locator('#conteudo').getByText('0.90 ETH').first()
  await expect(price).toBeVisible()
})
