import { useState, type FocusEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AuthResponse } from '@/api/contracts'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { emailSchema } from '@/lib/validation'
import { isEmailAvailable, useRegisterMutation } from '../api'
import { registerSchema, type RegisterValues } from '../schemas'
import { applyApiError, inputClass, type AuthVariant } from '../form-utils'
import { FormAlert, SubmitButton } from './auth-form-parts'
import { PasswordInput } from './password-input'

type RegisterFormProps = { variant: AuthVariant; onSuccess: (auth: AuthResponse) => void }

/** Figma "Cadastro": nome de usuário, e-mail, senha e confirmação. */
export function RegisterForm({ variant, onSuccess }: RegisterFormProps) {
  const registerUser = useRegisterMutation()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })
  const { errors } = form.formState

  // Ao sair do campo: avisa já que o e-mail existe (sem esperar o 409 do envio).
  async function checkEmail(event: FocusEvent<HTMLInputElement>) {
    const parsed = emailSchema.safeParse(event.target.value)
    if (!parsed.success) return
    try {
      if (!(await isEmailAvailable(parsed.data))) {
        form.setError('email', { type: 'server', message: 'Este e-mail já está cadastrado.' })
      }
    } catch {
      // Falha na checagem não bloqueia: o envio valida de novo no servidor.
    }
  }

  function clearServerEmailError() {
    if (form.getFieldState('email').error?.type === 'server') form.clearErrors('email')
  }

  const submit = form.handleSubmit(({ name, email, password }) => {
    setFormError(null)
    registerUser.mutate(
      { name, email, password },
      {
        onSuccess,
        // 409 (e-mail já cadastrado) e 422 chegam com `fieldErrors` e vão para o campo.
        onError: (error) => setFormError(applyApiError(error, form.setError, ['name', 'email', 'password'])),
      },
    )
  })

  const desktop = variant === 'desktop'
  return (
    <form noValidate onSubmit={submit} className={cn('flex flex-col', desktop ? '' : 'gap-10')} aria-label="Criar conta">
      <div className={cn('flex flex-col gap-3', desktop && 'px-20 pt-6')}>
        <Field label="Nome de usuário" hideLabel error={errors.name?.message}>
          {(control) => (
            <Input {...control} {...form.register('name')} autoComplete="username" placeholder="Nome de usuário" className={inputClass[variant]} />
          )}
        </Field>
        <Field label="E-mail" hideLabel error={errors.email?.message}>
          {(control) => (
            <Input
              {...control}
              {...form.register('email', { onBlur: checkEmail, onChange: clearServerEmailError })}
              type="email"
              autoComplete="email"
              placeholder="Digite seu e-mail"
              className={inputClass[variant]}
            />
          )}
        </Field>
        <Field label="Senha" hideLabel error={errors.password?.message}>
          {(control) => (
            <PasswordInput
              {...control}
              {...form.register('password')}
              autoComplete="new-password"
              placeholder="Senha"
              className={inputClass[variant]}
            />
          )}
        </Field>
        <Field label="Confirmar senha" hideLabel error={errors.confirmPassword?.message}>
          {(control) => (
            <PasswordInput
              {...control}
              {...form.register('confirmPassword')}
              autoComplete="new-password"
              placeholder="Confirmar senha"
              showToggle={!desktop}
              className={inputClass[variant]}
            />
          )}
        </Field>
        {formError && <FormAlert>{formError}</FormAlert>}
      </div>
      <div className={cn(desktop && 'px-20 pt-6')}>
        <SubmitButton variant={variant} pending={registerUser.isPending}>
          {desktop ? 'Criar conta' : 'Criar perfil'}
        </SubmitButton>
      </div>
    </form>
  )
}
