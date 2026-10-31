import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { getSocket } from './socket'

type Tick = { seq: number; at: string }

/** Painel temporário do spike 0.4 — removido quando o realtime real entrar (3.5). */
export function RealtimeSpikePanel() {
  const [connected, setConnected] = useState(false)
  const [lastTick, setLastTick] = useState<Tick | null>(null)
  const [lastEcho, setLastEcho] = useState<unknown>(null)

  useEffect(() => {
    const socket = getSocket()
    if (import.meta.env.DEV) Object.assign(window, { __socket: socket })

    const onConnect = () => {
      console.info('[socket] connected', socket.id)
      setConnected(true)
    }
    const onDisconnect = (reason: string) => {
      console.info('[socket] disconnected:', reason)
      setConnected(false)
    }
    const onTick = (tick: Tick) => {
      console.info('[socket] spike:tick', tick)
      setLastTick(tick)
    }
    const onEcho = (payload: unknown) => {
      console.info('[socket] spike:echo', payload)
      setLastEcho(payload)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('spike:tick', onTick)
    socket.on('spike:echo', onEcho)
    socket.connect()

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('spike:tick', onTick)
      socket.off('spike:echo', onEcho)
      socket.disconnect()
    }
  }, [])

  const socket = getSocket()

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-2 font-semibold">Socket.IO (spike)</h2>
      <p className="text-sm" role="status">
        Status:{' '}
        <span data-testid="socket-status" className={connected ? 'text-success' : 'text-destructive'}>
          {connected ? 'conectado' : 'desconectado'}
        </span>
      </p>
      <p className="text-sm text-muted-foreground">
        Último tick: {lastTick ? `#${lastTick.seq} às ${lastTick.at}` : '—'}
      </p>
      <p className="text-sm text-muted-foreground">
        Último echo: {lastEcho ? JSON.stringify(lastEcho) : '—'}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => socket.connect()} disabled={connected}>
          Conectar
        </Button>
        <Button size="sm" variant="outline" onClick={() => socket.disconnect()} disabled={!connected}>
          Desconectar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => socket.emit('spike:echo', { hello: 'mock' })}
          disabled={!connected}
        >
          Enviar echo
        </Button>
      </div>
    </div>
  )
}
