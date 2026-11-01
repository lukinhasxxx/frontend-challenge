import type { ReactNode } from 'react'
import type { Wallet } from '@/api/contracts'
import { cn } from '@/lib/utils'
import { NETWORK_CARD_LABEL, PROVIDER_LABEL, walletIdentity } from '../labels'

type WalletCardProps = {
  wallet: Wallet
  /** Controle à esquerda (rádio de seleção no pagamento). */
  leading?: ReactNode
  /** Ações à direita (menu "⋮" no pagamento). */
  trailing?: ReactNode
  showProvider?: boolean
  className?: string
}

/** Card "Wallet Card" do Figma mobile (Pagamento): fundo card, raio 14, apelido + identidade + rede. */
export function WalletCard({ wallet, leading, trailing, showProvider, className }: WalletCardProps) {
  return (
    <div className={cn('flex min-h-[5.8125rem] items-start gap-4 rounded-[0.875rem] bg-card py-[0.9375rem] pr-3 pl-[1.1875rem]', className)}>
      {leading && <div className="pt-6">{leading}</div>}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-base leading-4 font-bold">{wallet.label}</p>
        <p className="text-[0.875rem] leading-[1.375rem] text-muted-foreground">
          <span className="block truncate">{walletIdentity(wallet)}</span>
          <span className="block">{NETWORK_CARD_LABEL[wallet.network]}</span>
          {showProvider && <span className="block">{PROVIDER_LABEL[wallet.provider]}</span>}
        </p>
      </div>
      {trailing}
    </div>
  )
}
