import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { controlHandlers } from './control'
import { favoriteHandlers } from './favorites'
import { healthHandlers } from './health'
import { nftHandlers } from './nfts'
import { socketHandlers } from '../socket'

export const handlers = [
  ...healthHandlers,
  ...authHandlers,
  ...nftHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...controlHandlers,
  ...socketHandlers,
]
