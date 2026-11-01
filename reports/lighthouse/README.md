# Relatório Lighthouse

Gerado por `npm run lighthouse` (`scripts/lighthouse.mjs`) sobre o build de produção servido por `vite preview`, com os mocks (MSW) ativos, como no deploy de demonstração.

## Medianas (3 execuções por página e perfil)

Metas: Performance ≥ 90 · Acessibilidade ≥ 95 · Boas práticas ≥ 95 · SEO ≥ 90.

| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | FCP | LCP | CLS | TBT | Relatório |
|---|---|---|---|---|---|---|---|---|---|---|
| Início | Mobile | 92 | 96 | 100 | 100 | 2.007 ms | 2.946 ms | 0.018 | 98 ms | [HTML](./inicio-mobile.report.html) · [JSON](./inicio-mobile.report.json) |
| Início | Desktop | 99 | 96 | 100 | 100 | 606 ms | 899 ms | 0.004 | 0 ms | [HTML](./inicio-desktop.report.html) · [JSON](./inicio-desktop.report.json) |
| Detalhe do NFT | Mobile | 96 | 100 | 100 | 100 | 1.959 ms | 2.546 ms | 0.000 | 59 ms | [HTML](./detalhe-mobile.report.html) · [JSON](./detalhe-mobile.report.json) |
| Detalhe do NFT | Desktop | 99 | 97 | 100 | 100 | 601 ms | 899 ms | 0.000 | 0 ms | [HTML](./detalhe-desktop.report.html) · [JSON](./detalhe-desktop.report.json) |

As notas são a mediana de cada categoria nas 3 execuções. FCP, LCP, CLS, TBT e os relatórios HTML/JSON são da execução mediana (escolhida pelo mesmo critério do Lighthouse CI: a mais próxima da mediana de FCP e TTI).

**Todas as metas foram atingidas.**

## Todas as execuções

Notas na ordem Performance / Acessibilidade / Boas práticas / SEO.

| Página | Perfil | Execuções 1 — 2 — 3 |
|---|---|---|
| Início | Mobile | 92 / 96 / 100 / 100 — 93 / 96 / 100 / 100 — 92 / 96 / 100 / 100 |
| Início | Desktop | 99 / 96 / 100 / 100 — 99 / 96 / 100 / 100 — 99 / 96 / 100 / 100 |
| Detalhe do NFT | Mobile | 95 / 100 / 100 / 100 — 96 / 100 / 100 / 100 — 96 / 100 / 100 / 100 |
| Detalhe do NFT | Desktop | 99 / 97 / 100 / 100 — 99 / 97 / 100 / 100 — 99 / 97 / 100 / 100 |

## Ambiente

- Data: 2026-11-01
- Lighthouse 12.8.2 (Node API), Chrome headless 156.0.0.0
- Node v20.20.0, Windows_NT 10.0.19045 (x64)
- CPU: AMD Ryzen 5 5600X 6-Core Processor (12 threads), 32 GB de RAM — benchmark index do Lighthouse: 2278
- Mobile: emulação padrão do Lighthouse (Moto G Power, 4G lento simulado, CPU 4× mais lenta)
- Desktop: configuração `desktop` do Lighthouse (1350×940, sem limitação de CPU, rede de banda larga simulada)
- Servidor: `vite preview` local, sem CDN. A rede e a CPU são simuladas (throttling do Lighthouse), então as notas refletem mais o tamanho e a ordem dos recursos do que o servidor.

Os resultados variam com a máquina; por isso a mediana de 3 execuções.
