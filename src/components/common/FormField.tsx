import { cloneElement, createContext, isValidElement, useContext, useId, type ReactElement, type ReactNode } from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/** Atributos de accesibilidad que un campo comparte con su control. */
export interface FormFieldControlProps {
  id: string
  labelId: string
  'aria-invalid'?: true
  'aria-describedby'?: string
}

const FormFieldContext = createContext<FormFieldControlProps | null>(null)

/**
 * Permite a controles compuestos (p. ej. `SelectTrigger` de Radix, que vive
 * dentro de `Select` y no recibe props clonadas) conectarse a la etiqueta,
 * la ayuda y el error del `FormField` que los envuelve.
 */
export const useFormFieldControl = () => useContext(FormFieldContext)

interface FormFieldProps {
  label: ReactNode
  /** Un único control (Input, Textarea, Select…). Recibe id, aria-invalid y aria-describedby. */
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
  const labelId = `${id}-label`
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  // Solo se referencia el mensaje que realmente se muestra (el error sustituye a la ayuda).
  const describedBy = error ? errorId : hint ? hintId : undefined
  const field: FormFieldControlProps = { id, labelId, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy }

  // `Select` (Radix Root) no renderiza DOM: su `SelectTrigger` toma los atributos del contexto.
  const isSelect = isValidElement(children) && children.type === SelectPrimitive.Root
  const control =
    isValidElement(children) && !isSelect
      ? cloneElement(children, { id, 'aria-invalid': field['aria-invalid'], 'aria-describedby': describedBy, 'data-field-error': error ? '' : undefined })
      : children

  return (
    <FormFieldContext.Provider value={field}>
      <div className={cn('flex flex-col gap-1.5', className)}>
        <Label id={labelId} htmlFor={id} className="flex items-baseline justify-between gap-2">
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
    </FormFieldContext.Provider>
  )
}
