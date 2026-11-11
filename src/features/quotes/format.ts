import type { Currency } from '@/domain/models'

const moneyFormatters: Record<Currency, Intl.NumberFormat> = {
  COP: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 2 }),
  USD: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', currencyDisplay: 'code', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
}

/**
 * Formatea un importe decimal (string) sin pasar por `number`, para no perder
 * precisión. Intl.NumberFormat acepta strings numéricos en motores modernos.
 */
export function formatMoney(value: string, currency: Currency): string {
  const safe = /^-?\d+(\.\d+)?$/.test(value) ? value : '0'
  // Intl.NumberFormat v3 acepta strings decimales; el `lib` ES2022 de TypeScript aún no lo tipa.
  return moneyFormatters[currency].format(safe as unknown as number).replace(/\u00a0/g, ' ')
}

const dateFormatter = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const longDateFormatter = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

/** Fecha ISO `YYYY-MM-DD` → "31 dic 2026" (sin desfases de zona horaria). */
export function formatDate(isoDate: string, variant: 'short' | 'long' = 'short'): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return '—'
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  return (variant === 'long' ? longDateFormatter : dateFormatter).format(date).replace(/\.$/, '').replace(/ de /g, ' ')
}

/** Instante ISO-8601 → fecha local `YYYY-MM-DD`. */
export function instantToDateInput(instant: string): string {
  const date = new Date(instant)
  if (Number.isNaN(date.getTime())) return ''
  return toDateInput(date)
}

/** Fecha local `YYYY-MM-DD` → instante ISO-8601 (mediodía local para evitar saltos de día). */
export function dateInputToInstant(value: string): string {
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return ''
  return new Date(y, m - 1, d, 12, 0, 0).toISOString()
}

export function toDateInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return toDateInput(new Date(y, m - 1, d + days))
}

/** Días entre hoy y una fecha `YYYY-MM-DD` (negativo si ya pasó). */
export function daysUntil(isoDate: string, today: string = toDateInput(new Date())): number {
  const toUtc = (s: string) => {
    const [y, m, d] = s.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((toUtc(isoDate) - toUtc(today)) / 86_400_000)
}

const relativeFormatter = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

export function formatRelative(instant: string, now: Date = new Date()): string {
  const diff = (new Date(instant).getTime() - now.getTime()) / 1000
  const abs = Math.abs(diff)
  if (abs < 60) return 'hace un momento'
  if (abs < 3600) return relativeFormatter.format(Math.round(diff / 60), 'minute')
  if (abs < 86_400) return relativeFormatter.format(Math.round(diff / 3600), 'hour')
  if (abs < 86_400 * 30) return relativeFormatter.format(Math.round(diff / 86_400), 'day')
  return formatDate(instantToDateInput(instant))
}
