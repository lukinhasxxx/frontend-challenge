import type { Page } from '@playwright/test'
import { test, expect, gotoApp } from '../support/test'
import { signIn } from '../support/auth'
import { callApi } from '../support/mock'

const PNG_1PX = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

const form = (page: Page) => page.getByRole('form', { name: 'Perfil do colecionador' })
const save = (page: Page) => form(page).getByRole('button', { name: 'Salvar' }).click()

test.beforeEach(async ({ page }) => {
  await gotoApp(page, '/?auth=login')
  await signIn(page, 'ana@nft.dev')
  await gotoApp(page, '/perfil')
  await expect(form(page).getByLabel('Nome de exibição')).toHaveValue('Ana Souza')
})

test('§9.8 perfil: validação, conflito da API, avatar e persistência', async ({ page, isMobile }) => {
  const f = form(page)

  // Validação local ligada aos campos.
  await f.getByLabel('Nome de exibição').fill('')
  await f.getByLabel('Nome de usuário').fill('ana souza')
  await save(page)
  await expect(f.getByLabel('Nome de exibição')).toHaveAccessibleDescription('Informe o nome de exibição.')
  await expect(f.getByLabel('Nome de usuário')).toHaveAccessibleDescription('Use de 3 a 30 letras, números, ponto ou sublinhado.')
  await expect(f.getByLabel('Nome de exibição')).toBeFocused()

  // Erro da API (e-mail de outra conta) no campo.
  await f.getByLabel('Nome de exibição').fill('Mariana Souza')
  await f.getByLabel('Nome de usuário').fill('mariana.souza')
  await f.getByLabel('E-mail').fill('bruno@nft.dev')
  await save(page)
  await expect(f.getByLabel('E-mail')).toHaveAccessibleDescription('Este e-mail já está cadastrado.')

  // Avatar: tipo inválido recusado; PNG vira Data URL (reduzido) e só é aplicado ao salvar.
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles({ name: 'notas.txt', mimeType: 'text/plain', buffer: Buffer.from('oi') })
  await expect(page.getByText('Use uma imagem PNG, JPG ou WebP.')).toBeVisible()
  await fileInput.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG_1PX })
  await expect(f.getByRole('img', { name: 'Seu avatar' })).toHaveAttribute('src', /^data:image\/webp;base64,/)

  await f.getByLabel('E-mail').fill('mariana@nft.dev')
  await save(page)
  await expect(page.getByText('Perfil atualizado.')).toBeVisible()
  if (!isMobile) await expect(page.getByRole('link', { name: 'Mariana' })).toBeVisible() // header atualizado na hora

  await page.reload()
  await page.locator('html[data-app-ready="true"]').waitFor({ state: 'attached' })
  await expect(f.getByLabel('Nome de exibição')).toHaveValue('Mariana Souza')
  await expect(f.getByLabel('E-mail')).toHaveValue('mariana@nft.dev')
  await expect(f.getByRole('img', { name: 'Seu avatar' })).toHaveAttribute('src', /^data:image\/webp;base64,/)

  // Remover avatar também persiste.
  await f.getByRole('button', { name: 'Remover avatar' }).click()
  await save(page)
  await expect(page.getByText('Perfil atualizado.')).toBeVisible()
  await page.reload()
  await expect(form(page).getByRole('img', { name: 'Sem avatar' })).toBeVisible()
})

test('§9.8 senha: requisitos, senha atual incorreta (API) e login com a nova', async ({ page }) => {
  const f = form(page)
  const current = f.getByLabel('Senha atual')
  const next = f.getByLabel('Nova senha', { exact: true })
  const confirm = f.getByLabel('Confirmar nova senha')

  await next.fill('fraca')
  await confirm.fill('outra')
  await save(page)
  await expect(current).toHaveAccessibleDescription('Informe a senha atual.')
  await expect(next).toHaveAccessibleDescription('A senha deve ter ao menos 8 caracteres.')
  await expect(confirm).toHaveAccessibleDescription('As senhas não coincidem.')

  await current.fill('Errada@123')
  await next.fill('Nova@12345')
  await confirm.fill('Nova@12345')
  await save(page)
  await expect(current).toHaveAccessibleDescription('Senha atual incorreta.')

  await current.fill('Senha@123')
  await save(page)
  await expect(page.getByText('Perfil e senha atualizados.')).toBeVisible()
  await expect(current).toHaveValue('')

  // A senha nova vale no próximo login; a antiga não.
  await callApi(page, 'POST', '/api/auth/logout')
  await page.evaluate(() => localStorage.removeItem('auth-token'))
  const old = await callApi(page, 'POST', '/api/auth/login', { email: 'ana@nft.dev', password: 'Senha@123' })
  expect(old.status).toBe(401)
  await gotoApp(page, '/?auth=login')
  await signIn(page, 'ana@nft.dev', 'Nova@12345')
  await gotoApp(page, '/perfil')
  await expect(form(page).getByLabel('Nome de exibição')).toHaveValue('Ana Souza')
})
