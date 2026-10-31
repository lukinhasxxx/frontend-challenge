import { healthHandlers } from './health'
import { socketHandlers } from '../socket'

export const handlers = [...healthHandlers, ...socketHandlers]
