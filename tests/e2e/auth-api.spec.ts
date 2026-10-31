import type { Page } from '@playwright/test'
import { test, expect, gotoApp } from '../support/test'

type JsonResult = { status: number; body: Record<string, unknown> | null }

/** Chama a API de dentro da página (passa pelo service worker do MSW). */
function call(page: Page, method: string, url: string, body?: unknown, token?: string) {
  return page.evaluate(
    async ({ method, url, body, token }): Promise<JsonResult> => {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      const text = await response.text()
      return { status: response.status, body: text ? JSON.parse(text) : null }
    },
    { method, url, body, token },
  )
}

test.beforeEach(async ({ page }) => {
  await gotoApp(page)
})

test('login, sessão e logout', async ({ page }) => {
  const login = await call(page, 'POST', '/api/auth/login', { email: 'ana@nft.dev', password: 'Senha@123' })
  expect(login.status).toBe(200)
  const token = login.body?.token as string
  expect(login.body?.user).toMatchObject({ email: 'ana@nft.dev' })
  expect(login.body?.user).not.toHaveProperty('passwordHash')

  expect((await call(page, 'GET', '/api/auth/session', undefined, token)).status).toBe(200)
  expect((await call(page, 'POST', '/api/auth/logout', undefined, token)).status).toBe(204)

  const after = await call(page, 'GET', '/api/auth/session', undefined, token)
  expect(after.status).toBe(401)
  expect(after.body?.code).toBe('UNAUTHENTICATED')
})

test('credenciais inválidas e validação', async ({ page }) => {
  const wrong = await call(page, 'POST', '/api/auth/login', { email: 'ana@nft.dev', password: 'errada' })
  expect(wrong.status).toBe(401)
  expect(wrong.body?.code).toBe('INVALID_CREDENTIALS')

  const invalid = await call(page, 'POST', '/api/auth/register', { name: 'A', email: 'x', password: '123' })
  expect(invalid.status).toBe(422)
  expect(invalid.body?.fieldErrors).toMatchObject({ name: expect.any(String), email: expect.any(String), password: expect.any(String) })
})

test('cadastro cria usuário com senha hasheada e detecta conflito de e-mail', async ({ page }) => {
  const payload = { name: 'Carla Teste', email: 'carla@nft.dev', password: 'Segredo123' }
  const created = await call(page, 'POST', '/api/auth/register', payload)
  expect(created.status).toBe(201)

  const conflict = await call(page, 'POST', '/api/auth/register', { ...payload, email: 'CARLA@nft.dev' })
  expect(conflict.status).toBe(409)
  expect(conflict.body?.fieldErrors).toMatchObject({ email: expect.any(String) })

  const storedDb = await page.evaluate(() => localStorage.getItem('mock-db:v1') ?? '')
  expect(storedDb).toContain('carla@nft.dev')
  expect(storedDb).not.toContain('Segredo123')
})

test.describe('cenário expired-session', () => {
  test.use({ scenario: 'expired-session' })

  test('rotas autenticadas retornam SESSION_EXPIRED', async ({ page }) => {
    const login = await call(page, 'POST', '/api/auth/login', { email: 'bruno@nft.dev', password: 'Senha@123' })
    const session = await call(page, 'GET', '/api/auth/session', undefined, login.body?.token as string)
    expect(session.status).toBe(401)
    expect(session.body?.code).toBe('SESSION_EXPIRED')
  })
})
