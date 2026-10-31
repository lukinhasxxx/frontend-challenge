import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

/** Singleton do cliente Socket.IO. Conexão é aberta explicitamente via `connect()`. */
export function getSocket(): Socket {
  socket ??= io(import.meta.env.VITE_SOCKET_URL, {
    transports: ['websocket'], // único transporte suportado pelo binding do MSW
    autoConnect: false,
    auth: { token: 'spike-token' },
  })
  return socket
}
