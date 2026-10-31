export const NETWORKS = ['ethereum', 'polygon', 'base'] as const
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
