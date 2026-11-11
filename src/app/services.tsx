import { createContext, useContext, type ReactNode } from 'react'
import type { BusinessProfile } from '@/domain/models'
import type { BackupService, ClientService, PdfService, ProfileService, QuoteService } from '@/services/contracts'
import { backupService } from '@/services/backup'
import { dexieClientService, dexieProfileService, dexieQuoteService } from '@/services/dexie'
import { pdfService } from '@/services/pdf'

/**
 * Punto único de inyección de servicios para la UI.
 * Los componentes dependen de los contratos de `src/services/contracts.ts`;
 * hoy se conectan los adaptadores en memoria y, en una tarea posterior, se
 * podrán sustituir por adaptadores Dexie sin tocar la interfaz.
 */
export interface AppServices {
  quotes: QuoteService
  clients: ClientService
  profile: ProfileService
  backup?: BackupService
  pdf?: PdfService
}

/**
 * `src/services/mocks.ts` no incluye un ProfileService. Este adaptador en
 * memoria implementa el contrato existente sin modificarlo.
 */
export function createInMemoryProfileService(seed?: BusinessProfile): ProfileService {
  let current = seed
  return {
    async get() {
      return current
    },
    async save(profile) {
      current = profile
      return profile
    },
  }
}

export const defaultServices: AppServices = { quotes: dexieQuoteService, clients: dexieClientService, profile: dexieProfileService, backup: backupService, pdf: pdfService }

const ServicesContext = createContext<AppServices>(defaultServices)

export function ServicesProvider({ services = defaultServices, children }: { services?: AppServices; children: ReactNode }) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
}

export const useServices = () => useContext(ServicesContext)
