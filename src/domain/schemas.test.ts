import { describe, expect, it } from 'vitest'
import { DATA_LIMITS, backupPayloadSchema, clientSchema, quoteSchema } from './schemas'
import { mockClient, mockQuote } from '@/services/mocks'

describe('límites de esquemas', () => {
  it('acepta datos de dominio existentes dentro de los límites', () => {
    expect(clientSchema.safeParse(mockClient).success).toBe(true)
    expect(quoteSchema.safeParse(mockQuote).success).toBe(true)
  })

  it('rechaza textos sobredimensionados sin truncarlos', () => {
    const result = clientSchema.safeParse({ ...mockClient, name: 'x'.repeat(DATA_LIMITS.clientName + 1) })
    expect(result.success).toBe(false)
  })

  it('rechaza una cotización con demasiadas partidas antes de validarlas todas', () => {
    const result = quoteSchema.safeParse({
      ...mockQuote,
      items: Array.from({ length: DATA_LIMITS.maxQuoteItems + 1 }, () => mockQuote.items[0]),
    })
    expect(result.success).toBe(false)
  })

  it('rechaza porcentajes, cantidades e importes malformados', () => {
    expect(quoteSchema.safeParse({ ...mockQuote, items: [{ ...mockQuote.items[0], taxPercent: '100.01' }] }).success).toBe(false)
    expect(quoteSchema.safeParse({ ...mockQuote, items: [{ ...mockQuote.items[0], quantity: Infinity }] }).success).toBe(false)
    expect(quoteSchema.safeParse({ ...mockQuote, items: [{ ...mockQuote.items[0], unitPrice: '1.234' }] }).success).toBe(false)
  })

  it('rechaza objetos con campos desconocidos y respaldos sobredimensionados', () => {
    expect(clientSchema.safeParse({ ...mockClient, unexpected: true }).success).toBe(false)
    expect(backupPayloadSchema.safeParse({ format: 'cotiza-backup', schemaVersion: 1, exportedAt: '2026-01-01T00:00:00.000Z', clients: Array.from({ length: DATA_LIMITS.maxBackupClients + 1 }, () => mockClient), quotes: [] }).success).toBe(false)
  })
})
