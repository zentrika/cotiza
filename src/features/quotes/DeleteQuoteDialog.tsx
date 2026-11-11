import type { Quote } from '@/domain/models'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

export function DeleteQuoteDialog({ quote, onCancel, onConfirm }: { quote?: Quote; onCancel: () => void; onConfirm: (quote: Quote) => void }) {
  return (
    <AlertDialog open={Boolean(quote)} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar {quote?.number}?</AlertDialogTitle>
          <AlertDialogDescription>
            {quote?.title ? <>«{quote.title}» para {quote.clientSnapshot.name} </> : null}
            se eliminará de este dispositivo. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction destructive onClick={() => quote && onConfirm(quote)}>Eliminar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
