import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { ENS_SUFFIXES, type User } from '@/api/contracts'
import { ApiClientError } from '@/api/errors'
import { applyApiError } from '@/features/auth/form-utils'
import { PasswordInput } from '@/features/auth/components/password-input'
import { figmaInputClass, LabeledField, NativeSelect } from '@/features/wallets/components/form-controls'
import { AVATAR_TYPES, toAvatarDataUrl } from '@/lib/image'
import { passwordSchema, profileSchema } from '@/lib/validation'
import { useChangePassword, useUpdateProfile } from '../api'

/** Dados do perfil + "Alterar senha" (opcional: só valida se algum campo de senha for preenchido). */
const formSchema = profileSchema
  .extend({ currentPassword: z.string(), newPassword: z.string(), confirmPassword: z.string() })
  .superRefine((values, ctx) => {
    if (!values.currentPassword && !values.newPassword && !values.confirmPassword) return
    if (!values.currentPassword) ctx.addIssue({ code: 'custom', path: ['currentPassword'], message: 'Informe a senha atual.' })
    const strong = passwordSchema.safeParse(values.newPassword)
    if (!strong.success) ctx.addIssue({ code: 'custom', path: ['newPassword'], message: strong.error.issues[0]!.message })
    if (values.confirmPassword !== values.newPassword) {
      ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'As senhas não coincidem.' })
    }
  })

type FormInput = z.input<typeof formSchema>
type FormValues = z.output<typeof formSchema>

const PROFILE_FIELDS = ['name', 'username', 'email', 'ensName', 'ensSuffix', 'walletAlias'] as const

/** Avatar pendente até "Salvar": manter, trocar (Data URL) ou remover. */
type AvatarChange = { kind: 'keep' } | { kind: 'set'; dataUrl: string } | { kind: 'remove' }

function defaultsFrom(user: User): FormInput {
  return {
    name: user.name,
    username: user.username,
    email: user.email,
    ensName: user.ensName,
    ensSuffix: user.ensSuffix,
    walletAlias: user.walletAlias,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
}

/** Avatar padrão do Figma (Iconly Curved "Image 2", 24px, traço 1.5). */
function DefaultAvatarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Sem avatar" className="size-6">
      <path d="M2.75 12c0 6.937 2.313 9.25 9.25 9.25s9.25-2.313 9.25-9.25S18.937 2.75 12 2.75 2.75 5.063 2.75 12Z" />
      <path d="M10.599 8.784a1.761 1.761 0 1 1-3.522 0 1.761 1.761 0 0 1 3.522 0Z" />
      <path d="M21.12 14.767c-.881-.907-2.127-2.74-4.416-2.74s-2.339 4.039-4.675 4.039c-2.337 0-3.287-1.372-4.81-.656-1.522.715-2.762 3.562-2.762 3.562" />
    </svg>
  )
}

const passwordClass ='h-10 rounded-[0.1875rem] border-border bg-transparent px-4 text-[0.875rem]'

/** Figma "Desktop / Perfil do Colecionador": 2 colunas de 417px, senha em uma coluna, um único "Salvar". */
export function ProfileForm({ user }: { user: User }) {
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatar, setAvatar] = useState<AvatarChange>({ kind: 'keep' })
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(formSchema), defaultValues: defaultsFrom(user) })
  const { errors } = form.formState
  const pending = updateProfile.isPending || changePassword.isPending

  const preview = avatar.kind === 'set' ? avatar.dataUrl : avatar.kind === 'remove' ? null : user.avatarUrl

  async function pickAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // permite escolher o mesmo arquivo de novo
    if (!file) return
    try {
      setAvatar({ kind: 'set', dataUrl: await toAvatarDataUrl(file) })
      setAvatarError(null)
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Não foi possível ler esta imagem.')
    }
  }

  async function onValid({ currentPassword, newPassword, confirmPassword: _confirm, ...profile }: FormValues) {
    setFormError(null)
    // Senha primeiro (é o que mais falha): se a senha atual estiver errada, nada é salvo.
    if (newPassword) {
      try {
        await changePassword.mutateAsync({ currentPassword, newPassword })
      } catch (error) {
        setFormError(applyApiError(error, form.setError, ['currentPassword', 'newPassword']))
        return
      }
    }
    try {
      const avatarDataUrl = avatar.kind === 'set' ? avatar.dataUrl : avatar.kind === 'remove' ? null : undefined
      const saved = await updateProfile.mutateAsync({ ...profile, ...(avatarDataUrl !== undefined && { avatarDataUrl }) })
      form.reset(defaultsFrom(saved))
      setAvatar({ kind: 'keep' })
      toast.success(newPassword ? 'Perfil e senha atualizados.' : 'Perfil atualizado.')
    } catch (error) {
      const message = applyApiError(error, form.setError, [...PROFILE_FIELDS])
      if (error instanceof ApiClientError && error.fieldErrors.avatarDataUrl) setAvatarError(error.fieldErrors.avatarDataUrl)
      setFormError(newPassword ? `Senha alterada, mas os dados do perfil não foram salvos. ${message ?? ''}`.trim() : message)
    }
  }

  const submit = (event: FormEvent<HTMLFormElement>) => void form.handleSubmit(onValid)(event)

  const text = (name: (typeof PROFILE_FIELDS)[number], label: string, inputProps: Record<string, unknown> = {}) => (
    <LabeledField label={label} required overlap={false} className="gap-2.5" error={errors[name]?.message}>
      {(control) => <input {...control} {...form.register(name)} className={figmaInputClass} {...inputProps} />}
    </LabeledField>
  )

  const password = (name: 'currentPassword' | 'newPassword' | 'confirmPassword', label: string, autoComplete: string) => {
    const error = errors[name]?.message
    const id = `profile-${name}`
    return (
      <div className="flex flex-col gap-3">
        <label htmlFor={id} className="text-[0.9375rem] leading-[0.9375rem]">
          {label}
        </label>
        <PasswordInput
          id={id}
          {...form.register(name)}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={passwordClass}
        />
        {error && (
          <p id={`${id}-error`} role="alert" className="text-caption text-destructive-text">
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <form noValidate onSubmit={submit} aria-labelledby="profile-title" className="flex min-w-0 flex-1 flex-col gap-8">
      <h1 id="profile-title" className="text-base leading-4 font-bold">
        Perfil do colecionador
      </h1>

      <div className="grid gap-x-7 gap-y-6 md:grid-cols-2">
        {text('name', 'Nome de exibição', { autoComplete: 'name' })}
        {text('username', 'Nome de usuário', { autoComplete: 'username', spellCheck: false })}
        {text('email', 'E-mail', { type: 'email', autoComplete: 'email' })}
        <LabeledField label="Nome ENS" required overlap={false} className="gap-2.5" error={errors.ensName?.message}>
          {(control) => (
            <div className="flex gap-2.5">
              <NativeSelect aria-label="Sufixo ENS" {...form.register('ensSuffix')} wrapperClassName="w-[4.875rem] shrink-0" className="pr-7 pl-2.5 text-[0.9375rem]">
                {ENS_SUFFIXES.map((suffix) => (
                  <option key={suffix} value={suffix}>
                    {suffix}
                  </option>
                ))}
              </NativeSelect>
              <input {...control} {...form.register('ensName')} spellCheck={false} className={figmaInputClass} />
            </div>
          )}
        </LabeledField>
        {text('walletAlias', 'Apelido da carteira')}

        <div className="flex flex-col gap-2.5">
          <span id="avatar-label" className="text-[0.9375rem] leading-[0.9375rem]">
            Avatar
          </span>
          <div className="flex items-center gap-6">
            <span className="flex size-[3.125rem] shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-raised text-accent-foreground">
              {preview ? (
                <img src={preview} alt="Seu avatar" width={50} height={50} className="size-full object-cover" />
              ) : (
                <DefaultAvatarIcon />
              )}
            </span>
            <div className="flex items-center gap-5">
              <input
                ref={fileRef}
                type="file"
                accept={AVATAR_TYPES.join(',')}
                className="sr-only"
                tabIndex={-1}
                aria-labelledby="avatar-label"
                aria-describedby={avatarError ? 'avatar-error' : undefined}
                onChange={(event) => void pickAvatar(event)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-describedby={avatarError ? 'avatar-error' : undefined}
                className="h-10 w-[6.125rem] cursor-pointer rounded-[0.1875rem] bg-primary text-[0.875rem] leading-4 font-bold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Alterar
                <span className="sr-only"> avatar</span>
              </button>
              <button
                type="button"
                disabled={!preview}
                onClick={() => {
                  setAvatar({ kind: 'remove' })
                  setAvatarError(null)
                }}
                className="cursor-pointer text-[0.875rem] leading-4 hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                Remover
                <span className="sr-only"> avatar</span>
              </button>
            </div>
          </div>
          {avatarError && (
            <p id="avatar-error" role="alert" className="text-caption text-destructive-text">
              {avatarError}
            </p>
          )}
          {avatar.kind !== 'keep' && !avatarError && <p className="text-caption text-muted-foreground">Clique em Salvar para aplicar.</p>}
        </div>
      </div>

      <section aria-labelledby="password-title" className="flex flex-col gap-6 md:w-[calc(50%-0.875rem)]">
        <h2 id="password-title" className="text-base leading-4 font-medium">
          Alterar senha
        </h2>
        {password('currentPassword', 'Senha atual', 'current-password')}
        {password('newPassword', 'Nova senha', 'new-password')}
        {password('confirmPassword', 'Confirmar nova senha', 'new-password')}
      </section>

      {formError && (
        <p role="alert" className="text-caption text-destructive-text">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending || undefined}
        className="flex h-10 w-[8.1875rem] cursor-pointer items-center justify-center gap-2 rounded-[0.1875rem] bg-primary text-[0.875rem] leading-4 font-bold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait disabled:opacity-70"
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Salvar
      </button>
    </form>
  )
}
