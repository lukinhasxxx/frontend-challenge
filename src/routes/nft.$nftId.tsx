import { createFileRoute } from '@tanstack/react-router'
import { nftDetailQueryOptions, relatedNftsQueryOptions } from '@/features/catalog/api'
import { NftDetailPage } from '@/features/nft-detail/components/nft-detail-page'

export const Route = createFileRoute('/nft/$nftId')({
  // Pré-busca sem bloquear: skeleton imediato, inclusive em acesso direto pela URL.
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(nftDetailQueryOptions(params.nftId))
    void context.queryClient.prefetchQuery(relatedNftsQueryOptions(params.nftId))
  },
  staticData: { hideMobileTabBar: true },
  component: NftDetailRoute,
})

function NftDetailRoute() {
  const { nftId } = Route.useParams()
  return <NftDetailPage nftId={nftId} />
}
