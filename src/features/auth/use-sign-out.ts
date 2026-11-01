import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { logoutRequest } from './api'
import { endSession } from './session'

/** Logout: encerra no servidor, limpa token/cache/socket da sessão e volta para a Home. */
export function useSignOut() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return async () => {
    await logoutRequest()
    endSession(queryClient)
    await navigate({ to: '/' })
  }
}
