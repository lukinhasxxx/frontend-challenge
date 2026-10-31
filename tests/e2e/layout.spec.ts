import { test, expect, gotoApp } from '../support/test'

test('header desktop navega e marca a página ativa', async ({ page, isMobile }) => {
  test.skip(isMobile, 'header é exclusivo do desktop/tablet')
  await gotoApp(page)

  const nav = page.getByRole('navigation', { name: 'Principal' })
  await expect(nav.getByRole('link', { name: 'Início' })).toHaveAttribute('data-status', 'active')
  await page.getByRole('link', { name: 'Entrar' }).click()
  await expect(page).toHaveURL('/login')
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
})

test('barra de abas mobile substitui o header', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'barra de abas é exclusiva do mobile')
  await gotoApp(page, '/favoritos')

  await expect(page.getByRole('navigation', { name: 'Principal' })).toBeHidden()
  const tabs = page.getByRole('navigation', { name: 'Navegação inferior' })
  await expect(tabs.getByRole('link', { name: 'Favoritos' })).toHaveAttribute('data-status', 'active')
  await expect(page.getByRole('contentinfo')).toBeHidden() // Figma mobile não tem footer

  await tabs.getByRole('button', { name: 'Escanear NFT (em desenvolvimento)' }).click()
  await expect(page.getByText('Este recurso está em desenvolvimento.')).toBeVisible()

  await tabs.getByRole('link', { name: 'Carrinho' }).click()
  await expect(page).toHaveURL('/carrinho')
})

test('páginas editoriais do menu avisam que estão em desenvolvimento', async ({ page, isMobile }) => {
  test.skip(isMobile, 'menu é exclusivo do desktop/tablet')
  await gotoApp(page)
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('button', { name: 'Criadores (em desenvolvimento)' }).click()
  await expect(page.getByText('"Criadores" estará disponível em uma próxima versão.')).toBeVisible()
})

test('sem rolagem horizontal em 390, 768 e 1440 px', async ({ page }) => {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await gotoApp(page, '/dev/ui')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, `largura ${width}`).toBeLessThanOrEqual(0)
  }
})

test('link "pular para o conteúdo" é o primeiro foco', async ({ page }) => {
  await gotoApp(page)
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused()
})

test('ações fora do escopo avisam em vez de simular sucesso', async ({ page, isMobile }) => {
  test.skip(isMobile, 'o footer só existe a partir de 768px')
  await gotoApp(page)
  await page.getByRole('button', { name: 'Central de ajuda (em desenvolvimento)' }).click()
  await expect(page.getByText('Este recurso está em desenvolvimento.')).toBeVisible()
  await expect(page.getByText('"Central de ajuda" estará disponível em uma próxima versão.')).toBeVisible()

  await page.getByLabel('E-mail').fill('ana@nft.dev')
  await page.getByRole('button', { name: 'Enviar' }).click()
  await expect(page.getByText('"Newsletter" estará disponível em uma próxima versão.')).toBeVisible()
})
