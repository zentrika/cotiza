import type { Currency } from '@/domain/models'
import { formatMoney } from '@/features/quotes/format'
import { cn } from '@/lib/utils'

export function Money({ value, currency, className }: { value: string; currency: Currency; className?: string }) {
  return <span className={cn('tabular whitespace-nowrap', className)}>{formatMoney(value, currency)}</span>
}
