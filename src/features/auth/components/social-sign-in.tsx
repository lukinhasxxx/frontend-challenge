import { FacebookColorIcon, GoogleColorIcon } from '@/components/icons/social'
import { notifyInDevelopment } from '@/lib/in-development'
import { cn } from '@/lib/utils'

const PROVIDERS = [
  { label: 'Continuar com Google', icon: GoogleColorIcon, feature: 'Login com Google' },
  { label: 'Continuar com Facebook', icon: FacebookColorIcon, feature: 'Login com Facebook' },
] as const

/** "Ou continue com" + Google/Facebook. Fora do escopo do SPEC: avisam "em desenvolvimento". */
export function SocialSignIn({ variant, gapClass }: { variant: 'desktop' | 'mobile'; gapClass: string }) {
  return (
    <div className={cn('flex flex-col', variant === 'desktop' ? 'gap-3 pt-6' : 'gap-3')}>
      <div className={cn('flex items-center', variant === 'desktop' ? 'gap-3' : 'gap-2.5')}>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        <span className="text-[0.8125rem] leading-4 text-foreground">Ou continue com</span>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>
      <div className={cn('flex flex-col', gapClass, variant === 'desktop' && 'px-20')}>
        {PROVIDERS.map(({ label, icon: Icon, feature }) => (
          <button
            key={label}
            type="button"
            onClick={() => notifyInDevelopment(feature)}
            className="flex h-10 cursor-pointer items-center justify-center gap-3 rounded-sm border border-border text-[0.8125rem] leading-4 font-medium text-muted-foreground transition-colors hover:border-primary hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Icon className="size-5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
