import { NFT_CATEGORIES, type Collection, type Creator, type Edition, type Nft } from '@/api/contracts'
import { compareEth, fromWei, percentOfEth } from '@/lib/eth'
import { createRng } from '../rng'
import { FIXTURE_BASE_DATE } from './dates'

export const NFT_COUNT = 48

const ADJECTIVES = ['Neon', 'Solar', 'Lunar', 'Crimson', 'Silent', 'Golden', 'Electric', 'Hidden', 'Cosmic', 'Wild', 'Frozen', 'Velvet']
const NOUNS = ['Jaguar', 'Canopy', 'Orchid', 'Totem', 'Parrot', 'Temple', 'River', 'Serpent', 'Mask', 'Fern', 'Toucan', 'Echo']

export const COLLECTIONS: Collection[] = [
  { id: 'col-jungle-spirits', name: 'Jungle Spirits' },
  { id: 'col-neon-wilds', name: 'Neon Wilds' },
  { id: 'col-canopy-club', name: 'Canopy Club' },
  { id: 'col-lost-temples', name: 'Lost Temples' },
  { id: 'col-sonic-fauna', name: 'Sonic Fauna' },
  { id: 'col-pixel-safari', name: 'Pixel Safari' },
]

const CREATOR_NAMES = ['Mara Vex', 'Theo Rains', 'Iris Okafor', 'Kenji Mori', 'Lia Duarte', 'Omar Haddad', 'Sofia Brandt', 'Nico Alves']

export const CREATORS: Creator[] = CREATOR_NAMES.map((name, index) => ({
  id: `creator-${pad(index + 1)}`,
  name,
  avatarUrl: `/assets/avatars/creator-${pad(index + 1)}.webp`,
}))

const EDITION_TIERS = [
  { label: 'Standard', priceMultiplier: 100, supply: [50, 200] },
  { label: 'Rare', priceMultiplier: 250, supply: [10, 30] },
  { label: 'Legendary', priceMultiplier: 600, supply: [1, 5] },
] as const

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** Imagens em /public/assets/nfts: nft-01.webp (capa), nft-01-2.webp, nft-01-3.webp. */
function nftImages(n: number) {
  const base = `/assets/nfts/nft-${pad(n)}`
  return [`${base}.webp`, `${base}-2.webp`, `${base}-3.webp`]
}

/** Menor preço entre edições disponíveis; se todas esgotadas, o da primeira. */
export function lowestPrice(editions: Edition[]): string {
  const pool = editions.some((e) => e.available > 0) ? editions.filter((e) => e.available > 0) : editions
  return pool.reduce((min, e) => (compareEth(e.priceEth, min) < 0 ? e.priceEth : min), pool[0]!.priceEth)
}

/**
 * Catálogo determinístico. Variedade proposital para filtros/paginação:
 * - 5 categorias, 6 coleções, preços de 0.0100 a ~15 ETH;
 * - NFTs com 1 a 3 edições, edições esgotadas e NFTs totalmente esgotados;
 * - estoque baixo (1–2) para testar limite de quantidade.
 */
export function createNftFixtures(): Nft[] {
  const rng = createRng(20261031)
  const baseTime = new Date(FIXTURE_BASE_DATE).getTime()

  return Array.from({ length: NFT_COUNT }, (_, index) => {
    const n = index + 1
    const name = `${ADJECTIVES[index % 12]} ${NOUNS[(index * 7 + Math.floor(index / 12)) % 12]}`
    const basePrice = fromWei(BigInt(rng.int(100, 25_000)) * 10n ** 14n)
    const editionCount = rng.int(1, 3)
    const fullySoldOut = n % 16 === 5
    const lowStock = n % 9 === 2

    const editions: Edition[] = EDITION_TIERS.slice(0, editionCount).map((tier, tierIndex) => {
      const supply = rng.int(tier.supply[0], tier.supply[1])
      let available = rng.int(0, supply)
      if (tier.label === 'Legendary' && rng.next() < 0.5) available = 0
      if (lowStock && tierIndex === 0) available = rng.int(1, 2)
      if (fullySoldOut) available = 0
      return {
        id: `nft-${pad(n)}-${tier.label.toLowerCase()}`,
        label: tier.label,
        priceEth: percentOfEth(basePrice, tier.priceMultiplier),
        supply,
        available,
      }
    })

    const collection = COLLECTIONS[index % COLLECTIONS.length]!
    return {
      id: `nft-${pad(n)}`,
      name,
      description: `${name} faz parte da coleção ${collection.name}. Obra digital com ${editionCount} edição(ões) e certificado de autenticidade simulado.`,
      category: NFT_CATEGORIES[(index * 3) % NFT_CATEGORIES.length]!,
      collection,
      creator: rng.pick(CREATORS),
      images: nftImages(n),
      editions,
      priceEth: lowestPrice(editions),
      likes: rng.int(0, 999),
      featured: n % 8 === 1,
      version: 1,
      createdAt: new Date(baseTime - index * 7 * 3_600_000).toISOString(),
    }
  })
}
