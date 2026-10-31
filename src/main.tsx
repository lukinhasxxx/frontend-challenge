import '@/styles/globals.css'

/**
 * Ordem de boot importa: o MSW só aplica o patch de `WebSocket` dentro de
 * `worker.start()`, e o engine.io-client captura `globalThis.WebSocket` quando
 * o módulo é importado. Por isso o app (que importa socket.io-client) é
 * carregado dinamicamente só depois que os mocks estão ativos.
 */
async function bootstrap() {
  if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    const { startMocking } = await import('@/mocks/browser')
    await startMocking()
    const { mountMockDevtools } = await import('@/mocks/devtools/mount')
    mountMockDevtools()
  }
  const { renderApp } = await import('@/app/render')
  renderApp(document.getElementById('root')!)
}

void bootstrap()
