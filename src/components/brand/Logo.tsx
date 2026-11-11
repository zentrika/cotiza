import { cn } from '@/lib/utils'

/**
 * Recursos oficiales de ZENTRIKA (public/brand/assets). Se referencian tal cual,
 * sin recrearlos ni alterarlos. El isotipo a color funciona sobre fondos claros
 * y oscuros, por lo que se usa el mismo archivo en ambos modos.
 */
const ISOTIPO_SRC = '/brand/assets/zentrika-isotipo.svg'

/** Isotipo oficial de ZENTRIKA (viewBox 181.2 × 122, proporción ≈ 1.49:1). */
export function LogoMark({ className }: { className?: string }) {
  return <img src={ISOTIPO_SRC} alt="" aria-hidden width={181} height={122} decoding="async" className={cn('h-7 w-auto shrink-0 select-none', className)} draggable={false} />
}

/**
 * Composición de marca de producto, coherente con Perfila:
 * [Isotipo ZENTRIKA] Cotiza | by ZENTRIKA
 *
 * - `inline`: una sola línea con divisor vertical (barras superiores con espacio).
 * - `stacked`: «by ZENTRIKA» bajo el nombre del producto (barra lateral estrecha).
 */
export function Logo({ className, compact = false, layout = 'inline' }: { className?: string; compact?: boolean; layout?: 'inline' | 'stacked' }) {
  const parent = <span className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">by ZENTRIKA</span>
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      {!compact &&
        (layout === 'stacked' ? (
          <span className="flex flex-col leading-none">
            <span className="font-display text-[19px] font-semibold tracking-tight text-foreground">Cotiza</span>
            <span className="mt-1">{parent}</span>
          </span>
        ) : (
          <span className="flex items-center gap-2.5 leading-none">
            <span className="font-display text-[19px] font-semibold tracking-tight text-foreground">Cotiza</span>
            <span aria-hidden className="h-4 w-px bg-border" />
            {parent}
          </span>
        ))}
    </span>
  )
}
