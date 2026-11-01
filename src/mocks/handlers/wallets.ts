import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import type { Wallet, WalletConnection, WalletConnectionResponse, WalletRole, WalletsResponse } from '@/api/contracts'
import { walletDetailsSchema, walletNetworkSchema, walletProviderSchema } from '@/lib/validation'
import { requireSession } from '../auth'
import type { DbWallet } from '../db/schema'
import { db } from '../db/store'
import { apiError, parseBody, withScenario } from '../http'
import { getScenario } from '../scenarios'

const ROLE_LABEL: Record<WalletRole, string> = { primary: 'carteira principal', secondary: 'carteira secundária' }

const connectSchema = z.object({ walletId: z.string().min(1), provider: walletProviderSchema, network: walletNetworkSchema })

function toWallet({ userId: _userId, ...wallet }: DbWallet): Wallet {
  return wallet
}

function parseRole(value: unknown): WalletRole {
  if (value === 'primary' || value === 'secondary') return value
  throw apiError(404, 'NOT_FOUND', 'Tipo de carteira inexistente.')
}

/** Carteiras (principal e secundária) e a conexão simulada com a extensão; tudo exige sessão. */
export const walletHandlers = [
  http.get(
    '/api/wallets',
    withScenario(({ request }) => {
      const { user } = requireSession(request)
      const items = db
        .read()
        .wallets.filter((w) => w.userId === user.id)
        .sort((a, b) => Number(b.role === 'primary') - Number(a.role === 'primary'))
        .map(toWallet)
      return HttpResponse.json<WalletsResponse>({ items })
    }),
  ),

  // Cadastra (201) ou atualiza (200) a carteira do papel informado.
  http.put(
    '/api/wallets/:role',
    withScenario(async ({ request, params }) => {
      const { user } = requireSession(request)
      const role = parseRole(params.role)
      const details = await parseBody(request, walletDetailsSchema)
      const mine = db.read().wallets.filter((w) => w.userId === user.id)

      if (role === 'secondary' && !mine.some((w) => w.role === 'primary')) {
        throw apiError(422, 'VALIDATION_ERROR', 'Cadastre a carteira principal antes da secundária.')
      }
      // O mesmo endereço pode existir nas duas redes EVM, mas não repetido na mesma rede.
      const other = mine.find((w) => w.role !== role)
      if (other && other.network === details.network && other.address.toLowerCase() === details.address.toLowerCase()) {
        const message = `Este endereço já está cadastrado como ${ROLE_LABEL[other.role]} nesta rede.`
        throw apiError(409, 'WALLET_CONFLICT', message, { address: message })
      }

      const existing = mine.find((w) => w.role === role)
      const saved = db.write((state) => {
        const wallet: DbWallet = {
          ...details,
          id: existing?.id ?? `wal-${crypto.randomUUID().slice(0, 8)}`,
          userId: user.id,
          role,
          updatedAt: new Date().toISOString(),
        }
        state.wallets = [...state.wallets.filter((w) => w.id !== wallet.id), wallet]
        // Endereço/rede mudaram: a conexão antiga deixa de valer.
        const connection = state.walletConnections[user.id]
        if (connection?.walletId === wallet.id && (connection.address !== wallet.address || connection.network !== wallet.network)) {
          delete state.walletConnections[user.id]
        }
        return wallet
      })
      return HttpResponse.json<Wallet>(toWallet(saved), { status: existing ? 200 : 201 })
    }),
  ),

  http.get(
    '/api/wallet-connection',
    withScenario(({ request }) => {
      const { user } = requireSession(request)
      return HttpResponse.json<WalletConnectionResponse>({ connection: db.read().walletConnections[user.id] ?? null })
    }),
  ),

  // Simula o pedido de conexão à extensão (MetaMask, WalletConnect, Coinbase).
  http.post(
    '/api/wallet-connection',
    withScenario(async ({ request }) => {
      const { user } = requireSession(request)
      const body = await parseBody(request, connectSchema)
      const wallet = db.read().wallets.find((w) => w.id === body.walletId && w.userId === user.id)
      if (!wallet) throw apiError(404, 'NOT_FOUND', 'Carteira não encontrada.')
      if (getScenario(request) === 'wallet-rejected') {
        db.write((state) => {
          delete state.walletConnections[user.id]
        })
        throw apiError(403, 'WALLET_CONNECTION_REJECTED', 'A carteira recusou a conexão. Aprove o pedido na extensão e tente novamente.')
      }
      const connection: WalletConnection = { ...body, address: wallet.address, connectedAt: new Date().toISOString() }
      db.write((state) => {
        state.walletConnections[user.id] = connection
      })
      return HttpResponse.json<WalletConnection>(connection)
    }),
  ),

  http.delete(
    '/api/wallet-connection',
    withScenario(({ request }) => {
      const { user } = requireSession(request)
      db.write((state) => {
        delete state.walletConnections[user.id]
      })
      return new HttpResponse(null, { status: 204 })
    }),
  ),
]
