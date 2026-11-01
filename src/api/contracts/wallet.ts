import type { IsoDate } from './common'

/** Redes do filtro "Rede" do Figma. */
export const NETWORKS = ['ethereum', 'polygon', 'solana'] as const
export type Network = (typeof NETWORKS)[number]

/** Redes EVM em que um endereço 0x recebe NFTs (o mesmo endereço vale nas duas). */
export const WALLET_NETWORKS = ['ethereum', 'polygon'] as const satisfies readonly Network[]
export type WalletNetwork = (typeof WALLET_NETWORKS)[number]

/** "Tipo de carteira" / "Carteira e rede" do Figma. */
export const WALLET_PROVIDERS = ['walletconnect', 'metamask', 'coinbase'] as const
export type WalletProvider = (typeof WALLET_PROVIDERS)[number]

/** Sufixos do campo "Nome ENS". */
export const ENS_SUFFIXES = ['.eth', '.xyz'] as const
export type EnsSuffix = (typeof ENS_SUFFIXES)[number]

export type WalletRole = 'primary' | 'secondary'

/** Campos do formulário "Carteiras" do Figma. */
export type WalletDetails = {
  displayName: string
  /** "Apelido da carteira" (ex.: "Principal", "Reserva"). */
  label: string
  network: WalletNetwork
  profileName: string
  address: string
  /** "ENS ou carteira secundária (opcional)"; vazio quando não informado. */
  secondaryAddress: string
  provider: WalletProvider
  referralCode: string
  email: string
  ensName: string
  ensSuffix: EnsSuffix
}

export type Wallet = WalletDetails & {
  id: string
  role: WalletRole
  updatedAt: IsoDate
}

export type WalletsResponse = { items: Wallet[] }

/** `PUT /api/wallets/:role` cadastra (201) ou atualiza (200) a carteira daquele papel. */
export type UpsertWalletRequest = WalletDetails

/** Conexão simulada com a extensão da carteira (exigida para criar o pedido). */
export type WalletConnection = {
  walletId: string
  provider: WalletProvider
  network: WalletNetwork
  address: string
  connectedAt: IsoDate
}

export type ConnectWalletRequest = Pick<WalletConnection, 'walletId' | 'provider' | 'network'>

export type WalletConnectionResponse = { connection: WalletConnection | null }
