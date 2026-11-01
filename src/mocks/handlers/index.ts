import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { controlHandlers } from './control'
import { favoriteHandlers } from './favorites'
import { healthHandlers } from './health'
import { nftHandlers } from './nfts'
import { orderHandlers } from './orders'
import { walletHandlers } from './wallets'
import { socketHandlers } from '../socket'

export const handlers = [
  ...healthHandlers,
  ...authHandlers,
  ...nftHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...walletHandlers,
  ...orderHandlers,
  ...controlHandlers,
  ...socketHandlers,
]
