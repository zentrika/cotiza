import type { BusinessProfile, Client, Quote } from '@/domain/models'
import type { PdfService } from './contracts'

/**
 * Keeps pdf-lib and the PDF layout out of the initial application chunk.
 * The generator is loaded only when the user requests a PDF.
 */
export const lazyPdfService: PdfService = {
  async generateQuote(quote: Quote, profile: BusinessProfile, client: Client) {
    const { generateQuotePdf } = await import('./pdf')
    return generateQuotePdf(quote, profile, client)
  },
}
