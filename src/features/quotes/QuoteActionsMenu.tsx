import { Copy, Eye, MoreHorizontal, PencilLine, Tag, Trash2 } from 'lucide-react'
import type { Quote, QuoteStatus } from '@/domain/models'
import { Button } from '@/components/ui/button'
import { StatusDot } from '@/components/common/StatusBadge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { QUOTE_STATUSES, STATUS_META } from './status'

export interface QuoteActionHandlers {
  onOpen: (quote: Quote) => void
  onPreview: (quote: Quote) => void
  onDuplicate: (quote: Quote) => void
  onStatusChange: (quote: Quote, status: QuoteStatus) => void
  onDelete: (quote: Quote) => void
}

export function QuoteActionsMenu({ quote, ...handlers }: { quote: Quote } & QuoteActionHandlers) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${quote.number}`} onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onSelect={() => handlers.onOpen(quote)}><PencilLine /> Abrir y editar</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handlers.onPreview(quote)}><Eye /> Vista previa</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handlers.onDuplicate(quote)}><Copy /> Duplicar</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger><Tag /> Cambiar estado</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={quote.status} onValueChange={(value) => handlers.onStatusChange(quote, value as QuoteStatus)}>
              {QUOTE_STATUSES.map((status) => (
                <DropdownMenuRadioItem key={status} value={status}>
                  <StatusDot status={status} /> {STATUS_META[status].label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={() => handlers.onDelete(quote)}><Trash2 /> Eliminar</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
