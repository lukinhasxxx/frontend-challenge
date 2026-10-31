import { test, expect } from '../support/test'

test('carrega o app com API e Socket.IO simulados', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('GET /api/health → ok')).toBeVisible()
  await expect(page.getByTestId('socket-status')).toHaveText('conectado')
})

test('rota inexistente mostra a página 404', async ({ page }) => {
  await page.goto('/rota/que/nao/existe')

  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao início' }).click()
  await expect(page).toHaveURL('/')
})
