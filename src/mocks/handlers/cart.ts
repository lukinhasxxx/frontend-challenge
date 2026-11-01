import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import type { Cart, Quote } from '@/api/contracts'
import { requireSession } from '../auth'
import { buildCart, buildQuote, checkCoupon, findEdition, outOfStock, resolveCartOwner } from '../cart'
import { db } from '../db/store'
import { apiError, parseBody, withScenario } from '../http'

const MAX_STORED_QUOTES = 50

const addItemSchema = z.object({
  nftId: z.string().min(1),
  editionId: z.string().min(1),
  quantity: z.number().int().min(1, 'Quantidade mínima: 1.'),
})
const updateItemSchema = z.object({ quantity: z.number().int().min(1, 'Quantidade mínima: 1.') })
const couponSchema = z.object({ code: z.string().trim().min(1, 'Informe o código promocional.') })

const cartResponse = (owner: ReturnType<typeof resolveCartOwner>) => HttpResponse.json<Cart>(buildCart(db.read(), owner))

export const cartHandlers = [
  http.get(
    '/api/cart',
    withScenario(({ request }) => cartResponse(resolveCartOwner(request))),
  ),

  http.post(
    '/api/cart/items',
    withScenario(async ({ request }) => {
      const owner = resolveCartOwner(request)
      const body = await parseBody(request, addItemSchema)
      const found = findEdition(db.read(), body.nftId, body.editionId)
      if (!found) throw apiError(404, 'NOT_FOUND', 'NFT ou edição não encontrada.')
      if (found.edition.available === 0) throw apiError(409, 'EDITION_UNAVAILABLE', 'Esta edição está esgotada.')

      const inCart = db.read().carts[owner]?.find((i) => i.editionId === body.editionId)?.quantity ?? 0
      if (inCart + body.quantity > found.edition.available) throw outOfStock(found.edition.available, inCart)

      db.write((state) => {
        const items = (state.carts[owner] ??= [])
        const item = items.find((i) => i.editionId === body.editionId)
        // Adicionar de novo confirma o preço atual.
        if (item) Object.assign(item, { quantity: item.quantity + body.quantity, priceSeenEth: found.edition.priceEth })
        else items.push({ ...body, priceSeenEth: found.edition.priceEth })
      })
      return cartResponse(owner)
    }),
  ),

  http.patch(
    '/api/cart/items/:editionId',
    withScenario(async ({ request, params }) => {
      const owner = resolveCartOwner(request)
      const { quantity } = await parseBody(request, updateItemSchema)
      const item = db.read().carts[owner]?.find((i) => i.editionId === params.editionId)
      if (!item) throw apiError(404, 'NOT_FOUND', 'Item não está no carrinho.')
      const found = findEdition(db.read(), item.nftId, item.editionId)
      if (!found) throw apiError(404, 'NOT_FOUND', 'NFT ou edição não encontrada.')
      if (quantity > found.edition.available) throw outOfStock(found.edition.available, 0)

      db.write((state) => {
        const target = state.carts[owner]!.find((i) => i.editionId === params.editionId)!
        Object.assign(target, { quantity, priceSeenEth: found.edition.priceEth })
      })
      return cartResponse(owner)
    }),
  ),

  http.delete(
    '/api/cart/items/:editionId',
    withScenario(({ request, params }) => {
      const owner = resolveCartOwner(request)
      db.write((state) => {
        state.carts[owner] = (state.carts[owner] ?? []).filter((i) => i.editionId !== params.editionId)
      })
      return cartResponse(owner)
    }),
  ),

  // "Entendi": o dono confirma os preços atuais e as quantidades reduzidas ao estoque.
  http.post(
    '/api/cart/acknowledge',
    withScenario(({ request }) => {
      const owner = resolveCartOwner(request)
      db.write((state) => {
        for (const item of state.carts[owner] ?? []) {
          const found = findEdition(state, item.nftId, item.editionId)
          if (!found) continue
          item.priceSeenEth = found.edition.priceEth
          if (found.edition.available > 0) item.quantity = Math.min(item.quantity, found.edition.available)
        }
      })
      return cartResponse(owner)
    }),
  ),

  http.put(
    '/api/cart/coupon',
    withScenario(async ({ request }) => {
      const owner = resolveCartOwner(request)
      const { code } = await parseBody(request, couponSchema)
      const result = checkCoupon(db.read(), code)
      if (result.error) throw result.error
      db.write((state) => {
        state.cartCoupons[owner] = result.coupon.code
      })
      return cartResponse(owner)
    }),
  ),

  http.delete(
    '/api/cart/coupon',
    withScenario(({ request }) => {
      const owner = resolveCartOwner(request)
      db.write((state) => {
        delete state.cartCoupons[owner]
      })
      return cartResponse(owner)
    }),
  ),

  // Login: itens do visitante entram no carrinho do usuário (limitados ao estoque).
  http.post(
    '/api/cart/merge',
    withScenario(({ request }) => {
      const { user } = requireSession(request)
      const guestId = request.headers.get('x-guest-id')
      const owner = `user:${user.id}` as const
      if (!guestId) return cartResponse(owner)

      const guest = `guest:${guestId}` as const
      db.write((state) => {
        const target = (state.carts[owner] ??= [])
        for (const item of state.carts[guest] ?? []) {
          const available = findEdition(state, item.nftId, item.editionId)?.edition.available ?? 0
          const existing = target.find((i) => i.editionId === item.editionId)
          if (existing) existing.quantity = Math.max(1, Math.min(existing.quantity + item.quantity, available || existing.quantity))
          else target.push({ ...item })
        }
        if (!state.cartCoupons[owner] && state.cartCoupons[guest]) state.cartCoupons[owner] = state.cartCoupons[guest]
        delete state.carts[guest]
        delete state.cartCoupons[guest]
      })
      return cartResponse(owner)
    }),
  ),

  http.post(
    '/api/quote',
    withScenario(({ request }) => {
      const owner = resolveCartOwner(request)
      const quote = buildQuote(db.read(), owner)
      db.write((state) => {
        state.quotes.push({ ...quote, ownerKey: owner, createdAt: new Date().toISOString() })
        state.quotes = state.quotes.slice(-MAX_STORED_QUOTES)
      })
      return HttpResponse.json<Quote>(quote)
    }),
  ),
]
