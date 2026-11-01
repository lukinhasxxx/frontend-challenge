import type { Page } from '@playwright/test'
import { callApi } from './mock'

export const PASSWORD = 'Senha@123'

/** Preenche e envia o login do diálogo já aberto (modal no desktop, tela cheia no mobile). */
export async function signIn(page: Page, email: string, password = PASSWORD) {
  const form = page.getByRole('dialog')
  await form.getByLabel('E-mail').fill(email)
  await form.getByLabel('Senha', { exact: true }).fill(password)
  await form.getByRole('button', { name: 'Entrar', exact: true }).click()
  await form.waitFor({ state: 'hidden' })
}

/** Abre o login sobre a tela atual (mesmo caminho do botão "Entrar" do header). */
export async function openLogin(page: Page) {
  const url = new URL(page.url())
  url.searchParams.set('auth', 'login')
  await page.goto(url.pathname + url.search)
  await page.locator('html[data-app-ready="true"]').waitFor({ state: 'attached' })
}

/** Deixa uma edição com estoque/preço conhecidos (o mock emite `nft.updated`). */
export async function setEdition(page: Page, nftId: string, editionId: string, change: { available?: number; priceEth?: string }) {
  const { status } = await callApi(page, 'POST', `/__mock/nfts/${nftId}`, { editionId, ...change })
  if (status !== 200) throw new Error(`Falha ao preparar ${editionId}: ${status}`)
}
