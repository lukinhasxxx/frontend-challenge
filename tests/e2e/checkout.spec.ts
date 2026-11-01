import type { Page } from '@playwright/test'
import { test, expect, gotoApp } from '../support/test'
import { setEdition, signIn } from '../support/auth'
import { callApi, waitForRealtime } from '../support/mock'

// Violet Nomad #314 (nft-05), edição 1/50 — preço e estoque fixados em cada teste.
const NFT = 'nft-05'
const EDITION = 'nft-05-1of50'
const NAME = 'Violet Nomad #314'

const visible = (page: Page, role: Parameters<Page['getByRole']>[0], name: string | RegExp) =>
  page.getByRole(role, { name }).filter({ visible: true })

const useScenario = (page: Page, scenario: string) => page.evaluate((value) => localStorage.setItem('MOCK_SCENARIO', value), scenario)

/** Ana logada, `quantity` unidades da edição no carrinho, já em /pagamento com a MetaMask conectada. */
async function toPayment(page: Page, quantity = 1) {
  await gotoApp(page, '/?auth=login')
  await signIn(page, 'ana@nft.dev')
  await setEdition(page, NFT, EDITION, { available: 5, priceEth: '1.3900' })
  await gotoApp(page, `/nft/${NFT}`)
  await visible(page, 'radio', '1/50').click()
  for (let i = 1; i < quantity; i++) await visible(page, 'button', 'Aumentar quantidade').click()
  await visible(page, 'button', /^Comprar( NFT)?$/).click()
  await expect(page).toHaveURL('/carrinho')
  await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL('/pagamento')
  await page.getByRole('button', { name: 'Conectar MetaMask' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'MetaMask conectada' })).toBeVisible()
}

/** "Confirmar compra" → revisão → "Confirmar e pagar". */
async function confirmPurchase(page: Page) {
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  const review = page.getByRole('dialog', { name: 'Revise seu pedido' })
  await review.getByRole('button', { name: 'Confirmar e pagar' }).click()
  return review
}

const receiptTitle = (page: Page) => page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })
const pendingTitle = (page: Page) => page.getByRole('heading', { name: 'Aguardando confirmação do pagamento' })
const cartQuantity = (page: Page) => page.getByRole('group', { name: `Quantidade de ${NAME} (1/50)` }).locator('output')

test.describe('pagamento retido (payment-pending)', () => {
  test.use({ scenario: 'payment-pending' })

  test('§9.6 compra completa até o recibo: snapshot imutável e só o comprado sai do carrinho', async ({ page }) => {
    await toPayment(page, 2)
    await confirmPurchase(page)
    await expect(page).toHaveURL(/\/pedidos\/ord-/)
    await expect(pendingTitle(page)).toBeVisible()

    // Enquanto o pagamento está pendente, mais uma unidade entra no carrinho.
    const { body: detail } = await callApi<{ editions: { id: string }[] }>(page, 'GET', `/api/nfts/${NFT}`)
    expect(detail.editions.some((e) => e.id === EDITION)).toBe(true)
    await page.evaluate(
      async ({ nftId, editionId }) => {
        await fetch('/api/cart/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
            'X-Guest-Id': localStorage.getItem('guest-id') ?? '',
          },
          body: JSON.stringify({ nftId, editionId, quantity: 1 }),
        })
      },
      { nftId: NFT, editionId: EDITION },
    )

    await callApi(page, 'POST', '/__mock/orders/settle', { status: 'confirmed' })
    await expect(receiptTitle(page)).toBeVisible()
    const row = page.getByRole('row').filter({ hasText: NAME })
    await expect(row).toContainText('(x 2)')
    await expect(row).toContainText('2.78 ETH')
    await expect(page.getByRole('link', { name: /Ver no Etherscan/ })).toHaveAttribute('href', /^https:\/\/etherscan\.io\/tx\/0x[0-9a-f]{64}$/)

    // Mudança de preço depois da compra não altera o recibo.
    await setEdition(page, NFT, EDITION, { priceEth: '5.0000' })
    await page.reload()
    await expect(receiptTitle(page)).toBeVisible()
    await expect(page.getByRole('row').filter({ hasText: NAME })).toContainText('2.78 ETH')

    // Saíram só as 2 unidades compradas; a adicionada depois continua.
    await gotoApp(page, '/carrinho')
    await expect(cartQuantity(page)).toHaveText('1')
  })

  test('§9.10 queda do socket com pedido pendente, refresh, duplicatas e evento antigo', async ({ page }) => {
    await toPayment(page)
    await confirmPurchase(page)
    await expect(pendingTitle(page)).toBeVisible()

    // Refresh: o pedido pendente é recuperado pela API, sem nova compra.
    await page.reload()
    await expect(pendingTitle(page)).toBeVisible()
    await waitForRealtime(page)

    // O pagamento é confirmado enquanto o socket está fora: o evento se perde...
    await callApi(page, 'POST', '/__mock/socket/drop', { downForMs: 3_000 })
    await page.locator('html[data-realtime="disconnected"]').waitFor({ state: 'attached' })
    await callApi(page, 'POST', '/__mock/orders/settle', { status: 'confirmed' })
    await expect(pendingTitle(page)).toBeVisible()
    // ...e a reconexão reconcilia com a API REST.
    await waitForRealtime(page)
    await expect(receiptTitle(page)).toBeVisible()

    // Duplicata (mesmo eventId) e versão antiga ("pendente") não regridem o pedido terminal.
    expect((await callApi(page, 'POST', '/__mock/events/replay-last')).status).toBe(200)
    expect((await callApi(page, 'POST', '/__mock/events/stale')).status).toBe(200)
    await page.waitForTimeout(500)
    await expect(receiptTitle(page)).toBeVisible()
    await expect(pendingTitle(page)).toHaveCount(0)
    const orders = await callApi<{ pendingOrders: unknown[] }>(page, 'GET', '/__mock/state')
    expect(orders.body.pendingOrders).toHaveLength(0)
  })
})

test.describe('pagamento recusado (payment-declined)', () => {
  test.use({ scenario: 'payment-declined' })

  test('§9.7 recusa do pagamento preserva o carrinho e não mostra recibo', async ({ page }) => {
    await toPayment(page, 2)
    await confirmPurchase(page)
    await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible()
    await expect(page.getByText('Seus itens continuam no carrinho.')).toBeVisible()
    await expect(receiptTitle(page)).toHaveCount(0)

    await page.getByRole('link', { name: 'Voltar ao carrinho' }).click()
    await expect(cartQuantity(page)).toHaveText('2')
  })
})

test('§9.7 clique repetido envia um pedido; o padrão confirma sozinho via order.updated', async ({ page }) => {
  await toPayment(page)
  const posts: number[] = []
  page.on('response', (response) => {
    if (response.url().endsWith('/api/orders') && response.request().method() === 'POST') posts.push(response.status())
  })
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await page.getByRole('dialog', { name: 'Revise seu pedido' }).getByRole('button', { name: 'Confirmar e pagar' }).dblclick()

  await expect(receiptTitle(page)).toBeVisible({ timeout: 10_000 })
  expect(posts).toEqual([201])
})

test('§9.7 timeout após criar o pedido: reenviar recupera o mesmo pedido; mesma chave com outro corpo = 409', async ({ page }) => {
  test.setTimeout(60_000)
  await toPayment(page)
  await useScenario(page, 'timeout')
  const review = await confirmPurchase(page)
  await expect(review.getByRole('alert')).toContainText('Não recebemos a resposta', { timeout: 15_000 })
  const attempt = await page.evaluate(() => JSON.parse(sessionStorage.getItem('checkout-attempt')!) as { key: string; body: Record<string, unknown> })

  // Mesmo no cenário timeout, a repetição idempotente responde na hora.
  const replay = page.waitForResponse((r) => r.url().endsWith('/api/orders') && r.request().method() === 'POST')
  await review.getByRole('button', { name: 'Reenviar pedido' }).click()
  const response = await replay
  expect(response.status()).toBe(200)
  expect(response.headers()['idempotent-replayed']).toBe('true')
  expect(response.request().headers()['idempotency-key']).toBe(attempt.key)
  const order = (await response.json()) as { id: string }
  await expect(page).toHaveURL(`/pedidos/${order.id}`)

  const conflict = await page.evaluate(async ({ key, body }) => {
    const changed = { ...body, buyer: { ...(body.buyer as object), note: 'outro conteúdo' } }
    const r = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-mock-scenario': 'default',
        'Idempotency-Key': key,
        Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
      },
      body: JSON.stringify(changed),
    })
    return { status: r.status, code: ((await r.json()) as { code: string }).code }
  }, attempt)
  expect(conflict).toEqual({ status: 409, code: 'IDEMPOTENCY_CONFLICT' })
})

test('§9.9 preço alterado via Socket.IO no checkout exige nova confirmação', async ({ page }) => {
  await toPayment(page)
  const confirm = page.getByRole('button', { name: 'Confirmar compra' })

  // Evento nft.updated com o pagamento aberto: aviso, resumo novo e confirmação bloqueada.
  await setEdition(page, NFT, EDITION, { priceEth: '0.5000' })
  const issues = page.getByRole('alert').filter({ hasText: 'Seu carrinho mudou' })
  await expect(issues).toContainText(`O preço de ${NAME} (1/50) mudou de 1.39 para 0.50 ETH.`)
  await expect(confirm).toBeDisabled()
  await issues.getByRole('button', { name: 'Entendi, usar valores atuais' }).click()
  await expect(confirm).toBeEnabled()

  // Preço muda de novo na revalidação do envio: 409, nada é criado, nova confirmação.
  await useScenario(page, 'price-changed')
  const review = await confirmPurchase(page)
  await expect(review).toBeHidden()
  await expect(page.getByText('Os valores mudaram desde a sua revisão (total revisado: 0.516 ETH).')).toBeVisible()
  await page.getByRole('alert').filter({ hasText: 'Seu carrinho mudou' }).getByRole('button', { name: 'Entendi, usar valores atuais' }).click()
  await confirmPurchase(page)
  await expect(receiptTitle(page)).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('row').filter({ hasText: NAME })).toContainText('0.60 ETH')
})
