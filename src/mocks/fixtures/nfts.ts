import { NETWORKS, NFT_CATEGORIES, type Collection, type Edition, type Network, type Nft } from '@/api/contracts'
import { compareEth, fromWei, normalizeEth, percentOfEth, toWei } from '@/lib/eth'
import { createRng } from '../rng'
import { FIXTURE_BASE_DATE } from './dates'

export const NFT_COUNT = 48

type Family = 'emerald' | 'sage' | 'ivory' | 'golden'

/**
 * Cada coleção agrupa 12 NFTs em sequência, misturando ilustrações (como "Mais desta coleção" no Figma).
 * Nomes não repetem palavras dos nomes dos NFTs, para a busca não trazer itens só pela coleção.
 */
const COLLECTIONS: { collection: Collection; creator: string }[] = [
  { collection: { id: 'col-kurio-apes', name: 'Kurio Apes' }, creator: 'Nova Sato' },
  { collection: { id: 'col-canopy-society', name: 'Canopy Society' }, creator: 'Iris Okafor' },
  { collection: { id: 'col-midnight-club', name: 'Midnight Club' }, creator: 'Kenji Mori' },
  { collection: { id: 'col-frequency-lab', name: 'Frequency Lab' }, creator: 'Lia Duarte' },
]
const NFTS_PER_COLLECTION = 12

const FAMILIES: Record<Family, { names: string[]; traits: string[] }> = {
  emerald: {
    names: ['Emerald Ape', 'Jade Ape', 'Amber Ape', 'Copper Ape', 'Velvet Ape', 'Mosaic Ape'],
    traits: ['Óculos', 'Esmeralda', 'Jaqueta varsity', 'Corrente dourada'],
  },
  sage: {
    names: ['Sage Nomad', 'Cosmic Bloom', 'Violet Nomad', 'Moss Wanderer', 'Lilac Drifter', 'Fern Monk'],
    traits: ['Chapéu bucket', 'Moletom lilás', 'Pelagem prata', 'Olhar sereno'],
  },
  ivory: {
    names: ['Neon Vessel', 'Ivory Baron', 'Onyx Regent', 'Pearl Envoy', 'Ebony Consul', 'Cobalt Duke'],
    traits: ['Blazer marfim', 'Gola alta', 'Brinco', 'Pelagem ônix'],
  },
  golden: {
    names: ['Golden Beat', 'Golden Echo', 'Golden Signal', 'Honey Bass', 'Saffron Wave', 'Topaz Tempo'],
    traits: ['Fones verdes', 'Jaqueta creme', 'Pelagem dourada', 'Halo sálvia'],
  },
}
const FAMILY_ORDER: Family[] = ['emerald', 'sage', 'ivory', 'golden']

const NETWORK_LABEL: Record<Network, string> = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' }

/** Edições na ordem do Figma; preço relativo à edição 1/50 (preço do card). */
const EDITION_TIERS = [
  { label: '1/1', supply: 1, priceMultiplier: 400 },
  { label: '1/10', supply: 10, priceMultiplier: 180 },
  { label: '1/50', supply: 50, priceMultiplier: 100 },
  { label: 'Aberta', supply: 999, priceMultiplier: 120 },
] as const

type Seed = { family: Family; name: string; number: string; price: string; previous?: string; rare?: boolean }

/** Os 9 primeiros reproduzem a grade da Home no Figma (ordem, nomes e preços). */
const FIGMA_GRID: Seed[] = [
  { family: 'emerald', name: 'Emerald Ape', number: '042', price: '1.19', rare: true },
  { family: 'sage', name: 'Sage Nomad', number: '009', price: '1.69' },
  { family: 'ivory', name: 'Neon Vessel', number: '552', price: '1.99', previous: '2.29', rare: true },
  { family: 'sage', name: 'Cosmic Bloom', number: '118', price: '1.29' },
  { family: 'sage', name: 'Violet Nomad', number: '314', price: '1.39' },
  { family: 'ivory', name: 'Ivory Baron', number: '088', price: '1.79' },
  { family: 'golden', name: 'Golden Beat', number: '207', price: '0.99' },
  { family: 'golden', name: 'Golden Echo', number: '233', price: '0.59' },
  { family: 'golden', name: 'Golden Signal', number: '160', price: '0.39' },
]

function pad(n: number, size = 2) {
  return String(n).padStart(size, '0')
}

/** Preços do Figma têm 2 casas ("1.19 ETH"); o transporte continua com 4 ("1.1900"). */
function priceOf(eth: string, percent = 100): string {
  return normalizeEth(fromWei(toWei(percentOfEth(eth, percent)), 2))
}

function images(family: Family) {
  return {
    images: [1, 2, 3, 4].map((v) => `/assets/nfts/${family}-${v}.webp`),
    thumbnail: `/assets/nfts/${family}-1-sm.webp`,
  }
}

/** Menor preço entre edições disponíveis; se todas esgotadas, o da primeira. */
export function lowestPrice(editions: Edition[]): string {
  const pool = editions.some((e) => e.available > 0) ? editions.filter((e) => e.available > 0) : editions
  return pool.reduce((min, e) => (compareEth(e.priceEth, min) < 0 ? e.priceEth : min), pool[0]!.priceEth)
}

function generatedSeed(index: number, rng: ReturnType<typeof createRng>): Seed {
  const family = FAMILY_ORDER[index % FAMILY_ORDER.length]!
  const names = FAMILIES[family].names
  // Extremos da faixa de preço do Figma ("0,02 - 12,30 ETH").
  const price = index === 9 ? '12.30' : index === 10 ? '0.02' : (rng.int(2, 1230) / 100).toFixed(2)
  const previous = index % 7 === 0 ? priceOf(price, 115) : undefined
  return {
    family,
    name: names[Math.floor(index / FAMILY_ORDER.length) % names.length]!,
    number: pad((index * 73 + 17) % 997, 3),
    price,
    previous,
    rare: index % 5 === 0,
  }
}

/**
 * Catálogo determinístico: 9 categorias, 3 redes, edições "1/1 · 1/10 · 1/50 · Aberta",
 * edições e NFTs esgotados, estoque baixo e ofertas com preço anterior.
 */
export function createNftFixtures(): Nft[] {
  const rng = createRng(20261031)
  const baseTime = new Date(FIXTURE_BASE_DATE).getTime()

  return Array.from({ length: NFT_COUNT }, (_, index) => {
    const n = index + 1
    const seed = FIGMA_GRID[index] ?? generatedSeed(index, rng)
    const family = FAMILIES[seed.family]
    const { collection, creator } = COLLECTIONS[Math.floor(index / NFTS_PER_COLLECTION) % COLLECTIONS.length]!
    const network = index === 0 ? 'ethereum' : rng.pick(NETWORKS)
    const fullySoldOut = n % 16 === 13
    const lowStock = n % 9 === 2

    // O primeiro NFT tem as 4 edições (como no detalhe do Figma); os demais, 1/50 + extras.
    const tiers = EDITION_TIERS.filter((tier) => index === 0 || tier.label === '1/50' || rng.next() < 0.5)
    const editions: Edition[] = tiers.map((tier) => {
      let available = tier.label === 'Aberta' ? tier.supply : rng.int(0, tier.supply)
      if (index === 0) available = tier.label === '1/1' ? 0 : Math.max(available, 3)
      if (tier.label === '1/50' && lowStock) available = rng.int(1, 2)
      if (fullySoldOut) available = 0
      return {
        id: `nft-${pad(n)}-${tier.label === 'Aberta' ? 'open' : tier.label.replace('/', 'of')}`,
        label: tier.label,
        priceEth: priceOf(seed.price, tier.priceMultiplier),
        supply: tier.supply,
        available,
      }
    })

    const traits = [...family.traits].sort(() => rng.next() - 0.5).slice(0, 2)
    const attributes = index === 0 ? ['Óculos', 'Esmeralda', 'Raro'] : seed.rare ? [...traits, 'Raro'] : traits
    const name = `${seed.name} #${seed.number}`

    return {
      id: `nft-${pad(n)}`,
      name,
      description: `Um colecionável digital finalizado à mão da coleção ${collection.name}, verificado na ${NETWORK_LABEL[network]}, com arte desbloqueável e acesso para colecionadores.`,
      category: index < NFT_CATEGORIES.length ? NFT_CATEGORIES[index]! : rng.pick(NFT_CATEGORIES),
      network,
      collection,
      creator,
      ...images(seed.family),
      editions,
      priceEth: lowestPrice(editions),
      previousPriceEth: seed.previous ? normalizeEth(seed.previous) : null,
      tokenId: `#${pad(Number(seed.number), 4)}`,
      contractAddress: `0x${Array.from({ length: 40 }, () => '0123456789abcdef'[rng.int(0, 15)]).join('')}`,
      royaltyPercent: 5,
      attributes,
      rating: index === 0 ? { average: 4.8, count: 19 } : { average: rng.int(38, 50) / 10, count: rng.int(3, 60) },
      likes: rng.int(0, 999),
      featured: index < 3,
      version: 1,
      createdAt: new Date(baseTime - index * 7 * 3_600_000).toISOString(),
    }
  })
}

/** "NFT em destaque · Oferta limitada" da sidebar (ilustração sage com preço anterior, como no Figma). */
export const SPOTLIGHT_NFT_ID = 'nft-22'
