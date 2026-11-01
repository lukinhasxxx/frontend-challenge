import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Mail, ShoppingCart } from 'lucide-react'
import type { Edition, Nft } from '@/api/contracts'
import { ApiClientError } from '@/api/errors'
import { LinkedinIcon, TwitterIcon } from '@/components/icons/social'
import { Button, buttonVariants } from '@/components/ui/button'
import { EthPrice } from '@/components/ui/eth-price'
import { Skeleton } from '@/components/ui/skeleton'
import { nftDetailQueryOptions, relatedNftsQueryOptions } from '@/features/catalog/api'
import { displayEth, multiplyEth } from '@/lib/eth'
import { cn } from '@/lib/utils'
import { cartQueryOptions, quantityInCart } from '@/features/cart/api'
import { useAddToCartAction } from '@/features/cart/use-add-to-cart'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import { EditionPicker } from './edition-picker'
import { NftDetailTabs } from './nft-detail-tabs'
import { NftGallery } from './nft-gallery'
import { NftRatingPill, NftRatingStars } from './nft-rating'
import { QuantityStepper } from './quantity-stepper'
import { RelatedNfts } from './related-nfts'

/** Edição inicial: a do preço exibido no card (mais barata disponível). */
function defaultEdition(nft: Nft): Edition | undefined {
  return (
    nft.editions.find((e) => e.available > 0 && e.priceEth === nft.priceEth) ??
    nft.editions.find((e) => e.available > 0) ??
    nft.editions[0]
  )
}

function ShareLinks({ nft }: { nft: Nft }) {
  const url = encodeURIComponent(window.location.href)
  const text = encodeURIComponent(`${nft.name} na Kurio`)
  const linkClass = 'text-foreground hover:text-accent-foreground'
  return (
    <p className="flex items-center gap-3 text-body font-bold">
      Compartilhar este NFT:
      <a className={linkClass} href={`https://www.linkedin.com/sharing/share-offsite/?url=${url}`} target="_blank" rel="noopener noreferrer" aria-label="Compartilhar no LinkedIn (abre em nova aba)">
        <LinkedinIcon className="size-4" />
      </a>
      <a className={linkClass} href={`mailto:?subject=${text}&body=${url}`} aria-label="Compartilhar por e-mail">
        <Mail className="size-4" aria-hidden="true" />
      </a>
      <a className={linkClass} href={`https://twitter.com/intent/tweet?text=${text}&url=${url}`} target="_blank" rel="noopener noreferrer" aria-label="Compartilhar no Twitter (abre em nova aba)">
        <TwitterIcon className="size-4" />
      </a>
    </p>
  )
}

function TokenInfo({ nft }: { nft: Nft }) {
  return (
    <dl className="flex flex-col gap-3 text-body text-muted-foreground">
      <div className="flex gap-1">
        <dt>ID do token:</dt>
        <dd>{nft.tokenId}</dd>
      </div>
      <div className="flex gap-1">
        <dt>Coleção:</dt>
        <dd>{nft.collection.name}</dd>
      </div>
      <div className="flex gap-1">
        <dt>Atributos:</dt>
        <dd>{nft.attributes.join(', ')}</dd>
      </div>
    </dl>
  )
}

function StockMessage({ edition, quantity, inCart }: { edition: Edition | undefined; quantity: number; inCart: number }) {
  if (!edition) return null
  if (edition.available === 0) return <p className="text-caption text-destructive-text">Edição esgotada. Escolha outra edição.</p>
  // Estado não desenhado no Figma: tudo o que resta da edição já está no carrinho.
  if (inCart >= edition.available)
    return <p className="text-caption text-muted-foreground">Todas as unidades disponíveis desta edição já estão no seu carrinho.</p>
  // Fora do Figma: o "+" desabilitado já mostra o limite; o texto fica só para leitores de tela.
  if (quantity >= edition.available)
    return (
      <p role="status" className="sr-only">
        Máximo disponível: {edition.available}
      </p>
    )
  return null
}

function DetailView({ nft }: { nft: Nft }) {
  const router = useRouter()
  const related = useQuery(relatedNftsQueryOptions(nft.id))
  const cart = useQuery(cartQueryOptions)
  const { add, pending } = useAddToCartAction()
  const [editionId, setEditionId] = useState(() => defaultEdition(nft)?.id ?? '')
  const [rawQuantity, setQuantity] = useState(1)

  const edition = nft.editions.find((e) => e.id === editionId) ?? defaultEdition(nft)
  // Limite = disponível − o que já está no carrinho (a API valida de novo).
  const inCart = quantityInCart(cart.data, edition?.id)
  const max = Math.max(0, (edition?.available ?? 0) - inCart)
  // Se a disponibilidade cair (tempo real), a quantidade acompanha o novo limite.
  const quantity = Math.max(1, Math.min(rawQuantity, max))
  const unitPrice = edition?.priceEth ?? nft.priceEth
  const canBuy = max > 0

  function selectEdition(id: string) {
    setEditionId(id)
    setQuantity(1)
  }

  function addToCart(goToCart: boolean) {
    if (!edition || !canBuy) return
    add({ nftId: nft.id, editionId: edition.id, quantity }, { name: nft.name, goToCart })
  }

  return (
    <>
      {/* Desktop/tablet (≥ 768px) */}
      <div className="container hidden flex-col gap-24 pt-6 md:flex">
        <div className="flex flex-col gap-3">
          <nav aria-label="Trilha de navegação">
            <ol className="flex gap-1 text-body font-bold">
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
            </ol>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[35.8rem_1fr]">
            <NftGallery name={nft.name} images={nft.images} />

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3 border-b border-border pb-3">
                <h1 className="text-h1">{nft.name}</h1>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <EthPrice value={unitPrice} className="text-[1.375rem]" />
                  <NftRatingStars rating={nft.rating} />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <h2 className="text-body font-bold">Sobre este NFT:</h2>
                <p className="text-body-sm leading-6 text-muted-foreground">{nft.description}</p>
              </div>
              <EditionPicker editions={nft.editions} value={edition?.id ?? ''} onChange={selectEdition} />
              <div className="flex flex-wrap items-center justify-between gap-4">
                <QuantityStepper value={quantity} max={max} onChange={setQuantity} />
                <div className="flex gap-3">
                  <Button className="h-9 w-[7.1875rem] font-bold uppercase" disabled={!canBuy || pending} onClick={() => addToCart(true)}>
                    Comprar
                  </Button>
                  <FavoriteButton
                    nft={nft}
                    className={cn(buttonVariants({ variant: 'outline' }), 'h-9 border-primary aria-pressed:text-accent-foreground')}
                  >
                    {() => 'Favoritar'}
                  </FavoriteButton>
                </div>
              </div>
              <StockMessage edition={edition} quantity={quantity} inCart={inCart} />
              <TokenInfo nft={nft} />
              <ShareLinks nft={nft} />
            </div>
          </div>
        </div>

        <NftDetailTabs nft={nft} editionLabel={edition?.label ?? ''} />
        <RelatedNfts nfts={related.data} isLoading={related.isPending} />
      </div>

      {/* Mobile (< 768px): sem header, botão voltar e barra de compra fixa */}
      <div className="md:hidden">
        <div className="bg-linear-to-b from-card to-surface-raised px-7 pt-6 pb-28">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Voltar"
              onClick={() => (window.history.length > 1 ? router.history.back() : void router.navigate({ to: '/' }))}
              className="flex size-[2.1875rem] cursor-pointer items-center justify-center rounded-full border border-border text-muted-foreground"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <FavoriteButton
              nft={nft}
              className="flex size-[2.1875rem] items-center justify-center rounded-full border border-border text-accent-foreground"
            />
          </div>
          <img src={nft.images[0]} alt={nft.name} width={361} height={361} className="aspect-square w-full rounded-3xl object-cover" />
        </div>

        <div className="-mt-28 flex flex-col gap-3 rounded-t-[1.9375rem] bg-card px-6 pt-8 pb-52">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-[1.25rem] leading-tight font-bold">{nft.name}</h1>
            <NftRatingPill rating={nft.rating} />
          </div>
          <p className="text-body-sm leading-6 text-muted-foreground">{nft.description}</p>
          <EditionPicker editions={nft.editions} value={edition?.id ?? ''} onChange={selectEdition} />
          <StockMessage edition={edition} quantity={quantity} inCart={inCart} />
          <TokenInfo nft={nft} />
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col gap-5 rounded-t-[2.5rem] bg-card px-6 pt-5 pb-9 shadow-sheet">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-body font-medium text-muted-foreground">Qtd.</span>
              <QuantityStepper value={quantity} max={max} onChange={setQuantity} size="sm" />
            </div>
            <p className="text-[1.25rem] font-bold text-accent-foreground" aria-live="polite">
              <span className="sr-only">Total: </span>
              {displayEth(multiplyEth(unitPrice, canBuy ? quantity : 1))} ETH
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="cta" className="h-[3.75rem] flex-1 text-body-lg" disabled={!canBuy || pending} onClick={() => addToCart(true)}>
              Comprar NFT
            </Button>
            <Button
              variant="secondary"
              size="icon-lg"
              aria-label="Adicionar ao carrinho"
              className="size-[3.75rem] rounded-full border border-border bg-surface-raised"
              disabled={!canBuy || pending}
              onClick={() => addToCart(false)}
            >
              <ShoppingCart className="size-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando NFT">
      <div className="container hidden gap-8 pt-14 md:grid lg:grid-cols-[35.8rem_1fr]">
        <div className="flex gap-7">
          <div className="flex w-[6.25rem] flex-col gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="size-[6.25rem]" />
            ))}
          </div>
          <Skeleton className="aspect-square w-full max-w-[27.75rem]" />
        </div>
        <div className="flex flex-col gap-5">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-7 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="flex flex-col gap-4 px-7 pt-16 md:hidden">
        <Skeleton className="aspect-square w-full rounded-3xl" />
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}

export function NftDetailPage({ nftId }: { nftId: string }) {
  const detail = useQuery(nftDetailQueryOptions(nftId))

  if (detail.isPending) return <DetailSkeleton />

  if (detail.isError) {
    const notFound = detail.error instanceof ApiClientError && detail.error.code === 'NOT_FOUND'
    return (
      <section className="container flex flex-col items-start gap-4 py-16" role={notFound ? undefined : 'alert'}>
        <h1 className="text-h1">{notFound ? 'NFT não encontrado' : 'Não foi possível carregar o NFT'}</h1>
        <p className="text-body-sm text-muted-foreground">
          {notFound ? 'O NFT que você procura não existe ou foi removido.' : detail.error.message}
        </p>
        {notFound ? (
          <Button asChild>
            <Link to="/" hash="mercado">
              Voltar ao mercado
            </Link>
          </Button>
        ) : (
          <Button onClick={() => void detail.refetch()} disabled={detail.isFetching}>
            Tentar novamente
          </Button>
        )}
      </section>
    )
  }

  return <DetailView key={detail.data.id} nft={detail.data} />
}
