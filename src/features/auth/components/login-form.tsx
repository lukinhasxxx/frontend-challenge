import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AuthResponse } from '@/api/contracts'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { notifyInDevelopment } from '@/lib/in-development'
import { cn } from '@/lib/utils'
import { useLoginMutation } from '../api'
import { loginSchema, type LoginValues } from '../schemas'
import { applyApiError, inputClass, type AuthVariant } from '../form-utils'
import { FormAlert, SubmitButton } from './auth-form-parts'
import { PasswordInput } from './password-input'

type LoginFormProps = { variant: AuthVariant; onSuccess: (auth: AuthResponse) => void }

/** Figma "Login": e-mail, senha com olho, "Esqueceu a senha?" e "Entrar". */
export function LoginForm({ variant, onSuccess }: LoginFormProps) {
  const login = useLoginMutation()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })
  const { errors } = form.formState

  const submit = form.handleSubmit((values) => {
    setFormError(null)
    login.mutate(values, {
      onSuccess,
      onError: (error) => setFormError(applyApiError(error, form.setError, ['email', 'password'])),
    })
  })

  const desktop = variant === 'desktop'
  return (
    <form noValidate onSubmit={submit} className={cn('flex flex-col', desktop ? '' : 'gap-10')} aria-label="Entrar">
      <div className={cn('flex flex-col gap-3', desktop && 'px-20 pt-6')}>
        <Field label="E-mail" hideLabel error={errors.email?.message}>
          {(control) => (
            <Input
              {...control}
              {...form.register('email')}
              type="email"
              autoComplete="email"
              placeholder="contato@email.com"
              className={inputClass[variant]}
            />
          )}
        </Field>
        <Field label="Senha" hideLabel error={errors.password?.message}>
          {(control) => (
            <PasswordInput
              {...control}
              {...form.register('password')}
              autoComplete="current-password"
              placeholder="Senha"
              className={inputClass[variant]}
            />
          )}
        </Field>
        <button
          type="button"
          onClick={() => notifyInDevelopment('Recuperar senha')}
          className="cursor-pointer self-end text-[0.875rem] leading-4 text-accent-foreground hover:underline"
        >
          Esqueceu a senha?
        </button>
        {formError && <FormAlert>{formError}</FormAlert>}
      </div>
      <div className={cn(desktop && 'px-20 pt-6')}>
        <SubmitButton variant={variant} pending={login.isPending}>
          Entrar
        </SubmitButton>
      </div>
    </form>
  )
}
