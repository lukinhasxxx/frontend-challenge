import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import type { FavoritesResponse } from '@/api/contracts'
import { requireSession } from '../auth'
import { db } from '../db/store'
import { apiError, parseBody, withScenario } from '../http'

const addSchema = z.object({ nftId: z.string().min(1) })

/** Favoritos exigem sessão; POST e DELETE são idempotentes. */
export const favoriteHandlers = [
  http.get(
    '/api/favorites',
    withScenario(({ request }) => {
      const { user } = requireSession(request)
      const state = db.read()
      // Mais recentes primeiro.
      const ids = state.favorites.filter((f) => f.userId === user.id).map((f) => f.nftId).reverse()
      const items = ids.map((id) => state.nfts.find((n) => n.id === id)).filter((n) => n !== undefined)
      return HttpResponse.json<FavoritesResponse>({ items })
    }),
  ),

  http.post(
    '/api/favorites',
    withScenario(async ({ request }) => {
      const { user } = requireSession(request)
      const { nftId } = await parseBody(request, addSchema)
      if (!db.read().nfts.some((n) => n.id === nftId)) throw apiError(404, 'NOT_FOUND', 'NFT não encontrado.')
      db.write((state) => {
        if (!state.favorites.some((f) => f.userId === user.id && f.nftId === nftId)) state.favorites.push({ userId: user.id, nftId })
      })
      return HttpResponse.json({ nftId }, { status: 201 })
    }),
  ),

  http.delete(
    '/api/favorites/:nftId',
    withScenario(({ request, params }) => {
      const { user } = requireSession(request)
      db.write((state) => {
        state.favorites = state.favorites.filter((f) => !(f.userId === user.id && f.nftId === params.nftId))
      })
      return new HttpResponse(null, { status: 204 })
    }),
  ),
]
