import { isAxiosError } from 'axios'
import type { ApiError, ErrorCode } from './contracts'

export type ClientErrorCode = ErrorCode | 'NETWORK_ERROR' | 'TIMEOUT' | 'UNKNOWN'

/** Erro único que a interface recebe de qualquer chamada à API. */
export class ApiClientError extends Error {
  readonly status: number | null
  readonly code: ClientErrorCode
  readonly fieldErrors: Record<string, string>

  constructor(params: { status: number | null; code: ClientErrorCode; message: string; fieldErrors?: Record<string, string> }) {
    super(params.message)
    this.name = 'ApiClientError'
    this.status = params.status
    this.code = params.code
    this.fieldErrors = params.fieldErrors ?? {}
  }

  /** Falha transitória: vale tentar de novo. */
  get isTransient() {
    return this.status === null || this.status >= 500
  }
}

function isApiErrorBody(data: unknown): data is ApiError {
  return typeof data === 'object' && data !== null && 'code' in data && 'message' in data
}

export function toApiClientError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) return error
  if (!isAxiosError(error)) {
    return new ApiClientError({ status: null, code: 'UNKNOWN', message: 'Erro inesperado.' })
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiClientError({ status: null, code: 'TIMEOUT', message: 'O servidor demorou para responder.' })
  }
  if (!error.response) {
    return new ApiClientError({ status: null, code: 'NETWORK_ERROR', message: 'Sem conexão com o servidor.' })
  }
  const { status, data } = error.response
  if (isApiErrorBody(data)) {
    return new ApiClientError({ status, code: data.code, message: data.message, fieldErrors: data.fieldErrors })
  }
  return new ApiClientError({ status, code: 'UNKNOWN', message: `Erro ${status}.` })
}
