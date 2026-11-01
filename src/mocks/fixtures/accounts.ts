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

/** Ana tem principal + secundária (os cards "Principal" e "Reserva" do Figma mobile); Bruno só a principal. */
export const FIXTURE_WALLETS: DbWallet[] = [
  {
    id: 'wal-ana-main',
    userId: 'usr-ana',
    role: 'primary',
    displayName: 'Ana Souza',
    label: 'Principal',
    network: 'ethereum',
    profileName: 'Ana Coleciona',
    address: '0xA91F3c5D7e2B4a6C8d0E1f2A3b4C5d6E7f80E82C',
    secondaryAddress: '',
    provider: 'metamask',
    referralCode: 'KURIO-ANA',
    email: 'ana@nft.dev',
    ensName: 'ana.kurio',
    ensSuffix: '.eth',
    updatedAt: FIXTURE_BASE_DATE,
  },
  {
    id: 'wal-ana-alt',
    userId: 'usr-ana',
    role: 'secondary',
    displayName: 'Ana Souza',
    label: 'Reserva',
    network: 'polygon',
    profileName: 'Ana Coleciona',
    address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    secondaryAddress: 'nova.kurio.eth',
    provider: 'coinbase',
    referralCode: 'KURIO-ANA',
    email: 'ana@nft.dev',
    ensName: 'nova.kurio',
    ensSuffix: '.eth',
    updatedAt: FIXTURE_BASE_DATE,
  },
  {
    id: 'wal-bruno-main',
    userId: 'usr-bruno',
    role: 'primary',
    displayName: 'Bruno Lima',
    label: 'Principal',
    network: 'polygon',
    profileName: 'Bruno Lima',
    address: '0x4200000000000000000000000000000000000006',
    secondaryAddress: '',
    provider: 'coinbase',
    referralCode: 'KURIO-BRUNO',
    email: 'bruno@nft.dev',
    ensName: 'bruno.kurio',
    ensSuffix: '.eth',
    updatedAt: FIXTURE_BASE_DATE,
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
