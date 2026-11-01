import type { Page } from '@playwright/test'
import { test, expect, gotoApp } from '../support/test'
import { openLogin, signIn } from '../support/auth'

const NEON = 'Neon Vessel #552'

/** Coração do card (desktop: atalho do hover; mobile: sobre a imagem). */
async function cardHeart(page: Page, name: string, isMobile: boolean) {
  const card = page.getByRole('article').filter({ hasText: name })
  // Após login a página é recriada: espera o card voltar antes do hover.
  await expect(card).toBeVisible()
  if (!isMobile) await card.hover()
  return card.getByRole('button', { name: `Favoritar ${name}` })
}

test('visitante que favorita é levado ao login e o favorito é concluído depois', async ({ page, isMobile }) => {
  await gotoApp(page)
  await (await cardHeart(page, NEON, isMobile)).click()
  await expect(page).toHaveURL(/auth=login/)

  await signIn(page, 'ana@nft.dev')
  await expect(page.getByText('Adicionado aos favoritos.')).toBeVisible()
  await expect(await cardHeart(page, NEON, isMobile)).toHaveAttribute('aria-pressed', 'true')
})

test('favoritar é instantâneo, persiste após refresh e aparece em /favoritos', async ({ page, isMobile }) => {
  await gotoApp(page, '/nft/nft-03')
  await openLogin(page)
  await signIn(page, 'bruno@nft.dev')
  // Após o login a página é recriada com cache limpo: espera o detalhe voltar.
  await expect(page.getByRole('heading', { name: NEON, level: 1 }).filter({ visible: true })).toBeVisible()

  const heart = page.getByRole('button', { name: /^Favoritar( Neon Vessel #552)?$/ }).filter({ visible: true })
  const saved = page.waitForResponse((r) => r.url().endsWith('/api/favorites') && r.request().method() === 'POST')
  await heart.click()
  // Otimista: muda antes da resposta da API.
  await expect(heart).toHaveAttribute('aria-pressed', 'true')
  expect((await saved).status()).toBe(201)

  await page.reload()
  await page.locator('html[data-app-ready="true"]').waitFor({ state: 'attached' })
  await expect(heart).toHaveAttribute('aria-pressed', 'true')

  await gotoApp(page, '/favoritos')
  const list = page.getByRole('list', { name: 'NFTs favoritados' })
  await expect(list.getByRole('article').filter({ hasText: NEON })).toBeVisible()

  // Desfavoritar na própria lista tira o card na hora (otimista).
  await (await cardHeart(page, NEON, isMobile)).click()
  await expect(list.getByRole('article').filter({ hasText: NEON })).toHaveCount(0)
})

test('falha da API desfaz o coração e avisa', async ({ page, isMobile }) => {
  await gotoApp(page)
  await openLogin(page)
  await signIn(page, 'bruno@nft.dev')
  await expect(page.getByRole('article').filter({ hasText: NEON })).toBeVisible()
  const heart = await cardHeart(page, NEON, isMobile)
  await expect(heart).toHaveAttribute('aria-pressed', 'false')

  await page.evaluate(() => localStorage.setItem('MOCK_SCENARIO', 'error-500'))
  await heart.click()
  await expect(page.getByText('Não foi possível favoritar. Tente novamente.')).toBeVisible()
  await expect(heart).toHaveAttribute('aria-pressed', 'false')
})
