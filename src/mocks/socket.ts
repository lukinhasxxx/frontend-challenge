import { ws, type WebSocketHandlerConnection } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import type { RealtimeEvent } from '@/api/contracts'
import { findSessionByToken } from './auth'

/**
 * Servidor Socket.IO simulado.
 *
 * Limitações do @mswjs/socket.io-binding (documentar no ARCHITECTURE.md):
 * - Só transporte `websocket` (o cliente deve usar `transports: ['websocket']`).
 * - O binding envia o handshake Engine.IO (pingInterval 25s / pingTimeout 5s),
 *   mas não envia heartbeats: sem o ping "2" o cliente desconecta após ~30s.
 * - O pacote CONNECT do cliente (`40{auth}`) não é exposto: lemos o frame bruto.
 * - Sem rooms, namespaces ou broadcast: mantemos nosso próprio registro de clientes.
 * - O MSW remove o prefixo `/socket.io/` antes do match, então o link casa com
 *   a origem (`ws://realtime.mock/`). Usar a origem do app colidiria com o
 *   WebSocket do HMR do Vite (`ws://localhost:5173/?token=…`).
 * - Se o cliente fecha antes do handshake (ex.: StrictMode), o `close` não
 *   dispara no mock: timers e broadcast checam o readyState.
 */
const realtime = ws.link(new URL('/', import.meta.env.VITE_SOCKET_URL).href)

const HEARTBEAT_MS = 20_000

type SocketClient = {
  connection: WebSocketHandlerConnection
  io: ReturnType<typeof toSocketIo>
  /** Dono da conexão, resolvido pelo token enviado no CONNECT. `null` = visitante. */
  userId: string | null
}

const clients = new Set<SocketClient>()
let refuseConnectionsUntil = 0

function readConnectAuth(raw: unknown): { token?: unknown } | null {
  if (typeof raw !== 'string' || !raw.startsWith('40')) return null
  const json = raw.slice(2)
  return json ? (JSON.parse(json) as { token?: unknown }) : {}
}

function isClientOpen(connection: WebSocketHandlerConnection) {
  // `socket` existe na implementação, mas não na interface pública do MSW.
  const socket = Reflect.get(connection.client, 'socket') as WebSocket | undefined
  return socket?.readyState === WebSocket.OPEN
}

/** setInterval que se cancela sozinho quando o cliente não está mais aberto. */
function every(connection: WebSocketHandlerConnection, ms: number, fn: () => void) {
  const id = setInterval(() => {
    if (!isClientOpen(connection)) {
      clearInterval(id)
      return
    }
    fn()
  }, ms)
  return () => clearInterval(id)
}

function openClients() {
  for (const client of clients) {
    if (!isClientOpen(client.connection)) clients.delete(client)
  }
  return [...clients]
}

/** Entrega o evento aos clientes. `order.updated` só chega ao dono do pedido. */
export function broadcast(event: RealtimeEvent) {
  for (const client of openClients()) {
    if (event.type === 'order.updated' && client.userId !== event.userId) continue
    client.io.client.emit(event.type, event)
  }
}

/** Derruba todas as conexões e recusa novas por `ms` (testa reconexão). */
export function dropConnections(ms: number) {
  refuseConnectionsUntil = Date.now() + ms
  for (const client of openClients()) client.connection.client.close()
}

export function getSocketStats() {
  return {
    connectedClients: openClients().length,
    refusingUntil: refuseConnectionsUntil > Date.now() ? new Date(refuseConnectionsUntil).toISOString() : null,
  }
}

function acceptConnection(connection: WebSocketHandlerConnection) {
  // O handshake é enviado pelo binding ao chamar toSocketIo.
  const client: SocketClient = { connection, io: toSocketIo(connection), userId: null }
  clients.add(client)

  connection.client.addEventListener('message', (event) => {
    const auth = readConnectAuth(event.data)
    if (!auth) return
    const token = typeof auth.token === 'string' ? auth.token : null
    client.userId = findSessionByToken(token)?.userId ?? null
    console.info('[mock-socket] client connected as', client.userId ?? 'visitante')
  })

  const stopHeartbeat = every(connection, HEARTBEAT_MS, () => connection.client.send('2'))

  connection.client.addEventListener('close', () => {
    stopHeartbeat()
    clients.delete(client)
    console.info('[mock-socket] client disconnected')
  })
}

export const socketHandlers = [
  realtime.addEventListener('connection', (connection) => {
    const downFor = refuseConnectionsUntil - Date.now()
    if (downFor <= 0) return acceptConnection(connection)

    // Servidor "fora do ar": não responde ao handshake até a janela acabar.
    // (Fechar antes do handshake faria o socket.io-client desistir de reconectar.)
    setTimeout(() => {
      if (isClientOpen(connection)) acceptConnection(connection)
    }, downFor)
  }),
]
