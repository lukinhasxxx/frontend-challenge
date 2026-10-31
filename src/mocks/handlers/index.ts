import { authHandlers } from './auth'
import { controlHandlers } from './control'
import { healthHandlers } from './health'
import { socketHandlers } from '../socket'

export const handlers = [...healthHandlers, ...authHandlers, ...controlHandlers, ...socketHandlers]
