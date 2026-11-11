import { cn } from '@/lib/utils'

/** Sello de Cotiza: una "C" abierta en tinta con el punto cobre de ZENTRIKA. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-8', className)}>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path d="M21.6 11.2a7.4 7.4 0 1 0 0 9.6" fill="none" strokeWidth="3.2" strokeLinecap="round" className="stroke-primary-foreground" />
      <circle cx="22.4" cy="16" r="2.1" className="fill-ember" />
    </svg>
  )
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[19px] font-semibold tracking-tight">Cotiza</span>
          <span className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">por Zentrika</span>
        </span>
      )}
    </span>
  )
}
