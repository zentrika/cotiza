import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: ReactNode
  /** Un único control (Input, Textarea, SelectTrigger…). Recibe id, aria-invalid y aria-describedby. */
  children: ReactElement<Record<string, unknown>>
  error?: string
  hint?: ReactNode
  optional?: boolean
  className?: string
  id?: string
}

/** Etiqueta + control + ayuda/error, con los atributos ARIA conectados. */
export function FormField({ label, children, error, hint, optional, className, id: providedId }: FormFieldProps) {
  const generated = useId()
  const id = providedId ?? generated
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  const control = isValidElement(children)
    ? cloneElement(children, { id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy, 'data-field-error': error ? '' : undefined })
    : children

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="flex items-baseline justify-between gap-2">
        <span>{label}</span>
        {optional && <span className="text-[11px] font-normal text-muted-foreground">Opcional</span>}
      </Label>
      {control}
      {error ? (
        <p id={errorId} className="animate-fade-up text-xs font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
