import { FIXTURE_COUPONS, FIXTURE_FAVORITES, FIXTURE_USERS, FIXTURE_WALLETS } from '../fixtures/accounts'
import { createNftFixtures } from '../fixtures/nfts'
import { DB_SCHEMA_VERSION, type DbState } from './schema'

/** Estado inicial conhecido. O reset volta exatamente para cá. */
export function createSeed(): DbState {
  return structuredClone({
    schemaVersion: DB_SCHEMA_VERSION,
    users: FIXTURE_USERS,
    sessions: [],
    nfts: createNftFixtures(),
    favorites: FIXTURE_FAVORITES,
    carts: {},
    cartCoupons: {},
    coupons: FIXTURE_COUPONS,
    wallets: FIXTURE_WALLETS,
    quotes: [],
    orders: [],
  })
}
