# Arquitetura

Este documento descreve como o app se organiza, os contratos entre interface, estado e transporte, e as decisões tomadas onde o Figma ou o enunciado não definiam o comportamento. Para rodar o projeto, veja o [README](./README.md).

## Visão geral

```
React (rotas + features)
   │  hooks do TanStack Query (queryOptions / useMutation)
   ▼
Axios (src/api/client.ts) ──── HTTP ────► MSW (service worker) ──► handlers ──► banco no localStorage
                                                                      │
Socket.IO client (src/realtime) ◄── WebSocket ── servidor Socket.IO simulado (src/mocks/socket.ts)
   │                                                                  ▲
   └─► cache do TanStack Query                  eventos emitidos só depois de mutar o banco
```

- **A interface só conhece a API.** Nenhum componente, hook ou interceptor contém dado mockado. Tudo o que é simulado fica em `src/mocks/`: handlers, banco, fixtures, cenários, socket e painel. Com `VITE_ENABLE_MOCKS=false`, o app passa a falar com um backend real que siga os mesmos contratos.
- **Contrato único.** Os tipos de requisição, resposta e evento ficam em `src/api/contracts/` e são importados tanto pelo cliente quanto pelos handlers. As regras de validação (zod), como senha, e-mail, endereço de carteira e avatar, ficam em `src/lib/validation.ts` e também são compartilhadas: o formulário e a API mock recusam as mesmas entradas, com as mesmas mensagens.
- **Eventos nunca entram no estado da interface.** O Socket.IO só altera o cache do TanStack Query (ou o invalida). As telas leem o cache como leem qualquer resposta da API.

### Estrutura

| Pasta | Responsabilidade |
|---|---|
| `src/app/` | Bootstrap, `QueryClient`, router e configuração (`env.ts`). |
| `src/routes/` | Rotas file-based do TanStack Router. Rotas são finas: validam search params com zod, protegem com `beforeLoad` e fazem prefetch. Os componentes são carregados sob demanda (code splitting por rota). |
| `src/features/<domínio>/` | `api.ts` (query keys, `queryOptions`, mutations), `components/` e `schemas.ts`. Domínios: catalog, nft-detail, auth, favorites, cart, wallets, checkout, profile, home. |
| `src/api/` | Instância do Axios, normalização de erros, armazenamento do token e do id de visitante, contratos. |
| `src/realtime/` | Cliente Socket.IO (singleton) e aplicação idempotente dos eventos no cache. |
| `src/lib/` | Aritmética ETH, validação, redução de imagem, utilitários. |
| `src/mocks/` | MSW: `handlers/`, `db/` (schema versionado + store), `fixtures/`, `scenarios.ts`, `socket.ts`, `devtools/` (painel Mock). |

### Boot

`src/main.tsx` inicia o MSW (`worker.start()`) **antes** de importar o app. O motivo é que o `engine.io-client` guarda `globalThis.WebSocket` no momento em que o módulo é avaliado, e o MSW só substitui o `WebSocket` dentro do `start()`. Por isso o app é carregado com `import()` dinâmico depois dos mocks. O painel Mock é montado em paralelo, numa raiz React separada (`#mock-devtools`), sem atrasar a primeira renderização.

## Contratos REST

Todas as rotas ficam sob `/api`. Os valores em ETH trafegam como **string decimal com 4 casas** (`"0.4500"`) e as datas em ISO 8601. Todo erro tem o mesmo corpo:

```ts
type ApiError = { code: ErrorCode; message: string; fieldErrors?: Record<string, string> }
```

O `fieldErrors` liga o erro ao campo do formulário: o cliente aplica cada mensagem com `setError` do React Hook Form, por exemplo o 409 de e-mail já cadastrado ou de senha atual incorreta.

| Recurso | Endpoints |
|---|---|
| Autenticação | `POST /auth/register` · `POST /auth/login` · `GET /auth/session` · `POST /auth/logout` · `GET /auth/email-availability` |
| Catálogo | `GET /nfts` (q, category, collection, priceMin, priceMax, sort, tab, page, pageSize) · `GET /nfts/featured` · `GET /nfts/:id` · `GET /nfts/:id/related` |
| Favoritos | `GET /favorites` · `POST /favorites` · `DELETE /favorites/:nftId` |
| Carrinho | `GET /cart` · `POST /cart/items` · `PATCH /cart/items/:editionId` · `DELETE /cart/items/:editionId` · `PUT /cart/coupon` · `DELETE /cart/coupon` · `POST /cart/acknowledge` · `POST /cart/merge` |
| Cotação | `POST /quote` |
| Carteiras | `GET /wallets` · `PUT /wallets/:role` (primary/secondary) · `GET/POST/DELETE /wallet-connection` |
| Pedidos | `POST /orders` (exige `Idempotency-Key`) · `GET /orders/:id` |
| Perfil | `GET /profile` · `PATCH /profile` · `POST /profile/password` |

Códigos de erro (`src/api/contracts/common.ts`): `VALIDATION_ERROR`, `INVALID_CREDENTIALS`, `UNAUTHENTICATED`, `SESSION_EXPIRED`, `FORBIDDEN`, `NOT_FOUND`, `EMAIL_TAKEN`, `OUT_OF_STOCK`, `EDITION_UNAVAILABLE`, `QUOTE_STALE`, `COUPON_INVALID`, `COUPON_EXPIRED`, `IDEMPOTENCY_CONFLICT`, `PAYMENT_DECLINED`, `WALLET_CONFLICT`, `WALLET_NOT_CONNECTED`, `WALLET_CONNECTION_REJECTED`, `INTERNAL_ERROR`.

O cliente (`src/api/errors.ts`) converte tudo em `ApiClientError` com `status`, `code`, `fieldErrors` e `isTransient`. Transitório significa rede, timeout ou 5xx: é isso que decide retry e reenvio.

Endpoints de controle (`/__mock/*`, usados pelo painel e pelos testes): `GET /__mock/state`, `POST /__mock/reset`, `POST /__mock/nfts/:nftId` (altera edição e emite evento), `POST /__mock/events/replay-last`, `POST /__mock/events/stale`, `POST /__mock/orders/settle`, `POST /__mock/session/expire`, `POST /__mock/socket/drop`.

### Cenários

Cada handler é embrulhado por `withScenario()`, que lê o cenário (header `x-mock-scenario` > `localStorage.MOCK_SCENARIO` > `default`) e aplica latência, erro 500, falha de rede, timeout ou 401. Os cenários de negócio (`price-changed`, `sold-out`, `payment-declined`, `payment-pending`, `wallet-rejected`) são tratados dentro dos handlers correspondentes. A latência variável usa um gerador com semente fixa, para que o mesmo cenário se comporte igual a cada execução. A lista completa está no README.

## Contrato Socket.IO

```ts
type EventBase<T, P> = {
  eventId: string    // estável: o mesmo evento reenviado mantém o id
  type: T
  resourceId: string // id do NFT ou do pedido
  version: number    // versão do recurso depois da mudança
  occurredAt: string
  payload: P         // o recurso completo, já atualizado
}
type NftUpdatedEvent = EventBase<'nft.updated', Nft>
type OrderUpdatedEvent = EventBase<'order.updated', Order> & { userId: string }
```

- **`nft.updated`** vai para todos os clientes. É emitido quando preço ou estoque mudam (painel Mock, cenários de checkout, compra confirmada).
- **`order.updated`** vai **só para o dono do pedido**. O servidor simulado identifica o usuário pelo token enviado no handshake (`auth: { token }`, lido de novo a cada reconexão). Um visitante recebe apenas eventos públicos.
- Os eventos nascem **somente** no servidor simulado, depois de o banco ser alterado. O painel e os testes nunca emitem direto para a interface.

### Recepção no cliente (`src/realtime/`)

`RealtimeSync` conecta o socket e repassa os eventos para `applyNftEvent` e `applyOrderEvent`:

1. **Duplicata:** um `eventId` já visto é descartado. O histórico guarda até 500 ids.
2. **Fora de ordem:** um evento com `version` menor ou igual à maior versão conhecida é descartado. A versão conhecida vem do maior valor entre o que já foi aplicado e o que está no cache (detalhe, listas, destaques). Assim, um estado mais novo nunca regride, e um pedido em estado terminal (confirmado ou recusado) nunca volta a "pendente".
3. **Aplicação:** `setQueryData` atualiza o NFT no detalhe, nas listas paginadas, nos relacionados e nos destaques, e o pedido no seu detalhe. O carrinho e a cotação são **invalidados** (não editados): os avisos de "preço alterado / estoque reduzido / esgotado" vêm da cotação recalculada pela API.
4. **Anúncio:** uma região `aria-live` anuncia a mudança, junto com um toast.
5. **Reconexão:** ao reconectar, o cliente invalida NFTs, carrinho e pedidos. O que se perdeu durante a queda é recuperado por REST.

### Limitações do `@mswjs/socket.io-binding`

O binding é experimental, e o servidor simulado (`src/mocks/socket.ts`) contorna o seguinte:

- **Só o transporte `websocket`.** Não há long-polling, então o cliente usa `transports: ['websocket']`.
- **Sem heartbeat.** O binding envia o handshake do Engine.IO (pingInterval 25 s), mas não manda os pings. Sem eles, o cliente desconecta em ~30 s. O mock envia o ping a cada 20 s.
- **O `auth` do CONNECT não é exposto.** O mock lê o frame bruto (`40{...}`) para obter o token.
- **Sem rooms, namespaces ou broadcast.** O mock mantém o próprio registro de clientes, com o usuário de cada um, e filtra `order.updated` por dono.
- **Fechamento antes do handshake** (comum no StrictMode) não dispara `close` no mock, então timers e broadcast checam o `readyState` antes de enviar.
- **Host próprio.** O link usa `ws://realtime.mock`. Usar a origem do app colidiria com o WebSocket do HMR do Vite.
- **Queda simulada.** `POST /__mock/socket/drop` fecha as conexões e recusa novas por alguns segundos, o que exercita a reconexão automática do cliente.

## Sessão e isolamento

- **Token:** `POST /auth/login` devolve um token opaco (sessão de 30 min no banco simulado), guardado no `localStorage` e enviado pelo interceptor do Axios como `Authorization: Bearer`. As senhas ficam em hash SHA-256 com salt por usuário (`crypto.subtle`).
- **Boot:** `GET /auth/session` restaura a sessão depois de um refresh.
- **Rotas privadas** (`/perfil`, `/perfil/carteiras`, `/favoritos`, `/pagamento`, `/pedidos/:id`): o `beforeLoad` revalida a sessão no servidor ao entrar. No preload por hover, usa só o cache. Sem sessão, abre o login sobre a Início guardando a rota pedida (`?auth=login&redirect=...`), e o redirect só aceita caminhos internos, para evitar open redirect. Depois do login, o usuário volta para onde estava.
- **Expiração:** um 401 com `SESSION_EXPIRED` ou `UNAUTHENTICATED` faz o interceptor apagar o token e avisar a camada de sessão. O login abre **sobre a tela atual**, preservando a rota e o que foi digitado. Se a pessoa entra de novo com a mesma conta, as queries são só revalidadas; com outra conta, vale a troca de conta abaixo.
- **Troca de conta ou logout:** `queryClient.clear()` apaga todo o cache, o histórico de eventos é limpo e o contador `generation` muda. A árvore de páginas é remontada com essa chave e o socket reconecta com o novo token (ou como visitante). Nada da conta anterior sobrevive em cache, estado de componente ou socket. Os E2E conferem isso inspecionando o próprio `QueryClient`.

## Carrinho e precisão de ETH

- **Dono do carrinho:** visitante (`X-Guest-Id`, um uuid gerado uma vez no `localStorage`) ou usuário (pelo token). O carrinho mora no banco simulado, nunca no estado do React.
- **Merge no login:** `POST /cart/merge` une o carrinho de visitante ao da conta. As quantidades da mesma edição são somadas e limitadas ao estoque, e o cupom do visitante só passa se a conta não tiver um. Depois, o carrinho do visitante é apagado.
- **Cotação:** `POST /quote` calcula subtotal, desconto do cupom, taxa de rede (0.016 ETH) e total, e devolve `issues` quando algo mudou desde a última confirmação (preço, estoque reduzido, esgotado). "Entendi, usar valores atuais" (`POST /cart/acknowledge`) aceita os novos valores. Enquanto houver aviso pendente, não é possível finalizar.
- **Precisão (`src/lib/eth.ts`):** todo cálculo é feito em **wei com `bigint`** (18 casas). A string vira wei na entrada e volta a string com 4 casas na saída, arredondando meio para cima. Percentuais usam pontos-base inteiros. Nenhum valor monetário passa por `number`, e o mesmo módulo é usado pela interface e pelos handlers. Na exibição aparecem até 4 casas, sem zeros à direita e com no mínimo 2 (`1.19`, `0.016`).

## Checkout idempotente e pedidos

1. A cotação revisada (`quoteId`) é enviada em `POST /orders`, junto com carteira, rede, provedor e dados do colecionador.
2. **Revalidação no servidor:** a cotação é refeita. Se itens, preços, cupom ou total mudaram, ou se ela expirou (10 min), a resposta é 409 `QUOTE_STALE`, nada é criado e a interface pede nova confirmação. A carteira escolhida precisa estar "conectada" com o mesmo provedor e rede (409 `WALLET_NOT_CONNECTED`).
3. **Idempotência:** antes de enviar, o cliente guarda `{ userId, chave, corpo exato }` no `sessionStorage`. Se não houver resposta conclusiva (timeout, queda, 5xx), "Reenviar pedido" manda **a mesma chave com o mesmo corpo**, e isso sobrevive a refresh. O servidor guarda o hash SHA-256 do corpo canônico: mesma chave + mesmo corpo devolve o pedido original (200 + `Idempotent-Replayed: true`); mesma chave + outro corpo devolve 409 `IDEMPOTENCY_CONFLICT`. Qualquer resposta conclusiva descarta a tentativa guardada.
4. **Clique duplo:** o botão fica desabilitado durante o envio, e uma trava síncrona (`ref`) cobre o intervalo antes de o React re-renderizar. Resultado: uma única requisição.
5. **Liquidação simulada:** o pedido nasce `pending`, com `settleAs` e `settleAt` gravados. Depois de ~1,8 s vira `confirmed` (ou `declined` no cenário `payment-declined`, ou aguarda o painel em `payment-pending`) e emite `order.updated`. Na confirmação, saem do carrinho **só as quantidades compradas** e o estoque baixa (com `nft.updated`). Na recusa, o carrinho fica intacto.
6. **Recuperação:** o timer de liquidação se perde num refresh, então o boot do mock o reagenda. `GET /orders/:id` também liquida um pedido vencido, e a reconexão do socket revalida os pedidos. Um pedido nunca é criado de novo por causa de refresh ou reconexão.
7. **Recibo:** é um snapshot gravado na criação do pedido (nome, imagem, preço, token, totais). Mudanças posteriores no catálogo não o alteram. Só é exibido com o status `confirmed`.

## Cache, atualização otimista e reconciliação

**Política do `QueryClient`** (`src/app/query-client.ts`):

- `staleTime` de 30 s e `gcTime` de 5 min. O tempo real cobre as mudanças entre um refetch e outro.
- Retry só para falhas transitórias, no máximo 2 vezes. Um 4xx nunca é repetido.
- Mutations nunca têm retry automático, para evitar operações duplicadas.

**Query keys** hierárquicas por domínio: `['nfts', 'list', params]`, `['nfts', 'detail', id]`, `['cart']`, `['cart', 'quote']`, `['favorites']`, `['orders', id]`, `['auth', 'session']`. Isso permite invalidar ou atualizar um ramo inteiro de uma vez.

**Catálogo:**

- Os filtros, a busca, a ordenação e a página ficam na URL (`validateSearch` com zod), o que permite refresh, voltar e avançar, e compartilhar o link. Mudar um filtro volta para a página 1. No mobile, a busca atualiza a URL com debounce de 300 ms; no desktop, o diálogo de busca aplica o termo ao enviar.
- `placeholderData: keepPreviousData` mantém a lista anterior enquanto a nova carrega, com feedback de opacidade.
- **Respostas fora de ordem:** a query key inclui todos os parâmetros e o `AbortSignal` do Query é repassado ao Axios. Uma requisição obsoleta é cancelada, e uma resposta atrasada cai numa key que não está mais em uso, então nunca sobrescreve o resultado atual (coberto pelo cenário `out-of-order`).

**Favoritos (atualização otimista):**

- `onMutate` cancela as queries em andamento e aplica a mudança na hora (lista de favoritos e coração no catálogo).
- `onError` desfaz com a operação inversa e mostra um toast. Usamos a operação inversa, e não um snapshot, porque ela funciona mesmo se a lista ainda não tinha carregado e com cliques seguidos em NFTs diferentes.
- `onSettled` invalida a query para reconciliar com o servidor.
- Um visitante que favorita é levado ao login, e o favorito é concluído depois de entrar.

**Carrinho:** as mutations atualizam o cache com a resposta do servidor e invalidam a cotação. Os valores sempre vêm da API.

**Reconciliação com o tempo real:** os eventos aplicam o recurso completo com checagem de versão, e a reconexão invalida tudo o que pode ter mudado (seção Contrato Socket.IO).

## Performance

- Code splitting por rota, com o app carregado só depois do MSW (veja Boot) e o painel Mock fora do caminho crítico.
- No navegador, o MSW usa um substituto de `tough-cookie` (alias em `vite.config.ts`, arquivo `src/mocks/vendor/tough-cookie.ts`). O app não usa cookies, e esse alias tira ~260 KB (`tough-cookie` + `tldts`) do chunk dos mocks: de 172 KB para 52 KB comprimido. Se algum handler passar a enviar `Set-Cookie`, o alias deve ser removido.
- Imagens WebP com `width`/`height` (sem CLS). A imagem do destaque e as dos primeiros cards do grid usam `fetchpriority="high"`, sem lazy-loading. As demais são lazy.
- Os skeletons têm a mesma dimensão do conteúdo. O do detalhe ocupa ao menos uma tela, para que o rodapé não apareça e depois seja empurrado.
- Fonte variável self-hosted e `robots.txt` para o SEO.

Resultados: [reports/lighthouse/README.md](./reports/lighthouse/README.md). As medianas de 3 execuções ficaram entre 92 e 99 em Performance, 96 e 100 em Acessibilidade, e 100 em Boas práticas e em SEO, no mobile e no desktop.

## Testes

- **Unitários** (`tests/unit/`, runner do Playwright, sem navegador): aritmética ETH (somas sem erro de ponto flutuante, conversão para wei, arredondamento, percentuais, formatos inválidos), integridade das fixtures e utilitários.
- **E2E** (`tests/e2e/`, desktop Chrome + Pixel 7): os 12 fluxos do enunciado, mais layout sem rolagem horizontal em 390/768/1440, estados de carregamento e erro, painel Mock, navegação por teclado e regressão visual. Cada teste usa um contexto novo do navegador (banco limpo), define o cenário antes do boot e espera o sinal `html[data-app-ready]`. O tempo real é verificado pelo atributo `html[data-realtime]` e pelos endpoints `/__mock/*`.
- **Regressão visual:** Início, Detalhe, Carrinho e Pagamento, em 2 tamanhos de tela, com movimento reduzido, animações e cursor desligados, e ferramentas de dev escondidas. Tolerância de 3%, sem sufixo de sistema operacional nas referências.

## Decisões de UX, acessibilidade e desvios do Figma

### Telas e estados que o Figma não desenha

Esses itens seguem o padrão visual existente:

- **Busca no desktop:** a lupa do header abre um diálogo de busca. O frame desktop não tem campo de busca, e o enunciado exige busca.
- **Filtros:** a barra lateral aparece a partir de 1024px. De 768 a 1023px e no mobile, os filtros ficam num painel inferior.
- **Paginação no mobile:** também existe no mobile, porque o enunciado exige (o frame corta antes).
- **Mobile sem seções extras:** o mobile não mostra promoções, blog, as abas do detalhe e "Mais desta coleção", que os frames mobile não têm.
- **Header logado:** um botão com o primeiro nome e o avatar leva a `/perfil` (o Figma só mostra "Entrar").
- **Sessão expirada:** um aviso aparece no topo do login. No mobile, onde o Figma não tem botão de fechar, há "Continuar sem entrar".
- **Favoritos e Carteiras:** sem frame, usam o grid e os cards do catálogo. O estado vazio de favoritos tem "Explorar o mercado".
- **Carteiras e Perfil no mobile:** usam coluna única com a lateral "Meu perfil" empilhada.
- **Cupom aplicado:** o campo mostra o código, e o botão vira "Remover".
- **Avisos do carrinho:** "preço alterado / estoque reduzido / esgotado" com "Entendi, usar valores atuais".
- **Conexão simulada da carteira:** conectada, não conectada, recusada, e "Desconectar".
- **Revisão do pedido:** um modal "Revise seu pedido" aparece antes do envio e não fecha enquanto o pedido está sendo enviado.
- **Pedido pendente e recusado:** usam o mesmo cartão do recibo. O recibo é o modal "Order Confirmation Modal" do Figma, apresentado como página.
- **Pagamento no mobile:** não tem formulário (o frame não tem). Os dados do colecionador vêm da carteira, e os cards "Principal/Reserva" fazem a seleção.

### Correções de inconsistência do Figma

- **Detalhe:** os textos de "Contrato" e "Direitos autorais" estão trocados no Figma. Cada texto foi para o rótulo certo.
- **Raio do modal:** o modal de login tem raio 0 e o de cadastro tem raio 8. Usamos 8 nos dois, porque é o mesmo modal alternando abas.
- **Cadastro no mobile:** o placeholder centralizado num único campo foi alinhado à esquerda, como os demais.
- **Desconto zerado:** o Figma mostra "(-) 00.00". Usamos "(-) 0.00 ETH", no padrão dos outros valores.
- **Nome ENS no Pagamento:** o Figma mostra só o sufixo. Incluímos o campo do nome, igual ao de Carteiras.
- **Recibo:** mostra Subtotal e Desconto quando houve desconto. O Figma mostra só Taxa e Total, mas o enunciado pede o desconto.

### Acessibilidade × fidelidade

- **Cor dos erros:** o texto de erro usa coral (#F0805F, contraste 7.29) em vez de #ED1B2E (4.39, abaixo do AA para texto pequeno). O erro fica abaixo do campo e ligado a ele por `aria-describedby`, e o foco vai para o primeiro campo inválido.
- **Labels:** no Figma, os campos de login e cadastro só têm placeholder. O label existe, visível só para leitores de tela.
- **Diálogos** (login, busca, filtros, revisão): foco preso dentro, Esc fecha, e o foco volta para quem abriu, inclusive quando o login foi aberto pela URL. O modal de login não escurece a página, como no Figma.
- **Favoritar:** o botão tem nome fixo ("Favoritar X") e `aria-pressed`.
- **Cards:** um único link por card, "esticado" sobre o card, com anel de foco no card.
- **Tempo real:** os anúncios usam `aria-live`. O texto "Máximo disponível: N" do detalhe é só para leitores de tela.
- **Movimento reduzido:** `prefers-reduced-motion` para o carrossel e o shimmer dos skeletons.
- **Pontinhos do carrossel e da paginação de "Mais desta coleção":** mantêm o tamanho e o espaçamento do Figma (8 e 12px). O Lighthouse aponta "alvo de toque pequeno" nesses pontos. Eles são atalhos, porque o carrossel também avança sozinho e por arraste, e a nota de acessibilidade ficou em 96–100.
- **Fora do escopo:** os elementos continuam visíveis e avisam "Este recurso está em desenvolvimento." É o caso de Criadores, Aprenda, newsletter, escanear, "Ler mais", aba Avaliações, "Esqueceu a senha", Google/Facebook, e itens da lateral do perfil exceto "Sair". Nenhum simula sucesso.

### Dados e comportamento

- **Casas decimais:** os preços aparecem com 2 casas (Figma) e trafegam com 4 (`"7.3600"`).
- **Nomes das coleções:** as coleções inventadas têm nomes distintos dos NFTs, para que a busca por um nome não traga a coleção inteira.
- **Faixa de preço:** a escala vai de 0 ao próximo múltiplo de 5 do máximo da API.
- **Atalhos do card desktop:** os 3 atalhos do Figma (carrinho, coração, lupa) aparecem no hover ou no foco. O carrinho adiciona a edição disponível mais barata.
- **Comprar e adicionar no detalhe:** "Comprar" adiciona e leva ao carrinho. O ícone de carrinho no mobile adiciona e mostra "Ver carrinho". A quantidade é limitada ao estoque menos o que já está no carrinho.
- **Badge do carrinho:** fica só no header desktop e conta unidades.
- **Carteiras:** só Ethereum e Polygon, porque endereço `0x` é de rede EVM. Repetir endereço + rede entre principal e secundária gera 409. A secundária exige a principal.
- **Perfil:**
  - Um único "Salvar", e a senha é opcional.
  - A senha é trocada antes dos dados: com a senha atual errada, nada é salvo.
  - O avatar é reduzido no cliente para 256×256 WebP (Data URL) e só é aplicado ao salvar.
  - O avatar padrão é o ícone do Figma.
  - E-mail ou nome de usuário de outra conta gera 409 no campo.
- **Ícones redesenhados:** os ícones "thank-you" do recibo e o avatar padrão foram redesenhados em SVG a partir das medidas do Figma.
