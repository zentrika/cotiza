import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { database } from '@/db/database'
import { DATA_SCHEMA_VERSION, type Client, type Quote } from '@/domain/models'
import { createDexieServices } from './dexie'

const client: Client = { id: '11111111-1111-4111-8111-111111111111', name: 'Cliente Persistente', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', schemaVersion: DATA_SCHEMA_VERSION }
const quote: Quote = { id: '22222222-2222-4222-8222-222222222222', number: 'COT-0099', clientId: client.id, title: 'Trabajo offline', currency: 'COP', status: 'draft', issuerSnapshot: { legalName: 'Negocio Local' }, clientSnapshot: { name: client.name }, issuedAt: '2026-01-01T00:00:00.000Z', validFrom: '2026-01-01', validUntil: '2026-01-31', items: [{ id: '33333333-3333-4333-8333-333333333333', description: 'Servicio', quantity: 1, unitPrice: '1000', discountPercent: '0', taxPercent: '19' }], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', schemaVersion: DATA_SCHEMA_VERSION }

beforeEach(async () => { await database.delete(); await database.open() })
afterEach(async () => { await database.delete() })

describe('servicios Dexie', () => {
  it('crea, actualiza, lista, elimina y conserva snapshots', async () => {
    const services = createDexieServices()
    await services.clients.save(client)
    await services.quotes.save(quote)
    const reopened = createDexieServices()
    expect(await reopened.quotes.get(quote.id)).toEqual(quote)
    expect((await reopened.quotes.list())[0].clientSnapshot.name).toBe('Cliente Persistente')
    await reopened.quotes.save({ ...quote, status: 'sent', updatedAt: '2026-01-02T00:00:00.000Z' })
    expect((await reopened.quotes.get(quote.id))?.status).toBe('sent')
    await reopened.quotes.remove(quote.id)
    expect(await reopened.quotes.get(quote.id)).toBeUndefined()
  })

  it('guarda un único perfil y rechaza entidades inválidas', async () => {
    const services = createDexieServices()
    const original = { id: '44444444-4444-4444-8444-444444444444', legalName: 'Mi negocio', schemaVersion: DATA_SCHEMA_VERSION } as const
    await services.profile.save(original)
    await services.profile.save({ id: '55555555-5555-4555-8555-555555555555', legalName: 'Mi negocio actualizado', schemaVersion: DATA_SCHEMA_VERSION })
    expect((await services.profile.get())?.legalName).toBe('Mi negocio actualizado')
    await expect(services.quotes.save({ ...quote, id: 'bad-id' })).rejects.toThrow('Datos inválidos')
    await expect(services.profile.save({ ...original, legalName: 'x'.repeat(161) })).rejects.toThrow('Datos inválidos')
    expect((await services.profile.get())?.legalName).toBe('Mi negocio actualizado')
  })
})
