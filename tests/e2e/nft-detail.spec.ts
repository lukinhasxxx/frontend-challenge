import { test, expect, gotoApp } from '../support/test'

test('acesso direto ao detalhe mostra dados do NFT', async ({ page }) => {
  await gotoApp(page, '/nft/nft-01')
  // Desktop e mobile coexistem no DOM (um oculto por CSS): checamos só o visível.
  const visible = (text: string) => page.getByText(text, { exact: true }).filter({ visible: true })
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042', level: 1 }).filter({ visible: true })).toBeVisible()
  await expect(visible('#0042')).toBeVisible()
  await expect(visible('Óculos, Esmeralda, Raro')).toBeVisible()
})

test('NFT inexistente mostra estado de não encontrado', async ({ page }) => {
  await gotoApp(page, '/nft/nao-existe')
  await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao mercado' }).click()
  await expect(page).toHaveURL(/\/#mercado$/)
})

test('edição esgotada é indisponível e a quantidade respeita o estoque', async ({ page, isMobile }) => {
  await gotoApp(page, '/nft/nft-01')
  const scope = isMobile ? page.locator('div.md\\:hidden').first() : page.locator('div.md\\:flex').first()

  // 1/1 do Emerald Ape está esgotada na fixture.
  await expect(scope.getByRole('radio', { name: '1/1 (esgotada)' })).toBeDisabled()

  const increase = page.getByRole('button', { name: 'Aumentar quantidade' }).filter({ visible: true })
  const quantity = page.getByRole('group', { name: 'Quantidade' }).filter({ visible: true }).locator('output')
  await scope.getByRole('radio', { name: '1/10' }).click()
  for (let i = 0; i < 20 && (await increase.isEnabled()); i++) await increase.click()
  await expect(increase).toBeDisabled()
  // Aviso só para leitores de tela (não está no Figma): existe, mas não desloca o layout.
  await expect(scope.getByRole('status').filter({ hasText: /Máximo disponível: \d+$/ })).toBeAttached()
  const max = Number(await quantity.textContent())
  expect(max).toBeGreaterThan(1)
})

test('mobile esconde a barra de abas e mostra a barra de compra', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'layout mobile')
  await gotoApp(page, '/nft/nft-01')
  await expect(page.getByRole('navigation', { name: 'Navegação inferior' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Comprar NFT' })).toBeVisible()
})
