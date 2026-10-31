/** Redes do filtro "Rede" do Figma. */
export const NETWORKS = ['ethereum', 'polygon', 'solana'] as const
export type Network = (typeof NETWORKS)[number]

export type WalletRole = 'primary' | 'secondary'

export type Wallet = {
  id: string
  label: string
  address: string
  network: Network
  role: WalletRole
}

export type UpsertWalletRequest = {
  label: string
  address: string
  network: Network
  role: WalletRole
}
