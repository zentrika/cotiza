import { CalendarClock } from 'lucide-react'
import type { Quote, QuoteTotals } from '@/domain/models'
import { Link, paths } from '@/app/router'
import { Money } from '@/components/common/Money'
import { StatusBadge } from '@/components/common/StatusBadge'
import { cn } from '@/lib/utils'
import { daysUntil, formatDate, formatRelative } from './format'
import { QuoteActionsMenu, type QuoteActionHandlers } from './QuoteActionsMenu'

function validityHint(quote: Quote) {
  if (quote.status !== 'draft' && quote.status !== 'sent') return null
  const days = daysUntil(quote.validUntil)
  if (days < 0) return { text: 'Vigencia vencida', urgent: true }
  if (days === 0) return { text: 'Vence hoy', urgent: true }
  if (days <= 7) return { text: `Vence en ${days} ${days === 1 ? 'día' : 'días'}`, urgent: true }
  return null
}

/** Fila de cotización para listados. El área principal es un enlace; las acciones van aparte para no anidar controles. */
export function QuoteRow({ quote, totals, actions, className }: { quote: Quote; totals: QuoteTotals; actions?: QuoteActionHandlers; className?: string }) {
  const hint = validityHint(quote)
  return (
    <li className={cn('group relative flex items-center gap-2 rounded-xl transition-colors hover:bg-accent/60 focus-within:bg-accent/60', className)}>
      <Link to={paths.quote(quote.id)} className="focus-ring grid min-w-0 flex-1 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 rounded-xl px-3 py-3 sm:grid-cols-[minmax(0,1fr)_140px_150px_110px] sm:px-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="whitespace-nowrap font-mono text-[12px] font-medium text-muted-foreground">{quote.number}</span>
            {hint && (
              <span className={cn('inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-medium', hint.urgent ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground')}>
                <CalendarClock className="size-3" aria-hidden /> {hint.text}
              </span>
            )}
          </div>
          <p className="truncate font-medium">{quote.title || 'Sin título'}</p>
          <p className="truncate text-[13px] text-muted-foreground">{quote.clientSnapshot.name || 'Sin cliente'}</p>
        </div>
        <div className="hidden text-[13px] text-muted-foreground sm:block">
          <p>Válida hasta</p>
          <p className="text-foreground">{formatDate(quote.validUntil)}</p>
        </div>
        <div className="row-span-2 text-right sm:row-span-1">
          <Money value={totals.total} currency={quote.currency} className="font-semibold" />
          <p className="text-[12px] text-muted-foreground">{formatRelative(quote.updatedAt)}</p>
        </div>
        <div className="col-start-1 sm:col-start-auto sm:flex sm:justify-end">
          <StatusBadge status={quote.status} />
        </div>
      </Link>
      {actions && (
        <div className="shrink-0 pr-2">
          <QuoteActionsMenu quote={quote} {...actions} />
        </div>
      )}
    </li>
  )
}

export function QuoteRowSkeleton() {
  return (
    <li className="flex items-center gap-4 px-4 py-4" aria-hidden>
      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-5 w-24 animate-pulse rounded bg-muted" />
    </li>
  )
}
