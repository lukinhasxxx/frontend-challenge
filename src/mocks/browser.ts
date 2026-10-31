import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

export async function startMocking() {
  await worker.start({
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    // Só alerta sobre chamadas de API sem handler; assets, HMR etc. passam direto.
    onUnhandledRequest(request, print) {
      if (new URL(request.url).pathname.startsWith('/api')) print.warning()
    },
  })
}
