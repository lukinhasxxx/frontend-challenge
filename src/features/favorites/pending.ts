const PENDING_KEY = 'pending-favorite'

/** Visitante clicou no coração: lembra o NFT para favoritar logo após o login. */
export function savePendingFavorite(nftId: string) {
  sessionStorage.setItem(PENDING_KEY, nftId)
}

export function takePendingFavorite() {
  const nftId = sessionStorage.getItem(PENDING_KEY)
  sessionStorage.removeItem(PENDING_KEY)
  return nftId
}

/** Desistiu de entrar: o pedido não deve ser aplicado num login futuro. */
export function clearPendingFavorite() {
  sessionStorage.removeItem(PENDING_KEY)
}
