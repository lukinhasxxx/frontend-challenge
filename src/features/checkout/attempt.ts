import type { CreateOrderRequest } from '@/api/contracts'

export const CHECKOUT_ATTEMPT_STORAGE_KEY = 'checkout-attempt'

/**
 * Tentativa de compra (chave de idempotência + corpo exato enviado). Fica no sessionStorage
 * para sobreviver a refresh: sem resposta (timeout/queda), reenviamos a MESMA chave com o
 * MESMO corpo e a API devolve o mesmo pedido, em vez de criar outro.
 */
export type CheckoutAttempt = {
  userId: string
  key: string
  body: CreateOrderRequest
}

export const checkoutAttempt = {
  read(userId: string): CheckoutAttempt | null {
    try {
      const attempt = JSON.parse(sessionStorage.getItem(CHECKOUT_ATTEMPT_STORAGE_KEY) ?? 'null') as CheckoutAttempt | null
      // Tentativa de outra conta (troca de usuário na mesma aba) nunca é reaproveitada.
      return attempt?.userId === userId ? attempt : null
    } catch {
      return null
    }
  },
  save(attempt: CheckoutAttempt) {
    sessionStorage.setItem(CHECKOUT_ATTEMPT_STORAGE_KEY, JSON.stringify(attempt))
  },
  clear() {
    sessionStorage.removeItem(CHECKOUT_ATTEMPT_STORAGE_KEY)
  },
}
