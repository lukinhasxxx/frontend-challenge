import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** Desktop: dois cards promocionais (Figma "Promos"). Os botões levam ao catálogo filtrado. */
export function HomePromos() {
  return (
    <section aria-label="Promoções" className="container hidden md:block">
      <div className="grid gap-7 lg:grid-cols-2">
        <article className="relative flex h-[15.625rem] overflow-hidden rounded-lg bg-card">
          <img src="/assets/nfts/emerald-1-sm.webp" alt="" width={292} height={250} loading="lazy" className="h-full w-1/2 rounded-[1.125rem] object-cover" />
          <span aria-hidden="true" className="absolute -bottom-44 -left-20 size-64 rounded-full border-2 border-primary" />
          <div className="flex flex-1 flex-col items-end justify-center gap-3 px-8 text-right">
            <h2 className="max-w-52 text-h3 leading-6">Lançamentos gênesis de edição limitada</h2>
            <p className="text-body-sm text-muted-foreground">Colecione edições escassas diretamente dos criadores antes da revelação pública.</p>
            <Button asChild className="h-10 w-[8.75rem]">
              <Link to="/" search={{ tab: 'new' }} hash="mercado">
                Explorar <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </article>
        <article className="flex h-[15.625rem] overflow-hidden rounded-lg bg-card">
          <img src="/assets/nfts/ivory-1-sm.webp" alt="" width={287} height={250} loading="lazy" className="h-full w-1/2 rounded-[1.0625rem] object-cover" />
          <div className="flex flex-1 flex-col items-end justify-center gap-3 px-8 text-right">
            <h2 className="max-w-64 text-h3 leading-6">Arte digital selecionada e muito mais</h2>
            <p className="text-body-sm text-muted-foreground">Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.</p>
            <Button asChild className="h-10 w-[8.75rem]">
              <Link to="/" search={{ category: 'digital-art' }} hash="mercado">
                Explorar <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </article>
      </div>
    </section>
  )
}
