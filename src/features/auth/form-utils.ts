import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiClientError } from '@/api/errors'

export type AuthVariant = 'desktop' | 'mobile'

/** Medidas do Figma: desktop 340×40 (r5) / mobile 358×50 (r10). */
export const inputClass = {
  desktop: 'h-10 rounded-sm border-border bg-transparent text-[0.875rem]',
  mobile: 'h-[3.125rem] rounded-[0.625rem] border-border bg-transparent text-[0.875rem]',
} satisfies Record<AuthVariant, string>

/**
 * Leva os erros da API para o formulário: `fieldErrors` (409/422) vão para os campos,
 * o resto vira mensagem geral. Retorna a mensagem geral, se houver.
 */
export function applyApiError<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, fields: Path<T>[]) {
  if (!(error instanceof ApiClientError)) return 'Algo deu errado. Tente novamente.'
  let mappedAny = false
  for (const [field, message] of Object.entries(error.fieldErrors)) {
    if (fields.includes(field as Path<T>)) {
      setError(field as Path<T>, { type: 'server', message }, { shouldFocus: !mappedAny })
      mappedAny = true
    }
  }
  if (mappedAny) return null
  return error.isTransient ? 'Não foi possível conectar agora. Tente novamente em instantes.' : error.message
}
