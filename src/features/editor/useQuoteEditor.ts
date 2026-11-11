import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BusinessProfile, BusinessProfileSnapshot, Client, ClientSnapshot, Quote, QuoteItem } from '@/domain/models'
import { useServices } from '@/app/services'
import {
  buildClientFromSnapshot,
  clientToSnapshot,
  createDraftQuote,
  createEmptyItem,
  itemForCalculation,
  newId,
  nextQuoteNumber,
  snapshotToProfile,
  validateProfile,
  validateQuote,
  type FieldErrors,
} from '@/features/quotes/draft'

export const NEW_CLIENT = '__new__'

type LoadState = { status: 'loading' } | { status: 'error'; error: Error } | { status: 'not-found' } | { status: 'ready' }

export type SaveResult = { ok: true; quote: Quote; createdClient?: Client } | { ok: false; errors: FieldErrors }

/**
 * Estado y casos de uso del editor. La vista solo lee este estado y llama
 * acciones; toda la validación y persistencia pasan por aquí y por los
 * contratos de servicios.
 */
export function useQuoteEditor(quoteId?: string) {
  const services = useServices()
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [quote, setQuote] = useState<Quote>()
  const [baseline, setBaseline] = useState<string>('')
  const [clients, setClients] = useState<Client[]>([])
  const [otherNumbers, setOtherNumbers] = useState<string[]>([])
  const [profile, setProfile] = useState<BusinessProfile>()
  const [clientChoice, setClientChoice] = useState<string>(NEW_CLIENT)
  const [saveAsProfile, setSaveAsProfile] = useState(true)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [isNew, setIsNew] = useState(!quoteId)
  const attempt = useRef(0)
  const quoteRef = useRef<Quote | undefined>(undefined)
  quoteRef.current = quote

  const initialize = useCallback(async () => {
    const id = ++attempt.current
    setLoad({ status: 'loading' })
    try {
      const [allQuotes, allClients, currentProfile] = await Promise.all([services.quotes.list(), services.clients.list(), services.profile.get()])
      let loaded: Quote | undefined
      if (quoteId) {
        loaded = await services.quotes.get(quoteId)
        if (!loaded) {
          if (id === attempt.current) setLoad({ status: 'not-found' })
          return
        }
        loaded = structuredClone(loaded)
      } else {
        loaded = createDraftQuote({ number: nextQuoteNumber(allQuotes), profile: currentProfile })
      }
      if (id !== attempt.current) return
      const sortedClients = [...allClients].sort((a, b) => a.name.localeCompare(b.name, 'es'))
      setClients(sortedClients)
      setOtherNumbers(allQuotes.filter((q) => q.id !== loaded.id).map((q) => q.number))
      setProfile(currentProfile)
      setQuote(loaded)
      setBaseline(JSON.stringify(loaded))
      setClientChoice(sortedClients.some((c) => c.id === loaded.clientId) ? loaded.clientId : NEW_CLIENT)
      setErrors({})
      setLoad({ status: 'ready' })
    } catch (error) {
      if (id === attempt.current) setLoad({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) })
    }
  }, [quoteId, services])

  useEffect(() => {
    void initialize()
  }, [initialize])

  const clearErrors = useCallback((...keys: string[]) => {
    setErrors((prev) => {
      if (!keys.some((key) => key in prev)) return prev
      const next = { ...prev }
      for (const key of keys) delete next[key]
      return next
    })
  }, [])

  const update = useCallback((patch: Partial<Pick<Quote, 'number' | 'title' | 'notes' | 'currency' | 'status' | 'issuedAt' | 'validFrom' | 'validUntil'>>) => {
    setQuote((prev) => (prev ? { ...prev, ...patch } : prev))
    clearErrors(...Object.keys(patch), ...(patch.validFrom ? ['validUntil'] : []))
  }, [clearErrors])

  const updateIssuer = useCallback((patch: Partial<BusinessProfileSnapshot>) => {
    setQuote((prev) => (prev ? { ...prev, issuerSnapshot: { ...prev.issuerSnapshot, ...patch } } : prev))
    clearErrors(...Object.keys(patch).map((key) => `issuerSnapshot.${key}`))
  }, [clearErrors])

  const updateClient = useCallback((patch: Partial<ClientSnapshot>) => {
    setQuote((prev) => (prev ? { ...prev, clientSnapshot: { ...prev.clientSnapshot, ...patch } } : prev))
    clearErrors(...Object.keys(patch).map((key) => `clientSnapshot.${key}`))
  }, [clearErrors])

  const selectClient = useCallback((choice: string) => {
    setClientChoice(choice)
    clearErrors('clientId', 'clientSnapshot.name', 'clientSnapshot.email')
    if (choice === NEW_CLIENT) {
      setQuote((prev) => (prev ? { ...prev, clientId: '', clientSnapshot: { name: '' } } : prev))
      return
    }
    const client = clients.find((c) => c.id === choice)
    if (client) setQuote((prev) => (prev ? { ...prev, clientId: client.id, clientSnapshot: clientToSnapshot(client) } : prev))
  }, [clients, clearErrors])

  const addItem = useCallback(() => {
    const item = createEmptyItem()
    setQuote((prev) => (prev ? { ...prev, items: [...prev.items, item] } : prev))
    clearErrors('items')
    return item.id
  }, [clearErrors])

  const updateItem = useCallback((id: string, patch: Partial<QuoteItem>) => {
    const index = quoteRef.current?.items.findIndex((item) => item.id === id) ?? -1
    if (index >= 0) clearErrors(...Object.keys(patch).map((key) => `items.${index}.${key}`))
    setQuote((prev) => (prev ? { ...prev, items: prev.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) } : prev))
  }, [clearErrors])

  const removeItem = useCallback((id: string) => {
    setQuote((prev) => (prev ? { ...prev, items: prev.items.filter((item) => item.id !== id) } : prev))
    // Los índices cambian: se descartan los errores de líneas para no señalar la fila equivocada.
    setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith('items.'))))
  }, [])

  const duplicateItem = useCallback((id: string) => {
    setQuote((prev) => {
      if (!prev) return prev
      const index = prev.items.findIndex((item) => item.id === id)
      if (index < 0) return prev
      const items = [...prev.items]
      items.splice(index + 1, 0, { ...prev.items[index], id: newId() })
      return { ...prev, items }
    })
  }, [])

  const totals = useMemo(() => (quote ? services.quotes.calculateTotals({ ...quote, items: quote.items.map(itemForCalculation) }) : undefined), [quote, services.quotes])

  const dirty = useMemo(() => Boolean(quote) && JSON.stringify(quote) !== baseline, [quote, baseline])
  const numberTaken = useMemo(() => Boolean(quote?.number.trim()) && otherNumbers.includes(quote!.number.trim()), [quote, otherNumbers])
  const isNewClient = clientChoice === NEW_CLIENT

  const save = useCallback(async (): Promise<SaveResult> => {
    if (!quote) return { ok: false, errors: {} }
    const now = new Date().toISOString()

    const quoteCheck = validateQuote(quote, { requireClientId: !isNewClient })
    const clientCheck = isNewClient ? buildClientFromSnapshot(quote.clientSnapshot) : undefined
    const allErrors: FieldErrors = { ...(quoteCheck.ok ? {} : quoteCheck.errors), ...(clientCheck && !clientCheck.ok ? clientCheck.errors : {}) }
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      return { ok: false, errors: allErrors }
    }
    if (!quoteCheck.ok) return { ok: false, errors: {} }

    setSaving(true)
    try {
      let createdClient: Client | undefined
      if (clientCheck?.ok) {
        createdClient = await services.clients.save(clientCheck.value)
      }
      const toSave: Quote = { ...quoteCheck.value, clientId: createdClient?.id ?? quoteCheck.value.clientId, updatedAt: now }
      const saved = await services.quotes.save(toSave)

      if (!profile && saveAsProfile) {
        const candidate = validateProfile(snapshotToProfile(saved.issuerSnapshot))
        if (candidate.ok) setProfile(await services.profile.save(candidate.value))
      }

      if (createdClient) {
        const created = createdClient
        setClients((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'es')))
        setClientChoice(created.id)
      }
      setQuote(saved)
      setBaseline(JSON.stringify(saved))
      setIsNew(false)
      setErrors({})
      return { ok: true, quote: saved, createdClient }
    } finally {
      setSaving(false)
    }
  }, [quote, isNewClient, services, profile, saveAsProfile])

  return {
    load,
    reload: initialize,
    quote,
    totals,
    clients,
    profile,
    clientChoice,
    isNewClient,
    saveAsProfile,
    setSaveAsProfile,
    errors,
    saving,
    dirty,
    isNew,
    numberTaken,
    update,
    updateIssuer,
    updateClient,
    selectClient,
    addItem,
    updateItem,
    removeItem,
    duplicateItem,
    save,
  }
}

export type QuoteEditor = ReturnType<typeof useQuoteEditor>
