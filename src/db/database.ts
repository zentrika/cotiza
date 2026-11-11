import Dexie, { type Table } from 'dexie'
import type { BusinessProfile, Client, Quote } from '@/domain/models'

export class CotizaDatabase extends Dexie {
  clients!: Table<Client, string>
  quotes!: Table<Quote, string>
  profiles!: Table<BusinessProfile, string>

  constructor(name = 'cotiza') {
    super(name)
    this.version(1).stores({ clients: 'id, name, updatedAt', quotes: 'id, number, clientId, status, updatedAt' })
    this.version(2).stores({ clients: 'id, name, updatedAt', quotes: 'id, number, clientId, status, updatedAt', profiles: 'id' })
  }
}

export const database = new CotizaDatabase()
