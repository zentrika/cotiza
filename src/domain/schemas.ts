import { z } from 'zod'
import { DATA_SCHEMA_VERSION } from './models'

/** Límites de dominio: se rechaza, nunca se trunca silenciosamente. */
export const DATA_LIMITS = {
  legalName: 160, clientName: 160, taxId: 40, email: 254, phone: 40, address: 300,
  logoUrl: 2_048, quoteNumber: 32, title: 160, notes: 5_000, itemDescription: 500,
  decimalDigits: 18, maxQuoteItems: 100, maxBackupClients: 10_000,
  maxBackupQuotes: 10_000, maxQuantity: 1_000_000,
} as const

const uuid = z.string().uuid()
const requiredText = (max: number) => z.string().min(1).max(max)
const optionalText = (max: number) => z.string().max(max).optional()
const decimalPattern = new RegExp(`^\\d{1,${DATA_LIMITS.decimalDigits}}(\\.\\d{1,2})?$`)
const decimal = z.string().max(DATA_LIMITS.decimalDigits + 3).regex(decimalPattern)
const percentage = decimal.refine((value) => Number(value) <= 100, { message: 'percentage must be between 0 and 100' })

/** Rechaza arreglos sobredimensionados antes de recorrer sus elementos. */
const boundedArray = <T>(item: z.ZodType<T>, max: number) => z.preprocess((value, context) => {
  if (Array.isArray(value) && value.length > max) {
    context.addIssue({ code: z.ZodIssueCode.too_big, maximum: max, type: 'array', inclusive: true })
    return z.NEVER
  }
  return value
}, z.array(item).max(max))

export const currencySchema = z.enum(['COP', 'USD'])
export const quoteStatusSchema = z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired'])
const snapshot = z.object({ legalName: requiredText(DATA_LIMITS.legalName), taxId: optionalText(DATA_LIMITS.taxId), email: z.string().max(DATA_LIMITS.email).email().optional(), phone: optionalText(DATA_LIMITS.phone), address: optionalText(DATA_LIMITS.address), logoUrl: z.string().max(DATA_LIMITS.logoUrl).url().optional() }).strict()
const clientSnapshot = z.object({ name: requiredText(DATA_LIMITS.clientName), email: z.string().max(DATA_LIMITS.email).email().optional(), phone: optionalText(DATA_LIMITS.phone), taxId: optionalText(DATA_LIMITS.taxId), address: optionalText(DATA_LIMITS.address) }).strict()
export const businessProfileSchema = z.object({ id: uuid, legalName: requiredText(DATA_LIMITS.legalName), taxId: optionalText(DATA_LIMITS.taxId), email: z.string().max(DATA_LIMITS.email).email().optional(), phone: optionalText(DATA_LIMITS.phone), address: optionalText(DATA_LIMITS.address), logoUrl: z.string().max(DATA_LIMITS.logoUrl).url().optional(), schemaVersion: z.literal(DATA_SCHEMA_VERSION) }).strict()
export const clientSchema = z.object({ id: uuid, name: requiredText(DATA_LIMITS.clientName), email: z.string().max(DATA_LIMITS.email).email().optional(), phone: optionalText(DATA_LIMITS.phone), taxId: optionalText(DATA_LIMITS.taxId), address: optionalText(DATA_LIMITS.address), createdAt: z.string().datetime(), updatedAt: z.string().datetime(), schemaVersion: z.literal(DATA_SCHEMA_VERSION) }).strict()
export const quoteItemSchema = z.object({ id: uuid, description: requiredText(DATA_LIMITS.itemDescription), quantity: z.number().finite().positive().max(DATA_LIMITS.maxQuantity), unitPrice: decimal, discountPercent: percentage, taxPercent: percentage }).strict()
export const quoteSchema = z.object({ id: uuid, number: requiredText(DATA_LIMITS.quoteNumber), clientId: uuid, title: requiredText(DATA_LIMITS.title), notes: optionalText(DATA_LIMITS.notes), currency: currencySchema, status: quoteStatusSchema, issuerSnapshot: snapshot, clientSnapshot, issuedAt: z.string().datetime(), validFrom: z.string().date(), validUntil: z.string().date(), items: boundedArray(quoteItemSchema, DATA_LIMITS.maxQuoteItems), createdAt: z.string().datetime(), updatedAt: z.string().datetime(), schemaVersion: z.literal(DATA_SCHEMA_VERSION) }).strict().refine(({ validFrom, validUntil }) => validFrom <= validUntil, { message: 'validUntil must be on or after validFrom', path: ['validUntil'] })
export const backupPayloadSchema = z.object({ format: z.literal('cotiza-backup'), schemaVersion: z.literal(DATA_SCHEMA_VERSION), exportedAt: z.string().datetime(), businessProfile: businessProfileSchema.optional(), clients: boundedArray(clientSchema, DATA_LIMITS.maxBackupClients), quotes: boundedArray(quoteSchema, DATA_LIMITS.maxBackupQuotes), settings: z.object({ theme: z.enum(['light', 'dark', 'system']).optional() }).strict().optional() }).strict()
