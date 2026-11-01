import type { Locator, Page } from '@playwright/test'
import { test, expect, gotoApp } from '../support/test'

/** O elemento focado está dentro de `container`? */
const focusInside = (container: Locator) => container.evaluate((el) => el.contains(document.activeElement))

/** Tab (e Shift+Tab) várias vezes: o foco nunca sai do diálogo. */
async function expectFocusTrapped(page: Page, container: Locator, presses = 12) {
  for (const key of ['Tab', 'Shift+Tab']) {
    for (let i = 0; i < presses; i++) {
      await page.keyboard.press(key)
      expect(await focusInside(container), `${key} #${i + 1}`).toBe(true)
    }
  }
}

test('§9.11 login pelo teclado: foco inicial, foco preso, Esc fecha e devolve o foco', async ({ page, isMobile }) => {
  test.skip(isMobile, 'o botão "Entrar" do header só existe a partir de 768px')
  await gotoApp(page)
  const trigger = page.getByRole('link', { name: 'Entrar' })
  await trigger.focus()
  await page.keyboard.press('Enter')

  const dialog = page.getByRole('dialog', { name: 'Entrar' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('E-mail')).toBeFocused()
  await expectFocusTrapped(page, dialog)

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('§9.11 validação: Enter envia, erros ligados aos campos, foco no primeiro inválido e erro da API anunciado', async ({ page }) => {
  await gotoApp(page, '/?auth=login')
  const dialog = page.getByRole('dialog')
  const email = dialog.getByLabel('E-mail')
  const password = dialog.getByLabel('Senha', { exact: true })
  await expect(email).toBeFocused()

  await page.keyboard.press('Enter')
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(email).toHaveAccessibleDescription('Informe seu e-mail.')
  await expect(password).toHaveAccessibleDescription('Informe sua senha.')
  await expect(email).toBeFocused()

  await page.keyboard.type('ana@nft.dev')
  await page.keyboard.press('Tab')
  await expect(password).toBeFocused()
  await page.keyboard.type('Errada@123')
  await page.keyboard.press('Enter')
  await expect(dialog.getByRole('alert').filter({ hasText: 'E-mail ou senha incorretos.' })).toBeVisible()
})

test('§9.11 busca (desktop) e filtros (mobile): painel prende o foco e devolve ao botão', async ({ page, isMobile }) => {
  await gotoApp(page)
  const trigger = isMobile ? page.getByRole('button', { name: 'Abrir filtros' }) : page.getByRole('button', { name: 'Buscar NFTs' })
  await trigger.focus()
  await page.keyboard.press('Enter')

  const panel = page.getByRole('dialog', { name: isMobile ? 'Filtros' : 'Buscar NFTs' })
  await expect(panel).toBeVisible()
  expect(await focusInside(panel)).toBe(true)
  await expectFocusTrapped(page, panel, 6)

  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('§9.11 catálogo pelo teclado: foco visível e Enter abre o detalhe', async ({ page }) => {
  await gotoApp(page)
  const firstCard = page.getByRole('article').first()
  await expect(firstCard).toBeVisible()
  const link = firstCard.getByRole('link').first()

  // Tab até o primeiro link do card, sem usar o mouse.
  for (let i = 0; i < 80 && !(await link.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab')
  await expect(link).toBeFocused()
  // O anel de foco fica no próprio link ou no card inteiro (link "esticado" sobre o card).
  const outline = await link.evaluate((el) => {
    const visible = (node: Element) => {
      const style = getComputedStyle(node)
      return (style.outlineStyle !== 'none' && style.outlineWidth !== '0px') || style.boxShadow !== 'none'
    }
    return visible(el) || visible(el.closest('article')!)
  })
  expect(outline, 'foco visível no link do card').toBe(true)

  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/nft\/nft-/)
})
