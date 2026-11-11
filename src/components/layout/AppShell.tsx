import type { ReactNode } from 'react'
import { FileText, Home, Plus, Settings, ShieldCheck } from 'lucide-react'
import { Link, paths, useRouter, type Route } from '@/app/router'
import { Logo } from '@/components/brand/Logo'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'

const NAV_ITEMS: { to: string; label: string; icon: typeof Home; match: Route['name'][] }[] = [
  { to: paths.home, label: 'Inicio', icon: Home, match: ['home'] },
  { to: paths.history, label: 'Cotizaciones', icon: FileText, match: ['history', 'edit-quote'] },
  { to: paths.settings, label: 'Ajustes', icon: Settings, match: ['settings'] },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { route } = useRouter()
  const isActive = (match: Route['name'][]) => match.includes(route.name)

  return (
    <div className="min-h-dvh lg:pl-64">
      <a href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus() }} className="focus-ring sr-only z-[60] rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Saltar al contenido
      </a>

      {/* Barra lateral (escritorio) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-card/60 backdrop-blur-sm lg:flex">
        <div className="flex h-16 items-center justify-between px-5">
          <Link to={paths.home} className="focus-ring rounded-lg" aria-label="Cotiza, ir al inicio">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>

        <div className="px-4 pt-4">
          <Link
            to={paths.newQuote}
            className={cn('focus-ring group flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lift transition-colors hover:bg-primary/90', route.name === 'new-quote' && 'ring-2 ring-ember ring-offset-2 ring-offset-background')}
          >
            <Plus className="size-4 transition-transform duration-200 group-hover:rotate-90" />
            Nueva cotización
          </Link>
        </div>

        <nav aria-label="Principal" className="mt-6 flex flex-col gap-0.5 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon, match }) => (
            <Link
              key={to}
              to={to}
              aria-current={isActive(match) ? 'page' : undefined}
              className={cn(
                'focus-ring relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                isActive(match) && 'bg-accent text-foreground before:absolute before:-left-3 before:top-2 before:h-6 before:w-[3px] before:rounded-r-full before:bg-ember',
              )}
            >
              <Icon className="size-[18px]" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto p-4">
          <div className="rounded-xl border bg-background/70 p-4">
            <div className="flex items-center gap-2 text-[13px] font-medium">
              <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
              Privado por diseño
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">Sin cuentas ni servidores. Tus cotizaciones se quedan en este dispositivo.</p>
          </div>
        </div>
      </aside>

      {/* Barra superior (móvil y tableta) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur-md lg:hidden">
        <Link to={paths.home} className="focus-ring rounded-lg" aria-label="Cotiza, ir al inicio">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 outline-none sm:px-6 sm:pt-8 lg:px-10 lg:pb-16 lg:pt-10">
        {children}
      </main>

      {/* Navegación inferior (móvil y tableta) */}
      <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="mx-auto grid h-16 max-w-md grid-cols-4 items-center px-2">
          {NAV_ITEMS.slice(0, 2).map((item) => (
            <MobileNavLink key={item.to} {...item} active={isActive(item.match)} />
          ))}
          <Link to={paths.newQuote} className="focus-ring mx-auto flex flex-col items-center gap-1 rounded-xl text-[11px] font-medium" aria-current={route.name === 'new-quote' ? 'page' : undefined}>
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lift">
              <Plus className="size-5" />
            </span>
            <span className="sr-only">Nueva cotización</span>
          </Link>
          <MobileNavLink {...NAV_ITEMS[2]} active={isActive(NAV_ITEMS[2].match)} />
        </div>
      </nav>
    </div>
  )
}

function MobileNavLink({ to, label, icon: Icon, active }: { to: string; label: string; icon: typeof Home; active: boolean }) {
  return (
    <Link to={to} aria-current={active ? 'page' : undefined} className={cn('focus-ring mx-auto flex flex-col items-center gap-1 rounded-lg px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors', active && 'text-foreground')}>
      <Icon className={cn('size-5', active && 'text-ember-strong')} />
      {label}
    </Link>
  )
}
