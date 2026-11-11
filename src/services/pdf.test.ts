import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
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

  it('pagina cotizaciones con muchas líneas', async () => {
    const quote = { ...structuredClone(mockQuote), items: Array.from({ length: 45 }, (_, index) => ({ ...mockQuote.items[0], id: `${String(index + 10).padStart(8, '0')}-0000-4000-8000-000000000003`, description: `Servicio profesional número ${index + 1}` })) }
    const bytes = await generateQuotePdf(quote, { id: '77777777-7777-4777-8777-777777777777', legalName: 'Negocio', schemaVersion: 1 }, mockClient)
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBeGreaterThan(1)
  })
})
