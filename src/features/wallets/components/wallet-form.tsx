import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { z } from 'zod'
import { ENS_SUFFIXES, WALLET_NETWORKS, WALLET_PROVIDERS, type Wallet, type WalletDetails, type WalletRole } from '@/api/contracts'
import { applyApiError } from '@/features/auth/form-utils'
import { walletDetailsSchema } from '@/lib/validation'
import { cn } from '@/lib/utils'
import { useSaveWallet } from '../api'
import { NETWORK_LABEL, PROVIDER_LABEL, ROLE_TITLE } from '../labels'
import { figmaInputClass, LabeledField, NativeSelect } from './form-controls'

type WalletFormInput = z.input<typeof walletDetailsSchema>

const FIELDS = Object.keys(walletDetailsSchema.shape) as (keyof WalletDetails)[]

const EMPTY: Partial<WalletFormInput> = {
  displayName: '',
  label: '',
  profileName: '',
  address: '',
  secondaryAddress: '',
  referralCode: '',
  email: '',
  ensName: '',
  ensSuffix: '.eth',
}

type WalletFormProps = {
  role: WalletRole
  /** Dados iniciais (edição ou "Igual à carteira principal"). */
  initial?: WalletDetails
  onSaved: (wallet: Wallet) => void
  onCancel?: () => void
}

/** Formulário do frame "Desktop / Carteiras": 2 colunas de 417px no desktop, 1 coluna no mobile. */
export function WalletForm({ role, initial, onSaved, onCancel }: WalletFormProps) {
  const save = useSaveWallet()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<WalletFormInput, unknown, WalletDetails>({
    resolver: zodResolver(walletDetailsSchema),
    defaultValues: initial ?? EMPTY,
  })
  const { errors } = form.formState

  const submit = form.handleSubmit((details) => {
    setFormError(null)
    save.mutate(
      { role, details },
      {
        onSuccess: (wallet) => {
          toast.success(`${ROLE_TITLE[role]} salva.`)
          onSaved(wallet)
        },
        onError: (error) => setFormError(applyApiError(error, form.setError, FIELDS)),
      },
    )
  })

  const text = (name: keyof WalletDetails, label: string, extra: Partial<Parameters<typeof LabeledField>[0]> = {}, inputProps = {}) => (
    <LabeledField label={label} required error={errors[name]?.message} {...extra}>
      {(control) => <input {...control} {...form.register(name)} className={figmaInputClass} {...inputProps} />}
    </LabeledField>
  )

  return (
    <form noValidate onSubmit={submit} aria-label={ROLE_TITLE[role]} className="flex flex-col gap-8">
      <div className="grid gap-x-7 gap-y-6 md:grid-cols-2">
        {text('displayName', 'Nome de exibição', {}, { autoComplete: 'name' })}
        {text('label', 'Apelido da carteira', {}, { placeholder: role === 'primary' ? 'Ex.: Principal' : 'Ex.: Reserva' })}

        <LabeledField label="Rede" required error={errors.network?.message}>
          {(control) => (
            <NativeSelect {...control} {...form.register('network')} placeholder="Selecione uma rede" defaultValue="">
              {WALLET_NETWORKS.map((network) => (
                <option key={network} value={network}>
                  {NETWORK_LABEL[network]}
                </option>
              ))}
            </NativeSelect>
          )}
        </LabeledField>
        {text('profileName', 'Nome do perfil')}

        {text('address', 'Endereço da carteira', {}, { placeholder: 'Endereço 0x da carteira', autoComplete: 'off', spellCheck: false })}
        <LabeledField label="ENS ou carteira secundária (opcional)" hideLabel error={errors.secondaryAddress?.message}>
          {(control) => (
            <input
              {...control}
              {...form.register('secondaryAddress')}
              placeholder="ENS ou carteira secundária (opcional)"
              autoComplete="off"
              spellCheck={false}
              className={figmaInputClass}
            />
          )}
        </LabeledField>

        <LabeledField label="Tipo de carteira" required error={errors.provider?.message}>
          {(control) => (
            <NativeSelect {...control} {...form.register('provider')} placeholder="Selecione uma carteira" defaultValue="">
              {WALLET_PROVIDERS.map((provider) => (
                <option key={provider} value={provider}>
                  {PROVIDER_LABEL[provider]}
                </option>
              ))}
            </NativeSelect>
          )}
        </LabeledField>
        {text('referralCode', 'Código de indicação', {}, { autoCapitalize: 'characters' })}

        {text('email', 'E-mail', {}, { type: 'email', autoComplete: 'email' })}
        <LabeledField label="Nome ENS" required error={errors.ensName?.message ?? errors.ensSuffix?.message}>
          {(control) => (
            // Figma: sufixo (78px) + nome (329px), 10px entre eles.
            <div className="flex gap-2.5">
              <NativeSelect aria-label="Sufixo ENS" {...form.register('ensSuffix')} wrapperClassName="w-[4.875rem] shrink-0" className="pr-7 pl-2.5 text-[0.9375rem]">
                {ENS_SUFFIXES.map((suffix) => (
                  <option key={suffix} value={suffix}>
                    {suffix}
                  </option>
                ))}
              </NativeSelect>
              <input {...control} {...form.register('ensName')} autoComplete="off" spellCheck={false} className={figmaInputClass} />
            </div>
          )}
        </LabeledField>
      </div>

      {formError && (
        <p role="alert" className="text-caption text-destructive-text">
          {formError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-6">
        <button
          type="submit"
          disabled={save.isPending}
          aria-busy={save.isPending || undefined}
          className={cn(
            'flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[0.1875rem] bg-primary px-0.5 text-[0.875rem] leading-4 font-bold whitespace-nowrap text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait disabled:opacity-70',
            save.isPending ? 'px-3' : 'w-[8.1875rem]',
          )}
        >
          {save.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Salvar carteira
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="cursor-pointer text-base leading-4 font-medium text-accent-foreground hover:underline">
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
