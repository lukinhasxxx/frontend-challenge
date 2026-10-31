import { displayEth } from "@/lib/eth"
import { cn } from "@/lib/utils"

type EthPriceProps = {
  value: string
  /** Preço anterior, exibido riscado (ex.: oferta). */
  previous?: string | null
  className?: string
}

/** Preço em ETH no formato do Figma: "1.19 ETH" e, se houver, o anterior riscado. */
function EthPrice({ value, previous, className }: EthPriceProps) {
  return (
    <span className={cn("inline-flex items-baseline gap-2 font-bold text-accent-foreground", className)}>
      <span>{displayEth(value)} ETH</span>
      {previous && (
        <span className="font-normal text-subtle">
          <span className="sr-only">Preço anterior: </span>
          <s>{displayEth(previous)} ETH</s>
        </span>
      )}
    </span>
  )
}

export { EthPrice }
