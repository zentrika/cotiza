import { useEffect, useRef, useState } from 'react'
import { Copy, MoreVertical, Plus, Trash2 } from 'lucide-react'
import type { Currency, QuoteItem } from '@/domain/models'
import { calculateItem } from '@/domain/calculations'
import { Money } from '@/components/common/Money'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { itemForCalculation, normalizeDecimalInput, parseQuantity, type FieldErrors } from '@/features/quotes/draft'

interface ItemsEditorProps {
  items: QuoteItem[]
  currency: Currency
  errors: FieldErrors
  onAdd: () => string
  onChange: (id: string, patch: Partial<QuoteItem>) => void
  onRemove: (id: string) => void
  onDuplicate: (id: string) => void
}

export function ItemsEditor({ items, currency, errors, onAdd, onChange, onRemove, onDuplicate }: ItemsEditorProps) {
  const [focusId, setFocusId] = useState<string>()

  useEffect(() => {
    if (!focusId) return
    document.getElementById(`item-${focusId}-description`)?.focus()
    setFocusId(undefined)
  }, [focusId, items])

  return (
    <div>
      <ol className="flex flex-col gap-3">
        {items.map((item, index) => (
          <ItemRow
            key={item.id}
            item={item}
            index={index}
            currency={currency}
            errors={errors}
            canRemove={items.length > 1}
            onChange={(patch) => onChange(item.id, patch)}
            onRemove={() => onRemove(item.id)}
            onDuplicate={() => onDuplicate(item.id)}
          />
        ))}
      </ol>

      {errors.items && <p className="mt-3 text-xs font-medium text-destructive">{errors.items}</p>}

      <button
        type="button"
        onClick={() => setFocusId(onAdd())}
        className="focus-ring mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-input text-sm font-medium text-muted-foreground transition-colors hover:border-ember/60 hover:bg-ember-soft/40 hover:text-foreground"
      >
        <Plus className="size-4" /> Agregar producto o servicio
      </button>
    </div>
  )
}

interface ItemRowProps {
  item: QuoteItem
  index: number
  currency: Currency
  errors: FieldErrors
  canRemove: boolean
  onChange: (patch: Partial<QuoteItem>) => void
  onRemove: () => void
  onDuplicate: () => void
}

function ItemRow({ item, index, currency, errors, canRemove, onChange, onRemove, onDuplicate }: ItemRowProps) {
  const base = `item-${item.id}`
  const err = (field: keyof QuoteItem) => errors[`items.${index}.${field}`]
  const line = calculateItem(itemForCalculation(item))
  const rowErrors = (['description', 'quantity', 'unitPrice', 'discountPercent', 'taxPercent'] as const).map(err).filter(Boolean)

  return (
    <li className="animate-fade-up rounded-xl border bg-background/50 p-3 transition-colors focus-within:border-foreground/20 sm:p-4">
      <div className="flex items-center gap-2">
        <span aria-hidden className="w-5 shrink-0 text-center font-mono text-[11px] font-medium text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
        <div className="min-w-0 flex-1">
          <Label htmlFor={`${base}-description`} className="sr-only">Descripción de la línea {index + 1}</Label>
          <Input
            id={`${base}-description`}
            value={item.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Descripción del producto o servicio"
            className="font-medium"
            aria-invalid={err('description') ? true : undefined}
            data-field-error={err('description') ? '' : undefined}
          />
        </div>
        <ItemMenu canRemove={canRemove} onRemove={onRemove} onDuplicate={onDuplicate} index={index} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:ml-7 sm:mr-10 sm:grid-cols-[84px_minmax(0,1fr)_84px_84px_minmax(120px,auto)]">
        <NumberCell label="Cantidad" id={`${base}-quantity`} error={err('quantity')}>
          <QuantityInput id={`${base}-quantity`} value={item.quantity} onChange={(quantity) => onChange({ quantity })} invalid={Boolean(err('quantity'))} />
        </NumberCell>

        <NumberCell label={`Precio unitario (${currency})`} id={`${base}-unitPrice`} error={err('unitPrice')}>
          <Input
            id={`${base}-unitPrice`}
            inputMode="decimal"
            autoComplete="off"
            value={item.unitPrice}
            placeholder="0"
            onChange={(e) => onChange({ unitPrice: normalizeDecimalInput(e.target.value) })}
            className="tabular text-right"
            aria-invalid={err('unitPrice') ? true : undefined}
            data-field-error={err('unitPrice') ? '' : undefined}
          />
        </NumberCell>

        <NumberCell label="Desc. %" id={`${base}-discountPercent`} error={err('discountPercent')}>
          <PercentInput id={`${base}-discountPercent`} max={100} value={item.discountPercent} onChange={(discountPercent) => onChange({ discountPercent })} invalid={Boolean(err('discountPercent'))} />
        </NumberCell>

        <NumberCell label="Imp. %" id={`${base}-taxPercent`} error={err('taxPercent')}>
          <PercentInput id={`${base}-taxPercent`} value={item.taxPercent} onChange={(taxPercent) => onChange({ taxPercent })} invalid={Boolean(err('taxPercent'))} />
        </NumberCell>

        <div className="col-span-2 flex items-center justify-between border-t border-dashed pt-2.5 sm:col-span-1 sm:flex-col sm:items-end sm:justify-start sm:gap-1.5 sm:border-0 sm:pt-0">
          <span className="text-[12px] text-muted-foreground">Importe</span>
          <div className="text-right sm:flex sm:h-10 sm:flex-col sm:justify-center">
            <Money value={line.total} currency={currency} className="font-semibold" />
            {Number(line.discount) > 0 && <p className="text-[11px] leading-tight text-emerald-700 dark:text-emerald-400">ahorro <Money value={line.discount} currency={currency} /></p>}
          </div>
        </div>
      </div>

      {rowErrors.length > 0 && (
        <ul className="mt-2 space-y-0.5 sm:ml-7">
          {[...new Set(rowErrors)].map((message) => <li key={message} className="text-xs font-medium text-destructive">{message}</li>)}
        </ul>
      )}
    </li>
  )
}

function NumberCell({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className={cn('text-[12px] font-normal text-muted-foreground', error && 'text-destructive')}>{label}</Label>
      {children}
    </div>
  )
}

function ItemMenu({ canRemove, onRemove, onDuplicate, index }: { canRemove: boolean; onRemove: () => void; onDuplicate: () => void; index: number }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Opciones de la línea ${index + 1}`} className="text-muted-foreground">
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onDuplicate}><Copy /> Duplicar línea</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive disabled={!canRemove} onSelect={onRemove}><Trash2 /> Eliminar línea</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Cantidad con texto local para permitir escribir "1," o "0.5" sin perder el cursor. */
function QuantityInput({ id, value, onChange, invalid }: { id: string; value: number; onChange: (value: number) => void; invalid: boolean }) {
  const [text, setText] = useState(String(value))
  const last = useRef(value)

  useEffect(() => {
    if (value !== last.current) {
      setText(String(value))
      last.current = value
    }
  }, [value])

  return (
    <Input
      id={id}
      inputMode="decimal"
      autoComplete="off"
      value={text}
      onChange={(e) => {
        const next = e.target.value.replace(/[^\d.,]/g, '')
        setText(next)
        const parsed = parseQuantity(next)
        last.current = parsed
        onChange(parsed)
      }}
      onBlur={() => setText(String(last.current))}
      className="tabular text-right"
      aria-invalid={invalid || undefined}
      data-field-error={invalid ? '' : undefined}
    />
  )
}

function PercentInput({ id, value, onChange, invalid, max }: { id: string; value: string; onChange: (value: string) => void; invalid: boolean; max?: number }) {
  return (
    <div className="relative">
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          const next = normalizeDecimalInput(e.target.value)
          onChange(max !== undefined && Number(next) > max ? String(max) : next)
        }}
        className="tabular pr-6 text-right"
        aria-invalid={invalid || undefined}
        data-field-error={invalid ? '' : undefined}
      />
      <span aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
    </div>
  )
}
