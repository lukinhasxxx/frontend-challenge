import '@/styles/globals.css'
import { env } from '@/app/env'

/**
 * Ordem de boot importa: o MSW só aplica o patch de `WebSocket` dentro de
 * `worker.start()`, e o engine.io-client captura `globalThis.WebSocket` quando
 * o módulo é importado. Por isso o app (que importa socket.io-client) é
 * carregado dinamicamente só depois que os mocks estão ativos.
 */
async function bootstrap() {
  if (env.mocksEnabled) {
    const { startMocking } = await import('@/mocks/browser')
    await startMocking()
    // Painel Mock em paralelo: não atrasa a primeira renderização do app.
    void import('@/mocks/devtools/mount').then(({ mountMockDevtools }) => mountMockDevtools())
  }
  const { renderApp } = await import('@/app/render')
  renderApp(document.getElementById('root')!)
}

void bootstrap()
