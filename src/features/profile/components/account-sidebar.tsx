import type { ComponentType, SVGProps } from 'react'
import { Link } from '@tanstack/react-router'
import { Activity, Download, Heart, LogOut, MapPin, ShoppingCart, TriangleAlert, UserRound } from 'lucide-react'
import { useSignOut } from '@/features/auth/use-sign-out'
import { notifyInDevelopment } from '@/lib/in-development'
import { cn } from '@/lib/utils'

type Item = { label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }

const PAGES = [
  { label: 'Dados do perfil', to: '/perfil', icon: UserRound },
  { label: 'Carteiras', to: '/perfil/carteiras', icon: MapPin },
] as const

const OUT_OF_SCOPE: Item[] = [
  { label: 'Atividade', icon: ShoppingCart },
  { label: 'Lista de interesse', icon: Heart },
  { label: 'Ofertas', icon: Activity },
  { label: 'Arquivos baixados', icon: Download },
  { label: 'Suporte', icon: TriangleAlert },
]

const itemClass = 'flex h-[2.8125rem] w-full items-center gap-3 px-4 text-[0.9375rem] text-accent-foreground'

/** Figma "Account Sidebar" (Perfil/Carteiras): 310px, item ativo com barra de 6px à esquerda. */
export function AccountSidebar() {
  const signOut = useSignOut()

  return (
    <nav aria-labelledby="account-title" className="flex w-full shrink-0 flex-col bg-card py-2 lg:w-[19.375rem]">
      <h2 id="account-title" className="p-2.5 text-lg leading-4 font-bold">
        Meu perfil
      </h2>
      <ul>
        {PAGES.map(({ label, to, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact: true }}
              className={cn(itemClass, 'hover:bg-secondary')}
              activeProps={{ className: 'gap-4 border-l-[6px] border-primary pl-2.5' }}
            >
              <Icon className="size-[1.125rem]" aria-hidden="true" />
              {label}
            </Link>
          </li>
        ))}
        {OUT_OF_SCOPE.map(({ label, icon: Icon }) => (
          <li key={label}>
            <button type="button" onClick={() => notifyInDevelopment(label)} className={cn(itemClass, 'cursor-pointer hover:bg-secondary')}>
              <Icon className="size-[1.125rem]" aria-hidden="true" />
              {label}
              <span className="sr-only">(em desenvolvimento)</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 border-t border-border pt-2">
        <button type="button" onClick={() => void signOut()} className={cn(itemClass, 'cursor-pointer font-bold hover:bg-secondary')}>
          <LogOut className="size-[1.125rem]" aria-hidden="true" />
          Sair
        </button>
      </div>
    </nav>
  )
}
