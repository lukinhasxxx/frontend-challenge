import { useId, useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { Nft } from '@/api/contracts'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'

const PER_PAGE = 5

type RelatedNftsProps = {
  nfts: Nft[] | undefined
  isLoading: boolean
  /** Detalhe: "Mais desta coleção"; carrinho: "Colecionadores também viram". */
  title?: string
}

/** Desktop: carrossel de 5 cards por página com pontos de navegação. */
export function RelatedNfts({ nfts, isLoading, title = 'Mais desta coleção' }: RelatedNftsProps) {
  const [page, setPage] = useState(0)
  const titleId = useId()
  const pages = Math.ceil((nfts?.length ?? 0) / PER_PAGE)
  if (!isLoading && !nfts?.length) return null

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-8">
      <h2 id={titleId} className="border-b border-border pb-3 text-h3 text-accent-foreground">
        {title}
      </h2>
      <ul className="grid grid-cols-3 gap-6 lg:grid-cols-5">
        {isLoading
          ? Array.from({ length: PER_PAGE }, (_, i) => (
              <li key={i}>
                <NftCardSkeleton />
              </li>
            ))
          : nfts!.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE).map((nft) => (
              <li key={nft.id}>
                <NftCard
                  name={nft.name}
                  image={nft.thumbnail}
                  priceEth={nft.priceEth}
                  previousPriceEth={nft.previousPriceEth}
                  className="md:gap-1 [&_h3]:md:text-body"
                  renderLink={(content, className) => (
                    <Link to="/nft/$nftId" params={{ nftId: nft.id }} className={className}>
                      {content}
                    </Link>
                  )}
                />
              </li>
            ))}
      </ul>
      {pages > 1 && (
        <div role="group" aria-label={`Páginas de "${title}"`} className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Página ${i + 1} de ${pages}`}
              aria-current={i === page}
              onClick={() => setPage(i)}
              className="size-3 cursor-pointer rounded-full border border-primary aria-current:bg-primary"
            />
          ))}
        </div>
      )}
    </section>
  )
}
