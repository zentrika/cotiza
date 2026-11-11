import type { Client, Quote } from '@/domain/models'
import { calculateQuoteTotals } from '@/domain/calculations'
import type { ClientService, QuoteService } from './contracts'

export const mockClient: Client = { id: '00000000-0000-4000-8000-000000000001', name: 'Acme S.A.S.', email: 'contacto@acme.test', phone: '+57 300 000 0000', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', schemaVersion: 1 }
export const mockQuote: Quote = { id: '00000000-0000-4000-8000-000000000002', number: 'COT-0001', clientId: mockClient.id, title: 'Servicios profesionales', currency: 'COP', status: 'draft', issuerSnapshot: { legalName: 'ZENTRIKA' }, clientSnapshot: { name: mockClient.name, email: mockClient.email, phone: mockClient.phone }, issuedAt: '2026-01-01T00:00:00.000Z', validFrom: '2026-01-01', validUntil: '2026-12-31', items: [{ id: '00000000-0000-4000-8000-000000000003', description: 'Consultoría inicial', quantity: 1, unitPrice: '1500000', discountPercent: '0', taxPercent: '19' }], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', schemaVersion: 1 }

export function createInMemoryRepository<T extends { id: string }>(seed: T[] = []) {
  const records = new Map(seed.map((item) => [item.id, item]))
  return { async list() { return [...records.values()] }, async get(id: string) { return records.get(id) }, async save(entity: T) { records.set(entity.id, entity); return entity }, async remove(id: string) { records.delete(id) } }
}

export const mockClientService: ClientService = createInMemoryRepository([mockClient])
export const mockQuoteService: QuoteService = { ...createInMemoryRepository([mockQuote]), calculateTotals: (quote) => calculateQuoteTotals(quote.items) }
