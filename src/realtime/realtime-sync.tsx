import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { NftUpdatedEvent } from '@/api/contracts'
import { cartKeys, revalidateCartFor } from '@/features/cart/api'
import { nftKeys } from '@/features/catalog/api'
import { displayEth } from '@/lib/eth'
import { applyNftEvent } from './apply-nft-event'
import { getSocket } from './socket'

function describe(event: NftUpdatedEvent) {
  const nft = event.payload
  const available = nft.editions.reduce((sum, e) => sum + e.available, 0)
  return available === 0
    ? `${nft.name} esgotou.`
    : `${nft.name} atualizado: a partir de ${displayEth(nft.priceEth)} ETH.`
}

/**
 * Conecta o Socket.IO e sincroniza os eventos com o cache do TanStack Query.
 * Eventos nunca tocam o estado da interface diretamente: só o cache.
 */
export function RealtimeSync() {
  const queryClient = useQueryClient()
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    const socket = getSocket()
    let connectedBefore = false

    const onConnect = () => {
      document.documentElement.dataset.realtime = 'connected'
      // Reconexão: eventos perdidos durante a queda são recuperados via REST.
      if (connectedBefore) {
        void queryClient.invalidateQueries({ queryKey: nftKeys.all })
        void queryClient.invalidateQueries({ queryKey: cartKeys.all })
      }
      connectedBefore = true
    }
    const onDisconnect = () => {
      document.documentElement.dataset.realtime = 'disconnected'
    }
    const onNftUpdated = (event: NftUpdatedEvent) => {
      if (applyNftEvent(queryClient, event) !== 'applied') return
      revalidateCartFor(queryClient, event.resourceId)
      const message = describe(event)
      setAnnouncement(message)
      toast.info(message, { id: `nft-${event.resourceId}` })
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
  }, [queryClient])

  return (
    <p className="sr-only" aria-live="polite" role="status">
      {announcement}
    </p>
  )
}
