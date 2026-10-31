import { test, expect, gotoApp } from '../support/test'
import { waitForRealtime } from '../support/mock'

test('carrega a Home com catálogo e Socket.IO simulados', async ({ page }) => {
  await gotoApp(page)
  await expect(page.getByRole('article').filter({ hasText: 'Emerald Ape #042' })).toBeVisible()
  await waitForRealtime(page)
})

test('rota inexistente mostra a página 404', async ({ page }) => {
  await gotoApp(page, '/rota/que/nao/existe')

  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao início' }).click()
  await expect(page).toHaveURL('/')
})
