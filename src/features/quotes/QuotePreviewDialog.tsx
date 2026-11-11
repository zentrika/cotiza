import { FileDown, Loader2 } from 'lucide-react'
import type { Quote, QuoteTotals } from '@/domain/models'
import { useServices } from '@/app/services'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { QuoteDocument } from './QuoteDocument'
import { downloadPdf } from '@/services/pdf-download'
import { toast } from 'sonner'
import { useState } from 'react'

export function QuotePreviewDialog({ quote, totals, open, onOpenChange }: { quote?: Quote; totals?: QuoteTotals; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { pdf, clients } = useServices()
  const [generating, setGenerating] = useState(false)
  const handlePdf = async () => {
    if (!quote || !pdf) return
    setGenerating(true)
    try {
      const profile = { ...quote.issuerSnapshot, id: quote.id, schemaVersion: 1 as const }
      const client = (await clients.get(quote.clientId)) ?? { ...quote.clientSnapshot, id: quote.clientId, createdAt: quote.createdAt, updatedAt: quote.updatedAt, schemaVersion: 1 as const }
      const bytes = await pdf.generateQuote(quote, profile, client)
      downloadPdf(bytes, `${quote.number || 'cotizacion'}.pdf`)
    } catch (error) { toast.error('No se pudo generar el PDF', { description: error instanceof Error ? error.message : undefined }) }
    finally { setGenerating(false) }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl gap-0 bg-muted p-0 sm:max-h-[94dvh]">
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b bg-card/95 px-5 py-3.5 pr-14 backdrop-blur">
          <div className="min-w-0">
            <DialogTitle className="font-sans text-base font-semibold">Vista previa</DialogTitle>
            <DialogDescription className="text-xs">Así verá tu cliente la cotización.</DialogDescription>
          </div>
          <Button variant="outline" size="sm" disabled={generating || !quote || !pdf} onClick={() => void handlePdf()}>
            {generating ? <Loader2 className="animate-spin" aria-hidden /> : <FileDown aria-hidden />} {generating ? 'Generando PDF…' : 'Descargar PDF'}
          </Button>
        </div>
        <div className="p-3 sm:p-8">
          <p className="mb-2 px-1 text-xs text-muted-foreground sm:hidden">Desliza la tabla hacia los lados para ver todas las columnas.</p>
          {quote && totals && <QuoteDocument quote={quote} totals={totals} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}
