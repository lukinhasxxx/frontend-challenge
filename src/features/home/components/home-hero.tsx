import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { Nft } from '@/api/contracts'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const ROTATE_MS = 6_000
/** Deslocamento horizontal mínimo (px) para o toque contar como "arrastar". */
const SWIPE_MIN_PX = 40

/** Carrossel dos NFTs em destaque; arrasta no toque e pausa com foco/hover e com movimento reduzido. */
function useCarousel(length: number) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (paused || reducedMotion || length < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % length), ROTATE_MS)
    return () => clearInterval(id)
  }, [paused, length])

  const pauseHandlers = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onFocus: () => setPaused(true),
    onBlur: () => setPaused(false),
  }
  const swipeHandlers = {
    onTouchStart: (event: TouchEvent) => {
      const touch = event.touches[0]
      touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null
    },
    onTouchEnd: (event: TouchEvent) => {
      const start = touchStart.current
      const touch = event.changedTouches[0]
      touchStart.current = null
      if (!start || !touch || length < 2) return
      const dx = touch.clientX - start.x
      // Só gesto horizontal: rolar a página na vertical não troca o destaque.
      if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(touch.clientY - start.y)) return
      setIndex((i) => (i + (dx < 0 ? 1 : length - 1)) % length)
    },
  }
  return { index: length ? index % length : 0, setIndex, pauseHandlers, swipeHandlers }
}

function Dots({ count, index, onSelect, className }: { count: number; index: number; onSelect: (i: number) => void; className?: string }) {
  return (
    <div role="group" aria-label="Destaques" className={cn('flex gap-2', className)}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Mostrar destaque ${i + 1} de ${count}`}
          aria-current={i === index}
          onClick={() => onSelect(i)}
          className="size-2 cursor-pointer rounded-full bg-primary opacity-50 transition-opacity aria-current:opacity-100 hover:opacity-100"
        />
      ))}
    </div>
  )
}

/**
 * Desktop (≥ 768px): sem fundo próprio (Figma "Top"), texto à esquerda e imagem 450×450 à direita.
 */
export function DesktopHero({ nfts, isLoading }: { nfts: Nft[] | undefined; isLoading: boolean }) {
  const { index, setIndex, pauseHandlers, swipeHandlers } = useCarousel(nfts?.length ?? 0)
  const current = nfts?.[index]

  return (
    <section aria-label="Destaques" className="container hidden md:block">
      <div className="flex items-center justify-between gap-8 pt-8 pl-6 lg:gap-[6.875rem] lg:pl-10">
        <div className="flex max-w-[37.5rem] flex-col items-end gap-11 py-10">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-1">
              <p className="text-body-sm font-medium tracking-[0.1em]">Bem-vindo à Kurio</p>
              <h1 className="text-display uppercase">
                Seja dono do futuro <br />
                da arte digital
              </h1>
              <p className="max-w-[35rem] text-body-sm text-muted-foreground">
                Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e
                tenha uma parte da cultura da internet.
              </p>
            </div>
            <Button asChild className="h-10 w-fit px-9 font-bold uppercase">
              <Link to="/" hash="mercado">
                Explorar
              </Link>
            </Button>
          </div>
          {nfts && nfts.length > 1 && <Dots count={nfts.length} index={index} onSelect={setIndex} />}
        </div>

        <div className="aspect-square w-[45%] max-w-[28.125rem] shrink-0 touch-pan-y" {...pauseHandlers} {...swipeHandlers}>
          {isLoading || !current ? (
            <Skeleton className="size-full rounded-2xl" />
          ) : (
            <Link to="/nft/$nftId" params={{ nftId: current.id }} aria-label={`${current.name} — ver detalhes`}>
              <img
                key={current.id}
                src={current.images[0]}
                alt=""
                width={450}
                height={450}
                {...{ fetchpriority: 'high' }} // React 18 só repassa o atributo em minúsculas
                className="size-full rounded-2xl object-cover animate-in fade-in"
              />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

/** Mobile (< 768px): card 366×190 com círculos decorativos e duas imagens sobrepostas. */
export function MobileHero({ nfts, isLoading }: { nfts: Nft[] | undefined; isLoading: boolean }) {
  const { index, setIndex, pauseHandlers, swipeHandlers } = useCarousel(nfts?.length ?? 0)
  const current = nfts?.[index]
  const next = nfts?.[(index + 1) % (nfts?.length || 1)]

  return (
    <section aria-label="Destaques" className="relative touch-pan-y overflow-hidden rounded-xl bg-card p-4 md:hidden"
      {...pauseHandlers}
      {...swipeHandlers}
    >
      <span aria-hidden="true" className="absolute -top-8 -left-20 size-62 rounded-full bg-linear-to-br from-primary-hover/25 to-primary/10" />
      <span aria-hidden="true" className="absolute -top-2.5 left-20 size-62 rounded-full bg-linear-to-br from-primary-hover/20 to-primary/5" />

      <div className="relative flex items-center gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <p className="text-caption font-medium">Bem-vindo à Kurio</p>
          <h1 className="text-[1.125rem] leading-[1.8125rem] font-bold uppercase">Seja dono da cultura digital</h1>
          <p className="text-caption leading-[1.125rem] text-muted-foreground">Descubra NFTs selecionados de criadores do mundo todo.</p>
          <Link to="/" hash="mercado" className="mt-1 flex items-center gap-2 text-caption font-bold text-accent-foreground uppercase">
            Explorar
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="relative size-[8.625rem] shrink-0">
          {isLoading || !current ? (
            <Skeleton className="size-full rounded-xl" />
          ) : (
            <Link to="/nft/$nftId" params={{ nftId: current.id }} aria-label={`${current.name} — ver detalhes`}>
              <img src={current.thumbnail} alt="" width={138} height={138} className="size-full rounded-xl object-cover" />
              {next && next.id !== current.id && (
                <img
                  src={next.thumbnail}
                  alt=""
                  width={58}
                  height={58}
                  className="absolute bottom-[-0.5rem] left-3.5 size-[3.625rem] rounded-xl border-2 border-card object-cover"
                />
              )}
            </Link>
          )}
        </div>
      </div>
      {nfts && nfts.length > 1 && <Dots count={nfts.length} index={index} onSelect={setIndex} className="relative mt-4 justify-center" />}
    </section>
  )
}
