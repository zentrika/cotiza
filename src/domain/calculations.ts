import Decimal from 'decimal.js'
import type { QuoteItem, QuoteTotals } from './models'

export const CALCULATION_RULES = { scale: 2, roundingMode: 'half-up', lineItemsRoundedBeforeAggregation: true } as const
export const roundMoney = (value: Decimal) => value.toDecimalPlaces(CALCULATION_RULES.scale, Decimal.ROUND_HALF_UP).toFixed(2)

export function calculateItem(item: QuoteItem) {
  const gross = new Decimal(String(item.quantity)).times(item.unitPrice)
  const discount = gross.times(item.discountPercent).div(100)
  const net = gross.minus(discount)
  const tax = net.times(item.taxPercent).div(100)
  return { gross: roundMoney(gross), discount: roundMoney(discount), net: roundMoney(net), tax: roundMoney(tax), total: roundMoney(net.plus(tax)) }
}

export function calculateQuoteTotals(items: QuoteItem[]): QuoteTotals {
  let subtotal = new Decimal(0); let discount = new Decimal(0); let tax = new Decimal(0)
  for (const item of items) { const result = calculateItem(item); subtotal = subtotal.plus(result.gross); discount = discount.plus(result.discount); tax = tax.plus(result.tax) }
  return { subtotal: roundMoney(subtotal), discount: roundMoney(discount), tax: roundMoney(tax), total: roundMoney(subtotal.minus(discount).plus(tax)) }
}
