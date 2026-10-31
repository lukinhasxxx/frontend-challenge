import { test, expect, gotoApp } from '../support/test'

test.describe('cenário slow', () => {
  test.use({ scenario: 'slow' })

  test('mostra skeletons enquanto carrega e depois os cards', async ({ page }) => {
    await gotoApp(page)
    await expect(page.getByRole('list', { name: 'Carregando NFTs' })).toBeVisible()
    await expect(page.getByRole('article').filter({ hasText: 'Emerald Ape #042' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('list', { name: 'Carregando NFTs' })).toHaveCount(0)
  })

  test('detalhe mostra skeleton antes dos dados', async ({ page }) => {
    await gotoApp(page, '/nft/nft-01')
    await expect(page.getByLabel('Carregando NFT')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Emerald Ape #042' }).filter({ visible: true })).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('cenário error-500', () => {
  test.use({ scenario: 'error-500' })

  test('mostra erro e recupera ao tentar novamente', async ({ page }) => {
    await gotoApp(page)
    // O Query tenta 2 vezes antes de exibir o erro (falha transitória).
    const alert = page.getByRole('alert').filter({ hasText: 'Não foi possível carregar os NFTs.' })
    await expect(alert).toBeVisible({ timeout: 15_000 })

    await page.evaluate(() => localStorage.setItem('MOCK_SCENARIO', 'default'))
    await alert.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('article').filter({ hasText: 'Emerald Ape #042' })).toBeVisible()
  })
})

test.describe('cenário empty', () => {
  test.use({ scenario: 'empty' })

  test('mostra estado vazio', async ({ page }) => {
    await gotoApp(page)
    await expect(page.getByText('Nenhum NFT encontrado.')).toBeVisible()
  })
})
