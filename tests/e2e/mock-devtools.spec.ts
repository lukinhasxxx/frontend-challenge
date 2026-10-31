import type { Page } from '@playwright/test'
import { test, expect, gotoApp } from '../support/test'
import { waitForRealtime } from '../support/mock'

async function openPanel(page: Page) {
  await page.getByRole('button', { name: /^Mock/ }).click()
  return page.getByRole('region', { name: 'Mock DevTools' })
}

const token = (page: Page) => page.evaluate(() => localStorage.getItem('auth-token'))

/** Login/logout rápido recarregam a página: espera o novo documento ficar pronto. */
async function clickAndReload(page: Page, name: string) {
  const panel = await openPanel(page)
  await Promise.all([page.waitForEvent('load'), panel.getByRole('button', { name }).click()])
  await page.locator('html[data-app-ready="true"]').waitFor({ state: 'attached' })
}

test.beforeEach(async ({ page }) => {
  await gotoApp(page)
  await waitForRealtime(page)
})

test('login rápido autentica e logout volta a visitante', async ({ page, isMobile }) => {
  await clickAndReload(page, 'Entrar como Ana')
  await expect.poll(() => token(page)).not.toBeNull()
  if (!isMobile) await expect(page.getByRole('link', { name: 'Ana' })).toBeVisible()

  await clickAndReload(page, 'Sair')
  await expect.poll(() => token(page)).toBeNull()
  if (!isMobile) await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
})

test('alterar NFT pelo painel atualiza o card pelo socket', async ({ page }) => {
  const panel = await openPanel(page)
  await panel.getByLabel('NFT', { exact: true }).selectOption('nft-03')
  await panel.getByLabel('Novo preço (ETH)').fill('0.3300')
  await panel.getByRole('button', { name: 'Aplicar e emitir' }).click()
  await expect(page.getByRole('article').filter({ hasText: 'Neon Vessel #552' })).toContainText('0.33 ETH')
})

test('socket derrubado reconecta sozinho', async ({ page }) => {
  await (await openPanel(page)).getByRole('button', { name: 'Derrubar socket por 5 s' }).click()
  await page.locator('html[data-realtime="disconnected"]').waitFor({ state: 'attached' })
  await page.locator('html[data-realtime="connected"]').waitFor({ state: 'attached', timeout: 15_000 })
})

test('expirar sessão invalida o token na próxima requisição', async ({ page }) => {
  await clickAndReload(page, 'Entrar como Bruno')
  await expect.poll(() => token(page)).not.toBeNull()

  await (await openPanel(page)).getByRole('button', { name: 'Expirar sessão agora' }).click()
  await page.reload()
  await expect.poll(() => token(page)).toBeNull()
})
