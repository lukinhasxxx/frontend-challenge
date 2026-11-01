import { useQueryClient } from '@tanstack/react-query'
import { useMatches, useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import { XIcon } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import type { AuthResponse } from '@/api/contracts'
import { DESKTOP_QUERY, useMediaQuery } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'
import { safeRedirect } from '../guard'
import type { AuthMode } from '../schemas'
import { endSession, startSession, useSessionState } from '../session'
import type { AuthVariant } from '../form-utils'
import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'
import { SocialSignIn } from './social-sign-in'

const COPY = {
  login: {
    tab: 'Entrar',
    description: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
    mobileTitle: 'Entrar',
    switchPrompt: 'Novo na Kurio?',
    switchAction: 'Crie uma conta',
  },
  register: {
    tab: 'Criar conta',
    description: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
    mobileTitle: 'Criar perfil de colecionador',
    switchPrompt: 'Já tem uma conta?',
    switchAction: 'Entre',
  },
} satisfies Record<AuthMode, Record<string, string>>

const INVALID_MESSAGE = {
  SESSION_EXPIRED: 'Sua sessão expirou. Entre novamente para continuar de onde parou.',
  UNAUTHENTICATED: 'Sua sessão não é mais válida. Entre novamente para continuar.',
} as const

/**
 * Login/cadastro sobre a tela atual (Figma: modal no desktop, tela cheia no mobile).
 * Abre por `?auth=login|register` (header, rotas privadas) ou quando a API rejeita a sessão —
 * nesse caso sem navegar, preservando a tela e o que já foi preenchido.
 */
export function AuthDialog() {
  const search = useSearch({ from: '__root__' })
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { invalidReason } = useSessionState()
  const onPrivateRoute = useMatches({ select: (matches) => matches.some((m) => m.staticData.requiresAuth) })
  const variant: AuthVariant = useMediaQuery(DESKTOP_QUERY) ? 'desktop' : 'mobile'

  const mode: AuthMode = search.auth ?? 'login'
  const open = Boolean(search.auth) || invalidReason !== null

  function clearAuthParams() {
    void navigate({ to: '.', search: (prev) => ({ ...prev, auth: undefined, redirect: undefined }), replace: true })
  }

  function switchMode(next: AuthMode) {
    void navigate({ to: '.', search: (prev) => ({ ...prev, auth: next }), replace: true })
  }

  function close() {
    if (invalidReason) {
      // Desistiu de entrar de novo: encerra a sessão anterior por completo.
      endSession(queryClient)
      if (onPrivateRoute) {
        void navigate({ to: '/' })
        return
      }
    }
    clearAuthParams()
  }

  function handleSuccess(auth: AuthResponse) {
    startSession(queryClient, auth)
    const target = safeRedirect(search.redirect)
    if (target) void router.navigate({ href: target, replace: true })
    else clearAuthParams()
  }

  const copy = COPY[mode]
  const desktop = variant === 'desktop'
  const form =
    mode === 'login' ? (
      <LoginForm key="login" variant={variant} onSuccess={handleSuccess} />
    ) : (
      <RegisterForm key="register" variant={variant} onSuccess={handleSuccess} />
    )
  const notice = invalidReason && (
    <p role="alert" className={cn('text-center text-body-sm text-accent-foreground', desktop ? 'px-20 pt-6' : '')}>
      {INVALID_MESSAGE[invalidReason]}
    </p>
  )

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && close()}>
      <DialogPrimitive.Portal>
        {/* Figma: a página continua visível atrás do modal (sem escurecer). */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50" />
        <DialogPrimitive.Content
          // Foco inicial no primeiro campo (o Figma mostra o campo em foco), não no botão fechar.
          onOpenAutoFocus={(event) => {
            const firstInput = (event.currentTarget as HTMLElement | null)?.querySelector('input')
            if (firstInput) {
              event.preventDefault()
              firstInput.focus()
            }
          }}
          className={cn(
            'fixed z-50 overflow-y-auto outline-none',
            desktop
              ? 'top-40 left-1/2 max-h-[calc(100dvh-11rem)] w-[31.25rem] -translate-x-1/2 rounded-lg border-b-[0.625rem] border-primary bg-card shadow-card'
              : 'inset-0 bg-background px-7 pt-20 pb-6',
          )}
        >
          {desktop ? (
            <div className={mode === 'login' ? 'pb-[5.8125rem]' : 'pb-16'}>
              <DialogPrimitive.Close
                aria-label="Fechar"
                className="absolute top-2.5 right-2.5 flex size-6 cursor-pointer items-center justify-center rounded-xs text-accent-foreground hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-ring"
              >
                <XIcon className="size-[1.125rem]" aria-hidden="true" />
              </DialogPrimitive.Close>
              <DialogPrimitive.Title className="sr-only">{copy.tab}</DialogPrimitive.Title>
              <div className="flex flex-col items-center gap-10 px-12 pt-12">
                <div role="tablist" aria-label="Acesso à conta" className="flex items-center gap-2">
                  {(['login', 'register'] as const).map((tab, index) => (
                    <span key={tab} className="flex items-center gap-2">
                      {index > 0 && <span aria-hidden="true" className="h-5 w-px bg-coral" />}
                      <button
                        type="button"
                        role="tab"
                        aria-selected={mode === tab}
                        onClick={() => switchMode(tab)}
                        className="cursor-pointer text-xl leading-4 font-medium text-foreground hover:text-accent-foreground aria-selected:text-accent-foreground"
                      >
                        {COPY[tab].tab}
                      </button>
                    </span>
                  ))}
                </div>
                <DialogPrimitive.Description className="text-center text-[0.8125rem] leading-4 text-foreground">
                  {copy.description}
                </DialogPrimitive.Description>
              </div>
              {notice}
              {form}
              <SocialSignIn variant="desktop" gapClass={mode === 'login' ? 'gap-3' : 'gap-4'} />
            </div>
          ) : (
            <div className="mx-auto flex max-w-[22.375rem] flex-col gap-10">
              <p aria-hidden="true" className="flex h-34 items-center justify-center text-[2rem] leading-[2.625rem] font-bold tracking-[0.1em] text-foreground">
                KURIO
              </p>
              <DialogPrimitive.Title
                className={cn('text-center leading-4 font-bold text-foreground', mode === 'login' ? 'text-xl' : 'text-lg')}
              >
                {copy.mobileTitle}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">{copy.description}</DialogPrimitive.Description>
              {notice}
              {form}
              <SocialSignIn variant="mobile" gapClass="gap-4" />
              <p className="text-center text-[0.9375rem] leading-5 text-muted-foreground">
                {copy.switchPrompt}{' '}
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                  className="cursor-pointer text-muted-foreground underline-offset-4 hover:text-accent-foreground hover:underline"
                >
                  {copy.switchAction}
                </button>
              </p>
              {invalidReason && (
                // Estado não desenhado no Figma mobile (sem botão fechar): permite seguir como visitante.
                <button type="button" onClick={close} className="cursor-pointer text-center text-body-sm text-subtle hover:underline">
                  Continuar sem entrar
                </button>
              )}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
