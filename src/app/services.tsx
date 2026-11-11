import { createContext, useContext, type ReactNode } from 'react'
import type { BusinessProfile } from '@/domain/models'
import type { ClientService, ProfileService, QuoteService } from '@/services/contracts'
import { mockClientService, mockQuoteService } from '@/services/mocks'

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

export const defaultServices: AppServices = {
  quotes: mockQuoteService,
  clients: mockClientService,
  profile: createInMemoryProfileService(),
}

const ServicesContext = createContext<AppServices>(defaultServices)

export function ServicesProvider({ services = defaultServices, children }: { services?: AppServices; children: ReactNode }) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
}

export const useServices = () => useContext(ServicesContext)
