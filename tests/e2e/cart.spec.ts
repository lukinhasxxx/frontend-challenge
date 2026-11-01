import type { Page } from '@playwright/test'
import { test, expect, gotoApp } from '../support/test'
import { openLogin, setEdition, signIn } from '../support/auth'
import { callApi } from '../support/mock'

// Violet Nomad #314 (nft-05), edição 1/50 a 1.39 ETH — estoque fixado em cada teste.
const NFT = 'nft-05'
const EDITION = 'nft-05-1of50'
const NAME = 'Violet Nomad #314'

const visible = (page: Page, role: Parameters<Page['getByRole']>[0], name: string | RegExp) =>
  page.getByRole(role, { name }).filter({ visible: true })

/** Detalhe → edição 1/50 → quantidade → "Comprar" (leva ao carrinho). */
async function buyFromDetail(page: Page, quantity = 1) {
  await gotoApp(page, `/nft/${NFT}`)
  await visible(page, 'radio', '1/50').click()
  for (let i = 1; i < quantity; i++) await visible(page, 'button', 'Aumentar quantidade').click()
  await visible(page, 'button', /^Comprar( NFT)?$/).click()
  await expect(page).toHaveURL('/carrinho')
}

const summaryValue = (page: Page, label: string) =>
  page.getByRole('term').filter({ hasText: new RegExp(`^${label}$`) }).locator('xpath=following-sibling::dd[1]')

test.beforeEach(async ({ page }) => {
  await gotoApp(page)
  await setEdition(page, NFT, EDITION, { available: 5, priceEth: '1.3900' })
})

test('visitante adiciona, ajusta, remove e o carrinho sobrevive ao refresh', async ({ page }) => {
  await buyFromDetail(page, 2)
  const quantity = page.getByRole('group', { name: `Quantidade de ${NAME} (1/50)` })
  await expect(quantity.locator('output')).toHaveText('2')
  await expect(summaryValue(page, 'Subtotal')).toHaveText('2.78 ETH')
  await expect(summaryValue(page, 'Total')).toHaveText('2.796 ETH') // 2.78 + taxa 0.016

  await quantity.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await expect(quantity.locator('output')).toHaveText('3')
  await expect(summaryValue(page, 'Subtotal')).toHaveText('4.17 ETH')

  await page.reload()
  await page.locator('html[data-app-ready="true"]').waitFor({ state: 'attached' })
  await expect(quantity.locator('output')).toHaveText('3')

  await page.getByRole('button', { name: `Remover ${NAME} (1/50) do carrinho` }).click()
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
})

test('quantidade respeita o estoque, contando o que já está no carrinho', async ({ page }) => {
  await setEdition(page, NFT, EDITION, { available: 2 })
  await buyFromDetail(page, 2)

  await gotoApp(page, `/nft/${NFT}`)
  await visible(page, 'radio', '1/50').click()
  await expect(page.getByText('Todas as unidades disponíveis desta edição já estão no seu carrinho.').filter({ visible: true })).toBeVisible()
  await expect(visible(page, 'button', /^Comprar( NFT)?$/)).toBeDisabled()
})

test('cupom: inválido, expirado, válido e remoção', async ({ page }) => {
  await buyFromDetail(page)
  const field = page.getByRole('textbox', { name: 'Código promocional' })
  const submit = page.getByRole('button', { name: /^(Aplicar|Remover)$/ })

  await field.fill('NAOEXISTE')
  await submit.click()
  await expect(field).toHaveAccessibleDescription('Cupom inválido.')

  await field.fill('EXPIRED20')
  await submit.click()
  await expect(field).toHaveAccessibleDescription('Este cupom expirou.')

  await field.fill('jungle10')
  await submit.click()
  await expect(page.getByRole('status').filter({ hasText: 'Cupom JUNGLE10 aplicado: 10% de desconto.' })).toBeVisible()
  // 1.39 − 10% (0.139) + 0.016
  await expect(summaryValue(page, 'Desconto do lançamento')).toHaveText('(-) 0.139 ETH')
  await expect(summaryValue(page, 'Total')).toHaveText('1.267 ETH')

  await page.reload()
  await page.locator('html[data-app-ready="true"]').waitFor({ state: 'attached' })
  await expect(field).toHaveValue('JUNGLE10')

  await submit.click() // "Remover"
  await expect(summaryValue(page, 'Desconto do lançamento')).toHaveText('(-) 0.00 ETH')
})

test('itens do visitante entram no carrinho da conta ao entrar e não ficam após sair', async ({ page, isMobile }) => {
  await buyFromDetail(page, 2)
  await openLogin(page)
  await signIn(page, 'bruno@nft.dev')
  await expect(page.getByRole('group', { name: `Quantidade de ${NAME} (1/50)` }).locator('output')).toHaveText('2')
  if (!isMobile) await expect(page.getByRole('link', { name: 'Carrinho, 2 itens' })).toBeVisible()

  // Sair: o visitante volta a ter um carrinho próprio (vazio); os itens ficam na conta.
  await callApi(page, 'POST', '/api/auth/logout')
  await page.evaluate(() => localStorage.removeItem('auth-token'))
  await gotoApp(page, '/carrinho')
  await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
})

test('login rápido do painel Mock também junta o carrinho do visitante', async ({ page }) => {
  await buyFromDetail(page)
  await page.getByRole('button', { name: /^Mock/ }).click()
  await page.getByRole('button', { name: 'Entrar como Bruno' }).click()
  await page.waitForEvent('load')
  await expect(page.getByRole('group', { name: `Quantidade de ${NAME} (1/50)` }).locator('output')).toHaveText('1')
})

test('painel Mock já vem com o item do carrinho e altera o preço dele', async ({ page }) => {
  await buyFromDetail(page)
  await page.getByRole('button', { name: /^Mock/ }).click()
  const panel = page.getByRole('region', { name: 'Mock DevTools' })
  await expect(panel.getByRole('combobox', { name: 'Edição' })).toHaveValue(EDITION)
  await panel.getByLabel('Novo preço (ETH)').fill('0.5')
  await panel.getByRole('button', { name: 'Aplicar e emitir' }).click()
  await expect(panel.getByText('✔ NFT alterado e evento emitido')).toBeVisible()
  await expect(page.getByRole('alert').filter({ hasText: 'Seu carrinho mudou' })).toBeVisible()
})

test('tempo real: preço alterado avisa e atualiza o resumo; "Entendi" confirma', async ({ page }) => {
  await buyFromDetail(page)
  await expect(summaryValue(page, 'Subtotal')).toHaveText('1.39 ETH')

  await setEdition(page, NFT, EDITION, { priceEth: '0.5000' })
  const alert = page.getByRole('alert').filter({ hasText: 'Seu carrinho mudou' })
  await expect(alert).toContainText(`O preço de ${NAME} (1/50) mudou de 1.39 para 0.50 ETH.`)
  await expect(summaryValue(page, 'Subtotal')).toHaveText('0.50 ETH')
  await expect(page.getByRole('button', { name: 'Conectar e finalizar' })).toBeDisabled()

  await alert.getByRole('button', { name: 'Entendi, usar valores atuais' }).click()
  await expect(alert).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Conectar e finalizar' })).toBeEnabled()

  await setEdition(page, NFT, EDITION, { available: 0 })
  await expect(page.getByRole('alert').filter({ hasText: `${NAME} (1/50) esgotou` })).toBeVisible()
})
