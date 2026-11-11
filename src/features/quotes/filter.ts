import type { Quote, QuoteStatus } from '@/domain/models'

export type QuoteSort = 'recent' | 'number' | 'expiring'

export const SORT_LABELS: Record<QuoteSort, string> = {
  recent: 'Más recientes',
  number: 'Número',
  expiring: 'Vigencia más próxima',
}

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Búsqueda (número, título, cliente) + filtro por estado + orden. Insensible a tildes y mayúsculas. */
export function filterQuotes(quotes: Quote[], { query = '', status = 'all', sort = 'recent' }: { query?: string; status?: QuoteStatus | 'all'; sort?: QuoteSort }): Quote[] {
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean)
  const filtered = quotes.filter((quote) => {
    if (status !== 'all' && quote.status !== status) return false
    if (terms.length === 0) return true
    const haystack = normalize([quote.number, quote.title, quote.clientSnapshot.name, quote.clientSnapshot.email ?? ''].join(' '))
    return terms.every((term) => haystack.includes(term))
  })
  const sorted = [...filtered]
  if (sort === 'recent') sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  if (sort === 'number') sorted.sort((a, b) => b.number.localeCompare(a.number, 'es', { numeric: true }))
  if (sort === 'expiring') sorted.sort((a, b) => a.validUntil.localeCompare(b.validUntil))
  return sorted
}

export function countByStatus(quotes: Quote[]): Record<QuoteStatus | 'all', number> {
  const counts = { all: quotes.length, draft: 0, sent: 0, accepted: 0, rejected: 0, expired: 0 }
  for (const quote of quotes) counts[quote.status] += 1
  return counts
}
