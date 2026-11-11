import { useState } from 'react'
import { toast } from 'sonner'
import type { Quote, QuoteStatus } from '@/domain/models'
import { paths, useRouter } from '@/app/router'
import type { QuoteActionHandlers } from './QuoteActionsMenu'
import { STATUS_META } from './status'
import type { useQuotes } from './useQuotes'

/** Conecta las acciones contextuales del listado con el servicio y los avisos. */
export function useQuoteActions(quotes: ReturnType<typeof useQuotes>) {
  const { navigate } = useRouter()
  const [previewing, setPreviewing] = useState<Quote>()
  const [deleting, setDeleting] = useState<Quote>()

  const fail = (message: string) => (error: unknown) => toast.error(message, { description: error instanceof Error ? error.message : undefined })

  const handlers: QuoteActionHandlers = {
    onOpen: (quote) => navigate(paths.quote(quote.id)),
    onPreview: setPreviewing,
    onDuplicate: (quote) =>
      quotes.duplicate(quote).then(
        (copy) => toast.success(`Se creó ${copy.number}`, { description: 'Copia en borrador lista para editar.', action: { label: 'Abrir', onClick: () => navigate(paths.quote(copy.id)) } }),
        fail('No se pudo duplicar la cotización'),
      ),
    onStatusChange: (quote: Quote, status: QuoteStatus) =>
      quotes.setStatus(quote, status).then(() => toast.success(`${quote.number} ahora está «${STATUS_META[status].label}»`), fail('No se pudo cambiar el estado')),
    onDelete: setDeleting,
  }

  const confirmDelete = (quote: Quote) => {
    setDeleting(undefined)
    quotes.remove(quote.id).then(() => toast.success(`${quote.number} eliminada`), fail('No se pudo eliminar la cotización'))
  }

  return { handlers, previewing, setPreviewing, deleting, setDeleting, confirmDelete }
}
