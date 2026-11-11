import { describe, expect, it } from 'vitest'
import { addDays, dateInputToInstant, daysUntil, formatDate, formatMoney, instantToDateInput } from './format'

describe('formatMoney', () => {
  it('formatea COP con separador de miles colombiano', () => {
    expect(formatMoney('1785000.00', 'COP')).toBe('$ 1.785.000')
  })
  it('conserva decimales significativos en COP', () => {
    expect(formatMoney('1234.5', 'COP')).toBe('$ 1.234,5')
  })
  it('formatea USD con dos decimales', () => {
    expect(formatMoney('99.9', 'USD')).toBe('USD 99,90')
  })
  it('no pierde precisión con importes grandes', () => {
    expect(formatMoney('12345678901234567.89', 'COP')).toBe('$ 12.345.678.901.234.567,89')
  })
  it('tolera valores inválidos', () => {
    expect(formatMoney('abc', 'COP')).toBe('$ 0')
  })
})

describe('fechas', () => {
  it('formatea fechas ISO sin desfase de zona horaria', () => {
    expect(formatDate('2026-12-31')).toBe('31 dic 2026')
    expect(formatDate('2026-01-01', 'long')).toBe('1 enero 2026')
  })
  it('convierte entre input de fecha e instante', () => {
    expect(instantToDateInput(dateInputToInstant('2026-03-15'))).toBe('2026-03-15')
  })
  it('suma días y calcula días restantes', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02')
    expect(daysUntil('2026-02-02', '2026-01-30')).toBe(3)
    expect(daysUntil('2026-01-29', '2026-01-30')).toBe(-1)
  })
})
