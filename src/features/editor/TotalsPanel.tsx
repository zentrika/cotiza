import type { Currency, QuoteTotals } from '@/domain/models'
import { Money } from '@/components/common/Money'
import { cn } from '@/lib/utils'

/** Resumen de importes. El total usa la tipografía display y el acento cobre. */
export function TotalsPanel({ totals, currency, itemCount, className }: { totals: QuoteTotals; currency: Currency; itemCount: number; className?: string }) {
  const hasDiscount = Number(totals.discount) > 0
  return (
    <div className={cn('rounded-2xl border bg-card shadow-lift', className)}>
      <div className="relative overflow-hidden rounded-t-2xl bg-primary px-5 pb-5 pt-4 text-primary-foreground">
        <div aria-hidden className="absolute -right-10 -top-10 size-32 rounded-full bg-ember/30 blur-2xl" />
        <p className="relative text-[11px] font-semibold uppercase tracking-[0.2em] opacity-70">Total a cotizar</p>
        <p className="relative mt-1.5 font-display text-[32px] font-medium leading-none tracking-tight" aria-live="polite">
          <Money value={totals.total} currency={currency} />
        </p>
        <p className="relative mt-2 text-xs opacity-70">
          {itemCount} {itemCount === 1 ? 'línea' : 'líneas'} · {currency}
        </p>
      </div>
      <dl className="tabular space-y-2.5 px-5 py-4 text-sm">
        <Row label="Subtotal" value={<Money value={totals.subtotal} currency={currency} />} />
        <Row label="Descuentos" value={hasDiscount ? <span className="text-emerald-700 dark:text-emerald-400">− <Money value={totals.discount} currency={currency} /></span> : <span className="text-muted-foreground">—</span>} />
        <Row label="Impuestos" value={<Money value={totals.tax} currency={currency} />} />
      </dl>
      <p className="border-t px-5 py-3 text-[11.5px] leading-relaxed text-muted-foreground">Cálculo exacto por línea con redondeo a 2 decimales.</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
