import { describe, expect, it } from 'vitest'
import { calculateQuoteTotals } from './calculations'
import { quoteSchema } from './schemas'

describe('calculateQuoteTotals', () => { it('uses decimal arithmetic and applies discount before tax', () => { expect(calculateQuoteTotals([{ id: '1', description: 'x', quantity: 3, unitPrice: '0.10', discountPercent: '10', taxPercent: '19' }])).toEqual({ subtotal: '0.30', discount: '0.03', tax: '0.05', total: '0.32' }) }) })

describe('quoteSchema', () => { it('requires UUIDs, historical snapshots, version and validity dates', () => { const result = quoteSchema.safeParse({ ...({ id: '00000000-0000-4000-8000-000000000002', number: 'COT-0001', clientId: '00000000-0000-4000-8000-000000000001', title: 'x', currency: 'COP', status: 'draft', issuerSnapshot: { legalName: 'ZENTRIKA' }, clientSnapshot: { name: 'Acme' }, issuedAt: '2026-01-01T00:00:00.000Z', validFrom: '2026-01-01', validUntil: '2026-12-31', items: [{ id: '00000000-0000-4000-8000-000000000003', description: 'x', quantity: 1, unitPrice: '1.00', discountPercent: '0', taxPercent: '19' }], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', schemaVersion: 1 }) }); expect(result.success).toBe(true) }) })
