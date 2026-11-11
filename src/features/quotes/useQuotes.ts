import { useCallback } from 'react'
import type { Quote, QuoteStatus } from '@/domain/models'
import { useServices } from '@/app/services'
import { useAsync } from '@/hooks/useAsync'
import { byUpdatedDesc, duplicateQuote, nextQuoteNumber } from './draft'

/** Listado de cotizaciones y acciones contextuales sobre ellas. */
export function useQuotes() {
  const { quotes: service } = useServices()
  const state = useAsync(async () => (await service.list()).sort(byUpdatedDesc), [service])
  const { reload } = state

  const remove = useCallback(async (id: string) => {
    await service.remove(id)
    await reload()
  }, [service, reload])

  const setStatus = useCallback(async (quote: Quote, status: QuoteStatus) => {
    await service.save({ ...quote, status, updatedAt: new Date().toISOString() })
    await reload()
  }, [service, reload])

  const duplicate = useCallback(async (quote: Quote) => {
    const all = await service.list()
    const copy = duplicateQuote(quote, nextQuoteNumber(all))
    await service.save(copy)
    await reload()
    return copy
  }, [service, reload])

  return { ...state, remove, setStatus, duplicate, totals: service.calculateTotals }
}
