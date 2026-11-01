import type { z } from 'zod'
import type { BuyerProfile, User, Wallet } from '@/api/contracts'
import { buyerProfileSchema, walletNetworkSchema, walletProviderSchema } from '@/lib/validation'

/** Formulário "Perfil do colecionador" + rede e tipo de carteira escolhidos para este pagamento. */
export const paymentSchema = buyerProfileSchema.extend({ network: walletNetworkSchema, provider: walletProviderSchema })

export type PaymentInput = z.input<typeof paymentSchema>
export type PaymentValues = z.output<typeof paymentSchema>

/** "ana@nft.dev" → "ana" (só caracteres aceitos em nome de usuário). */
function usernameFrom(email: string) {
  const base = email.split('@')[0]?.replace(/[^a-zA-Z0-9_.]/g, '') ?? ''
  return base.length >= 3 ? base.slice(0, 30) : `${base}${'_'.repeat(3 - base.length)}`
}

/** Pré-preenche o pagamento com a carteira cadastrada e a conta logada. */
export function paymentDefaults(wallet: Wallet, user: User, network = wallet.network): PaymentValues {
  return {
    displayName: wallet.displayName,
    username: user.username || usernameFrom(user.email),
    profileName: wallet.profileName,
    email: wallet.email,
    referralCode: wallet.referralCode,
    ensName: wallet.ensName,
    ensSuffix: wallet.ensSuffix,
    secondaryAddress: wallet.secondaryAddress,
    note: '',
    network,
    provider: wallet.provider,
  }
}

export function buyerFrom({ network: _network, provider: _provider, ...buyer }: PaymentValues): BuyerProfile {
  return buyer
}
