import { Loader2 } from 'lucide-react'
import type { CreateOrderRequest, Quote, Wallet } from '@/api/contracts'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { NETWORK_LABEL, PROVIDER_LABEL, shortAddress } from '@/features/wallets/labels'
import { displayEth } from '@/lib/eth'

export type ReviewState = { body: CreateOrderRequest; quote: Quote; wallet: Wallet }

type ReviewDialogProps = {
  review: ReviewState | null
  pending: boolean
  /** Falha sem resposta (timeout/queda): reenviar a mesma tentativa. */
  unresolved: boolean
  error: string | null
  onConfirm: () => void
  onClose: () => void
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className={strong ? 'font-bold' : 'text-muted-foreground'}>{label}</dt>
      <dd className={strong ? 'text-right font-bold text-accent-foreground' : 'text-right'}>{value}</dd>
    </div>
  )
}

/**
 * Revisão antes do envio (não desenhada no Figma: segue o padrão dos modais do app).
 * Enquanto envia, não fecha e o botão fica travado: um clique, um pedido.
 */
export function ReviewDialog({ review, pending, unresolved, error, onConfirm, onClose }: ReviewDialogProps) {
  return (
    <Dialog open={review !== null} onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent
        showCloseButton={!pending}
        onEscapeKeyDown={(event) => pending && event.preventDefault()}
        onInteractOutside={(event) => pending && event.preventDefault()}
        className="max-h-[calc(100dvh-2rem)] gap-6 overflow-y-auto rounded-lg border-0 border-b-[0.625rem] border-primary text-[0.875rem] leading-5 sm:max-w-[31.25rem]"
      >
        {review && (
          <>
            <DialogHeader className="text-left">
              <DialogTitle className="text-lg leading-6 font-bold">Revise seu pedido</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Confira itens, valores e carteira. Ao confirmar, o pedido é enviado com estes valores.
              </DialogDescription>
            </DialogHeader>

            <section aria-labelledby="review-items" className="flex flex-col gap-2">
              <h3 id="review-items" className="font-bold">
                Itens
              </h3>
              <ul className="flex flex-col gap-1.5">
                {review.quote.lines.map((line) => (
                  <li key={line.editionId} className="flex justify-between gap-4">
                    <span>
                      {line.name} ({line.editionLabel}) × {line.quantity}
                    </span>
                    <span className="whitespace-nowrap">{displayEth(line.lineTotalEth)} ETH</span>
                  </li>
                ))}
              </ul>
            </section>

            <dl className="flex flex-col gap-1.5 border-t border-border pt-4">
              <Row label="Subtotal" value={`${displayEth(review.quote.subtotalEth)} ETH`} />
              <Row
                label={review.quote.coupon ? `Desconto (${review.quote.coupon.code})` : 'Desconto do lançamento'}
                value={`(-) ${displayEth(review.quote.discountEth)} ETH`}
              />
              <Row label="Taxa de rede" value={`${displayEth(review.quote.networkFeeEth)} ETH`} />
              <Row label="Total" value={`${displayEth(review.quote.totalEth)} ETH`} strong />
            </dl>

            <dl className="flex flex-col gap-1.5 border-t border-border pt-4">
              <Row label="Carteira" value={`${review.wallet.label} · ${shortAddress(review.wallet.address)}`} />
              <Row label="Conexão" value={PROVIDER_LABEL[review.body.provider]} />
              <Row label="Rede" value={NETWORK_LABEL[review.body.network]} />
              <Row label="Colecionador" value={`${review.body.buyer.displayName} (${review.body.buyer.email})`} />
            </dl>

            {error && (
              <p role="alert" className="rounded-md border border-primary bg-surface-raised p-3 text-accent-foreground">
                {error}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <DialogClose asChild>
                <Button variant="outline" disabled={pending}>
                  Voltar
                </Button>
              </DialogClose>
              <Button className="font-bold" disabled={pending} aria-busy={pending || undefined} onClick={onConfirm}>
                {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
                {pending ? 'Enviando pedido…' : unresolved ? 'Reenviar pedido' : 'Confirmar e pagar'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
