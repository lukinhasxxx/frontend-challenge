import { useEffect, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, X } from 'lucide-react'
import type { Order } from '@/api/contracts'
import { ApiClientError } from '@/api/errors'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cartKeys } from '@/features/cart/api'
import { NETWORK_LABEL, PROVIDER_LABEL, shortAddress } from '@/features/wallets/labels'
import { compareEth, displayEth } from '@/lib/eth'
import { orderQueryOptions } from '../api'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

/** "29 Jul, 2026" (formato do Figma). */
function formatDate(iso: string) {
  const date = new Date(iso)
  return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${date.getFullYear()}`
}

const EXPLORER_NAME: Record<Order['network'], string> = { ethereum: 'Etherscan', polygon: 'Polygonscan' }

/** Ícone "thank-you" do Figma (envelope com cartão), traço cobre. */
function ThankYouIcon() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" aria-hidden="true" className="text-primary">
      <path d="M36 9.5 40 5.5l4 4" />
      <path d="M17 41V12a2.5 2.5 0 0 1 2.5-2.5h41A2.5 2.5 0 0 1 63 12v29" />
      <text x="40" y="24" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="currentColor" stroke="none" fontFamily="inherit">
        THANK
      </text>
      <text x="40" y="35" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="currentColor" stroke="none" fontFamily="inherit">
        YOU
      </text>
      <path d="M17 30 9 36v35.5A2.5 2.5 0 0 0 11.5 74h57a2.5 2.5 0 0 0 2.5-2.5V36l-8-6" />
      <path d="m9 36 31 22 31-22" />
      <path d="m9.5 73 24-19.5M70.5 73l-24-19.5" />
    </svg>
  )
}

/** Moldura do modal "Order Confirmation Modal" do Figma: 578px, fundo card, faixa cobre de 10px embaixo. */
function Panel({ children, closeLabel = 'Fechar' }: { children: ReactNode; closeLabel?: string }) {
  return (
    <article className="relative mx-auto w-full max-w-[36.125rem] border-b-[0.625rem] border-primary bg-card">
      <Link
        to="/"
        aria-label={closeLabel}
        className="absolute top-3.5 right-3.5 flex size-6 items-center justify-center rounded-xs text-accent-foreground hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-ring"
      >
        <X className="size-[1.125rem]" aria-hidden="true" />
      </Link>
      {children}
    </article>
  )
}

/* ---------- Pendente e recusado (não desenhados: mesmo modal do recibo) ---------- */

function PendingOrder({ order }: { order: Order }) {
  return (
    <Panel>
      <div role="status" className="flex flex-col items-center gap-4 px-6 py-12 text-center md:px-11">
        <Loader2 className="size-12 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
        <h1 className="text-base leading-4 font-bold text-muted-foreground">Aguardando confirmação do pagamento</h1>
        <p className="max-w-md text-[0.875rem] leading-[1.375rem] text-muted-foreground">
          Pedido {order.id} · {displayEth(order.totalEth)} ETH na rede {NETWORK_LABEL[order.network]}. O recibo aparece aqui assim que a rede
          confirmar. Se a página for recarregada ou a conexão cair, o status é recuperado sem criar outra compra.
        </p>
      </div>
    </Panel>
  )
}

function DeclinedOrder({ order }: { order: Order }) {
  return (
    <Panel>
      <div role="alert" className="flex flex-col items-center gap-4 px-6 py-12 text-center md:px-11">
        <h1 className="text-lg leading-6 font-bold text-destructive-text">Pagamento recusado</h1>
        <p className="max-w-md text-[0.875rem] leading-[1.375rem] text-muted-foreground">
          {order.failureReason ?? 'O pagamento não foi concluído.'} Seus itens continuam no carrinho.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button asChild className="font-bold">
            <Link to="/pagamento">Tentar de novo</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/carrinho">Voltar ao carrinho</Link>
          </Button>
        </div>
      </div>
    </Panel>
  )
}

/* ---------- Recibo (Figma "Confirmação de Pedido") ---------- */

function MetaItem({ label, value, strongLabel, last }: { label: string; value: string; strongLabel?: boolean; last?: boolean }) {
  return (
    <div className={last ? '' : 'md:border-r md:border-primary md:pr-[1.0625rem]'}>
      <dt className={strongLabel ? 'text-[0.875rem] leading-4 font-bold' : 'text-[0.875rem] leading-4'}>{label}</dt>
      <dd className="text-[0.9375rem] leading-5">{value}</dd>
    </div>
  )
}

function Receipt({ order }: { order: Order }) {
  const hasDiscount = compareEth(order.discountEth, '0') > 0
  return (
    <Panel closeLabel="Fechar recibo">
      <header className="flex h-39 flex-col items-center justify-center gap-4 px-6 text-center">
        <ThankYouIcon />
        <h1 className="text-base leading-4 font-bold text-muted-foreground">Seus NFTs agora estão na sua carteira</h1>
      </header>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-primary px-6 py-3 text-muted-foreground md:flex md:h-[4.0625rem] md:items-center md:justify-between md:gap-3 md:px-9 md:py-1">
        <MetaItem label="ID da transação" value={order.txHash ? shortAddress(order.txHash) : '—'} strongLabel />
        <MetaItem label="Data" value={formatDate(order.updatedAt)} />
        <MetaItem label="Total" value={`${displayEth(order.totalEth)} ETH`} />
        <MetaItem label="Carteira" value={PROVIDER_LABEL[order.provider]} strongLabel last />
      </dl>

      <section aria-labelledby="receipt-details" className="flex flex-col gap-3 px-4 pt-5 pb-12 md:px-11">
        <h2 id="receipt-details" className="text-[0.9375rem] leading-4 font-bold">
          Detalhes da transação
        </h2>
        <table className="w-full border-separate border-spacing-y-3 text-left">
          <caption className="sr-only">Itens comprados</caption>
          <thead>
            <tr className="text-base leading-4 [&>th]:border-b-[0.3px] [&>th]:border-primary [&>th]:pb-3">
              <th scope="col" className="font-bold">
                NFTs
              </th>
              <th scope="col" className="w-24 text-center font-bold max-md:hidden">
                Edições
              </th>
              <th scope="col" className="w-28 text-right font-medium">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => (
              <tr key={line.editionId} className="h-[4.375rem]">
                <td className="p-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <img src={line.image} alt="" width={70} height={70} className="size-14 shrink-0 rounded-lg object-cover md:size-[4.375rem]" />
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <span className="text-[0.9375rem] leading-4 font-bold md:text-base">{line.name}</span>
                      <span className="text-[0.875rem] leading-4 text-subtle">ID do token: {line.tokenId}</span>
                    </div>
                  </div>
                </td>
                <td className="text-center text-[0.875rem] leading-4 whitespace-nowrap text-muted-foreground max-md:hidden">
                  (x {line.quantity})<span className="block pt-1 text-caption">{line.editionLabel}</span>
                </td>
                <td className="text-right whitespace-nowrap">
                  <span className="block text-lg leading-4 font-bold text-accent-foreground">{displayEth(line.lineTotalEth)} ETH</span>
                  {/* Mobile: sem a coluna "Edições", quantidade e edição vão abaixo do subtotal. */}
                  <span className="block pt-1.5 text-[0.875rem] leading-4 text-muted-foreground md:hidden">
                    (x {line.quantity}) · {line.editionLabel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ml-auto flex w-full max-w-[20.0625rem] flex-col gap-3">
          {hasDiscount && (
            <>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[0.9375rem] leading-5">Subtotal</dt>
                <dd className="text-lg leading-4">{displayEth(order.subtotalEth)} ETH</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[0.9375rem] leading-5">Desconto{order.coupon && ` (${order.coupon.code})`}</dt>
                <dd className="text-[0.9375rem] leading-5">(-) {displayEth(order.discountEth)} ETH</dd>
              </div>
            </>
          )}
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[0.9375rem] leading-5">Taxa de rede</dt>
            <dd className="text-lg leading-4">{displayEth(order.networkFeeEth)} ETH</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-base leading-4 font-bold">Total</dt>
            <dd className="text-lg leading-4 font-bold text-accent-foreground">{displayEth(order.totalEth)} ETH</dd>
          </div>
        </dl>

        <div className="flex flex-col items-center gap-5 border-t-[0.3px] border-primary pt-3 text-center">
          <p className="text-[0.875rem] leading-[1.375rem] text-muted-foreground">
            Transação confirmada na {NETWORK_LABEL[order.network]}. A propriedade foi transferida para sua carteira conectada e registrada na rede.
          </p>
          {order.explorerUrl && (
            <a
              href={order.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 items-center rounded-sm bg-primary px-4 text-base leading-4 font-bold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Ver no {EXPLORER_NAME[order.network]}
              <span className="sr-only"> (abre em nova aba; transação simulada)</span>
            </a>
          )}
        </div>
      </section>
    </Panel>
  )
}

/* ---------- Página ---------- */

/**
 * Pedido: pendente → confirmado/recusado via `order.updated` (cache), com recuperação por
 * `GET /api/orders/:id` em refresh e reconexão. O recibo só aparece para pedido confirmado.
 */
export function OrderPage({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient()
  const order = useQuery(orderQueryOptions(orderId))
  const status = order.data?.status

  // Confirmado (por evento ou ao reabrir a página): o carrinho perdeu os itens comprados.
  useEffect(() => {
    if (status === 'confirmed') void queryClient.invalidateQueries({ queryKey: cartKeys.all })
  }, [status, queryClient])

  let body: ReactNode
  if (order.isPending) {
    body = <Skeleton role="status" aria-label="Carregando pedido" className="mx-auto h-96 w-full max-w-[36.125rem]" />
  } else if (order.isError) {
    const notFound = order.error instanceof ApiClientError && order.error.status === 404
    body = (
      <Panel>
        <div role="alert" className="flex flex-col items-center gap-4 px-6 py-12 text-center">
          <h1 className="text-lg font-bold">{notFound ? 'Pedido não encontrado' : 'Não foi possível carregar o pedido'}</h1>
          {!notFound && (
            <Button variant="outline" onClick={() => void order.refetch()}>
              Tentar novamente
            </Button>
          )}
        </div>
      </Panel>
    )
  } else if (order.data.status === 'confirmed') {
    body = <Receipt order={order.data} />
  } else if (order.data.status === 'declined') {
    body = <DeclinedOrder order={order.data} />
  } else {
    body = <PendingOrder order={order.data} />
  }

  return <div className="container pt-8 pb-24 md:pt-16">{body}</div>
}
