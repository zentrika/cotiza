import type { BackupPayload, BusinessProfile, Client, Quote, QuoteTotals, UUID } from '@/domain/models'

export interface Repository<T extends { id: UUID }> { list(): Promise<T[]>; get(id: UUID): Promise<T | undefined>; save(entity: T): Promise<T>; remove(id: UUID): Promise<void> }
export interface ClientService extends Repository<Client> {}
export interface QuoteService extends Repository<Quote> { calculateTotals(quote: Quote): QuoteTotals }
export interface ProfileService { get(): Promise<BusinessProfile | undefined>; save(profile: BusinessProfile): Promise<BusinessProfile> }
export interface PdfService { generateQuote(quote: Quote, profile: BusinessProfile, client: Client): Promise<Uint8Array> }
export interface BackupService { create(): Promise<BackupPayload>; restore(payload: BackupPayload): Promise<void> }
