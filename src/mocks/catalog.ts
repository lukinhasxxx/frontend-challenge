import type { Nft } from '@/api/contracts'
import { normalizeEth } from '@/lib/eth'
import { db } from './db/store'
import { publishNftUpdated } from './events'
import { lowestPrice } from './fixtures/nfts'

export type EditionChange = {
  priceEth?: string
  available?: number
}

/**
 * Única forma de alterar preço/disponibilidade: grava no banco, incrementa a
 * versão do NFT e publica `nft.updated`. REST e eventos ficam consistentes.
 */
export function updateEdition(nftId: string, editionId: string, change: EditionChange): Nft | null {
  const result = db.write((state) => {
    const nft = state.nfts.find((n) => n.id === nftId)
    const edition = nft?.editions.find((e) => e.id === editionId)
    if (!nft || !edition) return null

    const previous = structuredClone(nft)
    if (change.priceEth !== undefined) edition.priceEth = normalizeEth(change.priceEth)
    if (change.available !== undefined) edition.available = Math.min(change.available, edition.supply)
    nft.priceEth = lowestPrice(nft.editions)
    nft.version += 1
    return { previous, next: structuredClone(nft) }
  })

  if (!result) return null
  publishNftUpdated(result.previous, result.next)
  return result.next
}
