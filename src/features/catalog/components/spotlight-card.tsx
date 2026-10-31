import { Link } from '@tanstack/react-router'
import type { Nft } from '@/api/contracts'
import { Skeleton } from '@/components/ui/skeleton'

/** Sidebar desktop: "NFT EM DESTAQUE · OFERTA LIMITADA". */
export function SpotlightCard({ nft, isLoading }: { nft: Nft | null | undefined; isLoading: boolean }) {
  if (isLoading) return <Skeleton className="h-[29.375rem] w-full rounded-none" />
  if (!nft) return null

  return (
    <section aria-labelledby="spotlight-title" className="relative flex flex-col gap-4 overflow-hidden bg-card pt-6">
      <div className="flex flex-col gap-1 px-4">
        <h2 id="spotlight-title" className="text-h2 text-accent-foreground uppercase">
          NFT em destaque
        </h2>
        <p className="text-center text-[1.375rem] leading-tight font-bold uppercase">Oferta limitada</p>
      </div>
      <Link
        to="/nft/$nftId"
        params={{ nftId: nft.id }}
        className="group/spot block focus-visible:outline-offset-[-4px]"
        aria-label={`${nft.name} — ver detalhes`}
      >
        <img
          src={nft.thumbnail}
          alt=""
          width={310}
          height={310}
          loading="lazy"
          className="aspect-square w-full rounded-[1.375rem] object-cover transition-transform duration-300 group-hover/spot:scale-[1.02]"
        />
      </Link>
      <span aria-hidden="true" className="absolute top-[6.5rem] left-9 size-4 rounded-full bg-primary/80" />
      <span aria-hidden="true" className="absolute right-3 bottom-28 size-11 rounded-full bg-primary/80" />
    </section>
  )
}
