import { createHash } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { NETWORKS, NFT_CATEGORIES } from '../../src/api/contracts'
import { compareEth, isEthAmount } from '../../src/lib/eth'
import { FIXTURE_PASSWORD, FIXTURE_USERS } from '../../src/mocks/fixtures/accounts'
import { createNftFixtures, NFT_COUNT, SPOTLIGHT_NFT_ID } from '../../src/mocks/fixtures/nfts'

const nfts = createNftFixtures()

test('catálogo é determinístico e com ids/nomes únicos', () => {
  expect(createNftFixtures()).toEqual(nfts)
  expect(nfts).toHaveLength(NFT_COUNT)
  expect(new Set(nfts.map((n) => n.id)).size).toBe(NFT_COUNT)
  expect(new Set(nfts.map((n) => n.name)).size).toBe(NFT_COUNT)
})

test('os 9 primeiros reproduzem a grade da Home do Figma', () => {
  expect(nfts.slice(0, 9).map((n) => `${n.name} ${n.priceEth}`)).toEqual([
    'Emerald Ape #042 1.1900',
    'Sage Nomad #009 1.6900',
    'Neon Vessel #552 1.9900',
    'Cosmic Bloom #118 1.2900',
    'Violet Nomad #314 1.3900',
    'Ivory Baron #088 1.7900',
    'Golden Beat #207 0.9900',
    'Golden Echo #233 0.5900',
    'Golden Signal #160 0.3900',
  ])
  expect(nfts[2]!.previousPriceEth).toBe('2.2900')
})

test('Emerald Ape #042 tem os dados do detalhe no Figma', () => {
  const emerald = nfts[0]!
  expect(emerald.editions.map((e) => e.label)).toEqual(['1/1', '1/10', '1/50', 'Aberta'])
  expect(emerald.rating).toEqual({ average: 4.8, count: 19 })
  expect(emerald.tokenId).toBe('#0042')
  expect(emerald.collection.name).toBe('Kurio Apes')
  expect(emerald.attributes).toEqual(['Óculos', 'Esmeralda', 'Raro'])
  expect(emerald.network).toBe('ethereum')
})

test('tem variedade para filtros, esgotados, estoque baixo e destaque', () => {
  expect(new Set(nfts.map((n) => n.category))).toEqual(new Set(NFT_CATEGORIES))
  expect(new Set(nfts.map((n) => n.network))).toEqual(new Set(NETWORKS))
  expect(nfts.some((n) => n.editions.every((e) => e.available === 0))).toBe(true)
  expect(nfts.some((n) => n.editions.some((e) => e.available === 0) && n.editions.some((e) => e.available > 0))).toBe(true)
  expect(nfts.some((n) => n.editions.some((e) => e.available > 0 && e.available <= 2))).toBe(true)
  expect(nfts.filter((n) => n.featured)).toHaveLength(3)

  const spotlight = nfts.find((n) => n.id === SPOTLIGHT_NFT_ID)!
  expect(spotlight.thumbnail).toContain('sage')
  expect(spotlight.previousPriceEth).not.toBeNull()
})

test('preços são strings ETH com 4 casas (valor com 2, como no Figma), na faixa 0,02 – 12,30', () => {
  for (const nft of nfts) {
    for (const price of [...nft.editions.map((e) => e.priceEth), nft.previousPriceEth ?? '0.0000']) {
      expect(isEthAmount(price)).toBe(true)
      expect(price).toMatch(/^\d+\.\d{2}00$/)
    }
  }
  const prices = nfts.map((n) => n.priceEth).sort(compareEth)
  expect(prices[0]).toBe('0.0200')
  expect(prices.at(-1)).toBe('12.3000')
})

test('nome de coleção não repete palavras dos nomes dos NFTs (busca sem falso positivo)', () => {
  const nameWords = new Set(nfts.flatMap((n) => n.name.replace(/#\d+/, '').toLowerCase().split(/\s+/).filter(Boolean)))
  const collectionWords = new Set(nfts.flatMap((n) => n.collection.name.toLowerCase().split(/\s+/)))
  // "Kurio Apes" vem do Figma; "apes" ≠ "ape" dos nomes.
  expect([...collectionWords].filter((word) => nameWords.has(word))).toEqual([])
})

test('hash das senhas dos usuários confere com a senha de fixture', () => {
  for (const user of FIXTURE_USERS) {
    const hash = createHash('sha256').update(`${user.salt}:${FIXTURE_PASSWORD}`).digest('hex')
    expect(user.passwordHash).toBe(hash)
  }
})
