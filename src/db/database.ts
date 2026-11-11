import Dexie, { type Table } from 'dexie'
import type { Client, Quote } from '@/domain/models'

export class CotizaDatabase extends Dexie { clients!: Table<Client, string>; quotes!: Table<Quote, string>
  constructor() { super('cotiza'); this.version(1).stores({ clients: 'id, name, updatedAt', quotes: 'id, number, clientId, status, updatedAt' }) }
}

export const database = new CotizaDatabase()
