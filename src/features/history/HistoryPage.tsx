import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownUp, FileText, Plus, Search, X } from 'lucide-react'
import type { QuoteStatus } from '@/domain/models'
import { Link, paths } from '@/app/router'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState, ErrorState } from '@/components/common/States'
import { StatusDot } from '@/components/common/StatusBadge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { DeleteQuoteDialog } from '@/features/quotes/DeleteQuoteDialog'
import { countByStatus, filterQuotes, SORT_LABELS, type QuoteSort } from '@/features/quotes/filter'
import { QuotePreviewDialog } from '@/features/quotes/QuotePreviewDialog'
import { QuoteRow, QuoteRowSkeleton } from '@/features/quotes/QuoteRow'
import { QUOTE_STATUSES, STATUS_META } from '@/features/quotes/status'
import { useQuoteActions } from '@/features/quotes/useQuoteActions'
import { useQuotes } from '@/features/quotes/useQuotes'

export function HistoryPage() {
  const quotes = useQuotes()
  const actions = useQuoteActions(quotes)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<QuoteStatus | 'all'>('all')
  const [sort, setSort] = useState<QuoteSort>('recent')
  const searchRef = useRef<HTMLInputElement>(null)

  const all = useMemo(() => quotes.data ?? [], [quotes.data])
  const counts = useMemo(() => countByStatus(all), [all])
  const results = useMemo(() => filterQuotes(all, { query, status, sort }), [all, query, status, sort])
  const hasFilters = query.trim() !== '' || status !== 'all'

  // Atajo "/" para enfocar la búsqueda.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(target.tagName) && !target.isContentEditable) {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const clearFilters = () => {
    setQuery('')
    setStatus('all')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Historial"
        title="Tus cotizaciones"
        description="Busca, revisa y actualiza el estado de cada propuesta."
        actions={<Link to={paths.newQuote} className={buttonVariants()}><Plus /> Nueva cotización</Link>}
      />

      {quotes.status === 'success' && all.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="Tu historial está vacío"
          description="Las cotizaciones que guardes aparecerán aquí, ordenadas y listas para buscar."
          action={<Link to={paths.newQuote} className={buttonVariants()}><Plus /> Crear cotización</Link>}
        />
      ) : (
        <>
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por número, título o cliente"
                  aria-label="Buscar cotizaciones"
                  className="pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
                />
                {query ? (
                  <button type="button" onClick={() => setQuery('')} className="focus-ring absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" aria-label="Limpiar búsqueda">
                    <X className="size-4" />
                  </button>
                ) : (
                  <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border bg-muted px-1.5 font-mono text-[11px] text-muted-foreground sm:block">/</kbd>
                )}
              </div>
              <Select value={sort} onValueChange={(value) => setSort(value as QuoteSort)}>
                <span id="history-sort-label" className="sr-only">Ordenar por</span>
                <SelectTrigger id="history-sort" className="sm:w-56" aria-labelledby="history-sort-label">
                  <span className="flex items-center gap-2"><ArrowDownUp className="size-4 text-muted-foreground" aria-hidden /><SelectValue /></span>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SORT_LABELS) as QuoteSort[]).map((key) => <SelectItem key={key} value={key}>{SORT_LABELS[key]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div role="group" aria-label="Filtrar por estado" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              <FilterChip active={status === 'all'} onClick={() => setStatus('all')} label="Todas" count={counts.all} />
              {QUOTE_STATUSES.map((s) => (
                <FilterChip key={s} active={status === s} onClick={() => setStatus(s)} label={STATUS_META[s].plural} count={counts[s]} dot={<StatusDot status={s} />} />
              ))}
            </div>
          </div>

          {quotes.status === 'loading' && (
            <Card className="p-2"><ul aria-busy="true" aria-label="Cargando cotizaciones">{[0, 1, 2, 3].map((i) => <QuoteRowSkeleton key={i} />)}</ul></Card>
          )}
          {quotes.status === 'error' && <ErrorState error={quotes.error} onRetry={quotes.reload} />}
          {quotes.status === 'success' && (
            <section aria-label="Resultados">
              <p className="mb-2 px-1 text-[13px] text-muted-foreground" aria-live="polite">
                {results.length} {results.length === 1 ? 'cotización' : 'cotizaciones'}
                {hasFilters && ` de ${all.length}`}
              </p>
              {results.length === 0 ? (
                <EmptyState
                  icon={<Search />}
                  title="Sin coincidencias"
                  description="Prueba con otro término o quita los filtros activos."
                  action={<Button variant="outline" onClick={clearFilters}>Limpiar filtros</Button>}
                />
              ) : (
                <Card className="p-1.5">
                  <div className="hidden grid-cols-[minmax(0,1fr)_140px_150px_110px_40px] gap-x-4 border-b px-4 pb-2 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
                    <span>Cotización</span><span>Vigencia</span><span className="text-right">Total</span><span className="text-right">Estado</span><span />
                  </div>
                  <ul className="divide-y divide-border/60">
                    {results.map((quote) => <QuoteRow key={quote.id} quote={quote} totals={quotes.totals(quote)} actions={actions.handlers} className="animate-fade-up" />)}
                  </ul>
                </Card>
              )}
            </section>
          )}
        </>
      )}

      <QuotePreviewDialog quote={actions.previewing} totals={actions.previewing && quotes.totals(actions.previewing)} open={Boolean(actions.previewing)} onOpenChange={(open) => !open && actions.setPreviewing(undefined)} />
      <DeleteQuoteDialog quote={actions.deleting} onCancel={() => actions.setDeleting(undefined)} onConfirm={actions.confirmDelete} />
    </div>
  )
}

function FilterChip({ active, onClick, label, count, dot }: { active: boolean; onClick: () => void; label: string; count: number; dot?: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'focus-ring inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:border-foreground/25 hover:text-foreground',
      )}
    >
      {dot}
      {label}
      <span className={cn('tabular rounded-full px-1.5 text-[11px]', active ? 'bg-primary-foreground/15' : 'bg-muted')}>{count}</span>
    </button>
  )
}
