import { describe, expect, it } from 'vitest'
import Decimal from 'decimal.js'
import { calculateItem, calculateQuoteTotals, roundMoney } from '@/domain/calculations'
import { formatMoney } from '@/features/quotes/format'
import { itemForCalculation, normalizeDecimalInput } from '@/features/quotes/draft'
import type { QuoteItem } from '@/domain/models'

describe('Pruebas financieras - Cotiza 1.0', () => {
  describe('Formato monetario COP', () => {
    it('formatea números enteros con separador de miles colombiano', () => {
      expect(formatMoney('1500000', 'COP')).toBe('$ 1.500.000')
      expect(formatMoney('0', 'COP')).toBe('$ 0')
      expect(formatMoney('25000000', 'COP')).toBe('$ 25.000.000')
    })

    it('formatea decimales significativos en COP cuando existen', () => {
      expect(formatMoney('1500.50', 'COP')).toBe('$ 1.500,5')
      expect(formatMoney('1234.56', 'COP')).toBe('$ 1.234,56')
    })

    it('formatea USD con dos decimales fijos según convención', () => {
      expect(formatMoney('1500', 'USD')).toBe('USD 1.500,00')
      expect(formatMoney('99.9', 'USD')).toBe('USD 99,90')
    })
  })

  describe('Cantidades decimales y cálculo de partidas', () => {
    it('calcula correctamente servicios con cantidades fraccionarias (ej. 2.5 horas)', () => {
      const item: QuoteItem = {
        id: '1',
        description: 'Consultoría técnica',
        quantity: 2.5,
        unitPrice: '180000',
        discountPercent: '0',
        taxPercent: '19',
      }
      const result = calculateItem(item)
      // Bruto: 2.5 * 180000 = 450000.00
      expect(result.gross).toBe('450000.00')
      expect(result.discount).toBe('0.00')
      expect(result.net).toBe('450000.00')
      // IVA 19%: 450000 * 0.19 = 85500.00
      expect(result.tax).toBe('85500.00')
      // Total: 450000 + 85500 = 535500.00
      expect(result.total).toBe('535500.00')
    })

    it('maneja cantidades muy pequeñas sin desbordamiento ni NaN', () => {
      const item: QuoteItem = {
        id: '2',
        description: 'Fracción de insumo',
        quantity: 0.125,
        unitPrice: '10000',
        discountPercent: '0',
        taxPercent: '0',
      }
      const result = calculateItem(item)
      expect(result.gross).toBe('1250.00')
      expect(result.total).toBe('1250.00')
    })
  })

  describe('Descuentos e IVA colombiano', () => {
    it('aplica el descuento sobre el valor bruto ANTES del IVA', () => {
      const item: QuoteItem = {
        id: '3',
        description: 'Desarrollo web',
        quantity: 1,
        unitPrice: '100000',
        discountPercent: '10', // 10% descuento -> 10000
        taxPercent: '19',      // 19% IVA sobre 90000 -> 17100
      }
      const result = calculateItem(item)
      expect(result.gross).toBe('100000.00')
      expect(result.discount).toBe('10000.00')
      expect(result.net).toBe('90000.00')
      expect(result.tax).toBe('17100.00')
      expect(result.total).toBe('107100.00')
    })

    it('soporta 100% de descuento (servicio de cortesía comercial)', () => {
      const item: QuoteItem = {
        id: '4',
        description: 'Capacitación cortesía',
        quantity: 5,
        unitPrice: '200000',
        discountPercent: '100',
        taxPercent: '19',
      }
      const result = calculateItem(item)
      expect(result.gross).toBe('1000000.00')
      expect(result.discount).toBe('1000000.00')
      expect(result.net).toBe('0.00')
      expect(result.tax).toBe('0.00')
      expect(result.total).toBe('0.00')
    })

    it('calcula totales agregados en cotizaciones con múltiples partidas y diferentes tarifas', () => {
      const items: QuoteItem[] = [
        { id: '1', description: 'Producto A (IVA 19%)', quantity: 2, unitPrice: '50000', discountPercent: '5', taxPercent: '19' },
        { id: '2', description: 'Servicio B (Exento 0%)', quantity: 1, unitPrice: '120000', discountPercent: '0', taxPercent: '0' },
      ]
      // Item 1: gross = 100000, desc = 5000, net = 95000, tax 19% = 18050, total = 113050
      // Item 2: gross = 120000, desc = 0, net = 120000, tax 0% = 0, total = 120000
      const totals = calculateQuoteTotals(items)
      expect(totals.subtotal).toBe('220000.00')
      expect(totals.discount).toBe('5000.00')
      expect(totals.tax).toBe('18050.00')
      expect(totals.total).toBe('233050.00')
    })
  })

  describe('Redondeo Half-Up', () => {
    it('redondea .x05 hacia arriba (.x1) y .x04 hacia abajo (.x0)', () => {
      expect(roundMoney(new Decimal('10.125'))).toBe('10.13')
      expect(roundMoney(new Decimal('10.124'))).toBe('10.12')
      expect(roundMoney(new Decimal('0.005'))).toBe('0.01')
      expect(roundMoney(new Decimal('0.004'))).toBe('0.00')
    })
  })

  describe('Valores inválidos y resiliencia de entrada', () => {
    it('itemForCalculation sanea precios y cantidades inválidas para evitar NaN', () => {
      const corrupted: QuoteItem = {
        id: 'bad',
        description: 'Test',
        quantity: -5,
        unitPrice: 'invalid-price',
        discountPercent: '999%',
        taxPercent: '',
      }
      const safe = itemForCalculation(corrupted)
      expect(safe.quantity).toBe(0)
      expect(safe.unitPrice).toBe('0')
      expect(safe.discountPercent).toBe('0')
      expect(safe.taxPercent).toBe('0')

      const result = calculateItem(safe)
      expect(result.total).toBe('0.00')
    })
  })

  describe('Coherencia de totales entre Editor y Partidas', () => {
    it('verifica si la suma de los totales de cada línea coincide exactamente con el total de cotización', () => {
      // Caso con decimales periódicos para evaluar redondeos independientes
      const items: QuoteItem[] = [
        { id: '1', description: 'Item 1', quantity: 3, unitPrice: '33.33', discountPercent: '10', taxPercent: '19' },
        { id: '2', description: 'Item 2', quantity: 7, unitPrice: '14.28', discountPercent: '5', taxPercent: '19' },
      ]
      const line1 = calculateItem(items[0])
      const line2 = calculateItem(items[1])
      const totals = calculateQuoteTotals(items)

      const sumLineTotals = new Decimal(line1.total).plus(line2.total).toFixed(2)
      // Registramos la coherencia
      expect(totals.total).toBe(sumLineTotals)
    })
  })
})

