import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Minus, Plus, Trash2 } from 'lucide-react'
import type { Cart, CartLine, Quote } from '@/api/contracts'
import { Button } from '@/components/ui/button'
import { EthPrice } from '@/components/ui/eth-price'
import { Skeleton } from '@/components/ui/skeleton'
import { sessionQueryOptions } from '@/features/auth/api'
import { nftListQueryOptions } from '@/features/catalog/api'
import { RelatedNfts } from '@/features/nft-detail/components/related-nfts'
import { displayEth } from '@/lib/eth'
import { DESKTOP_QUERY, useMediaQuery } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'
import { cartQueryOptions, quoteQueryOptions, useRemoveCartItem, useUpdateCartItem } from '../api'
import { CartIssues } from './cart-issues'
import { CouponForm } from './coupon-form'

type Variant = 'desktop' | 'mobile'

/* ---------- Quantidade e remoção ---------- */

function LineQuantity({ line, variant }: { line: CartLine; variant: Variant }) {
  const update = useUpdateCartItem()
  const soldOut = line.available === 0
  const max = line.available
  const set = (quantity: number) => update.mutate({ editionId: line.editionId, quantity })

  if (soldOut) return <span className="text-caption font-bold text-destructive-text">Esgotado</span>

  // Figma: desktop botões 20×30 cobre (pílula); mobile círculos claros, "−" apagado no mínimo.
  const buttonClass = cn(
    'flex cursor-pointer items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed [&_svg]:size-4',
    variant === 'desktop'
      ? 'h-[1.875rem] w-5 bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-40'
      : 'size-[1.375rem] bg-foreground text-background disabled:bg-border disabled:text-subtle',
  )
  return (
    <div role="group" aria-label={`Quantidade de ${line.name} (${line.editionLabel})`} className="flex items-center gap-3">
      <button
        type="button"
        aria-label="Diminuir quantidade"
        className={buttonClass}
        disabled={line.quantity <= 1 || update.isPending}
        onClick={() => set(line.quantity - 1)}
      >
        <Minus aria-hidden="true" />
      </button>
      <output aria-live="polite" className={cn('min-w-3 text-center', variant === 'desktop' ? 'text-[1.0625rem]' : 'text-base')}>
        {line.quantity}
      </output>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        className={buttonClass}
        disabled={line.quantity >= max || update.isPending}
        onClick={() => set(line.quantity + 1)}
      >
        <Plus aria-hidden="true" />
      </button>
    </div>
  )
}

function RemoveButton({ line, className }: { line: CartLine; className?: string }) {
  const remove = useRemoveCartItem()
  return (
    <button
      type="button"
      aria-label={`Remover ${line.name} (${line.editionLabel}) do carrinho`}
      disabled={remove.isPending}
      onClick={() => remove.mutate(line.editionId)}
      className={cn(
        'flex size-8 cursor-pointer items-center justify-center rounded-xs text-muted-foreground transition-colors hover:text-destructive-text focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50',
        className,
      )}
    >
      <Trash2 className="size-5" aria-hidden="true" />
    </button>
  )
}

/* ---------- Linhas ---------- */

function DesktopLines({ lines }: { lines: CartLine[] }) {
  return (
    <table className="w-full border-separate border-spacing-y-3 text-left">
      <caption className="sr-only">Itens do carrinho</caption>
      <thead>
        {/* Figma: cabeçalho com linha cobre abaixo. */}
        <tr className="text-base leading-4 [&>th]:border-b [&>th]:border-primary [&>th]:pb-3">
          <th scope="col" className="w-[19.4rem] font-bold">
            NFTs
          </th>
          <th scope="col" className="w-[8.6rem] font-medium">
            Preço
          </th>
          <th scope="col" className="w-[8.5rem] font-bold">
            Edições
          </th>
          <th scope="col" className="font-medium">
            Total
          </th>
          <th scope="col">
            <span className="sr-only">Remover</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => (
          <tr key={line.editionId} className="h-[4.375rem] bg-card">
            <td className="p-0">
              <div className="flex items-center gap-4">
                <img src={line.image} alt="" width={70} height={70} className="size-[4.375rem] rounded-md object-cover" />
                <div className="flex min-w-0 flex-col gap-1.5">
                  <Link to="/nft/$nftId" params={{ nftId: line.nftId }} className="truncate text-base leading-4 font-bold hover:text-accent-foreground">
                    {line.name}
                  </Link>
                  <span className="text-[0.875rem] leading-4 text-subtle">
                    ID do token: {line.tokenId} · {line.editionLabel}
                  </span>
                </div>
              </div>
            </td>
            <td>
              <EthPrice
                value={line.unitPriceEth}
                previous={line.previousUnitPriceEth}
                className="text-base leading-4 font-bold [&>span:first-child]:text-muted-foreground"
              />
            </td>
            <td>
              <LineQuantity line={line} variant="desktop" />
            </td>
            <td className="text-base leading-4 font-bold text-accent-foreground">{displayEth(line.lineTotalEth)} ETH</td>
            <td className="w-12 pr-6 text-right">
              <RemoveButton line={line} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function MobileLines({ lines }: { lines: CartLine[] }) {
  return (
    <ul aria-label="Itens do carrinho" className="flex flex-col gap-5">
      {lines.map((line) => (
        <li key={line.editionId} className="relative flex h-25 overflow-hidden rounded-[0.875rem] bg-card shadow-card">
          <img src={line.image} alt="" width={100} height={100} className="size-25 shrink-0 rounded-[0.875rem] object-cover" />
          <div className="flex min-w-0 flex-1 flex-col justify-between py-3 pr-2 pl-2.5">
            <div className="flex flex-col gap-1.5 pr-8">
              <Link to="/nft/$nftId" params={{ nftId: line.nftId }} className="truncate text-[0.9375rem] leading-4 font-bold">
                {line.name}
              </Link>
              <span className="text-[0.875rem] leading-4 text-muted-foreground">Edição: {line.editionLabel}</span>
            </div>
            <div className="flex items-end justify-between gap-2">
              <span className="text-lg leading-4 font-bold text-accent-foreground">{displayEth(line.lineTotalEth)} ETH</span>
              <LineQuantity line={line} variant="mobile" />
            </div>
          </div>
          {/* Fora do Figma (o ícone de lixeira aparece sobreposto a um item): posição fixa no canto. */}
          <RemoveButton line={line} className="absolute top-1 right-1" />
        </li>
      ))}
    </ul>
  )
}

/* ---------- Resumo ---------- */

type SummaryRowProps = { label: string; value: string; loading: boolean; emphasis?: boolean; small?: boolean }

/** Figma: valores em 18px (desktop) / 16px (mobile); o desconto em 15px; total em cobre. */
function SummaryRow({ label, value, loading, emphasis, small }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={cn('whitespace-nowrap', emphasis ? 'text-base leading-4 font-bold' : 'text-[0.9375rem] leading-5')}>{label}</dt>
      <dd
        className={cn(
          'text-right whitespace-nowrap',
          emphasis ? 'text-lg leading-4 font-bold text-accent-foreground' : small ? 'text-[0.9375rem] leading-5' : 'text-base leading-4 md:text-lg',
        )}
      >
        {loading ? <Skeleton className="ml-auto h-4 w-20" /> : value}
      </dd>
    </div>
  )
}

function CartSummary({ cart, quote, quoteLoading, variant }: { cart: Cart; quote: Quote | undefined; quoteLoading: boolean; variant: Variant }) {
  const { data: session } = useQuery(sessionQueryOptions)
  const navigate = useNavigate()
  const blocked = !quote || quote.issues.length > 0 || quote.lines.length === 0
  const desktop = variant === 'desktop'

  // Pagamento exige login: o visitante entra (o carrinho vem junto) e segue para /pagamento.
  function checkout() {
    if (!session) {
      void navigate({ to: '.', search: (prev) => ({ ...prev, auth: 'login', redirect: '/pagamento' }) })
      return
    }
    void navigate({ to: '/pagamento' })
  }

  return (
    <div className="flex flex-col gap-6">
      <CouponForm appliedCode={cart.couponCode} percentOff={quote?.coupon?.percentOff ?? null} variant={variant} />
      <dl className="flex flex-col gap-3" aria-busy={quoteLoading}>
        <SummaryRow label="Subtotal" value={`${displayEth(quote?.subtotalEth ?? '0')} ETH`} loading={quoteLoading} />
        <SummaryRow label="Desconto do lançamento" value={`(-) ${displayEth(quote?.discountEth ?? '0')} ETH`} loading={quoteLoading} small />
        <div className="flex flex-col gap-1">
          <SummaryRow label="Taxa de rede" value={`${displayEth(quote?.networkFeeEth ?? '0')} ETH`} loading={quoteLoading} />
          <p className="self-end text-[0.75rem] leading-4 text-accent-foreground">Taxa estimada</p>
        </div>
        <div className={cn(desktop && 'pt-3')}>
          <SummaryRow label="Total" value={`${displayEth(quote?.totalEth ?? '0')} ETH`} loading={quoteLoading} emphasis />
        </div>
      </dl>
      <div className="flex flex-col items-center gap-3">
        <Button
          variant={desktop ? 'default' : 'cta'}
          className={cn('w-full font-bold', desktop ? 'h-10 rounded-[0.1875rem] text-[0.9375rem]' : 'h-15 text-base')}
          disabled={blocked}
          onClick={checkout}
        >
          Conectar e finalizar
        </Button>
        {desktop && (
          <Link to="/" hash="mercado" className="text-[0.9375rem] text-accent-foreground hover:underline">
            Continuar explorando
          </Link>
        )}
      </div>
    </div>
  )
}

/* ---------- Estados ---------- */

function EmptyCart() {
  return (
    <div className="flex flex-col items-start gap-4 bg-card p-6">
      <p className="text-body">Seu carrinho está vazio.</p>
      <Button asChild variant="outline">
        <Link to="/" hash="mercado">
          Explorar o mercado
        </Link>
      </Button>
    </div>
  )
}

function CartError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-4 bg-card p-6">
      <p className="text-body">Não foi possível carregar o carrinho.</p>
      <Button variant="outline" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  )
}

function LinesSkeleton() {
  return (
    <div aria-label="Carregando carrinho" role="status" className="flex flex-col gap-3">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-25 w-full md:h-[4.375rem]" />
      ))}
    </div>
  )
}

/* ---------- Página ---------- */

/** Figma "Carrinho de NFTs": tabela + resumo (desktop) e cards + resumo fixo inferior (mobile). */
export function CartPage() {
  const router = useRouter()
  const variant: Variant = useMediaQuery(DESKTOP_QUERY) ? 'desktop' : 'mobile'
  const cart = useQuery(cartQueryOptions)
  const hasLines = Boolean(cart.data?.lines.length)
  const quote = useQuery({ ...quoteQueryOptions, enabled: hasLines })
  const related = useQuery({ ...nftListQueryOptions({ sort: 'popular', page: 1, pageSize: 10 }), enabled: variant === 'desktop' })

  const body = cart.isPending ? (
    <LinesSkeleton />
  ) : cart.isError ? (
    <CartError onRetry={() => void cart.refetch()} />
  ) : !hasLines ? (
    <EmptyCart />
  ) : variant === 'desktop' ? (
    <DesktopLines lines={cart.data.lines} />
  ) : (
    <MobileLines lines={cart.data.lines} />
  )
  const issues = quote.data && cart.data && <CartIssues quote={quote.data} lines={cart.data.lines} />
  const summary = hasLines && cart.data && (
    <CartSummary cart={cart.data} quote={quote.data} quoteLoading={quote.isPending} variant={variant} />
  )

  if (variant === 'mobile') {
    return (
      <div className="flex flex-col gap-3 px-7 pt-8">
        <div className="relative flex h-11 items-center justify-center">
          <button
            type="button"
            aria-label="Voltar"
            onClick={() => (window.history.length > 1 ? router.history.back() : void router.navigate({ to: '/' }))}
            className="absolute left-0 flex size-[2.1875rem] cursor-pointer items-center justify-center rounded-full border border-border bg-surface-raised text-muted-foreground"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <h1 className="text-xl leading-4 font-bold">Carrinho de NFTs</h1>
        </div>
        {issues}
        {body}
        {summary && (
          <>
            {/* Espaço para o resumo fixo não cobrir o último item. */}
            <div aria-hidden="true" className="h-[22rem]" />
            <section
              aria-label="Resumo do pedido"
              className="fixed inset-x-0 bottom-0 z-40 rounded-t-[2.5rem] bg-card px-6 pt-6 pb-9 shadow-sheet"
            >
              {summary}
            </section>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="container flex flex-col gap-24 pt-8">
      <div className="flex flex-col gap-3">
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
            <li aria-current="page">Carrinho</li>
          </ol>
        </nav>
        <h1 className="sr-only">Carrinho de NFTs</h1>
        <div className="grid gap-12 lg:grid-cols-[48.875rem_1fr] lg:gap-[5.375rem]">
          <div className="flex flex-col gap-4">
            {issues}
            {body}
          </div>
          {summary && (
            <section aria-labelledby="summary-title" className="flex flex-col gap-6">
              <h2 id="summary-title" className="border-b border-primary pb-3 text-lg leading-4 font-bold">
                Resumo da carteira
              </h2>
              {summary}
            </section>
          )}
        </div>
      </div>
      <RelatedNfts nfts={related.data?.items} isLoading={related.isPending} title="Colecionadores também viram" />
    </div>
  )
}
