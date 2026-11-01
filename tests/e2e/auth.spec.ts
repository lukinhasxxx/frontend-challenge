import type { Page } from '@playwright/test'
import { test, expect, gotoApp } from '../support/test'
import { callApi, waitForRealtime } from '../support/mock'

const PASSWORD = 'Senha@123'
const dialog = (page: Page) => page.getByRole('dialog')
const token = (page: Page) => page.evaluate(() => localStorage.getItem('auth-token'))

/** Tudo o que está no cache do TanStack Query, serializado (para provar que não há dados de outra conta). */
const cacheDump = (page: Page) =>
  page.evaluate(() => {
    const client = Reflect.get(window, '__TANSTACK_QUERY_CLIENT__') as {
      getQueryCache: () => { getAll: () => { queryKey: unknown; state: { data: unknown } }[] }
    }
    return JSON.stringify(client.getQueryCache().getAll().map((query) => [query.queryKey, query.state.data]))
  })

async function signIn(page: Page, email: string, password = PASSWORD) {
  const form = dialog(page)
  await form.getByLabel('E-mail').fill(email)
  await form.getByLabel('Senha', { exact: true }).fill(password)
  await form.getByRole('button', { name: 'Entrar', exact: true }).click()
}

/** Desktop: link com o nome no header; mobile: aba "Perfil". */
function profileEntry(page: Page, isMobile: boolean, name: string) {
  return isMobile
    ? page.getByRole('navigation', { name: 'Navegação inferior' }).getByRole('link', { name: 'Perfil' })
    : page.getByRole('banner').getByRole('link', { name })
}

test('rota privada abre o login e volta para ela após entrar; refresh mantém a sessão', async ({ page }) => {
  await gotoApp(page, '/perfil')
  await expect(page).toHaveURL(/auth=login&redirect=%2Fperfil/)
  await expect(dialog(page)).toBeVisible()

  await signIn(page, 'ana@nft.dev', 'senha-errada')
  await expect(dialog(page).getByRole('alert')).toHaveText('E-mail ou senha incorretos.')

  await signIn(page, 'ana@nft.dev')
  await expect(page).toHaveURL('/perfil')
  await expect(dialog(page)).toBeHidden()
  await expect(page.getByText('ana@nft.dev')).toBeVisible()

  await page.reload()
  await page.locator('html[data-app-ready="true"]').waitFor({ state: 'attached' })
  await expect(page.getByText('ana@nft.dev')).toBeVisible()
})

test('cadastro valida campos (aria-describedby), trata e-mail existente e cria a conta', async ({ page }) => {
  await gotoApp(page, '/?auth=register')
  const form = dialog(page)
  const name = form.getByLabel('Nome de usuário')
  const email = form.getByLabel('E-mail')
  const submit = form.getByRole('button', { name: /^Criar (conta|perfil)$/ })

  await submit.click()
  await expect(name).toHaveAttribute('aria-invalid', 'true')
  await expect(name).toHaveAccessibleDescription(/Informe seu nome de usuário/)
  await expect(name).toBeFocused()

  await name.fill('Carla Dias')
  await email.fill('ana@nft.dev')
  await form.getByLabel('Senha', { exact: true }).fill('senha1234')
  await form.getByLabel('Confirmar senha').fill('outra1234')
  await submit.click()
  await expect(form.getByLabel('Confirmar senha')).toHaveAccessibleDescription('As senhas não coincidem.')

  await form.getByLabel('Confirmar senha').fill('senha1234')
  await submit.click()
  // 409 da API ligado ao campo de e-mail.
  await expect(email).toHaveAccessibleDescription('Este e-mail já está cadastrado.')
  await expect(email).toBeFocused()

  await email.fill('carla@nft.dev')
  await submit.click()
  await expect(dialog(page)).toBeHidden()
  await expect.poll(() => token(page)).not.toBeNull()
})

test('sessão expirada durante a navegação reabre o login e retoma o destino', async ({ page, isMobile }) => {
  await gotoApp(page, '/perfil')
  await signIn(page, 'ana@nft.dev')
  // Espera a rota terminar de carregar (a revalidação da sessão ao entrar já respondeu).
  await expect(page.getByText('ana@nft.dev')).toBeVisible()

  expect((await callApi(page, 'POST', '/__mock/session/expire')).status).toBe(204)
  await page.getByRole('link', { name: 'Início', exact: true }).first().click()
  await profileEntry(page, isMobile, 'Ana').click()

  await expect(dialog(page).getByRole('alert')).toHaveText('Sua sessão expirou. Entre novamente para continuar de onde parou.')
  await expect.poll(() => token(page)).toBeNull()

  await signIn(page, 'ana@nft.dev')
  await expect(page).toHaveURL('/perfil')
  await expect(page.getByText('ana@nft.dev')).toBeVisible()
})

test('desistir de entrar após expirar encerra a sessão anterior', async ({ page }) => {
  await gotoApp(page, '/perfil')
  await signIn(page, 'ana@nft.dev')
  await expect(page.getByText('ana@nft.dev')).toBeVisible()

  await callApi(page, 'POST', '/__mock/session/expire')
  await page.reload()
  await page.locator('html[data-app-ready="true"]').waitFor({ state: 'attached' })
  await expect(dialog(page).getByRole('alert')).toContainText('Sua sessão expirou')

  await page.keyboard.press('Escape')
  await expect(dialog(page)).toBeHidden()
  await expect(page).toHaveURL('/')
  expect(await cacheDump(page)).not.toContain('ana@nft.dev')
})

test('logout e troca de usuário não deixam dados da conta anterior', async ({ page, isMobile }) => {
  await gotoApp(page, '/perfil')
  await signIn(page, 'ana@nft.dev')
  await expect(page.getByText('ana@nft.dev')).toBeVisible()
  expect(await cacheDump(page)).toContain('ana@nft.dev')

  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL('/')
  await expect.poll(() => token(page)).toBeNull()
  expect(await cacheDump(page)).not.toContain('ana@nft.dev')
  // Socket reaberto como visitante (sem o token da Ana).
  await waitForRealtime(page)

  await profileEntry(page, isMobile, 'Entrar').click()
  if (!isMobile) await expect(page).toHaveURL(/auth=login/)
  else await expect(page).toHaveURL(/auth=login&redirect=%2Fperfil/)
  await signIn(page, 'bruno@nft.dev')
  if (!isMobile) await page.getByRole('banner').getByRole('link', { name: 'Bruno' }).click()
  await expect(page.getByText('bruno@nft.dev')).toBeVisible()
  expect(await cacheDump(page)).not.toContain('ana@nft.dev')
})

test('redirect para fora do site é ignorado', async ({ page }) => {
  await gotoApp(page, '/?auth=login&redirect=//evil.example/roubo')
  await signIn(page, 'ana@nft.dev')
  await expect(dialog(page)).toBeHidden()
  await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/)
})
