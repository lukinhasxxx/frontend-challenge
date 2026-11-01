import type { Wallet, WalletNetwork, WalletProvider, WalletRole } from '@/api/contracts'

export const NETWORK_LABEL: Record<WalletNetwork, string> = { ethereum: 'Ethereum', polygon: 'Polygon' }

/** Linha do card de carteira no Figma mobile ("Rede principal Ethereum", "Rede Polygon"). */
export const NETWORK_CARD_LABEL: Record<WalletNetwork, string> = { ethereum: 'Rede principal Ethereum', polygon: 'Rede Polygon' }

export const PROVIDER_LABEL: Record<WalletProvider, string> = {
  walletconnect: 'WalletConnect',
  metamask: 'MetaMask',
  coinbase: 'Coinbase Wallet',
}

export const ROLE_TITLE: Record<WalletRole, string> = { primary: 'Carteira principal', secondary: 'Carteira secundária' }

/** "0xA91F…E82C" (Figma). */
export function shortAddress(address: string) {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address
}

/** Nome ENS completo, se houver; senão o endereço abreviado (cards do Figma mobile). */
export function walletIdentity(wallet: Wallet) {
  return wallet.ensName ? `${wallet.ensName}${wallet.ensSuffix}` : shortAddress(wallet.address)
}
