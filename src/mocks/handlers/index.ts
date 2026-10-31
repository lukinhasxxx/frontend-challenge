import { authHandlers } from './auth'
import { controlHandlers } from './control'
import { healthHandlers } from './health'
import { nftHandlers } from './nfts'
import { socketHandlers } from '../socket'

export const handlers = [...healthHandlers, ...authHandlers, ...nftHandlers, ...controlHandlers, ...socketHandlers]
