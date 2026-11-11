import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { database } from '@/db/database'
import { DATA_SCHEMA_VERSION, type BackupPayload, type Client, type Quote } from '@/domain/models'
import { BackupValidationError, DexieBackupService, MAX_BACKUP_FILE_BYTES, parseBackupFile, validateBackupPayload } from './backup'

const client: Client = { id: '11111111-1111-4111-8111-111111111111', name: 'Café “La Montaña”', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', schemaVersion: DATA_SCHEMA_VERSION }
const quote: Quote = { id: '22222222-2222-4222-8222-222222222222', number: 'COT-0001', clientId: client.id, title: 'Diseño ñandú €', currency: 'COP', status: 'draft', issuerSnapshot: { legalName: 'Negocio Ágil' }, clientSnapshot: { name: client.name }, issuedAt: '2026-01-01T00:00:00.000Z', validFrom: '2026-01-01', validUntil: '2026-12-31', items: [{ id: '33333333-3333-4333-8333-333333333333', description: 'Ítem — especial', quantity: 1, unitPrice: '1000', discountPercent: '0', taxPercent: '19' }], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', schemaVersion: DATA_SCHEMA_VERSION }
const payload: BackupPayload = { format: 'cotiza-backup', schemaVersion: DATA_SCHEMA_VERSION, exportedAt: '2026-02-01T00:00:00.000Z', clients: [client], quotes: [quote], settings: { theme: 'dark' } }

beforeEach(async () => { await database.delete(); await database.open() })
afterEach(async () => { await database.delete() })

describe('BackupService', () => {
  it('exporta e importa datos válidos conservando relaciones y caracteres especiales', async () => {
    const service = new DexieBackupService()
    await database.clients.put(client)
    await database.quotes.put(quote)
    const exported = await service.create()
    expect(exported).toMatchObject({ format: 'cotiza-backup', schemaVersion: 1, clients: [client], quotes: [quote] })
    await service.restore(payload)
    expect(await database.clients.get(client.id)).toEqual(client)
    expect(await database.quotes.get(quote.id)).toEqual(quote)
    expect(localStorage.getItem('cotiza:theme')).toBe('dark')
  })

  it('rechaza JSON corrupto, versión incompatible y datos inválidos sin modificar IndexedDB', async () => {
    await database.clients.put(client)
    await expect(parseBackupFile(new File(['{ roto'], 'backup.json', { type: 'application/json' }))).rejects.toThrow('JSON válido')
    expect(() => validateBackupPayload({ ...payload, schemaVersion: 999 })).toThrow()
    expect(() => validateBackupPayload({ ...payload, clients: [{ ...client, email: 'no-es-correo' }] })).toThrow()
    expect(await database.clients.get(client.id)).toEqual(client)
  })

  it('rechaza colecciones sobredimensionadas y duplicados', async () => {
    const clients = Array.from({ length: 10_001 }, (_, index) => ({ ...client, id: `11111111-1111-4111-8111-${String(index).padStart(12, '0')}` }))
    expect(() => validateBackupPayload({ ...payload, clients })).toThrow(BackupValidationError)
    expect(() => validateBackupPayload({ ...payload, clients: [client, client] })).toThrow('duplicados')
    expect(() => validateBackupPayload({ ...payload, quotes: [{ ...quote, items: [quote.items[0], { ...quote.items[0] }] }] })).toThrow('duplicados')
  })

  it('permite repetir el identificador de una partida en cotizaciones diferentes y conserva ambas relaciones', async () => {
    const secondQuote = { ...quote, id: '44444444-4444-4444-8444-444444444444', number: 'COT-0002' }
    const compatiblePayload = { ...payload, quotes: [quote, secondQuote] }

    expect(validateBackupPayload(compatiblePayload).quotes).toHaveLength(2)
    await new DexieBackupService().restore(compatiblePayload)
    expect(await database.quotes.get(quote.id)).toEqual(quote)
    expect(await database.quotes.get(secondQuote.id)).toEqual(secondQuote)
  })

  it('rechaza un archivo por tamaño antes de leerlo', async () => {
    const file = new File(['x'.repeat(MAX_BACKUP_FILE_BYTES + 1)], 'large.json')
    await expect(parseBackupFile(file)).rejects.toThrow('10 MB')
  })

  it('permite cancelar después de analizar sin reemplazar hasta invocar restore explícitamente', async () => {
    await database.clients.put(client)
    const file = new File([JSON.stringify(payload)], 'backup.json', { type: 'application/json' })
    await parseBackupFile(file)
    expect(await database.clients.get(client.id)).toEqual(client)
    expect(await database.quotes.count()).toBe(0)
  })

  it('hace rollback y conserva los datos originales si falla la transacción', async () => {
    const original = { ...client, name: 'Original' }
    await database.clients.put(original)
    const fail = () => { throw new Error('fallo simulado') }
    database.quotes.hook('creating', fail)
    try {
      await expect(new DexieBackupService().restore(payload)).rejects.toThrow('fallo simulado')
    } finally { database.quotes.hook('creating').unsubscribe(fail) }
    expect(await database.clients.get(original.id)).toEqual(original)
    expect(await database.quotes.count()).toBe(0)
  })

  it('rechaza relaciones a clientes inexistentes antes de abrir la transacción', async () => {
    expect(() => validateBackupPayload({ ...payload, clients: [] })).toThrow('cliente inexistente')
  })
})
