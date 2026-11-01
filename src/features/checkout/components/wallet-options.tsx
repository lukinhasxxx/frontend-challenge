import { forwardRef } from 'react'
import { Wallet as WalletIcon } from 'lucide-react'
import { WALLET_PROVIDERS, type WalletConnection, type WalletProvider } from '@/api/contracts'
import { ChoiceIndicator } from '@/features/wallets/components/form-controls'
import { NETWORK_LABEL, PROVIDER_LABEL, shortAddress } from '@/features/wallets/labels'
import { cn } from '@/lib/utils'

type Variant = 'desktop' | 'mobile'

/** Ordem do Figma: WalletConnect, MetaMask, Coinbase. */
const PROVIDER_MARK: Record<WalletProvider, string | null> = { walletconnect: 'W', metamask: 'M', coinbase: null }

type WalletOptionsProps = {
  variant: Variant
  value: WalletProvider | undefined
  onChange: (provider: WalletProvider) => void
  disabled?: boolean
}

/**
 * "Carteira e rede" (Figma). Escolher uma opção pede a conexão à carteira (simulada).
 * Desktop: linhas de 45px com borda; mobile: cards de 65px com marca à esquerda e rádio à direita.
 */
export function WalletOptions({ variant, value, onChange, disabled }: WalletOptionsProps) {
  const desktop = variant === 'desktop'
  return (
    <div role="radiogroup" aria-label="Carteira para pagar" className={cn('flex flex-col', desktop ? 'gap-4' : 'gap-4')}>
      {WALLET_PROVIDERS.map((provider) => {
        const checked = value === provider
        const input = (
          <input
            type="radio"
            name="wallet-provider"
            value={provider}
            checked={checked}
            disabled={disabled}
            onChange={() => onChange(provider)}
            className="peer sr-only"
          />
        )
        if (desktop) {
          return (
            <label
              key={provider}
              className={cn(
                'flex h-[2.8125rem] cursor-pointer items-center gap-2.5 rounded-[0.1875rem] border px-3 transition-colors has-disabled:cursor-not-allowed',
                checked ? 'border-primary' : 'border-border hover:border-border-strong',
              )}
            >
              {input}
              <ChoiceIndicator checked={checked} />
              {provider === 'walletconnect' ? (
                <>
                  <span className="sr-only">WalletConnect (MetaMask, WalletConnect ou Coinbase)</span>
                  <span
                    aria-hidden="true"
                    className="flex h-[1.625rem] items-center rounded-md border border-border-strong bg-surface-dark px-2 text-[0.5625rem] leading-3 font-bold tracking-[0.00625rem] whitespace-nowrap text-accent-foreground"
                  >
                    METAMASK • WALLETCONNECT • COINBASE
                  </span>
                </>
              ) : (
                <span className="text-[0.9375rem] leading-5">{PROVIDER_LABEL[provider]}</span>
              )}
            </label>
          )
        }
        const mark = PROVIDER_MARK[provider]
        return (
          <label
            key={provider}
            className="flex h-[4.0625rem] cursor-pointer items-center gap-3 rounded-[0.9375rem] bg-card pr-4 pl-3.5 shadow-card has-disabled:cursor-not-allowed"
          >
            {input}
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-raised text-[0.875rem] leading-[1.125rem] font-bold text-accent-foreground"
            >
              {mark ?? <WalletIcon className="size-5" />}
            </span>
            <span className="flex-1 text-[0.875rem] leading-4">{PROVIDER_LABEL[provider]}</span>
            <ChoiceIndicator checked={checked} muted />
          </label>
        )
      })}
    </div>
  )
}

type ConnectionStatusProps = {
  provider: WalletProvider | undefined
  connection: WalletConnection | null | undefined
  connected: boolean
  connecting: boolean
  /** Recusa da carteira ou exigência de conectar antes de confirmar. */
  error: string | null
  onConnect: () => void
  onDisconnect: () => void
  disconnecting: boolean
}

const linkButton =
  'cursor-pointer font-bold text-accent-foreground underline-offset-2 hover:underline disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-ring'

/** Estado da conexão simulada (não desenhado no Figma): texto + ação, anunciado por leitores de tela. */
export const ConnectionStatus = forwardRef<HTMLDivElement, ConnectionStatusProps>(function ConnectionStatus(
  { provider, connection, connected, connecting, error, onConnect, onDisconnect, disconnecting },
  ref,
) {
  const name = provider ? PROVIDER_LABEL[provider] : 'a carteira'
  return (
    <div ref={ref} tabIndex={-1} className="flex flex-col gap-2 text-[0.875rem] leading-5 outline-none">
      <p role="status" className={cn(connected ? 'text-foreground' : 'text-muted-foreground')}>
        {connecting
          ? `Conectando a ${name}… aprove o pedido na carteira.`
          : connected && connection
            ? `${PROVIDER_LABEL[connection.provider]} conectada · ${NETWORK_LABEL[connection.network]} · ${shortAddress(connection.address)}`
            : provider
              ? `${PROVIDER_LABEL[provider]} não conectada.`
              : 'Escolha uma carteira para conectar.'}
      </p>
      {error && !connecting && (
        <p role="alert" className="text-destructive-text">
          {error}
        </p>
      )}
      {!connecting && provider && (
        <div>
          {connected ? (
            <button type="button" className={linkButton} onClick={onDisconnect} disabled={disconnecting}>
              Desconectar
            </button>
          ) : (
            <button type="button" className={linkButton} onClick={onConnect}>
              {error ? 'Tentar conectar de novo' : `Conectar ${PROVIDER_LABEL[provider]}`}
            </button>
          )}
        </div>
      )}
    </div>
  )
})
