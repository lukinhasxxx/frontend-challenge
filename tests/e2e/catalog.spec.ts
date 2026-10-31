import type { Page } from '@playwright/test'
import { test, expect, gotoApp } from '../support/test'
import { apiNames } from '../support/mock'

/** Nomes dos cards visíveis na grade, na ordem. */
async function gridNames(page: Page) {
  const grid = page.locator('#mercado ul[aria-busy="false"]')
  await expect(grid).toBeVisible()
  return grid.getByRole('heading', { level: 3 }).allTextContents()
}

async function expectGridMatchesApi(page: Page) {
  const query = new URL(page.url()).searchParams
  const expected = await apiNames(page, query.toString())
  await expect.poll(() => gridNames(page)).toEqual(expected)
}

test.describe('catálogo no desktop (≥ 1024px)', () => {
  test.skip(({ isMobile }) => isMobile, 'sidebar é exclusiva do desktop')

  test('busca, filtros combinados e ordenação compõem a URL', async ({ page }) => {
    await gotoApp(page)

    await page.getByRole('button', { name: 'Buscar NFTs' }).click()
    await page.getByLabel('Termo de busca').fill('Golden')
    await page.getByRole('button', { name: 'Buscar', exact: true }).click()
    await expect(page).toHaveURL(/q=Golden/)
    await expect(page.getByText('Resultados para')).toBeVisible()
    await expectGridMatchesApi(page)
    for (const name of await page.locator('#mercado article h3').allTextContents()) expect(name).toContain('Golden')

    await page.getByRole('button', { name: 'Limpar busca' }).click()
    const sidebar = page.getByRole('complementary', { name: 'Filtros' })
    await sidebar.getByRole('button', { name: /^Arte digital/ }).click()
    await sidebar.getByRole('button', { name: /^Polygon/ }).click()
    await expect(page).toHaveURL(/category=digital-art/)
    await expect(page).toHaveURL(/network=polygon/)
    await expect(sidebar.getByRole('button', { name: /^Polygon/ })).toHaveAttribute('aria-pressed', 'true')
    await expectGridMatchesApi(page)

    await page.getByRole('combobox', { name: 'Ordenar por:' }).click()
    await page.getByRole('option', { name: 'Maior preço' }).click()
    await expect(page).toHaveURL(/sort=price-desc/)
    await expectGridMatchesApi(page)
  })

  test('paginação, refresh e histórico restauram o estado; filtro volta à página 1', async ({ page }) => {
    await gotoApp(page)
    const firstPage = await gridNames(page)

    await page.getByRole('link', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expectGridMatchesApi(page)
    const secondPage = await gridNames(page)
    expect(secondPage).not.toEqual(firstPage)

    await page.reload()
    await expect(page).toHaveURL(/page=2/)
    await expect.poll(() => gridNames(page)).toEqual(secondPage)

    await page.goBack()
    await expect(page).not.toHaveURL(/page=2/)
    await expect.poll(() => gridNames(page)).toEqual(firstPage)
    await page.goForward()
    await expect.poll(() => gridNames(page)).toEqual(secondPage)

    await page.getByRole('button', { name: 'Em alta', exact: true }).click()
    await expect(page).toHaveURL(/tab=trending/)
    await expect(page).not.toHaveURL(/page=/)
    await expectGridMatchesApi(page)
  })

  test('faixa de preço aplica mínimo e máximo', async ({ page }) => {
    await gotoApp(page)
    const max = page.getByRole('slider', { name: 'Preço máximo' })
    await max.focus()
    for (let i = 0; i < 20; i++) await page.keyboard.press('PageDown')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page).toHaveURL(/maxPrice=/)
    await expectGridMatchesApi(page)
  })

  test('link de coleção no footer aplica o filtro de categoria', async ({ page }) => {
    await gotoApp(page)
    await page.getByRole('contentinfo').getByRole('link', { name: 'Fotografia' }).click()
    await expect(page).toHaveURL(/category=photography/)
    await expect(page.getByRole('complementary', { name: 'Filtros' }).getByRole('button', { name: /^Fotografia/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})

test.describe('cenário out-of-order', () => {
  test.use({ scenario: 'out-of-order' })
  test.skip(({ isMobile }) => isMobile, 'usa a sidebar do desktop')

  test('resposta antiga e lenta não sobrescreve o filtro mais recente', async ({ page }) => {
    await gotoApp(page)
    const sidebar = page.getByRole('complementary', { name: 'Filtros' })
    // A 1ª requisição demora mais que a 2ª (o cenário inverte a ordem das respostas).
    await sidebar.getByRole('button', { name: /^Música/ }).click()
    await sidebar.getByRole('button', { name: /^Fotografia/ }).click()
    await expect(page).toHaveURL(/category=photography/)
    await page.waitForTimeout(2_500)
    await expectGridMatchesApi(page)
  })
})

test.describe('catálogo no mobile (< 768px)', () => {
  test.skip(({ isMobile }) => !isMobile, 'barra de busca e painel são do mobile')

  test('busca com debounce e filtros pelo painel', async ({ page }) => {
    await gotoApp(page)
    await page.getByRole('searchbox', { name: 'Buscar NFTs' }).fill('Sage')
    await expect(page).toHaveURL(/q=Sage/)
    await expectGridMatchesApi(page)

    await page.getByRole('button', { name: 'Abrir filtros' }).click()
    const sheet = page.getByRole('dialog', { name: 'Filtros' })
    await sheet.getByRole('button', { name: /^Ethereum/ }).click()
    await expect(page).toHaveURL(/network=ethereum/)
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
    await expectGridMatchesApi(page)
  })
})
