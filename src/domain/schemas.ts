import { z } from 'zod'
import { DATA_SCHEMA_VERSION } from './models'

export const currencySchema = z.enum(['COP', 'USD'])
export const quoteStatusSchema = z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired'])
const uuid = z.string().uuid()
const decimal = z.string().regex(/^\d+(\.\d{1,2})?$/)
const snapshot = z.object({ legalName: z.string().min(1), taxId: z.string().optional(), email: z.string().email().optional(), phone: z.string().optional(), address: z.string().optional(), logoUrl: z.string().url().optional() })
const clientSnapshot = z.object({ name: z.string().min(1), email: z.string().email().optional(), phone: z.string().optional(), taxId: z.string().optional(), address: z.string().optional() })
export const businessProfileSchema = z.object({ id: uuid, legalName: z.string().min(1), taxId: z.string().optional(), email: z.string().email().optional(), phone: z.string().optional(), address: z.string().optional(), logoUrl: z.string().url().optional(), schemaVersion: z.literal(DATA_SCHEMA_VERSION) })
export const clientSchema = z.object({ id: uuid, name: z.string().min(1), email: z.string().email().optional(), phone: z.string().optional(), taxId: z.string().optional(), address: z.string().optional(), createdAt: z.string().datetime(), updatedAt: z.string().datetime(), schemaVersion: z.literal(DATA_SCHEMA_VERSION) })
export const quoteItemSchema = z.object({ id: uuid, description: z.string().min(1), quantity: z.number().positive(), unitPrice: decimal, discountPercent: decimal, taxPercent: decimal })
export const quoteSchema = z.object({ id: uuid, number: z.string().min(1), clientId: uuid, title: z.string().min(1), notes: z.string().optional(), currency: currencySchema, status: quoteStatusSchema, issuerSnapshot: snapshot, clientSnapshot, issuedAt: z.string().datetime(), validFrom: z.string().date(), validUntil: z.string().date(), items: z.array(quoteItemSchema), createdAt: z.string().datetime(), updatedAt: z.string().datetime(), schemaVersion: z.literal(DATA_SCHEMA_VERSION) }).refine(({ validFrom, validUntil }) => validFrom <= validUntil, { message: 'validUntil must be on or after validFrom', path: ['validUntil'] })
export const backupPayloadSchema = z.object({ format: z.literal('cotiza-backup'), schemaVersion: z.literal(DATA_SCHEMA_VERSION), exportedAt: z.string().datetime(), businessProfile: businessProfileSchema.optional(), clients: z.array(clientSchema), quotes: z.array(quoteSchema) })
