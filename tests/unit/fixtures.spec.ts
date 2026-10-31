import { createHash } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { NFT_CATEGORIES } from '../../src/api/contracts/nft'
import { isEthAmount } from '../../src/lib/eth'
import { FIXTURE_PASSWORD, FIXTURE_USERS } from '../../src/mocks/fixtures/accounts'
import { createNftFixtures, NFT_COUNT } from '../../src/mocks/fixtures/nfts'

const nfts = createNftFixtures()

test('catálogo é determinístico e com ids/nomes únicos', () => {
  expect(createNftFixtures()).toEqual(nfts)
  expect(nfts).toHaveLength(NFT_COUNT)
  expect(new Set(nfts.map((n) => n.id)).size).toBe(NFT_COUNT)
  expect(new Set(nfts.map((n) => n.name)).size).toBe(NFT_COUNT)
})

test('tem variedade para filtros, esgotados e estoque baixo', () => {
  expect(new Set(nfts.map((n) => n.category))).toEqual(new Set(NFT_CATEGORIES))
  expect(nfts.some((n) => n.editions.every((e) => e.available === 0))).toBe(true)
  expect(nfts.some((n) => n.editions.some((e) => e.available === 0) && n.editions.some((e) => e.available > 0))).toBe(true)
  expect(nfts.some((n) => n.editions.some((e) => e.available > 0 && e.available <= 2))).toBe(true)
  expect(nfts.filter((n) => n.featured).length).toBeGreaterThanOrEqual(4)
})

test('preços são strings ETH válidas com 4 casas', () => {
  for (const nft of nfts) {
    for (const edition of nft.editions) {
      expect(isEthAmount(edition.priceEth)).toBe(true)
      expect(edition.priceEth).toMatch(/^\d+\.\d{4}$/)
    }
  }
})

test('hash das senhas dos usuários confere com a senha de fixture', () => {
  for (const user of FIXTURE_USERS) {
    const hash = createHash('sha256').update(`${user.salt}:${FIXTURE_PASSWORD}`).digest('hex')
    expect(user.passwordHash).toBe(hash)
  }
})
