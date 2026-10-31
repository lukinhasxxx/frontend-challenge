import { authHandlers } from './auth'
import { healthHandlers } from './health'
import { socketHandlers } from '../socket'

export const handlers = [...healthHandlers, ...authHandlers, ...socketHandlers]
