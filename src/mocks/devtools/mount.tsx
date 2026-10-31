import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MockDevtools } from './mock-devtools'

/** Monta o painel em uma raiz React própria, fora da árvore do app. */
export function mountMockDevtools() {
  const container = document.createElement('div')
  container.id = 'mock-devtools'
  document.body.append(container)
  createRoot(container).render(
    <StrictMode>
      <MockDevtools />
    </StrictMode>,
  )
}
