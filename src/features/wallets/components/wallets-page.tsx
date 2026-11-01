import { useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import type { Wallet, WalletDetails } from '@/api/contracts'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AccountSidebar } from '@/features/profile/components/account-sidebar'
import { walletsQueryOptions } from '../api'
import { ROLE_TITLE } from '../labels'
import { ChoiceIndicator } from './form-controls'
import { WalletCard } from './wallet-card'
import { WalletForm } from './wallet-form'

function detailsOf(wallet: Wallet): WalletDetails {
  const { id: _id, role: _role, updatedAt: _updatedAt, ...details } = wallet
  return details
}

const actionClass = 'cursor-pointer text-base leading-4 font-medium text-accent-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-50'

/* ---------- Carteira principal ---------- */

function PrimarySection({ wallet }: { wallet: Wallet | undefined }) {
  // Figma: sem carteira, o formulário já aparece aberto.
  const [editing, setEditing] = useState(!wallet)
  const formRef = useRef<HTMLDivElement>(null)
  const showForm = editing || !wallet

  return (
    <section aria-labelledby="primary-wallet-title" className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <h2 id="primary-wallet-title" className="text-[1.0625rem] leading-4 font-bold">
            {ROLE_TITLE.primary}
          </h2>
          {!wallet ? (
            <button type="button" className={actionClass} onClick={() => formRef.current?.querySelector('input')?.focus()}>
              Adicionar
            </button>
          ) : (
            !editing && (
              <button type="button" className={actionClass} onClick={() => setEditing(true)} aria-label="Editar carteira principal">
                Editar
              </button>
            )
          )}
        </div>
        <p className="text-[0.875rem] leading-[0.9375rem] text-muted-foreground">
          Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
        </p>
      </div>
      {showForm ? (
        <div ref={formRef}>
          <WalletForm
            role="primary"
            initial={wallet && detailsOf(wallet)}
            onSaved={() => setEditing(false)}
            onCancel={wallet ? () => setEditing(false) : undefined}
          />
        </div>
      ) : (
        <WalletCard wallet={wallet} showProvider className="md:max-w-[26.0625rem]" />
      )}
    </section>
  )
}

/* ---------- Carteira secundária ---------- */

function SecondarySection({ wallet, primary }: { wallet: Wallet | undefined; primary: Wallet | undefined }) {
  const [editing, setEditing] = useState(false)
  const [sameAsPrimary, setSameAsPrimary] = useState(false)

  // "Igual à carteira principal": abre o formulário já preenchido com os dados da principal.
  const initial = sameAsPrimary && primary ? detailsOf(primary) : wallet && detailsOf(wallet)
  const close = () => {
    setEditing(false)
    setSameAsPrimary(false)
  }

  return (
    <section aria-labelledby="secondary-wallet-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h2 id="secondary-wallet-title" className="text-[1.0625rem] leading-4 font-bold">
          {ROLE_TITLE.secondary}
        </h2>
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-[0.875rem] leading-4 has-disabled:cursor-not-allowed has-disabled:opacity-50">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={sameAsPrimary}
              disabled={!primary}
              onChange={(event) => {
                setSameAsPrimary(event.target.checked)
                if (event.target.checked) setEditing(true)
              }}
            />
            <ChoiceIndicator checked={sameAsPrimary} />
            Igual à carteira principal
          </label>
          {!editing && (
            <button
              type="button"
              className={actionClass}
              disabled={!primary}
              onClick={() => setEditing(true)}
              aria-label={wallet ? 'Editar carteira secundária' : 'Adicionar carteira secundária'}
            >
              {wallet ? 'Editar' : 'Adicionar'}
            </button>
          )}
        </div>
      </div>
      {editing ? (
        <div className="pt-5">
          <WalletForm key={sameAsPrimary ? 'same' : 'own'} role="secondary" initial={initial} onSaved={close} onCancel={close} />
        </div>
      ) : wallet ? (
        <WalletCard wallet={wallet} showProvider className="md:max-w-[26.0625rem]" />
      ) : (
        <p className="text-[0.875rem] leading-[0.9375rem] text-muted-foreground">
          {primary ? 'Você ainda não adicionou uma carteira secundária.' : 'Cadastre a carteira principal para adicionar uma secundária.'}
        </p>
      )}
    </section>
  )
}

/* ---------- Página ---------- */

/** Figma "Desktop / Carteiras" (sem frame mobile: coluna única com cabeçalho de voltar, como as telas mobile). */
export function WalletsPage() {
  const wallets = useQuery(walletsQueryOptions)
  const primary = wallets.data?.find((w) => w.role === 'primary')
  const secondary = wallets.data?.find((w) => w.role === 'secondary')

  return (
    <div className="container flex flex-col gap-7 py-8 lg:flex-row lg:items-start">
      <div className="hidden lg:contents">
        <AccountSidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-8">
        <div className="relative flex h-11 items-center justify-center lg:hidden">
          <Link
            to="/perfil"
            aria-label="Voltar ao perfil"
            className="absolute left-0 flex size-[2.1875rem] items-center justify-center rounded-full border border-border bg-surface-raised text-muted-foreground"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </Link>
          <h1 className="text-xl leading-4 font-bold">Carteiras</h1>
        </div>
        <h1 className="sr-only max-lg:hidden">Carteiras</h1>

        {wallets.isPending ? (
          <div role="status" aria-label="Carregando carteiras" className="flex flex-col gap-6">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : wallets.isError ? (
          <div role="alert" className="flex flex-col items-start gap-4 bg-card p-6">
            <p className="text-body">Não foi possível carregar suas carteiras.</p>
            <Button variant="outline" onClick={() => void wallets.refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <>
            <PrimarySection key={primary?.id ?? 'new'} wallet={primary} />
            <SecondarySection key={secondary?.id ?? 'new'} wallet={secondary} primary={primary} />
          </>
        )}
      </div>
    </div>
  )
}
