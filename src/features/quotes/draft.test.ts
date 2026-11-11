import { describe, expect, it } from 'vitest'
import { mockQuote } from '@/services/mocks'
import { buildClientFromSnapshot, createDraftQuote, duplicateQuote, itemForCalculation, nextQuoteNumber, normalizeDecimalInput, validateProfile, validateQuote } from './draft'

describe('nextQuoteNumber', () => {
  it('continúa la numeración más alta', () => {
    expect(nextQuoteNumber([{ number: 'COT-0001' }, { number: 'COT-0009' }, { number: 'X' }])).toBe('COT-0010')
  })
  it('empieza en COT-0001 sin cotizaciones', () => {
    expect(nextQuoteNumber([])).toBe('COT-0001')
  })
})

describe('normalizeDecimalInput', () => {
  it.each([
    ['1500000', '1500000'],
    ['1.000.000', '1000000'],
    ['1.500', '1500'],
    ['1.500,5', '1500.5'],
    ['1.500,555', '1500.55'],
    ['12,345', '12.34'],
    ['99.9', '99.9'],
    ['99.90', '99.90'],
    ['1.000.00', '1000.00'],
    ['$ 2.500', '2500'],
    [',5', '0.5'],
    ['19.', '19.'],
  ])('%s → %s', (raw, expected) => {
    expect(normalizeDecimalInput(raw)).toBe(expected)
  })
})

describe('itemForCalculation', () => {
  it('convierte valores incompletos en importes calculables', () => {
    const item = itemForCalculation({ id: 'x', description: '', quantity: Number.NaN, unitPrice: '', discountPercent: '10.', taxPercent: 'abc' })
    expect(item).toMatchObject({ quantity: 0, unitPrice: '0', discountPercent: '10', taxPercent: '0' })
  })
})

describe('validateQuote', () => {
  it('acepta la cotización de ejemplo', () => {
    expect(validateQuote(mockQuote).ok).toBe(true)
  })

  it('devuelve errores en español por campo para un borrador vacío', () => {
    const draft = createDraftQuote({ number: 'COT-0002' })
    const result = validateQuote(draft)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.title).toBe('Este campo es obligatorio.')
    expect(result.errors.clientId).toMatch(/cliente/)
    expect(result.errors['clientSnapshot.name']).toBeDefined()
    expect(result.errors['issuerSnapshot.legalName']).toBeDefined()
    expect(result.errors['items.0.description']).toBeDefined()
    expect(result.errors['items.0.unitPrice']).toBe('Escribe un precio válido.')
  })

  it('rechaza una vigencia invertida', () => {
    const result = validateQuote({ ...mockQuote, validFrom: '2026-05-10', validUntil: '2026-05-01' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.validUntil).toMatch(/vigencia/)
  })

  it('convierte campos opcionales vacíos en undefined', () => {
    const result = validateQuote({ ...mockQuote, notes: '   ', clientSnapshot: { ...mockQuote.clientSnapshot, email: '' } })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.notes).toBeUndefined()
      expect(result.value.clientSnapshot.email).toBeUndefined()
    }
  })

  it('exige al menos una línea', () => {
    const result = validateQuote({ ...mockQuote, items: [] })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.items).toBeDefined()
  })
})

describe('duplicateQuote', () => {
  it('crea una copia en borrador con nuevos identificadores', () => {
    const copy = duplicateQuote({ ...mockQuote, status: 'accepted' }, 'COT-0002')
    expect(copy.id).not.toBe(mockQuote.id)
    expect(copy.number).toBe('COT-0002')
    expect(copy.status).toBe('draft')
    expect(copy.items[0].id).not.toBe(mockQuote.items[0].id)
    expect(copy.clientSnapshot).toEqual(mockQuote.clientSnapshot)
  })
})

describe('buildClientFromSnapshot / validateProfile', () => {
  it('crea un cliente válido desde el snapshot', () => {
    const result = buildClientFromSnapshot({ name: '  Café La Montaña ', email: '' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toMatchObject({ name: 'Café La Montaña', email: undefined, schemaVersion: 1 })
  })
  it('señala correos inválidos con prefijo de snapshot', () => {
    const result = buildClientFromSnapshot({ name: 'Ana', email: 'no-es-correo' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors['clientSnapshot.email']).toBe('Escribe un correo válido.')
  })
  it('valida el perfil del negocio', () => {
    const result = validateProfile({ id: crypto.randomUUID(), legalName: 'Estudio', logoUrl: 'no-url', schemaVersion: 1 })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.logoUrl).toMatch(/URL/)
  })
})
