const TOKEN_KEY = 'auth-token'
const GUEST_ID_KEY = 'guest-id'

/** Token da sessão. Persistido para a sessão sobreviver a refresh. */
export const authToken = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

/** Identifica o carrinho do visitante (enviado em `X-Guest-Id`). */
export function getGuestId() {
  let guestId = localStorage.getItem(GUEST_ID_KEY)
  if (!guestId) {
    guestId = crypto.randomUUID()
    localStorage.setItem(GUEST_ID_KEY, guestId)
  }
  return guestId
}
