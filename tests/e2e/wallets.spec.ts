import { test, expect, gotoApp } from '../support/test'
import { openLogin, signIn } from '../support/auth'

test.beforeEach(async ({ page }) => {
  await gotoApp(page, '/perfil')
  await openLogin(page)
  await signIn(page, 'bruno@nft.dev')
})

test('carteiras: consulta, validação, conflito da API e secundária persistida', async ({ page }) => {
  await gotoApp(page, '/perfil')
  await page.getByRole('link', { name: 'Carteiras' }).click()
  await expect(page).toHaveURL('/perfil/carteiras')

  // Consulta: principal do Bruno; sem secundária.
  const primary = page.getByRole('region', { name: 'Carteira principal' })
  await expect(primary.getByText('bruno.kurio.eth')).toBeVisible()
  await expect(page.getByText('Você ainda não adicionou uma carteira secundária.')).toBeVisible()

  // Validação local: endereço inválido e campo obrigatório vazio.
  await primary.getByRole('button', { name: 'Editar carteira principal' }).click()
  const form = page.getByRole('form', { name: 'Carteira principal' })
  await form.getByLabel('Endereço da carteira').fill('0x123')
  await form.getByLabel('Código de indicação').fill('')
  await form.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(form.getByLabel('Endereço da carteira')).toHaveAccessibleDescription('Use um endereço 0x com 40 caracteres hexadecimais.')
  await expect(form.getByLabel('Código de indicação')).toHaveAccessibleDescription('Informe o código de indicação.')
  await form.getByRole('button', { name: 'Cancelar' }).click()

  // Secundária "igual à principal": mesma rede e endereço → 409 da API no campo.
  const secondary = page.getByRole('region', { name: 'Carteira secundária' })
  await secondary.getByText('Igual à carteira principal').click()
  const secondaryForm = page.getByRole('form', { name: 'Carteira secundária' })
  await expect(secondaryForm.getByLabel('Endereço da carteira')).toHaveValue('0x4200000000000000000000000000000000000006')
  await secondaryForm.getByLabel('Apelido da carteira').fill('Reserva')
  await secondaryForm.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(secondaryForm.getByLabel('Endereço da carteira')).toHaveAccessibleDescription(
    'Este endereço já está cadastrado como carteira principal nesta rede.',
  )

  // Mesmo endereço em outra rede EVM é válido.
  await secondaryForm.getByLabel('Rede').selectOption('ethereum')
  await secondaryForm.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(secondary.getByText('Rede principal Ethereum')).toBeVisible()

  await page.reload()
  await page.locator('html[data-app-ready="true"]').waitFor({ state: 'attached' })
  await expect(page.getByRole('region', { name: 'Carteira secundária' }).getByText('Reserva')).toBeVisible()
})
