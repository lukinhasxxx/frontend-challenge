# Kurio — Marketplace de NFTs

SPA de marketplace de NFTs: catálogo com busca e filtros, detalhe com edições, favoritos, carrinho com cupom, carteiras, checkout idempotente, acompanhamento do pedido em tempo real, recibo e perfil do colecionador.

Não há backend: toda a API REST e o servidor Socket.IO são simulados no navegador com [MSW](https://mswjs.io/), sobre um banco persistido no `localStorage`. Os mocks ficam ativos em desenvolvimento, nos testes e no build de produção (deploy de demonstração).

- **Demo em produção (Vercel):** https://frontend-challenge-lukinhasxxx.vercel.app
- **Arquitetura, contratos e decisões:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Relatórios do Lighthouse:** [reports/lighthouse/README.md](./reports/lighthouse/README.md)

## Destaques de engenharia

- **Rede de verdade, sem mock na interface.** A API REST e o Socket.IO (`ws://realtime.mock`) são interceptados no service worker. Por trás deles há um banco versionado no `localStorage`. Nenhum componente, hook ou interceptor conhece dado simulado. O painel `🧪 Mock` é desacoplado do app e só fala com endpoints `/__mock/*`, e funciona também em produção na Vercel.
- **Precisão financeira em ETH.** Os valores trafegam como string decimal (`"0.4500"`) e os cálculos são feitos em `bigint` (wei, 18 casas). Tudo isso fica em `src/lib/eth.ts`, que o cliente e o servidor simulado compartilham.
- **Checkout idempotente e resiliente.**
  - O clique duplo é bloqueado.
  - A `Idempotency-Key` e o corpo do pedido ficam guardados, e o servidor compara o hash do payload. Depois de um timeout, o reenvio devolve o mesmo pedido (`Idempotent-Replayed: true`).
  - Uma cotação desatualizada bloqueia a compra com `409 QUOTE_STALE`.
- **Tempo real com deduplicação e reconciliação.** Cada recurso tem versão crescente e cada evento tem `eventId`, o que descarta duplicatas e eventos fora de ordem. Os eventos só atualizam o cache do TanStack Query. Ao reconectar, o app reconcilia o estado pela API REST.
- **Performance medida.** No Lighthouse, a Performance ficou em 92 ou mais no mobile e 99 no desktop, sempre como mediana de 3 execuções. Para chegar lá:
  - O chunk dos mocks caiu de 172 KB para 52 KB gzip, trocando dependências que o MSW traz e o app não usa (`tough-cookie`/`tldts`) por um stub leve.
  - Os primeiros cards visíveis carregam com `fetchpriority="high"`.
  - Os skeletons têm o tamanho do conteúdo final, o que mantém o CLS em até 0.018.

## Avaliando em 3 minutos (direto na demo publicada)

Sem instalar nada, na URL da Vercel:

1. **Catálogo e estado na URL:** busque, filtre, ordene e mude de página. A URL acompanha tudo. Dê refresh e use voltar e avançar: o estado se mantém.
2. **Carrinho de visitante e merge no login:** sem login, adicione um NFT ao carrinho e entre como `ana@nft.dev` / `Senha@123`. O item continua lá. Saia e entre como `bruno@nft.dev`: nada da Ana aparece.
3. **Tempo real e falhas:** abra o detalhe de um NFT e, no `🧪 Mock`, altere o preço e clique em "Aplicar e emitir". O valor muda sem reload. Teste também "Reenviar duplicata", "Emitir evento antigo", "Derrubar socket por 5 s" e os cenários `slow`, `error-500` e `out-of-order`.
4. **Checkout idempotente e recibo:** como Ana, clique em "Conectar e finalizar", depois em "Conectar MetaMask", "Confirmar compra" e "Confirmar e pagar". O pedido fica pendente e o recibo aparece por `order.updated`. Repita com os cenários `timeout` ("Reenviar pedido" devolve o mesmo pedido), `price-changed` e `payment-declined`.
5. **Conta, carteiras e responsividade:** edite o perfil (avatar e senha) e as carteiras, e dê refresh. Confira as telas em 390, 768 e 1440 px.

## Stack

Vite · React 18 · TypeScript (strict) · TanStack Router · TanStack Query · Axios · Socket.IO Client · MSW + `@mswjs/socket.io-binding` · Tailwind CSS v4 · shadcn/ui (Radix) · lucide-react · React Hook Form · Zod · Playwright · Lighthouse.

## Como rodar

Requisitos: Node.js 20 ou superior e npm.

```bash
npm ci
npm run dev          # http://localhost:5173
```

Não é preciso criar `.env`: o app sobe com os mocks ativos por padrão.

Build de produção (o mesmo usado no deploy):

```bash
npm run build
npm run preview      # http://localhost:4173
```

### Deploy

É um site estático (`dist/`). Na Vercel, basta importar o repositório: o preset Vite já usa `npm run build` e `dist`, e o `vercel.json` reescreve as rotas para o `index.html`, o que permite abrir qualquer URL direto ou dar refresh nela. Para outros hosts (Netlify, Cloudflare Pages), `public/_redirects` faz o mesmo.

## Variáveis de ambiente

Todas são opcionais. Os valores padrão ficam em [`src/app/env.ts`](./src/app/env.ts), e o `.env` versionado repete esses padrões.

| Variável | Padrão | Uso |
|---|---|---|
| `VITE_ENABLE_MOCKS` | `true` | Liga o MSW (API e Socket.IO simulados) e o painel `🧪 Mock`. Só `false` desliga. |
| `VITE_SOCKET_URL` | `ws://realtime.mock` | Endereço do Socket.IO. Com os mocks, é um host fictício interceptado pelo MSW: se a interceptação falhar, a conexão dá erro em vez de cair no servidor do Vite. |

Para mudar algo só na sua máquina, use `.env.local` (fica fora do Git).

## Rotas

| Rota | Acesso | Tela |
|---|---|---|
| `/` | Pública | Início: destaques e catálogo (busca, filtros, ordenação e página na URL) |
| `/nft/:nftId` | Pública | Detalhe do NFT, edições e quantidade |
| `/carrinho` | Pública | Carrinho (visitante ou conta), cupom e cotação |
| `/favoritos` | Protegida | Favoritos da conta |
| `/pagamento` | Protegida | Checkout: carteira, rede, conexão simulada e revisão |
| `/pedidos/:orderId` | Protegida | Acompanhamento do pedido e recibo |
| `/perfil` | Protegida | Perfil do colecionador: dados, avatar e senha |
| `/perfil/carteiras` | Protegida | Carteiras principal e secundária |

Login e cadastro abrem como diálogo sobre a página atual (`?auth=login` / `?auth=register`). `/login` e `/cadastro` redirecionam para esse formato.

Uma rota protegida acessada sem sessão abre o login com `?redirect=<rota>`, e depois de entrar o usuário volta para ela. O redirect só aceita caminhos internos. Qualquer outra URL mostra a página 404.

## Dados de demonstração

### Contas

| Conta | E-mail | Senha |
|---|---|---|
| Ana Souza | `ana@nft.dev` | `Senha@123` |
| Bruno Lima | `bruno@nft.dev` | `Senha@123` |

Ana já tem carteira principal e secundária e alguns favoritos, e é boa para testar o checkout. Bruno serve para conferir o isolamento entre contas. Também é possível criar uma conta nova. A senha precisa de 8+ caracteres, com maiúscula, minúscula, número e caractere especial.

### Cupons

| Código | Efeito |
|---|---|
| `JUNGLE10` | 10% de desconto |
| `WELCOME5` | 5% de desconto |
| `EXPIRED20` | Expirado (mostra o erro "Este cupom expirou.") |

Qualquer outro código retorna "Cupom inválido.". O carrinho também tem uma taxa de rede fixa de 0.016 ETH.

### Catálogo

O catálogo tem 48 NFTs fixos (`src/mocks/fixtures/nfts.ts`), com coleções, categorias, edições, estoque e preços variados, e alguns já esgotados. As imagens ficam em `public/assets/nfts/`.

### Banco simulado e reset

O estado (usuários com senha em hash SHA-256 + salt, sessões, carrinhos, favoritos, carteiras, pedidos e estoque) fica no `localStorage`, na chave `mock-db:v1`, e sobrevive a refresh. O banco tem versão: quando o formato muda, ele é recriado a partir das fixtures automaticamente.

Para voltar ao estado inicial, use **🧪 Mock → Banco → Resetar banco e sessão** ou apague a chave `mock-db:v1` em DevTools → Application → Local Storage.

## Painel `🧪 Mock`

Com os mocks ativos, um botão `🧪 Mock · <cenário>` (ícone de frasco) aparece no centro da tela, embaixo no desktop e no topo no mobile, inclusive no deploy. Ele abre um painel para provocar estados difíceis de reproduzir à mão. O painel é montado fora da árvore do app, e cada ação chama endpoints `/__mock/*` tratados pelo MSW. Assim, toda mudança passa pelo banco simulado e chega à interface pelos mesmos caminhos da API e do socket.

| Seção | O que faz |
|---|---|
| **Cenário** | Troca o cenário ativo (tabela abaixo). Vale a partir da próxima requisição. |
| **Sessão** | Entra como Ana ou Bruno (une o carrinho de visitante, como no login real), sai, ou expira todas as sessões (o próximo request recebe 401 e o app pede login preservando a tela). |
| **Tempo real — nft.updated** | Altera preço e disponibilidade de uma edição e emite `nft.updated`. Também reenvia o último evento (duplicata, mesmo `eventId`) ou emite um evento com versão antiga, que o app deve ignorar. |
| **Pedidos — pagamento** | Confirma ou recusa o pedido pendente (use com o cenário `payment-pending`). |
| **Pedidos — idempotência** | Reenvia a última tentativa de compra com a mesma `Idempotency-Key` (retorna o mesmo pedido) ou com outro conteúdo (409 `IDEMPOTENCY_CONFLICT`). |
| **Conexão do socket** | Derruba o Socket.IO por 5 s. Na reconexão, o app revalida catálogo, carrinho e pedidos pela API. |
| **Banco** | Recria o banco a partir das fixtures, encerra a sessão e recarrega a página. O cenário escolhido continua. |

### Cenários

O cenário é escolhido pelo painel, pelo `localStorage.MOCK_SCENARIO` ou pelo header `x-mock-scenario`, que tem prioridade (usado nos testes).

| Cenário | Comportamento |
|---|---|
| `default` | Respostas normais (~150 ms). |
| `slow` | Toda resposta demora ~2,5 s (skeletons). |
| `variable-latency` | Latência aleatória entre 200 ms e 1,8 s (semente fixa). |
| `out-of-order` | Cada requisição responde mais rápido que a anterior: as respostas chegam fora de ordem. |
| `error-500` | Toda chamada `/api` retorna 500. |
| `offline` | Falha de rede. |
| `timeout` | Processa a requisição, mas responde depois do timeout do cliente (10 s). A repetição idempotente de um pedido responde na hora. |
| `expired-session` | Rotas autenticadas retornam 401 `SESSION_EXPIRED`. |
| `empty` | Listagens vazias. |
| `price-changed` | Preços mudam ao revalidar a cotação no envio do pedido (409 `QUOTE_STALE`). |
| `sold-out` | Edições esgotam ao revalidar a cotação no envio do pedido. |
| `payment-declined` | O pagamento é recusado depois de o pedido ser criado. |
| `payment-pending` | O pagamento fica pendente até ser resolvido pelo painel. |
| `wallet-rejected` | A carteira recusa a conexão no pagamento. |

### Roteiros rápidos

- **Preço em tempo real:** abra o detalhe de um NFT, mude o preço da edição no painel e clique em "Aplicar e emitir". O valor muda sem reload, e um aviso é anunciado. Com o mesmo NFT no carrinho, aparece "Seu carrinho mudou".
- **Compra completa:** entre como Ana, adicione um NFT, vá em "Conectar e finalizar", conecte a MetaMask, clique em "Confirmar compra" e depois em "Confirmar e pagar". O pedido fica pendente e é confirmado sozinho (~2 s) via `order.updated`, e aí aparece o recibo.
- **Queda do socket com pedido pendente:** use o cenário `payment-pending`, faça uma compra, clique em "Derrubar socket por 5 s" e em seguida em "Confirmar pendente". Ao reconectar, o pedido aparece confirmado.
- **Timeout e idempotência:** use o cenário `timeout` e confirme a compra. Depois de 10 s aparece "Reenviar pedido", que manda a mesma chave e devolve o mesmo pedido (header `Idempotent-Replayed`).
- **Isolamento de sessão:** entre como Ana, saia e entre como Bruno. Nada de Ana (carrinho, favoritos, pedidos) aparece, nem no cache do TanStack Query.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (porta 5173), com devtools do Router e do Query a partir de 768px. |
| `npm run build` | Typecheck + build de produção em `dist/`. |
| `npm run preview` | Serve o build (porta 4173). |
| `npm run typecheck` | TypeScript sem emitir arquivos. |
| `npm run lint` | ESLint. |
| `npm test` | Toda a suíte Playwright: unitários + E2E em desktop (Chrome) e mobile (Pixel 7). Sobe o Vite sozinho na porta 5174. |
| `npm run test:unit` | Só os unitários (aritmética ETH, fixtures, utilitários). |
| `npm run test:e2e` | Só os E2E (desktop + mobile). |
| `npm run test:report` | Abre o último relatório HTML do Playwright. |
| `npm run lighthouse` | Build + 3 medições Lighthouse por página e perfil, com a mediana em `reports/lighthouse/`. |

Antes do primeiro `npm test`, instale o navegador do Playwright com `npx playwright install chromium`.

### Testes

Os E2E ficam em `tests/e2e/` e cobrem os fluxos do enunciado: catálogo com filtros na URL, respostas fora de ordem, detalhe, login, cadastro e sessão expirada, favoritos otimistas com rollback, carrinho de visitante unido ao entrar, carteiras, compra completa, recusa, clique duplo, timeout com reenvio idempotente, preço alterado via Socket.IO, queda e reconexão do socket, perfil, navegação por teclado e regressão visual.

Cada teste roda em um contexto novo do navegador, então o banco simulado começa do zero. O cenário é definido no `localStorage` antes de o app carregar, e o estado é manipulado pelos mesmos endpoints `/__mock/*` do painel.

**Regressão visual** (`tests/e2e/visual.spec.ts`): Início, Detalhe, Carrinho e Pagamento, em desktop e mobile, com animações desligadas e dados fixos. As imagens de referência ficam em `tests/__screenshots__/` e não têm sufixo de sistema operacional, com tolerância de 3% de pixels diferentes. Foram geradas no Windows. Em outro sistema, se a renderização de fontes passar dessa tolerância, gere de novo com:

```bash
npx playwright test tests/e2e/visual.spec.ts --update-snapshots
```

## Acessibilidade e testes

**Cobertura:**
- **Tamanho:** são 156 execuções, das quais 144 passam e 12 são puladas de propósito por existirem só no desktop ou só no mobile. Isso cobre unitários e E2E em dois projetos (Chrome desktop e Pixel 7).
- **Rede real:** o Playwright **não intercepta a rede**. Os testes passam pelo mesmo MSW e pelo mesmo Socket.IO simulado que o app usa na demo, e provocam falhas pelos cenários e pelos endpoints `/__mock/*`.
- **Regressão visual:** cobre 4 telas, em desktop e mobile.

**Cuidados de acessibilidade:**
- **Foco:** diálogos (login, busca, filtros, revisão do pedido) prendem o foco, fecham com Esc e devolvem o foco para quem os abriu. O link "Pular para o conteúdo" leva direto ao conteúdo.
- **Formulários:** cada campo tem label, o erro fica ligado ao campo por `aria-describedby` e o foco vai para o primeiro campo inválido.
- **Contraste AA:** o vermelho de erro do Figma (4.39:1) foi trocado por coral (7.29:1).
- **Leitores de tela:** as mudanças em tempo real (preço, estoque, pagamento) são anunciadas por `aria-live`. Favoritar usa `aria-pressed`.
- **Movimento reduzido:** com `prefers-reduced-motion`, o carrossel e o shimmer dos skeletons param.

## Resultados do Lighthouse

Mediana de 3 execuções sobre o build de produção, com os mocks ativos (`npm run lighthouse`). Os relatórios HTML e JSON completos estão em [`reports/lighthouse/`](./reports/lighthouse/README.md).

| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| Início | Mobile | 92 | 96 | 100 | 100 | 2,9 s | 0.018 | 98 ms |
| Início | Desktop | 99 | 96 | 100 | 100 | 0,9 s | 0.004 | 0 ms |
| Detalhe do NFT | Mobile | 96 | 100 | 100 | 100 | 2,5 s | 0 | 59 ms |
| Detalhe do NFT | Desktop | 99 | 97 | 100 | 100 | 0,9 s | 0 | 0 ms |

## Estrutura

```
src/
  app/          bootstrap, providers, QueryClient, router, env
  routes/       rotas (file-based): validam search params, protegem e pré-carregam
  features/     telas por domínio: catalog, nft-detail, auth, favorites, cart, wallets, checkout, profile
  api/          cliente Axios, erros e contratos tipados (compartilhados com os mocks)
  realtime/     cliente Socket.IO e aplicação dos eventos no cache
  components/   UI base (shadcn) e layout
  lib/          aritmética ETH, validação (zod), imagem, utilitários
  mocks/        MSW: handlers, banco, fixtures, cenários, socket simulado e painel Mock
tests/          unit/, e2e/, support/ e __screenshots__/
scripts/        lighthouse.mjs
reports/        relatórios Lighthouse
```
