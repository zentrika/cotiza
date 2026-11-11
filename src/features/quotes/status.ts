import type { QuoteStatus } from '@/domain/models'

export interface StatusMeta {
  label: string
  plural: string
  description: string
  /** Clases para el indicador y la insignia; funcionan en modo claro y oscuro. */
  dot: string
  badge: string
}

export const QUOTE_STATUSES: QuoteStatus[] = ['draft', 'sent', 'accepted', 'rejected', 'expired']

export const STATUS_META: Record<QuoteStatus, StatusMeta> = {
  draft: {
    label: 'Borrador',
    plural: 'Borradores',
    description: 'En preparación, aún no se ha enviado.',
    dot: 'bg-slate-400 dark:bg-slate-500',
    badge: 'border-slate-300/70 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
  },
  sent: {
    label: 'Enviada',
    plural: 'Enviadas',
    description: 'Compartida con el cliente, esperando respuesta.',
    dot: 'bg-sky-500',
    badge: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-300',
  },
  accepted: {
    label: 'Aceptada',
    plural: 'Aceptadas',
    description: 'El cliente aprobó la propuesta.',
    dot: 'bg-emerald-500',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300',
  },
  rejected: {
    label: 'Rechazada',
    plural: 'Rechazadas',
    description: 'El cliente no aceptó la propuesta.',
    dot: 'bg-rose-500',
    badge: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300',
  },
  expired: {
    label: 'Vencida',
    plural: 'Vencidas',
    description: 'Superó su fecha de vigencia.',
    dot: 'bg-amber-500',
    badge: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300',
  },
}
