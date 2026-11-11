import type { Table } from 'dexie'
import { database } from '@/db/database'
import { calculateQuoteTotals } from '@/domain/calculations'
import { businessProfileSchema, clientSchema, quoteSchema } from '@/domain/schemas'
import type { BusinessProfile, Client, Quote } from '@/domain/models'
import type { ClientService, ProfileService, QuoteService } from './contracts'

function validated<T>(result: { success: boolean; data?: T; error?: unknown }): T {
  if (!result.success) throw new Error(`Datos inválidos: ${String(result.error)}`)
  return result.data as T
}

function createRepository<T extends { id: string }>(table: Table<T, string>, schema: { safeParse(value: T): { success: boolean; data?: T; error?: unknown } }) {
  return {
    async list() { return (await table.toArray()).map((item) => structuredClone(validated(schema.safeParse(item)))) },
    async get(id: string) { const item = await table.get(id); return item ? structuredClone(validated(schema.safeParse(item))) : undefined },
    async save(entity: T) {
      const value = structuredClone(validated(schema.safeParse(entity)))
      await table.put(value)
      return structuredClone(value)
    },
    async remove(id: string) { await table.delete(id) },
  }
}

export const dexieClientService: ClientService = createRepository<Client>(database.clients, clientSchema)
export const dexieQuoteService: QuoteService = {
  ...createRepository<Quote>(database.quotes, quoteSchema),
  calculateTotals: (quote) => calculateQuoteTotals(quote.items),
}

export const dexieProfileService: ProfileService = {
  async get() {
    const profiles = await database.profiles.toArray()
    return profiles[0] ? structuredClone(validated(businessProfileSchema.safeParse(profiles[0]))) : undefined
  },
  async save(profile: BusinessProfile) {
    const value = structuredClone(validated(businessProfileSchema.safeParse(profile)))
    await database.transaction('rw', database.profiles, async () => {
      await database.profiles.clear()
      await database.profiles.put(value)
    })
    return structuredClone(value)
  },
}

export function createDexieServices() {
  return { quotes: dexieQuoteService, clients: dexieClientService, profile: dexieProfileService }
}
