import { describe, expect, it, vi } from 'vitest'
import { lazyPdfService } from './pdf-lazy'
import { mockClient, mockQuote } from './mocks'

describe('servicio PDF diferido', () => {
  it('carga el generador al solicitar la generación y devuelve un PDF válido', async () => {
    const generated = new Uint8Array([37, 80, 68, 70, 45])
    const generateQuotePdf = vi.fn(async () => generated)
    vi.doMock('./pdf', () => ({ generateQuotePdf }))

    const bytes = await lazyPdfService.generateQuote(
      mockQuote,
      { id: '66666666-6666-4666-8666-666666666666', legalName: 'Negocio', schemaVersion: 1 },
      mockClient,
    )

    expect(bytes).toBe(generated)
    expect(generateQuotePdf).toHaveBeenCalledOnce()
  })
})
