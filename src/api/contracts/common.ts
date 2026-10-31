/** Valor em ETH transportado como string decimal com 4 casas (ex.: "0.4500"). */
export type EthAmount = string

/** Data/hora ISO 8601. */
export type IsoDate = string

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHENTICATED'
  | 'SESSION_EXPIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'EMAIL_TAKEN'
  | 'OUT_OF_STOCK'
  | 'EDITION_UNAVAILABLE'
  | 'QUOTE_STALE'
  | 'COUPON_INVALID'
  | 'COUPON_EXPIRED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'PAYMENT_DECLINED'
  | 'INTERNAL_ERROR'

/** Corpo de toda resposta de erro da API. */
export type ApiError = {
  code: ErrorCode
  message: string
  /** Erros por campo (formulários). A chave é o nome do campo. */
  fieldErrors?: Record<string, string>
}

export type Paginated<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}
