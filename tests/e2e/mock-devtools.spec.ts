import type { Page } from '@playwright/test'
import { test, expect, gotoApp } from '../support/test'

async function openPanel(page: Page) {
  await page.getByRole('button', { name: /^Mock/ }).click()
  return page.getByRole('region', { name: 'Mock DevTools' })
}

test.beforeEach(async ({ page }) => {
  await gotoApp(page)
  await expect(page.getByTestId('socket-status')).toHaveText('conectado')
})

test('login rápido autentica e logout volta a visitante', async ({ page }) => {
  const panel = await openPanel(page)
  await panel.getByRole('button', { name: 'Entrar como Ana' }).click()
  await expect(page.getByTestId('session-status')).toHaveText(/Logado como Ana Souza/)

  await (await openPanel(page)).getByRole('button', { name: 'Sair' }).click()
  await expect(page.getByTestId('session-status')).toHaveText('Visitante')
})

test('alteração de NFT chega pelo socket, incluindo duplicata e evento antigo', async ({ page }) => {
  const panel = await openPanel(page)
  await panel.getByLabel('NFT', { exact: true }).selectOption('nft-03')
  await panel.getByLabel('Novo preço (ETH)').fill('9.8765')
  await panel.getByRole('button', { name: 'Aplicar e emitir' }).click()

  await expect(page.getByTestId('socket-events')).toHaveText(/recebidos: 1/)
  await expect(page.getByTestId('socket-last-event')).toContainText('v2')

  // Painel de diagnóstico conta tudo que chega; o descarte (dedupe/versão) vem na etapa 3.5.
  await panel.getByRole('button', { name: 'Reenviar duplicata' }).click()
  await expect(page.getByTestId('socket-events')).toHaveText(/recebidos: 2/)
  await panel.getByRole('button', { name: 'Emitir evento antigo' }).click()
  await expect(page.getByTestId('socket-events')).toHaveText(/recebidos: 3/)
  await expect(page.getByTestId('socket-last-event')).toContainText('v1')

  // O REST reflete a mudança (mesma fonte de verdade).
  const state = await page.evaluate(() => fetch('/__mock/state').then((r) => r.json()))
  expect(state.nfts.find((n: { id: string }) => n.id === 'nft-03').version).toBe(2)
})

test('socket derrubado reconecta sozinho', async ({ page }) => {
  const panel = await openPanel(page)
  await panel.getByRole('button', { name: 'Derrubar socket por 5 s' }).click()
  await expect(page.getByTestId('socket-status')).toHaveText('desconectado')
  await expect(page.getByTestId('socket-status')).toHaveText('conectado', { timeout: 15_000 })
})

test('expirar sessão invalida o token na próxima requisição', async ({ page }) => {
  const panel = await openPanel(page)
  await panel.getByRole('button', { name: 'Entrar como Bruno' }).click()
  await expect(page.getByTestId('session-status')).toHaveText(/Bruno Lima/)

  await (await openPanel(page)).getByRole('button', { name: 'Expirar sessão agora' }).click()
  await page.reload()
  await expect(page.getByTestId('session-status')).toHaveText(/expirou/)
  expect(await page.evaluate(() => localStorage.getItem('auth-token'))).toBeNull()
})
