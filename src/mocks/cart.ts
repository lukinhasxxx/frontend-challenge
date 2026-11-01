import type { Cart, CartLine, Edition, Nft, Quote, QuoteIssue, QuoteLine } from '@/api/contracts'
import { addEth, compareEth, multiplyEth, normalizeEth, percentOfEth, subtractEth } from '@/lib/eth'
import { readBearerToken, requireSession } from './auth'
import type { CartOwnerKey, DbState } from './db/schema'
import { apiError } from './http'

/** Taxa de rede estimada do Figma ("0.016 ETH · Taxa estimada"). */
export const NETWORK_FEE_ETH = '0.0160'
const QUOTE_TTL_MS = 10 * 60_000
const ZERO = '0.0000'

/**
 * Dono do carrinho: com Bearer, o usuário (token inválido/expirado → 401);
 * sem Bearer, o visitante identificado pelo header `X-Guest-Id`.
 */
export function resolveCartOwner(request: Request): CartOwnerKey {
  if (readBearerToken(request)) return `user:${requireSession(request).user.id}`
  const guestId = request.headers.get('x-guest-id')
  if (!guestId) throw apiError(422, 'VALIDATION_ERROR', 'Identificador do visitante ausente (X-Guest-Id).')
  return `guest:${guestId}`
}

export function findEdition(state: DbState, nftId: string, editionId: string): { nft: Nft; edition: Edition } | null {
  const nft = state.nfts.find((n) => n.id === nftId)
  const edition = nft?.editions.find((e) => e.id === editionId)
  return nft && edition ? { nft, edition } : null
}

export function buildCart(state: DbState, owner: CartOwnerKey): Cart {
  const lines: CartLine[] = []
  for (const item of state.carts[owner] ?? []) {
    const found = findEdition(state, item.nftId, item.editionId)
    if (!found) continue
    const { nft, edition } = found
    lines.push({
      nftId: nft.id,
      editionId: edition.id,
      quantity: item.quantity,
      name: nft.name,
      image: nft.thumbnail,
      tokenId: nft.tokenId,
      editionLabel: edition.label,
      unitPriceEth: edition.priceEth,
      lineTotalEth: multiplyEth(edition.priceEth, item.quantity),
      previousUnitPriceEth: compareEth(item.priceSeenEth, edition.priceEth) !== 0 ? item.priceSeenEth : null,
      available: edition.available,
    })
  }
  return {
    lines,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    couponCode: state.cartCoupons[owner] ?? null,
    updatedAt: new Date().toISOString(),
  }
}

/** Cupom válido pelo código (maiúsculas), ou o motivo da recusa. */
export function checkCoupon(state: DbState, code: string) {
  const coupon = state.coupons.find((c) => c.code === code.trim().toUpperCase())
  if (!coupon) return { error: apiError(422, 'COUPON_INVALID', 'Cupom inválido.', { code: 'Cupom inválido.' }) }
  if (new Date(coupon.expiresAt).getTime() <= Date.now()) {
    return { error: apiError(422, 'COUPON_EXPIRED', 'Este cupom expirou.', { code: 'Este cupom expirou.' }) }
  }
  return { coupon }
}

/**
 * Cotação a partir do carrinho com os preços e o estoque atuais. Mudanças desde o que o dono
 * viu viram `issues` (preço alterado, quantidade reduzida, esgotado) até ele confirmar.
 */
export function buildQuote(state: DbState, owner: CartOwnerKey): Quote {
  const lines: QuoteLine[] = []
  const issues: QuoteIssue[] = []

  for (const item of state.carts[owner] ?? []) {
    const found = findEdition(state, item.nftId, item.editionId)
    if (!found) continue
    const { nft, edition } = found
    const ids = { nftId: nft.id, editionId: edition.id }

    if (edition.available === 0) {
      issues.push({ type: 'sold-out', ...ids })
      continue
    }
    if (item.quantity > edition.available) {
      issues.push({ type: 'quantity-reduced', ...ids, requested: item.quantity, available: edition.available })
    }
    if (compareEth(item.priceSeenEth, edition.priceEth) !== 0) {
      issues.push({ type: 'price-changed', ...ids, previousPriceEth: item.priceSeenEth, currentPriceEth: edition.priceEth })
    }

    const quantity = Math.min(item.quantity, edition.available)
    lines.push({
      ...ids,
      name: nft.name,
      editionLabel: edition.label,
      quantity,
      unitPriceEth: edition.priceEth,
      lineTotalEth: multiplyEth(edition.priceEth, quantity),
    })
  }

  const subtotalEth = lines.length ? addEth(...lines.map((l) => l.lineTotalEth)) : ZERO
  const couponCode = state.cartCoupons[owner]
  const valid = couponCode ? checkCoupon(state, couponCode).coupon : undefined
  const coupon = valid ? { code: valid.code, percentOff: valid.percentOff } : null
  const discountEth = coupon ? percentOfEth(subtotalEth, coupon.percentOff) : ZERO
  const networkFeeEth = lines.length ? NETWORK_FEE_ETH : ZERO

  return {
    id: `quo-${crypto.randomUUID().slice(0, 8)}`,
    lines,
    coupon,
    subtotalEth,
    discountEth,
    networkFeeEth,
    totalEth: normalizeEth(addEth(subtractEth(subtotalEth, discountEth), networkFeeEth)),
    issues,
    expiresAt: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
  }
}

/** Quantidade máxima que ainda cabe no carrinho para a edição. */
export function outOfStock(available: number, inCart: number) {
  const units = (n: number) => `${n} ${n === 1 ? 'unidade disponível' : 'unidades disponíveis'}`
  const message = inCart
    ? `Há ${units(available)} desta edição e ${inCart} já ${inCart === 1 ? 'está' : 'estão'} no seu carrinho.`
    : `Há apenas ${units(available)} desta edição.`
  return apiError(409, 'OUT_OF_STOCK', message, { quantity: message })
}
