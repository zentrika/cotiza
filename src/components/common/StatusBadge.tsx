import type { QuoteStatus } from '@/domain/models'
import { STATUS_META } from '@/features/quotes/status'
import { cn } from '@/lib/utils'

export function StatusDot({ status, className }: { status: QuoteStatus; className?: string }) {
  return <span aria-hidden className={cn('inline-block size-1.5 shrink-0 rounded-full', STATUS_META[status].dot, className)} />
}

export function StatusBadge({ status, className }: { status: QuoteStatus; className?: string }) {
  const meta = STATUS_META[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium', meta.badge, className)}>
      <StatusDot status={status} />
      {meta.label}
    </span>
  )
}
