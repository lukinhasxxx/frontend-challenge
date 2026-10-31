import type { Nft } from '@/api/contracts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IN_DEVELOPMENT_MESSAGE } from '@/lib/in-development'
import { NETWORK_LABEL } from '@/features/catalog/labels'

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`.toUpperCase().replace('0X', '0x')
}

/** Desktop: abas "Detalhes do NFT" e "Avaliações de colecionadores (n)". */
export function NftDetailTabs({ nft, editionLabel }: { nft: Nft; editionLabel: string }) {
  const network = NETWORK_LABEL[nft.network]

  return (
    <Tabs defaultValue="details" className="gap-4">
      <TabsList className="w-full gap-10 border-b border-border pb-1">
        <TabsTrigger value="details" className="text-h3 font-normal data-[state=active]:font-bold">
          Detalhes do NFT
        </TabsTrigger>
        <TabsTrigger value="reviews" className="text-h3 font-normal data-[state=active]:font-bold">
          Avaliações de colecionadores ({nft.rating.count})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="flex flex-col gap-4 text-body-sm leading-6 text-muted-foreground">
        <p>
          {nft.name} é uma obra digital {editionLabel} finalizada à mão da coleção {nft.collection.name}. Cada atributo fica
          armazenado nos metadados do token e verificado na {network}. A obra explora identidade, movimento e luz em um mundo
          digital sem fronteiras.
        </p>
        <p>
          A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de
          procedência registrada na rede. {nft.creator} recebe {nft.royaltyPercent}% de direitos autorais nas vendas
          secundárias, apoiando novos trabalhos e lançamentos da comunidade.
        </p>
        <dl className="flex flex-col gap-4">
          <div>
            <dt className="font-bold text-foreground">Rede:</dt>
            <dd>Cunhado na {network} com procedência imutável e metadados armazenados no IPFS.</dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Contrato:</dt>
            <dd>{shortAddress(nft.contractAddress)} • Contrato inteligente ERC-721 verificado.</dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Direitos autorais:</dt>
            <dd>
              Direitos autorais do criador: {nft.royaltyPercent}% nas vendas secundárias, pagos automaticamente pelos mercados
              compatíveis.
            </dd>
          </div>
        </dl>
      </TabsContent>

      {/* Avaliações estão fora do escopo do SPEC. */}
      <TabsContent value="reviews" className="text-body-sm text-muted-foreground">
        {IN_DEVELOPMENT_MESSAGE}
      </TabsContent>
    </Tabs>
  )
}
