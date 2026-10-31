import { useEffect, useState } from 'react'
import type { NftUpdatedEvent } from '@/api/contracts'
import { getSocket } from './socket'

/**
 * Painel temporário de diagnóstico do socket — substituído pela sincronização
 * real com o cache do TanStack Query na etapa 3.5.
 */
export function RealtimeSpikePanel() {
  const [connected, setConnected] = useState(false)
  const [received, setReceived] = useState(0)
  const [lastEvent, setLastEvent] = useState<NftUpdatedEvent | null>(null)

  useEffect(() => {
    const socket = getSocket()
    if (import.meta.env.DEV) Object.assign(window, { __socket: socket })

    const onConnect = () => setConnected(true)
    const onDisconnect = (reason: string) => {
      console.info('[socket] disconnected:', reason)
      setConnected(false)
    }
    const onNftUpdated = (event: NftUpdatedEvent) => {
      console.info('[socket] nft.updated', event)
      setReceived((count) => count + 1)
      setLastEvent(event)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('nft.updated', onNftUpdated)
    socket.connect()

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('nft.updated', onNftUpdated)
      socket.disconnect()
    }
  }, [])

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-2 font-semibold">Socket.IO</h2>
      <p className="text-sm" role="status">
        Status:{' '}
        <span data-testid="socket-status" className={connected ? 'text-success' : 'text-destructive'}>
          {connected ? 'conectado' : 'desconectado'}
        </span>
      </p>
      <p className="text-sm text-muted-foreground" data-testid="socket-events">
        Eventos nft.updated recebidos: {received}
      </p>
      {lastEvent && (
        <p className="text-sm text-muted-foreground" data-testid="socket-last-event">
          Último: {lastEvent.payload.name} v{lastEvent.version} — {lastEvent.payload.priceEth} ETH (id{' '}
          {lastEvent.eventId.slice(0, 8)})
        </p>
      )}
    </div>
  )
}
