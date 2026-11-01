import type { Page } from '@playwright/test'
import { test, expect, gotoApp } from '../support/test'
import { signIn } from '../support/auth'

/**
 * Regressão visual das 4 telas do SPEC com o seed inicial (dados determinísticos).
 * Carrossel parado (prefers-reduced-motion), animações desligadas e ferramentas de dev escondidas.
 */
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

const HIDE_DEV_TOOLS = String.raw`.z-\[9999\], [aria-label*="evtools" i], .tsqd-parent-container { visibility: hidden !important; }`

async function snapshot(page: Page, name: string) {
  // Carrega imagens "lazy" rolando a página e espera fontes e imagens.
  await page.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight)
    await new Promise((resolve) => setTimeout(resolve, 200))
    window.scrollTo(0, 0)
    await document.fonts.ready
  })
  // Só as imagens exibidas (as escondidas no mobile, com loading="lazy", nunca carregam).
  await page.waitForFunction(() =>
    [...document.images].filter((img) => img.getClientRects().length > 0).every((img) => img.complete && img.naturalWidth > 0),
  )
  await page.addStyleTag({ content: HIDE_DEV_TOOLS })
  await expect(page).toHaveScreenshot(`${name}-${test.info().project.name}.png`, { fullPage: true })
}

/** Violet Nomad #314 (1/50) no carrinho, como no fluxo real. */
async function addToCart(page: Page) {
  await gotoApp(page, '/nft/nft-05')
  await page.getByRole('radio', { name: '1/50' }).filter({ visible: true }).click()
  await page.getByRole('button', { name: /^Comprar( NFT)?$/ }).filter({ visible: true }).click()
  await expect(page).toHaveURL('/carrinho')
}

test('visual: Início', async ({ page }) => {
  await gotoApp(page)
  await expect(page.getByRole('article').first()).toBeVisible()
  await snapshot(page, 'inicio')
})

test('visual: Detalhe do NFT', async ({ page }) => {
  await gotoApp(page, '/nft/nft-01')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042', level: 1 }).filter({ visible: true })).toBeVisible()
  await snapshot(page, 'detalhe')
})

test('visual: Carrinho', async ({ page }) => {
  await addToCart(page)
  await expect(page.getByRole('term').filter({ hasText: /^Total$/ })).toBeVisible()
  await expect(page.getByText('1.406 ETH').first()).toBeVisible()
  await snapshot(page, 'carrinho')
})

test('visual: Pagamento', async ({ page }) => {
  await gotoApp(page, '/?auth=login')
  await signIn(page, 'ana@nft.dev')
  await addToCart(page)
  await gotoApp(page, '/pagamento')
  await expect(page.getByRole('status').filter({ hasText: 'MetaMask não conectada.' })).toBeVisible()
  await expect(page.getByText('1.406 ETH').first()).toBeVisible()
  await snapshot(page, 'pagamento')
})
