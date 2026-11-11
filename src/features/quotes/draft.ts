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
 * Normaliza lo que escribe la persona en un campo de importe, siguiendo la
 * convención colombiana (punto de miles, coma decimal) sin romper la entrada
 * con punto decimal:
 * - Si hay coma, la coma es decimal y los puntos son de miles: "1.500,5" → "1500.5".
 * - Varios puntos son de miles: "1.000.000" → "1000000".
 * - Un único punto seguido de 3 dígitos es de miles: "1.500" → "1500".
 * - Un único punto seguido de 1–2 dígitos es decimal: "99.9" → "99.9".
 * El resultado se limita a 2 decimales (regla del esquema).
 */
export function normalizeDecimalInput(raw: string): string {
  let cleaned = raw.replace(/[^\d.,]/g, '')
  if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '')
    const [integer, ...rest] = cleaned.split(',')
    return rest.length === 0 ? integer : `${integer || '0'}.${rest.join('').slice(0, 2)}`
  }
  const parts = cleaned.split('.')
  if (parts.length === 1) return cleaned
  if (parts.length > 2 || parts[1].length === 3) {
    const last = parts[parts.length - 1]
    // "1.000.00" (miles + decimal tecleado con punto) conserva el último grupo como decimal.
    if (parts.length > 2 && last.length > 0 && last.length < 3) return `${parts.slice(0, -1).join('')}.${last}`
    return parts.join('')
  }
  return `${parts[0] || '0'}.${parts[1].slice(0, 2)}`
}

export function parseQuantity(raw: string): number {
  const value = Number(raw.replace(',', '.'))
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
  if (issue.code === 'too_small' && issue.type === 'string') return 'Este campo es obligatorio.'
  if (issue.code === 'too_small' && issue.type === 'number') return 'Debe ser mayor que 0.'
  if (issue.code === 'invalid_string' && issue.validation === 'email') return 'Escribe un correo válido.'
  if (issue.code === 'invalid_string' && issue.validation === 'url') return 'Escribe una URL válida (https://…).'
  if (issue.code === 'invalid_string' && issue.validation === 'regex') {
    return field === 'unitPrice' ? 'Escribe un precio válido.' : 'Usa un porcentaje válido (hasta 2 decimales).'
  }
  if (issue.code === 'invalid_string' && (issue.validation === 'date' || issue.validation === 'datetime')) return 'Selecciona una fecha válida.'
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
