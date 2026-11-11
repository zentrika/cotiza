import { describe, expect, it } from 'vitest'
import type { Quote } from '@/domain/models'
import { mockQuote } from '@/services/mocks'
import { countByStatus, filterQuotes } from './filter'

const make = (patch: Partial<Quote>): Quote => ({ ...mockQuote, ...patch })
const quotes = [
  make({ id: 'a', number: 'COT-0001', title: 'Diseño de marca', status: 'draft', updatedAt: '2026-01-01T00:00:00.000Z', validUntil: '2026-03-01', clientSnapshot: { name: 'Panadería Ñapa' } }),
  make({ id: 'b', number: 'COT-0010', title: 'Sitio web', status: 'sent', updatedAt: '2026-02-01T00:00:00.000Z', validUntil: '2026-02-15', clientSnapshot: { name: 'Café Montaña' } }),
  make({ id: 'c', number: 'COT-0002', title: 'Mantenimiento', status: 'accepted', updatedAt: '2026-01-15T00:00:00.000Z', validUntil: '2026-06-01', clientSnapshot: { name: 'Acme' } }),
]

describe('filterQuotes', () => {
  it('busca sin importar tildes ni mayúsculas', () => {
    expect(filterQuotes(quotes, { query: 'cafe' }).map((q) => q.id)).toEqual(['b'])
    expect(filterQuotes(quotes, { query: 'DISENO' }).map((q) => q.id)).toEqual(['a'])
    expect(filterQuotes(quotes, { query: 'napa' }).map((q) => q.id)).toEqual(['a'])
  })
  it('filtra por estado', () => {
    expect(filterQuotes(quotes, { status: 'accepted' }).map((q) => q.id)).toEqual(['c'])
  })
  it('ordena por reciente, número y vigencia', () => {
    expect(filterQuotes(quotes, { sort: 'recent' }).map((q) => q.id)).toEqual(['b', 'c', 'a'])
    expect(filterQuotes(quotes, { sort: 'number' }).map((q) => q.id)).toEqual(['b', 'c', 'a'])
    expect(filterQuotes(quotes, { sort: 'expiring' }).map((q) => q.id)).toEqual(['b', 'a', 'c'])
  })
  it('cuenta por estado', () => {
    expect(countByStatus(quotes)).toEqual({ all: 3, draft: 1, sent: 1, accepted: 1, rejected: 0, expired: 0 })
  })
})
