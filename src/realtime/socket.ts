import { io, type Socket } from 'socket.io-client'
import { authToken } from '@/api/session-storage'

let socket: Socket | null = null

/** Singleton do cliente Socket.IO. Conexão é aberta explicitamente via `connect()`. */
export function getSocket(): Socket {
  socket ??= io(import.meta.env.VITE_SOCKET_URL, {
    transports: ['websocket'], // único transporte suportado pelo binding do MSW
    autoConnect: false,
    // Função: o token é lido a cada (re)conexão, não só na criação.
    auth: (cb) => cb({ token: authToken.get() }),
  })
  return socket
}
