import type { CotizaDatabase } from '@/db/database'
import { database } from '@/db/database'
import { backupPayloadSchema } from '@/domain/schemas'
import { type BackupPayload, DATA_SCHEMA_VERSION } from '@/domain/models'
import type { BackupService } from './contracts'

export const BACKUP_FORMAT = 'cotiza-backup' as const
export const MAX_BACKUP_FILE_BYTES = 10 * 1024 * 1024

export interface BackupSummary { exportedAt: string; schemaVersion: number; profile: boolean; clients: number; quotes: number; items: number; settings: boolean }

export class BackupValidationError extends Error {
  constructor(message: string) { super(message); this.name = 'BackupValidationError' }
}

function uniqueIds(values: string[], label: string) {
  if (new Set(values).size !== values.length) throw new BackupValidationError(`El respaldo contiene identificadores duplicados en ${label}.`)
}

/** Valida y normaliza un respaldo sin ejecutar nada incluido en él. */
export function validateBackupPayload(input: unknown): BackupPayload {
  const result = backupPayloadSchema.safeParse(input)
  if (!result.success) throw new BackupValidationError('El respaldo no cumple la estructura compatible de Cotiza.')
  const payload = result.data as BackupPayload
  uniqueIds(payload.clients.map((client) => client.id), 'clientes')
  uniqueIds(payload.quotes.map((quote) => quote.id), 'cotizaciones')
  const clientIds = new Set(payload.clients.map((client) => client.id))
  for (const quote of payload.quotes) {
    if (!clientIds.has(quote.clientId)) throw new BackupValidationError(`La cotización ${quote.number} referencia un cliente inexistente.`)
    uniqueIds(quote.items.map((item) => item.id), `partidas de la cotización ${quote.number}`)
  }
  return structuredClone(payload)
}

export function summarizeBackup(payload: BackupPayload): BackupSummary {
  return { exportedAt: payload.exportedAt, schemaVersion: payload.schemaVersion, profile: Boolean(payload.businessProfile), clients: payload.clients.length, quotes: payload.quotes.length, items: payload.quotes.reduce((total, quote) => total + quote.items.length, 0), settings: Boolean(payload.settings) }
}

async function readFileText(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer el archivo.'))
    reader.readAsText(file)
  })
}

function readTheme(): BackupPayload['settings'] {
  try {
    const theme = localStorage.getItem('cotiza:theme')
    return theme === 'light' || theme === 'dark' || theme === 'system' ? { theme } : undefined
  } catch { return undefined }
}

export async function parseBackupFile(file: File): Promise<BackupPayload> {
  if (file.size > MAX_BACKUP_FILE_BYTES) throw new BackupValidationError('El archivo supera el límite de 10 MB.')
  let parsed: unknown
  try { parsed = JSON.parse(await readFileText(file)) } catch { throw new BackupValidationError('El archivo no contiene JSON válido.') }
  return validateBackupPayload(parsed)
}

export class DexieBackupService implements BackupService {
  constructor(private readonly db: CotizaDatabase = database) {}

  async create(): Promise<BackupPayload> {
    const [profiles, clients, quotes] = await Promise.all([this.db.profiles.toArray(), this.db.clients.toArray(), this.db.quotes.toArray()])
    const payload = validateBackupPayload({ format: BACKUP_FORMAT, schemaVersion: DATA_SCHEMA_VERSION, exportedAt: new Date().toISOString(), businessProfile: profiles[0], clients, quotes, settings: readTheme() })
    return payload
  }

  async restore(input: BackupPayload): Promise<void> {
    const payload = validateBackupPayload(input)
    await this.db.transaction('rw', this.db.profiles, this.db.clients, this.db.quotes, async () => {
      await this.db.profiles.clear()
      await this.db.clients.clear()
      await this.db.quotes.clear()
      if (payload.businessProfile) await this.db.profiles.put(payload.businessProfile)
      if (payload.clients.length) await this.db.clients.bulkPut(payload.clients)
      if (payload.quotes.length) await this.db.quotes.bulkPut(payload.quotes)
    })
    if (payload.settings?.theme) {
      try { localStorage.setItem('cotiza:theme', payload.settings.theme) } catch { /* la restauración de datos no depende de localStorage */ }
    }
  }
}

export const backupService = new DexieBackupService()
