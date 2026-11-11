export type Currency = 'COP' | 'USD'
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
export type UUID = string
export const DATA_SCHEMA_VERSION = 1 as const
export type RoundingMode = 'half-up'

export interface BusinessProfile { id: UUID; legalName: string; taxId?: string; email?: string; phone?: string; address?: string; logoUrl?: string; schemaVersion: typeof DATA_SCHEMA_VERSION }
export interface BusinessProfileSnapshot { legalName: string; taxId?: string; email?: string; phone?: string; address?: string; logoUrl?: string }
export interface Client { id: UUID; name: string; email?: string; phone?: string; taxId?: string; address?: string; createdAt: string; updatedAt: string; schemaVersion: typeof DATA_SCHEMA_VERSION }
export interface ClientSnapshot { name: string; email?: string; phone?: string; taxId?: string; address?: string }
export interface QuoteItem { id: UUID; description: string; quantity: number; unitPrice: string; discountPercent: string; taxPercent: string }
export interface Quote { id: UUID; number: string; clientId: UUID; title: string; notes?: string; currency: Currency; status: QuoteStatus; issuerSnapshot: BusinessProfileSnapshot; clientSnapshot: ClientSnapshot; issuedAt: string; validFrom: string; validUntil: string; items: QuoteItem[]; createdAt: string; updatedAt: string; schemaVersion: typeof DATA_SCHEMA_VERSION }
export interface QuoteTotals { subtotal: string; discount: string; tax: string; total: string }
export interface BackupPayload { format: 'cotiza-backup'; schemaVersion: typeof DATA_SCHEMA_VERSION; exportedAt: string; businessProfile?: BusinessProfile; clients: Client[]; quotes: Quote[] }
