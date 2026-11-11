import type { ZodIssue } from 'zod'
import { DATA_SCHEMA_VERSION, type BusinessProfile, type BusinessProfileSnapshot, type Client, type ClientSnapshot, type Quote, type QuoteItem } from '@/domain/models'
import { businessProfileSchema, clientSchema, quoteSchema } from '@/domain/schemas'
import { addDays, toDateInput } from './format'

/**
 * Lógica de edición de cotizaciones, independiente de React.
 * No modifica modelos: solo crea, normaliza y valida entidades existentes.
 */

export const DEFAULT_TAX_PERCENT = '19'
export const DEFAULT_VALIDITY_DAYS = 30

export const newId = () => crypto.randomUUID()

export function nextQuoteNumber(quotes: Pick<Quote, 'number'>[]): string {
  const max = quotes.reduce((acc, quote) => {
    const match = quote.number.match(/(\d+)\s*$/)
    return match ? Math.max(acc, Number(match[1])) : acc
  }, 0)
  return `COT-${String(max + 1).padStart(4, '0')}`
}

export function createEmptyItem(): QuoteItem {
  return { id: newId(), description: '', quantity: 1, unitPrice: '', discountPercent: '0', taxPercent: DEFAULT_TAX_PERCENT }
}

export function profileToSnapshot(profile?: BusinessProfile): BusinessProfileSnapshot {
  if (!profile) return { legalName: '' }
  const { legalName, taxId, email, phone, address, logoUrl } = profile
  return { legalName, taxId, email, phone, address, logoUrl }
}

export function clientToSnapshot(client: Client): ClientSnapshot {
  const { name, email, phone, taxId, address } = client
  return { name, email, phone, taxId, address }
}

export function createDraftQuote({ number, profile, now = new Date() }: { number: string; profile?: BusinessProfile; now?: Date }): Quote {
  const today = toDateInput(now)
  const instant = now.toISOString()
  return {
    id: newId(),
    number,
    clientId: '',
    title: '',
    notes: '',
    currency: 'COP',
    status: 'draft',
    issuerSnapshot: profileToSnapshot(profile),
    clientSnapshot: { name: '' },
    issuedAt: instant,
    validFrom: today,
    validUntil: addDays(today, DEFAULT_VALIDITY_DAYS),
    items: [createEmptyItem()],
    createdAt: instant,
    updatedAt: instant,
    schemaVersion: DATA_SCHEMA_VERSION,
  }
}

export function duplicateQuote(source: Quote, number: string, now = new Date()): Quote {
  const today = toDateInput(now)
  const instant = now.toISOString()
  return {
    ...structuredClone(source),
    id: newId(),
    number,
    status: 'draft',
    title: source.title ? `${source.title} (copia)` : '',
    issuedAt: instant,
    validFrom: today,
    validUntil: addDays(today, DEFAULT_VALIDITY_DAYS),
    items: source.items.map((item) => ({ ...item, id: newId() })),
    createdAt: instant,
    updatedAt: instant,
  }
}

/**
 * Contrato de entrada numérica del editor:
 * - Se aceptan espacios y el símbolo `$`, pero no se descartan letras ni
 *   otros signos: una captura inválida debe permanecer visible para que la
 *   validación la informe.
 * - Con ambos separadores, el último es decimal y los anteriores deben ser
 *   agrupaciones válidas de tres dígitos.
 * - Con un solo separador, un grupo final de tres dígitos es agrupación de
 *   miles (`2,500` y `2.500` → `2500`). Las fracciones tienen uno o dos
 *   dígitos (`1500,00` → `1500.00`). Esta política es explícita porque la
 *   aplicación no mantiene una configuración regional distinta por campo y
 *   acepta ambos estilos para facilitar la captura local e internacional.
 * - El dominio conserva hasta dos decimales, tal como exige `quoteItemSchema`.
 *
 * Los formatos inválidos se devuelven sin transformarlos. Así no se convierten
 * silenciosamente en otro importe ni se oculta el error en el formulario.
 */
export function normalizeDecimalInput(raw: string): string {
  const cleaned = raw.trim().replace(/[ $]/g, '')
  if (cleaned === '') return ''
  if (!/^\d[\d.,]*$/.test(cleaned) && !/^[.,]\d[\d.,]*$/.test(cleaned)) return raw

  const separators = [...cleaned].filter((char) => char === ',' || char === '.')
  if (separators.length === 0) return cleaned

  const lastSeparatorIndex = Math.max(cleaned.lastIndexOf(','), cleaned.lastIndexOf('.'))
  const integerPart = cleaned.slice(0, lastSeparatorIndex)
  const fractionPart = cleaned.slice(lastSeparatorIndex + 1)
  const hasBothSeparators = cleaned.includes(',') && cleaned.includes('.')

  if (hasBothSeparators) {
    const groupingParts = integerPart.split(/[.,]/)
    if (!/^\d{1,3}$/.test(groupingParts[0]) || groupingParts.slice(1).some((part) => !/^\d{3}$/.test(part))) return raw
    if (!/^\d*$/.test(fractionPart)) return raw
    return `${groupingParts.join('')}.${fractionPart.slice(0, 2)}`
  }

  const separator = separators[0]
  const parts = cleaned.split(separator)
  if (parts.length > 2) {
    if (parts.some((part, index) => index === 0 ? !/^\d{1,3}$/.test(part) : !/^\d{3}$/.test(part))) return raw
    return parts.join('')
  }

  const [integer, fraction = ''] = parts
  if (integer !== '' && !/^\d+$/.test(integer)) return raw
  if (fraction.length === 3 && /^\d{1,3}$/.test(integer)) return `${integer || '0'}${fraction}`
  if (!/^\d{0,2}$/.test(fraction)) return raw
  return `${integer || '0'}.${fraction}`
}

export function parseQuantity(raw: string): number {
  const cleaned = raw.trim().replace(/[ $]/g, '')
  if (!cleaned || !/^(?:\d[\d.,]*|[.,]\d[\d.,]*)$/.test(cleaned)) return 0

  const separators = [...cleaned].filter((char) => char === ',' || char === '.')
  if (separators.length === 0) return Number(cleaned)

  const lastSeparator = Math.max(cleaned.lastIndexOf(','), cleaned.lastIndexOf('.'))
  const integerPart = cleaned.slice(0, lastSeparator)
  const fractionPart = cleaned.slice(lastSeparator + 1)
  const hasBothSeparators = cleaned.includes(',') && cleaned.includes('.')
  let canonical: string

  if (hasBothSeparators) {
    const groupingParts = integerPart.split(/[.,]/)
    if (!/^\d{1,3}$/.test(groupingParts[0]) || groupingParts.slice(1).some((part) => !/^\d{3}$/.test(part)) || !/^\d+$/.test(fractionPart)) return 0
    canonical = `${groupingParts.join('')}.${fractionPart}`
  } else {
    const parts = cleaned.split(separators[0])
    if (parts.length > 2) {
      if (parts.some((part, index) => index === 0 ? !/^\d{1,3}$/.test(part) : !/^\d{3}$/.test(part))) return 0
      canonical = parts.join('')
    } else {
      const [integer, fraction = ''] = parts
      if (integer !== '' && !/^\d+$/.test(integer) || !/^\d+$/.test(fraction)) return 0
      const isThousandsGroup = fraction.length === 3 && integer !== '0' && integer.length <= 3
      canonical = isThousandsGroup ? `${integer}${fraction}` : `${integer || '0'}.${fraction}`
    }
  }

  const value = Number(canonical)
  return Number.isFinite(value) ? value : 0
}

/** Un decimal incompleto ("12." o "") se convierte en un valor válido para cálculos. */
const finalizeDecimal = (value: string, fallback = '0') => {
  const trimmed = value.replace(/\.$/, '')
  return trimmed === '' ? fallback : trimmed
}

/** Garantiza que los importes de una línea sean calculables mientras se edita. */
export function itemForCalculation(item: QuoteItem): QuoteItem {
  const safe = (value: string) => (/^\d+(\.\d{1,2})?$/.test(finalizeDecimal(value)) ? finalizeDecimal(value) : '0')
  return {
    ...item,
    quantity: Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 0,
    unitPrice: safe(item.unitPrice),
    discountPercent: safe(item.discountPercent),
    taxPercent: safe(item.taxPercent),
  }
}

const emptyToUndefined = <T extends object>(record: T): T =>
  Object.fromEntries(Object.entries(record).map(([key, value]) => [key, typeof value === 'string' && value.trim() === '' ? undefined : typeof value === 'string' ? value.trim() : value])) as T

/** Limpia la cotización antes de validarla: recorta textos y convierte campos opcionales vacíos en `undefined`. */
export function sanitizeQuote(quote: Quote): Quote {
  return {
    ...quote,
    number: quote.number.trim(),
    title: quote.title.trim(),
    notes: quote.notes?.trim() ? quote.notes.trim() : undefined,
    issuerSnapshot: { ...emptyToUndefined(quote.issuerSnapshot), legalName: quote.issuerSnapshot.legalName.trim() },
    clientSnapshot: { ...emptyToUndefined(quote.clientSnapshot), name: quote.clientSnapshot.name.trim() },
    items: quote.items.map((item) => ({
      ...item,
      description: item.description.trim(),
      unitPrice: finalizeDecimal(item.unitPrice, ''),
      discountPercent: finalizeDecimal(item.discountPercent),
      taxPercent: finalizeDecimal(item.taxPercent),
    })),
  }
}

export function sanitizeProfile(profile: BusinessProfile): BusinessProfile {
  return { ...emptyToUndefined(profile), legalName: profile.legalName.trim(), id: profile.id, schemaVersion: profile.schemaVersion }
}

export type FieldErrors = Record<string, string>

const FIELD_MESSAGES: Record<string, string> = {
  clientId: 'Selecciona un cliente o crea uno nuevo.',
  validUntil: 'La vigencia debe terminar el mismo día o después de iniciar.',
}

function issueMessage(issue: ZodIssue): string {
  const key = issue.path.join('.')
  if (FIELD_MESSAGES[key]) return FIELD_MESSAGES[key]
  const field = String(issue.path[issue.path.length - 1] ?? '')
  if (issue.code === 'too_small' && issue.origin === 'string') return 'Este campo es obligatorio.'
  if (issue.code === 'too_small' && issue.origin === 'number') return 'Debe ser mayor que 0.'
  if (issue.code === 'invalid_format' && issue.format === 'email') return 'Escribe un correo válido.'
  if (issue.code === 'invalid_format' && issue.format === 'url') return 'Escribe una URL válida (https://…).'
  if (issue.code === 'invalid_format' && issue.format === 'regex') {
    return field === 'unitPrice' ? 'Escribe un precio válido.' : 'Usa un porcentaje válido (hasta 2 decimales).'
  }
  if (issue.code === 'invalid_format' && (issue.format === 'date' || issue.format === 'datetime')) return 'Selecciona una fecha válida.'
  return 'Revisa este campo.'
}

export function issuesToFieldErrors(issues: ZodIssue[]): FieldErrors {
  const errors: FieldErrors = {}
  for (const issue of issues) {
    const key = issue.path.join('.')
    if (!errors[key]) errors[key] = issueMessage(issue)
  }
  return errors
}

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors }

/**
 * Validación de la cotización con el esquema de dominio. Añade una regla de
 * experiencia (no de modelo): al menos una línea para poder guardar.
 */
export function validateQuote(quote: Quote, { requireClientId = true } = {}): ValidationResult<Quote> {
  const sanitized = sanitizeQuote(quote)
  const candidate = requireClientId ? sanitized : { ...sanitized, clientId: sanitized.clientId || '00000000-0000-4000-8000-000000000000' }
  const result = quoteSchema.safeParse(candidate)
  const errors = result.success ? {} : issuesToFieldErrors(result.error.issues)
  if (sanitized.items.length === 0) errors.items = 'Agrega al menos un producto o servicio.'
  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return { ok: true, value: sanitized }
}

export function buildClientFromSnapshot(snapshot: ClientSnapshot, now = new Date()): ValidationResult<Client> {
  const instant = now.toISOString()
  const client: Client = { ...emptyToUndefined(snapshot), name: snapshot.name.trim(), id: newId(), createdAt: instant, updatedAt: instant, schemaVersion: DATA_SCHEMA_VERSION }
  const result = clientSchema.safeParse(client)
  if (!result.success) {
    const prefixed = Object.fromEntries(Object.entries(issuesToFieldErrors(result.error.issues)).map(([key, value]) => [`clientSnapshot.${key}`, value]))
    return { ok: false, errors: prefixed }
  }
  return { ok: true, value: client }
}

export function validateProfile(profile: BusinessProfile): ValidationResult<BusinessProfile> {
  const sanitized = sanitizeProfile(profile)
  const result = businessProfileSchema.safeParse(sanitized)
  if (!result.success) return { ok: false, errors: issuesToFieldErrors(result.error.issues) }
  return { ok: true, value: sanitized }
}

export function snapshotToProfile(snapshot: BusinessProfileSnapshot, id: string = newId()): BusinessProfile {
  return { ...snapshot, id, schemaVersion: DATA_SCHEMA_VERSION }
}

/** Ordena por última modificación, de la más reciente a la más antigua. */
export const byUpdatedDesc = (a: Pick<Quote, 'updatedAt'>, b: Pick<Quote, 'updatedAt'>) => b.updatedAt.localeCompare(a.updatedAt)
