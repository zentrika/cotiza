import { ArrowRight, Building2, EyeOff, FileText, HardDrive, Plus, UserX } from 'lucide-react'
import { Link, paths } from '@/app/router'
import { useServices } from '@/app/services'
import { ErrorState, EmptyState } from '@/components/common/States'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAsync } from '@/hooks/useAsync'
import { cn } from '@/lib/utils'
import { DeleteQuoteDialog } from '@/features/quotes/DeleteQuoteDialog'
import { QuotePreviewDialog } from '@/features/quotes/QuotePreviewDialog'
import { QuoteRow, QuoteRowSkeleton } from '@/features/quotes/QuoteRow'
import { STATUS_META } from '@/features/quotes/status'
import { useQuoteActions } from '@/features/quotes/useQuoteActions'
import { useQuotes } from '@/features/quotes/useQuotes'
import type { QuoteStatus } from '@/domain/models'

const PRIVACY_POINTS = [
  { icon: UserX, title: 'Sin registro', text: 'Empieza a cotizar de inmediato, sin cuentas ni contraseñas.' },
  { icon: HardDrive, title: 'Solo en tu dispositivo', text: 'Tus clientes y precios se guardan en este navegador.' },
  { icon: EyeOff, title: 'Sin rastreo', text: 'No usamos analítica ni enviamos tus datos a terceros.' },
]

const SUMMARY_STATUSES: QuoteStatus[] = ['draft', 'sent', 'accepted']

export function HomePage() {
  const { profile: profileService } = useServices()
  const quotes = useQuotes()
  const actions = useQuoteActions(quotes)
  const profile = useAsync(() => profileService.get(), [profileService])

  const list = quotes.data ?? []
  const recent = list.slice(0, 5)
  const counts = Object.fromEntries(SUMMARY_STATUSES.map((s) => [s, list.filter((q) => q.status === s).length])) as Record<QuoteStatus, number>

  return (
    <div className="space-y-10">
      {/* Presentación */}
      <section className="relative grid items-center gap-10 overflow-hidden rounded-3xl border bg-card px-6 py-10 shadow-lift sm:px-10 sm:py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-[radial-gradient(circle,hsl(var(--brand)/0.14),hsl(var(--brand-violet)/0.08)_55%,transparent_70%)] blur-2xl" />
        <div className="relative animate-fade-up">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-brand" aria-hidden /> Gratis · Sin registro
          </p>
          <h1 className="text-balance font-display text-[34px] font-medium leading-[1.08] tracking-tight sm:text-5xl">
            Cotizaciones claras, <em className="font-normal italic text-brand-strong">listas en minutos.</em>
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            Crea propuestas profesionales con totales exactos, descuentos e impuestos por línea. Pensado para independientes y pequeños negocios en Colombia.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to={paths.newQuote} className={cn(buttonVariants({ size: 'lg' }), 'group')}>
              <Plus className="transition-transform duration-200 group-hover:rotate-90" /> Crear cotización
            </Link>
            <Link to={paths.history} className={buttonVariants({ size: 'lg', variant: 'outline' })}>
              Ver mis cotizaciones
            </Link>
          </div>
        </div>
        <PaperIllustration />
      </section>

      {/* Perfil pendiente */}
      {profile.status === 'success' && !profile.data && (
        <Link to={paths.settings} className="focus-ring group flex items-center gap-4 rounded-2xl border border-brand/30 bg-brand-soft/60 p-4 transition-colors hover:bg-brand-soft sm:p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-brand-strong shadow-lift">
            <Building2 className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium">Configura los datos de tu negocio</span>
            <span className="block text-sm text-muted-foreground">Aparecerán automáticamente en cada cotización nueva.</span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-brand-strong transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* Recientes */}
        <section aria-labelledby="recent-heading">
          <div className="mb-3 flex items-end justify-between">
            <h2 id="recent-heading" className="font-display text-xl font-medium tracking-tight">Recientes</h2>
            {list.length > 0 && (
              <Link to={paths.history} className="focus-ring inline-flex items-center gap-1 rounded text-sm font-medium text-brand-strong hover:underline">
                Ver todas <ArrowRight className="size-3.5" />
              </Link>
            )}
          </div>
          {quotes.status === 'loading' && (
            <Card className="p-2"><ul aria-busy="true" aria-label="Cargando cotizaciones">{[0, 1, 2].map((i) => <QuoteRowSkeleton key={i} />)}</ul></Card>
          )}
          {quotes.status === 'error' && <ErrorState error={quotes.error} onRetry={quotes.reload} />}
          {quotes.status === 'success' && recent.length === 0 && (
            <EmptyState
              icon={<FileText />}
              title="Aún no tienes cotizaciones"
              description="Tu primera cotización está a un clic. Se guardará solo en este dispositivo."
              action={<Link to={paths.newQuote} className={buttonVariants()}><Plus /> Crear la primera</Link>}
            />
          )}
          {quotes.status === 'success' && recent.length > 0 && (
            <Card className="p-1.5">
              <ul className="divide-y divide-border/60">
                {recent.map((quote) => (
                  <QuoteRow key={quote.id} quote={quote} totals={quotes.totals(quote)} actions={actions.handlers} />
                ))}
              </ul>
            </Card>
          )}
        </section>

        <aside className="space-y-6">
          {list.length > 0 && (
            <section aria-labelledby="summary-heading">
              <h2 id="summary-heading" className="mb-3 font-display text-xl font-medium tracking-tight">Resumen</h2>
              <Card className="grid grid-cols-3 divide-x divide-border/70 lg:grid-cols-1 lg:divide-x-0 lg:divide-y">
                {SUMMARY_STATUSES.map((status) => (
                  <div key={status} className="flex flex-col gap-1 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
                      <span className={cn('size-2 rounded-full', STATUS_META[status].dot)} aria-hidden />
                      {STATUS_META[status].plural}
                    </span>
                    <span className="tabular font-display text-2xl font-medium">{counts[status]}</span>
                  </div>
                ))}
              </Card>
            </section>
          )}

          <section aria-labelledby="privacy-heading" className="rounded-2xl border bg-card/60 p-5">
            <h2 id="privacy-heading" className="font-medium">Tus datos son tuyos</h2>
            <ul className="mt-4 space-y-4">
              {PRIVACY_POINTS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <Icon className="mt-0.5 size-4 shrink-0 text-brand-strong" aria-hidden />
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-[13px] leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <QuotePreviewDialog quote={actions.previewing} totals={actions.previewing && quotes.totals(actions.previewing)} open={Boolean(actions.previewing)} onOpenChange={(open) => !open && actions.setPreviewing(undefined)} />
      <DeleteQuoteDialog quote={actions.deleting} onCancel={() => actions.setDeleting(undefined)} onConfirm={actions.confirmDelete} />
    </div>
  )
}

/** Ilustración decorativa: una hoja de cotización estilizada. */
function PaperIllustration() {
  return (
    <div aria-hidden className="relative mx-auto hidden h-64 w-full max-w-sm select-none sm:block">
      <div className="absolute inset-x-10 top-6 h-56 rotate-[5deg] rounded-lg border bg-background shadow-lift" />
      <div className="absolute inset-x-6 top-2 h-60 -rotate-[2deg] rounded-lg border bg-paper p-5 shadow-paper transition-transform duration-500 hover:-rotate-[1deg]">
        <div className="h-1 w-full rounded-full bg-brand-gradient" />
        <div className="mt-4 flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="h-2.5 w-24 rounded bg-foreground/80" />
            <div className="h-2 w-16 rounded bg-muted-foreground/30" />
          </div>
          <div className="space-y-1.5 text-right">
            <div className="ml-auto h-2 w-14 rounded bg-brand-gradient opacity-80" />
            <div className="font-mono text-[11px] font-semibold text-foreground/80">COT-0042</div>
          </div>
        </div>
        <div className="mt-5 space-y-2.5">
          {[78, 64, 70].map((w, i) => (
            <div key={i} className="flex items-center justify-between gap-4 border-b border-dashed pb-2">
              <div className="h-2 rounded bg-muted-foreground/25" style={{ width: `${w}%` }} />
              <div className="h-2 w-10 rounded bg-muted-foreground/25" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-baseline justify-end gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total</span>
          <span className="font-display text-xl font-semibold tabular">$ 4.284.000</span>
        </div>
      </div>
    </div>
  )
}
