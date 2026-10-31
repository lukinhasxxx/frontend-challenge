import type { DbCoupon, DbUser, DbWallet } from '../db/schema'
import { FIXTURE_BASE_DATE } from './dates'

/** Senha de ambos os usuários de fixture (o banco guarda só o hash). */
export const FIXTURE_PASSWORD = 'Senha@123'

export const FIXTURE_USERS: DbUser[] = [
  {
    id: 'usr-ana',
    name: 'Ana Souza',
    email: 'ana@nft.dev',
    avatarUrl: '/assets/avatars/creator-03.webp',
    bio: 'Colecionadora de arte generativa.',
    createdAt: FIXTURE_BASE_DATE,
    salt: 'f3a9c1e07b2d4e18',
    passwordHash: '8fbecc1a358af22677c34b1f8f7fc482818cbb722cb04480c487821aba3b76b3',
  },
  {
    id: 'usr-bruno',
    name: 'Bruno Lima',
    email: 'bruno@nft.dev',
    avatarUrl: null,
    bio: '',
    createdAt: FIXTURE_BASE_DATE,
    salt: '7c41d0b9e2a35f86',
    passwordHash: '60d3b7b1bac533de12381dbfa69f085bf33ea0bac86dc99364b4ec9e5fe374c0',
  },
]

export const FIXTURE_WALLETS: DbWallet[] = [
  {
    id: 'wal-ana-main',
    userId: 'usr-ana',
    label: 'MetaMask principal',
    address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    network: 'ethereum',
    role: 'primary',
  },
  {
    id: 'wal-ana-alt',
    userId: 'usr-ana',
    label: 'Carteira Polygon',
    address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    network: 'polygon',
    role: 'secondary',
  },
  {
    id: 'wal-bruno-main',
    userId: 'usr-bruno',
    label: 'Coinbase Wallet',
    address: '0x4200000000000000000000000000000000000006',
    network: 'base',
    role: 'primary',
  },
]

export const FIXTURE_FAVORITES = [
  { userId: 'usr-ana', nftId: 'nft-01' },
  { userId: 'usr-ana', nftId: 'nft-04' },
  { userId: 'usr-ana', nftId: 'nft-12' },
  { userId: 'usr-bruno', nftId: 'nft-07' },
]

export const FIXTURE_COUPONS: DbCoupon[] = [
  { code: 'JUNGLE10', percentOff: 10, expiresAt: '2099-12-31T23:59:59.000Z' },
  { code: 'WELCOME5', percentOff: 5, expiresAt: '2099-12-31T23:59:59.000Z' },
  { code: 'EXPIRED20', percentOff: 20, expiresAt: '2024-01-01T00:00:00.000Z' },
]
