import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { ChangePasswordRequest, SessionResponse, UpdateProfileRequest, User } from '@/api/contracts'
import { sessionQueryOptions } from '@/features/auth/api'

/** Salva o perfil e atualiza a sessão em cache (nome e avatar do header mudam na hora). */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: UpdateProfileRequest) => (await api.patch<User>('/profile', body)).data,
    onSuccess: (user) =>
      queryClient.setQueryData<SessionResponse | null>(sessionQueryOptions.queryKey, (session) => (session ? { ...session, user } : session)),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (body: ChangePasswordRequest) => {
      await api.post('/profile/password', body)
    },
  })
}
