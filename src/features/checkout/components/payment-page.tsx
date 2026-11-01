import { useReducer, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, EllipsisVertical } from 'lucide-react'
import { DropdownMenu } from 'radix-ui'
import {
  ENS_SUFFIXES,
  WALLET_NETWORKS,
  WALLET_PROVIDERS,
  type Cart,
  type Quote,
  type User,
  type Wallet,
  type WalletConnection,
  type WalletNetwork,
  type WalletProvider,
  type WalletRole,
} from '@/api/contracts'
import { ApiClientError } from '@/api/errors'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { sessionQueryOptions } from '@/features/auth/api'
import { cartKeys, cartQueryOptions, quoteQueryOptions } from '@/features/cart/api'
import { CartIssues } from '@/features/cart/components/cart-issues'
import { walletKeys, walletsQueryOptions } from '@/features/wallets/api'
import { ChoiceIndicator, figmaInputClass, LabeledField, NativeSelect } from '@/features/wallets/components/form-controls'
import { WalletCard } from '@/features/wallets/components/wallet-card'
import { NETWORK_CARD_LABEL, NETWORK_LABEL, PROVIDER_LABEL } from '@/features/wallets/labels'
import { displayEth } from '@/lib/eth'
import { DESKTOP_QUERY, useMediaQuery } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'
import { connectionQueryOptions, isUnresolvedFailure, useConnectWallet, useDisconnectWallet, useSubmitOrder } from '../api'
import { checkoutAttempt, type CheckoutAttempt } from '../attempt'
import { buyerFrom, paymentDefaults, paymentSchema, type PaymentInput, type PaymentValues } from '../schemas'
import { ReviewDialog, type ReviewState } from './review-dialog'
import { ConnectionStatus, WalletOptions } from './wallet-options'

type Variant = 'desktop' | 'mobile'

const UNRESOLVED_MESSAGE =
  'Não recebemos a resposta do servidor e o pedido pode já ter sido criado. Reenvie a mesma tentativa: ela não gera um segundo pedido.'

/* ---------- Molduras (desktop: trilha + container; mobile: cabeçalho com voltar) ---------- */

function Frame({ variant, children }: { variant: Variant; children: ReactNode }) {
  const router = useRouter()
  if (variant === 'mobile') {
    return (
      <div className="flex flex-col gap-4 px-7 pt-8">
        <div className="flex h-11 items-center gap-6">
          <button
            type="button"
            aria-label="Voltar"
            onClick={() => (window.history.length > 1 ? router.history.back() : void router.navigate({ to: '/carrinho' }))}
            className="flex size-[2.1875rem] shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-surface-raised text-muted-foreground"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <h1 className="text-xl leading-4 font-bold">Pagamento com carteira</h1>
        </div>
        {children}
      </div>
    )
  }
  return (
    <div className="container flex flex-col gap-8 pt-8">
      <nav aria-label="Trilha de navegação">
        <ol className="flex gap-1 text-[0.9375rem] leading-4 font-bold">
          <li>
            <Link to="/" className="hover:text-accent-foreground">
              Início
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to="/" hash="mercado" className="hover:text-accent-foreground">
              Mercado
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">Pagamento</li>
        </ol>
      </nav>
      <h1 className="sr-only">Pagamento</h1>
      {children}
    </div>
  )
}

function Notice({ tone = 'info', children }: { tone?: 'info' | 'error'; children: ReactNode }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex flex-col gap-3 rounded-md border bg-surface-raised p-4 text-body-sm', tone === 'error' ? 'border-primary' : 'border-border-strong')}
    >
      {children}
    </div>
  )
}

/* ---------- Resumo desktop ("Seus NFTs") ---------- */

function OrderLines({ cart }: { cart: Cart }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between border-b-[0.3px] border-primary pb-3 text-base leading-4">
        <span className="font-bold">NFTs</span>
        <span className="font-medium">Subtotal</span>
      </div>
      <ul aria-label="NFTs do pedido" className="flex flex-col gap-3">
        {cart.lines.map((line) => (
          <li key={line.editionId} className="flex h-[4.375rem] items-center gap-1.5 bg-card pr-3 pl-1">
            <img src={line.image} alt="" width={70} height={70} className="size-[4.375rem] shrink-0 rounded-lg object-cover" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="truncate text-base leading-4 font-bold">{line.name}</span>
              <span className="truncate text-[0.875rem] leading-4 text-subtle">ID do token: {line.tokenId}</span>
            </div>
            <span className="text-[0.875rem] leading-4 whitespace-nowrap text-muted-foreground">(x {line.quantity})</span>
            <span className="ml-1 text-lg leading-4 font-bold whitespace-nowrap text-accent-foreground">{displayEth(line.lineTotalEth)} ETH</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Totals({ quote, loading }: { quote: Quote | undefined; loading: boolean }) {
  const value = (eth: string | undefined, prefix = '') => (loading || !eth ? <Skeleton className="ml-auto h-4 w-20" /> : `${prefix}${displayEth(eth)} ETH`)
  return (
    <div className="flex flex-col gap-3" aria-busy={loading}>
      <p className="text-center text-[0.875rem] leading-4">
        {quote?.coupon ? (
          <>Cupom {quote.coupon.code} aplicado. </>
        ) : (
          <>Tem um código promocional? </>
        )}
        <Link to="/carrinho" className="text-accent-foreground hover:underline">
          {quote?.coupon ? 'Alterar no carrinho' : 'Aplique aqui'}
        </Link>
      </p>
      <dl className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[0.9375rem] leading-5">Subtotal</dt>
          <dd className="text-lg leading-4">{value(quote?.subtotalEth)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[0.9375rem] leading-5">Desconto do lançamento</dt>
          <dd className="text-[0.9375rem] leading-5">{value(quote?.discountEth, '(-) ')}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[0.9375rem] leading-5">Taxa de rede</dt>
          <dd className="text-lg leading-4">{value(quote?.networkFeeEth)}</dd>
        </div>
        <p className="text-center text-[0.75rem] leading-4 text-accent-foreground">Taxa estimada</p>
        <div className="flex items-center justify-between gap-4 border-t-[0.3px] border-primary px-[2.625rem] pt-3">
          <dt className="text-base leading-4 font-bold">Total</dt>
          <dd className="text-lg leading-4 font-bold text-accent-foreground">{value(quote?.totalEth)}</dd>
        </div>
      </dl>
    </div>
  )
}

/* ---------- Formulário desktop ("Perfil do colecionador") ---------- */

type BuyerFieldsProps = {
  form: ReturnType<typeof useForm<PaymentInput, unknown, PaymentValues>>
  wallet: Wallet
  hasSecondary: boolean
  usingSecondary: boolean
  onToggleWallet: () => void
  onProviderChange: (provider: WalletProvider) => void
}

function BuyerFields({ form, wallet, hasSecondary, usingSecondary, onToggleWallet, onProviderChange }: BuyerFieldsProps) {
  const { errors } = form.formState
  const text = (name: keyof PaymentValues, label: string, inputProps: Record<string, unknown> = {}) => (
    <LabeledField label={label} required overlap={false} error={errors[name]?.message}>
      {(control) => <input {...control} {...form.register(name)} className={figmaInputClass} {...inputProps} />}
    </LabeledField>
  )

  return (
    <section aria-labelledby="buyer-title" className="flex flex-col gap-3">
      <h2 id="buyer-title" className="text-[1.0625rem] leading-4 font-bold">
        Perfil do colecionador
      </h2>
      <div className="flex flex-col gap-6">
        <div className="grid gap-x-6 gap-y-3 md:grid-cols-2">
          {text('displayName', 'Nome de exibição', { autoComplete: 'name' })}
          {text('username', 'Nome de usuário', { autoComplete: 'username' })}

          <LabeledField label="Rede" required overlap={false} error={errors.network?.message}>
            {(control) => (
              <NativeSelect {...control} {...form.register('network')} placeholder="Selecione uma rede">
                {WALLET_NETWORKS.map((network) => (
                  <option key={network} value={network}>
                    {NETWORK_LABEL[network]}
                  </option>
                ))}
              </NativeSelect>
            )}
          </LabeledField>
          {text('profileName', 'Nome do perfil')}

          {/* Endereço vem da carteira cadastrada (troca-se em Carteiras ou em "Usar outra carteira?"). */}
          <LabeledField label="Endereço da carteira" required overlap={false}>
            {(control) => (
              <input {...control} value={wallet.address} readOnly aria-readonly="true" title="Endereço da carteira cadastrada" className={figmaInputClass} />
            )}
          </LabeledField>
          <LabeledField label="ENS ou carteira secundária (opcional)" hideLabel overlap={false} error={errors.secondaryAddress?.message}>
            {(control) => (
              <input
                {...control}
                {...form.register('secondaryAddress')}
                placeholder="ENS ou carteira secundária (opcional)"
                spellCheck={false}
                className={figmaInputClass}
              />
            )}
          </LabeledField>

          <LabeledField label="Tipo de carteira" required overlap={false} error={errors.provider?.message}>
            {(control) => (
              <NativeSelect
                {...control}
                {...form.register('provider', { onChange: (event) => onProviderChange(event.target.value as WalletProvider) })}
                placeholder="Selecione uma carteira"
              >
                {WALLET_PROVIDERS.map((provider) => (
                  <option key={provider} value={provider}>
                    {PROVIDER_LABEL[provider]}
                  </option>
                ))}
              </NativeSelect>
            )}
          </LabeledField>
          {text('referralCode', 'Código de indicação', { autoCapitalize: 'characters' })}

          {text('email', 'E-mail', { type: 'email', autoComplete: 'email' })}
          <LabeledField label="Nome ENS" required overlap={false} error={errors.ensName?.message}>
            {(control) => (
              <div className="flex gap-2.5">
                <NativeSelect aria-label="Sufixo ENS" {...form.register('ensSuffix')} wrapperClassName="w-[4.875rem] shrink-0" className="pr-7 pl-2.5 text-[0.9375rem]">
                  {ENS_SUFFIXES.map((suffix) => (
                    <option key={suffix} value={suffix}>
                      {suffix}
                    </option>
                  ))}
                </NativeSelect>
                <input {...control} {...form.register('ensName')} spellCheck={false} className={figmaInputClass} />
              </div>
            )}
          </LabeledField>
        </div>

        <label className="flex w-fit cursor-pointer items-center gap-2 text-[0.9375rem] leading-5 has-disabled:cursor-not-allowed has-disabled:opacity-60">
          <input type="checkbox" className="peer sr-only" checked={usingSecondary} disabled={!hasSecondary} onChange={onToggleWallet} />
          <ChoiceIndicator checked={usingSecondary} className="size-[0.9375rem] border-2" />
          Usar outra carteira?
        </label>
        {!hasSecondary && (
          <p className="-mt-4 text-caption text-muted-foreground">
            Cadastre uma carteira secundária em{' '}
            <Link to="/perfil/carteiras" className="text-accent-foreground hover:underline">
              Carteiras
            </Link>{' '}
            para usar outra.
          </p>
        )}

        <div className="flex flex-col gap-3">
          <label htmlFor="buyer-note" className="text-[0.9375rem] leading-[0.9375rem]">
            Observação do colecionador (opcional)
          </label>
          <textarea
            id="buyer-note"
            {...form.register('note')}
            aria-invalid={errors.note ? true : undefined}
            aria-describedby={errors.note ? 'buyer-note-error' : undefined}
            className={cn(figmaInputClass, 'h-38 max-w-[21.875rem] resize-none py-3')}
          />
          {errors.note && (
            <p id="buyer-note-error" role="alert" className="text-caption text-destructive-text">
              {errors.note.message}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

/* ---------- Carteiras cadastradas (mobile: "Carteira conectada") ---------- */

type MobileWalletsProps = {
  wallets: Wallet[]
  selected: Wallet
  network: WalletNetwork
  onSelect: (role: WalletRole, network?: WalletNetwork) => void
}

function MobileWallets({ wallets, selected, network, onSelect }: MobileWalletsProps) {
  return (
    <section aria-labelledby="mobile-wallets-title" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 id="mobile-wallets-title" className="text-base leading-4 font-bold">
          Carteira conectada
        </h2>
        <Link to="/perfil/carteiras" className="text-[0.875rem] leading-4 font-bold text-accent-foreground">
          Trocar carteira
        </Link>
      </div>
      <div role="radiogroup" aria-labelledby="mobile-wallets-title" className="flex flex-col gap-5">
        {wallets.map((wallet) => {
          const checked = wallet.id === selected.id
          const shown = checked ? { ...wallet, network } : wallet
          return (
            <WalletCard
              key={wallet.id}
              wallet={shown}
              className={cn(checked && 'shadow-[0_20px_20px_rgb(10_6_4/0.45)]')}
              leading={
                <label className="flex cursor-pointer">
                  <input type="radio" name="payment-wallet" className="peer sr-only" checked={checked} onChange={() => onSelect(wallet.role)} />
                  <ChoiceIndicator checked={checked} muted />
                  <span className="sr-only">
                    {wallet.label}, {NETWORK_CARD_LABEL[shown.network]}
                  </span>
                </label>
              }
              trailing={
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger
                    aria-label={`Opções da carteira ${wallet.label}`}
                    className="flex size-8 cursor-pointer items-center justify-center self-center rounded-full text-subtle focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <EllipsisVertical className="size-5" aria-hidden="true" />
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      align="end"
                      className="z-50 min-w-48 rounded-md border border-border-strong bg-popover p-1 text-[0.875rem] shadow-card"
                    >
                      <DropdownMenu.Label className="px-2 py-1.5 text-caption text-muted-foreground">Rede</DropdownMenu.Label>
                      <DropdownMenu.RadioGroup value={shown.network} onValueChange={(value) => onSelect(wallet.role, value as WalletNetwork)}>
                        {WALLET_NETWORKS.map((option) => (
                          <DropdownMenu.RadioItem
                            key={option}
                            value={option}
                            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 outline-none data-highlighted:bg-accent"
                          >
                            <ChoiceIndicator checked={shown.network === option} />
                            {NETWORK_LABEL[option]}
                          </DropdownMenu.RadioItem>
                        ))}
                      </DropdownMenu.RadioGroup>
                      <DropdownMenu.Separator className="my-1 h-px bg-border" />
                      <DropdownMenu.Item asChild className="block rounded-sm px-2 py-1.5 outline-none data-highlighted:bg-accent">
                        <Link to="/perfil/carteiras">Editar carteiras</Link>
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              }
            />
          )
        })}
      </div>
    </section>
  )
}

/* ---------- Checkout (uma carteira selecionada) ---------- */

type CheckoutProps = {
  variant: Variant
  user: User
  wallet: Wallet
  wallets: Wallet[]
  cart: Cart
  quote: UseQueryResult<Quote>
  connection: WalletConnection | null | undefined
  initialNetwork: WalletNetwork | undefined
  attempt: CheckoutAttempt | null
  onSelectWallet: (role: WalletRole, network?: WalletNetwork) => void
  onAttemptChange: () => void
}

function Checkout({ variant, user, wallet, wallets, cart, quote, connection, initialNetwork, attempt, onSelectWallet, onAttemptChange }: CheckoutProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const desktop = variant === 'desktop'
  const form = useForm<PaymentInput, unknown, PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: paymentDefaults(wallet, user, initialNetwork),
  })
  const provider = useWatch({ control: form.control, name: 'provider' }) as WalletProvider | undefined
  const network = useWatch({ control: form.control, name: 'network' }) as WalletNetwork | undefined

  const connect = useConnectWallet()
  const disconnect = useDisconnectWallet()
  const submit = useSubmitOrder()
  const statusRef = useRef<HTMLDivElement>(null)
  // `isPending` só muda no próximo render: a trava síncrona barra o 2º clique de um duplo clique.
  const sendingRef = useRef(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [review, setReview] = useState<ReviewState | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const connected = Boolean(
    connection && connection.walletId === wallet.id && connection.provider === provider && connection.network === network,
  )
  const unresolved = Boolean(attempt)
  const quoteData = quote.data
  const blocked = !quoteData || quoteData.issues.length > 0 || quoteData.lines.length === 0 || quote.isFetching

  function requestConnection(nextProvider = provider) {
    const nextNetwork = form.getValues('network')
    if (!nextProvider || !nextNetwork) {
      void form.trigger(['network', 'provider'])
      return
    }
    setConnectError(null)
    connect.mutate(
      { walletId: wallet.id, provider: nextProvider, network: nextNetwork },
      { onError: (error) => setConnectError(error instanceof ApiClientError ? error.message : 'Não foi possível conectar a carteira.') },
    )
  }

  function chooseProvider(next: WalletProvider) {
    form.setValue('provider', next, { shouldValidate: true })
    connect.reset()
    requestConnection(next)
  }

  function sendOrder(body: ReviewState['body'], reviewedTotal?: string) {
    if (sendingRef.current) return
    sendingRef.current = true
    setReviewError(null)
    submit.mutate(
      { userId: user.id, body },
      {
        onSettled: () => {
          sendingRef.current = false
          onAttemptChange()
        },
        // Pedido criado (pendente): o resultado do pagamento é acompanhado na página do pedido.
        onSuccess: (order) => void navigate({ to: '/pedidos/$orderId', params: { orderId: order.id } }),
        onError: (error) => {
          if (isUnresolvedFailure(error)) {
            setReviewError(UNRESOLVED_MESSAGE)
            return
          }
          setReview(null)
          const apiError = error instanceof ApiClientError ? error : null
          if (apiError?.code === 'QUOTE_STALE') {
            // Nada foi criado: busca a cotação nova e exige nova confirmação com os valores atuais.
            void queryClient.invalidateQueries({ queryKey: cartKeys.all })
            const before = reviewedTotal ? ` (total revisado: ${displayEth(reviewedTotal)} ETH)` : ''
            setNotice(`Os valores mudaram desde a sua revisão${before}. Confira o resumo atualizado e confirme a compra de novo.`)
          } else if (apiError?.code === 'WALLET_NOT_CONNECTED') {
            void queryClient.invalidateQueries({ queryKey: walletKeys.connection })
            setConnectError(apiError.message)
            statusRef.current?.focus()
          } else {
            setNotice(apiError?.message ?? 'Não foi possível enviar o pedido. Tente novamente.')
          }
        },
      },
    )
  }

  function onValid(values: PaymentValues) {
    setNotice(null)
    if (blocked || !quoteData) return
    if (!connected) {
      setConnectError('Conecte sua carteira para continuar.')
      statusRef.current?.focus()
      return
    }
    setReview({
      quote: quoteData,
      wallet,
      body: { quoteId: quoteData.id, walletId: wallet.id, network: values.network, provider: values.provider, buyer: buyerFrom(values) },
    })
  }

  // Mobile não mostra o formulário: dados da carteira inválidos são corrigidos em Carteiras.
  function onInvalid() {
    if (!desktop) setNotice('Os dados da carteira estão incompletos. Atualize-os em Carteiras antes de pagar.')
  }

  const confirm = (event: FormEvent<HTMLFormElement>) => void form.handleSubmit(onValid, onInvalid)(event)

  const notices = (
    <>
      {unresolved && attempt && !review && (
        <Notice tone="error">
          <p>{UNRESOLVED_MESSAGE}</p>
          <Button size="sm" className="w-fit font-bold" disabled={submit.isPending} onClick={() => sendOrder(attempt.body)}>
            {submit.isPending ? 'Reenviando…' : 'Reenviar pedido'}
          </Button>
        </Notice>
      )}
      {notice && <Notice tone="error">{notice}</Notice>}
      {quoteData && <CartIssues quote={quoteData} lines={cart.lines} />}
    </>
  )

  const status = (
    <ConnectionStatus
      ref={statusRef}
      provider={provider}
      connection={connection}
      connected={connected}
      connecting={connect.isPending}
      error={connectError}
      onConnect={() => requestConnection()}
      onDisconnect={() => disconnect.mutate()}
      disconnecting={disconnect.isPending}
    />
  )

  const confirmButton = (
    <Button
      type="submit"
      form="payment-form"
      variant={desktop ? 'default' : 'cta'}
      disabled={blocked || submit.isPending || unresolved}
      className={cn('w-full font-bold', desktop ? 'h-[2.8125rem] rounded-lg text-[0.9375rem]' : 'h-15 text-[0.9375rem]')}
    >
      Confirmar compra
    </Button>
  )

  const dialog = (
    <ReviewDialog
      review={review}
      pending={submit.isPending}
      unresolved={unresolved}
      error={reviewError}
      onConfirm={() => review && sendOrder(unresolved && attempt ? attempt.body : review.body, review.quote.totalEth)}
      onClose={() => {
        setReview(null)
        setReviewError(null)
      }}
    />
  )

  if (!desktop) {
    return (
      <form id="payment-form" noValidate onSubmit={confirm} aria-label="Pagamento" className="flex flex-col gap-4">
        {notices}
        <MobileWallets wallets={wallets} selected={wallet} network={network ?? wallet.network} onSelect={onSelectWallet} />
        <section aria-labelledby="mobile-options-title" className="flex flex-col gap-4">
          <h2 id="mobile-options-title" className="text-base leading-4 font-bold">
            Carteira e rede
          </h2>
          <WalletOptions variant="mobile" value={provider} onChange={chooseProvider} disabled={connect.isPending} />
          {status}
        </section>
        <p className="flex items-center justify-end gap-7 text-base leading-4 font-bold">
          Total:
          <span className="text-lg text-accent-foreground">{quoteData ? `${displayEth(quoteData.totalEth)} ETH` : <Skeleton className="h-4 w-24" />}</span>
        </p>
        <div aria-hidden="true" className="h-24" />
        <div className="fixed inset-x-7 bottom-8 z-40">{confirmButton}</div>
        {dialog}
      </form>
    )
  }

  return (
    <>
      {notices}
      <div className="grid gap-8 pb-24 lg:grid-cols-[minmax(0,47.6875rem)_25.3125rem] lg:justify-between">
        <form id="payment-form" noValidate onSubmit={confirm} aria-label="Perfil do colecionador">
          <BuyerFields
            form={form}
            wallet={wallet}
            hasSecondary={wallets.some((w) => w.role === 'secondary')}
            usingSecondary={wallet.role === 'secondary'}
            onToggleWallet={() => onSelectWallet(wallet.role === 'secondary' ? 'primary' : 'secondary')}
            onProviderChange={(next) => {
              connect.reset()
              requestConnection(next)
            }}
          />
        </form>
        <aside aria-label="Resumo do pedido" className="flex flex-col gap-3">
          <h2 className="text-[1.0625rem] leading-4 font-bold">Seus NFTs</h2>
          <OrderLines cart={cart} />
          <Totals quote={quoteData} loading={quote.isPending} />
          <section aria-labelledby="options-title" className="flex flex-col gap-5 pt-3">
            <h2 id="options-title" className="text-center text-[1.0625rem] leading-4 font-bold">
              Carteira e rede
            </h2>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <WalletOptions variant="desktop" value={provider} onChange={chooseProvider} disabled={connect.isPending} />
                {status}
              </div>
              {confirmButton}
            </div>
          </section>
        </aside>
      </div>
      {dialog}
    </>
  )
}

/* ---------- Página ---------- */

/** Figma "Pagamento": formulário + resumo + carteira e rede (desktop) e carteiras + opções (mobile). */
export function PaymentPage() {
  const variant: Variant = useMediaQuery(DESKTOP_QUERY) ? 'desktop' : 'mobile'
  const { data: session } = useQuery(sessionQueryOptions)
  const wallets = useQuery(walletsQueryOptions)
  const cart = useQuery(cartQueryOptions)
  const hasLines = Boolean(cart.data?.lines.length)
  const quote = useQuery({ ...quoteQueryOptions, enabled: hasLines })
  const connection = useQuery(connectionQueryOptions)
  const [selection, setSelection] = useState<{ role: WalletRole; network?: WalletNetwork }>({ role: 'primary' })
  const [, refreshAttempt] = useReducer((n: number) => n + 1, 0)

  const user = session?.user
  if (!user) return null
  const attempt = checkoutAttempt.read(user.id)

  let body: ReactNode
  if (wallets.isPending || cart.isPending) {
    body = (
      <div role="status" aria-label="Carregando pagamento" className="grid gap-8 lg:grid-cols-[1fr_25.3125rem]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  } else if (wallets.isError || cart.isError) {
    body = (
      <Notice tone="error">
        <p>Não foi possível carregar o pagamento.</p>
        <Button size="sm" variant="outline" className="w-fit" onClick={() => void Promise.all([wallets.refetch(), cart.refetch()])}>
          Tentar novamente
        </Button>
      </Notice>
    )
  } else if (!hasLines) {
    body = (
      <Notice>
        <p>Seu carrinho está vazio.</p>
        <Button asChild size="sm" variant="outline" className="w-fit">
          <Link to="/" hash="mercado">
            Explorar o mercado
          </Link>
        </Button>
      </Notice>
    )
  } else if (!wallets.data.length) {
    body = (
      <Notice>
        <p>Cadastre uma carteira para pagar e receber seus NFTs.</p>
        <Button asChild size="sm" className="w-fit font-bold">
          <Link to="/perfil/carteiras">Cadastrar carteira</Link>
        </Button>
      </Notice>
    )
  } else {
    const wallet = wallets.data.find((w) => w.role === selection.role) ?? wallets.data[0]!
    body = (
      <Checkout
        key={`${wallet.id}:${selection.network ?? ''}`}
        variant={variant}
        user={user}
        wallet={wallet}
        wallets={wallets.data}
        cart={cart.data}
        quote={quote}
        connection={connection.data}
        initialNetwork={selection.network}
        attempt={attempt}
        onSelectWallet={(role, network) => setSelection({ role, network })}
        onAttemptChange={refreshAttempt}
      />
    )
  }

  return <Frame variant={variant}>{body}</Frame>
}
