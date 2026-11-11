import { FileDown } from 'lucide-react'
import type { Quote, QuoteTotals } from '@/domain/models'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { QuoteDocument } from './QuoteDocument'

export function QuotePreviewDialog({ quote, totals, open, onOpenChange }: { quote?: Quote; totals?: QuoteTotals; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl gap-0 bg-muted p-0 sm:max-h-[94dvh]">
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b bg-card/95 px-5 py-3.5 pr-14 backdrop-blur">
          <div className="min-w-0">
            <DialogTitle className="font-sans text-base font-semibold">Vista previa</DialogTitle>
            <DialogDescription className="text-xs">Así verá tu cliente la cotización.</DialogDescription>
          </div>
          <Button variant="outline" size="sm" disabled title="La descarga en PDF estará disponible próximamente">
            <FileDown /> PDF · Próximamente
          </Button>
        </div>
        <div className="p-3 sm:p-8">{quote && totals && <QuoteDocument quote={quote} totals={totals} />}</div>
      </DialogContent>
    </Dialog>
  )
}
