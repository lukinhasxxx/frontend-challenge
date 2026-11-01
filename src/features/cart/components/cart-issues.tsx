import type { CartLine, Quote, QuoteIssue } from '@/api/contracts'
import { Button } from '@/components/ui/button'
import { displayEth } from '@/lib/eth'
import { useAcknowledgeCart } from '../api'

function issueText(issue: QuoteIssue, lines: CartLine[]) {
  const line = lines.find((l) => l.editionId === issue.editionId)
  const item = line ? `${line.name} (${line.editionLabel})` : 'Um item'
  switch (issue.type) {
    case 'price-changed':
      return `O preço de ${item} mudou de ${displayEth(issue.previousPriceEth)} para ${displayEth(issue.currentPriceEth)} ETH.`
    case 'quantity-reduced':
      return `${item}: restam só ${issue.available}. A quantidade será ajustada.`
    case 'sold-out':
      return `${item} esgotou. Remova-o para continuar.`
  }
}

/** Avisos de preço/estoque vindos da cotação; "Entendi" confirma os valores atuais. */
export function CartIssues({ quote, lines }: { quote: Quote; lines: CartLine[] }) {
  const acknowledge = useAcknowledgeCart()
  const issues = quote.issues ?? []
  if (!issues.length) return null
  const canAcknowledge = issues.some((issue) => issue.type !== 'sold-out')

  return (
    <div role="alert" className="flex flex-col gap-3 rounded-md border border-primary bg-surface-raised p-4 text-body-sm">
      <p className="font-bold text-accent-foreground">Seu carrinho mudou desde que você adicionou os itens:</p>
      <ul className="flex list-disc flex-col gap-1 pl-5">
        {issues.map((issue) => (
          <li key={`${issue.type}-${issue.editionId}`}>{issueText(issue, lines)}</li>
        ))}
      </ul>
      {canAcknowledge && (
        <Button size="sm" className="w-fit font-bold" disabled={acknowledge.isPending} onClick={() => acknowledge.mutate()}>
          Entendi, usar valores atuais
        </Button>
      )}
    </div>
  )
}
