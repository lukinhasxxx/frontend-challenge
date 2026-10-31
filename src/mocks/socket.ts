import { ws, type WebSocketHandlerConnection } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'

/**
 * Servidor Socket.IO simulado.
 *
 * Limitações do @mswjs/socket.io-binding (documentar no ARCHITECTURE.md):
 * - Só transporte `websocket` (o cliente deve usar `transports: ['websocket']`).
 * - O binding envia o handshake Engine.IO (pingInterval 25s / pingTimeout 5s),
 *   mas não envia heartbeats: sem o ping "2" o cliente desconecta após ~30s.
 * - O pacote CONNECT do cliente (`40{auth}`) não é exposto: lemos o frame bruto.
 * - Sem rooms, namespaces ou broadcast.
 * - O MSW remove o prefixo `/socket.io/` antes do match, então o link casa com
 *   a origem (`ws://realtime.mock/`). Usar a origem do app colidiria com o
 *   WebSocket do HMR do Vite (`ws://localhost:5173/?token=…`).
 * - Se o cliente fecha antes do handshake (ex.: StrictMode), o `close` não
 *   dispara no mock: timers devem checar o readyState (ver `every`).
 */
const realtime = ws.link(new URL('/', import.meta.env.VITE_SOCKET_URL).href)

const HEARTBEAT_MS = 20_000
const SPIKE_TICK_MS = 3_000

function readConnectAuth(raw: unknown): Record<string, unknown> | null {
  if (typeof raw !== 'string' || !raw.startsWith('40')) return null
  const json = raw.slice(2)
  return json ? (JSON.parse(json) as Record<string, unknown>) : {}
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

export const socketHandlers = [
  realtime.addEventListener('connection', (connection) => {
    console.info('[mock-socket] client connected', connection.client.url.href)
    const io = toSocketIo(connection)

    connection.client.addEventListener('message', (event) => {
      const auth = readConnectAuth(event.data)
      if (auth) console.info('[mock-socket] client CONNECT auth:', auth)
    })

    const stopHeartbeat = every(connection, HEARTBEAT_MS, () => connection.client.send('2'))

    // Spike 0.4: evento periódico para validar o canal servidor → cliente.
    let seq = 0
    const stopTicker = every(connection, SPIKE_TICK_MS, () => {
      seq += 1
      io.client.emit('spike:tick', { seq, at: new Date().toISOString() })
    })

    // Spike 0.4: valida o canal cliente → servidor.
    io.client.on('spike:echo', (_event, payload) => {
      io.client.emit('spike:echo', { received: payload })
    })

    connection.client.addEventListener('close', () => {
      stopHeartbeat()
      stopTicker()
      console.info('[mock-socket] client disconnected')
    })
  }),
]
