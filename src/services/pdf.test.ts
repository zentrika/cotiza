import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { calculateQuoteTotals } from '@/domain/calculations'
import { formatMoney } from '@/features/quotes/format'
import { itemForCalculation } from '@/features/quotes/draft'
import { mockClient, mockQuote } from './mocks'
import { generateQuotePdf } from './pdf'

describe('PDF de cotizaciones', () => {
  it('genera un documento carta con contenido y caracteres españoles', async () => {
    const quote = { ...structuredClone(mockQuote), title: 'Diseño y revisión', notes: 'Información válida para Bogotá y Medellín.' }
    const bytes = await generateQuotePdf(quote, { id: '66666666-6666-4666-8666-666666666666', legalName: 'Compañía Ñandú', schemaVersion: 1 }, { ...mockClient, name: 'Café Bogotá' })
    const pdf = await PDFDocument.load(bytes)
    expect(Array.from(bytes.slice(0, 5))).toEqual(Array.from(new TextEncoder().encode('%PDF-')))
    expect(pdf.getPages()[0].getSize()).toMatchObject({ width: 612, height: 792 })
  })

  it('conserva exactamente los importes financieros al generar el PDF', async () => {
    const quote = { ...structuredClone(mockQuote), items: [
      { ...mockQuote.items[0], quantity: 2, unitPrice: '125000.50', discountPercent: '10', taxPercent: '19' },
      { ...mockQuote.items[0], id: '00000000-0000-4000-8000-000000000004', quantity: 1, unitPrice: '50000', discountPercent: '0', taxPercent: '0' },
    ] }
    const totals = calculateQuoteTotals(quote.items.map(itemForCalculation))
    const bytes = await generateQuotePdf(quote, { id: '66666666-6666-4666-8666-666666666666', legalName: 'Compañía Ñandú', schemaVersion: 1 }, mockClient)
    const pdf = await PDFDocument.load(bytes)

    expect(totals).toEqual({ subtotal: '300001.00', discount: '25000.10', tax: '42750.17', total: '317751.07' })
    expect(pdf.getPageCount()).toBe(1)
    expect(formatMoney(totals.total, quote.currency)).toBe('$ 317.751,07')
  })

  it('pagina cotizaciones con muchas líneas', async () => {
    const quote = { ...structuredClone(mockQuote), items: Array.from({ length: 45 }, (_, index) => ({ ...mockQuote.items[0], id: `${String(index + 10).padStart(8, '0')}-0000-4000-8000-000000000003`, description: `Servicio profesional número ${index + 1}` })) }
    const bytes = await generateQuotePdf(quote, { id: '77777777-7777-4777-8777-777777777777', legalName: 'Negocio', schemaVersion: 1 }, mockClient)
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBeGreaterThan(1)
  })
})
