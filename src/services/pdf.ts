import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { BusinessProfile, Client, Quote } from '@/domain/models'
import { calculateItem, calculateQuoteTotals } from '@/domain/calculations'
import { formatDate, formatMoney, instantToDateInput } from '@/features/quotes/format'
import { itemForCalculation } from '@/features/quotes/draft'
import { STATUS_META } from '@/features/quotes/status'
import type { PdfService } from './contracts'

const PAGE_WIDTH = 612
const PAGE_HEIGHT = 792
const MARGIN = 48
const INK = rgb(0.09, 0.1, 0.15)
const MUTED = rgb(0.36, 0.38, 0.44)
const BRAND_PRIMARY = rgb(0x2a / 255, 0x66 / 255, 0xff / 255)
const BRAND_SECONDARY = rgb(0x3b / 255, 0x82 / 255, 0xff / 255)
const BRAND_VIOLET = rgb(0x8b / 255, 0x5c / 255, 0xf6 / 255)
const LIGHT = rgb(0.9, 0.94, 1)

function safeText(value: string | undefined) { return value?.trim() || '' }
function fit(value: string, font: PDFFont, size: number, width: number) {
  if (font.widthOfTextAtSize(value, size) <= width) return value
  let result = value
  while (result.length > 1 && font.widthOfTextAtSize(`${result}...`, size) > width) result = result.slice(0, -1)
  return `${result}...`
}
function wrap(value: string, font: PDFFont, size: number, width: number) {
  const words = value.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) <= width) line = candidate
    else { if (line) lines.push(line); line = fit(word, font, size, width) }
  }
  if (line) lines.push(line)
  return lines.length ? lines : ['']
}
function right(page: PDFPage, value: string, x: number, y: number, font: PDFFont, size: number, color = INK) {
  page.drawText(value, { x: x - font.widthOfTextAtSize(value, size), y, size, font, color })
}
function line(page: PDFPage, x1: number, y: number, x2: number, color = LIGHT, thickness = 1) {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, color, thickness })
}

export async function generateQuotePdf(quote: Quote, profile: BusinessProfile, client: Client): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const money = (value: string) => formatMoney(value, quote.currency)
  const totals = calculateQuoteTotals(quote.items.map(itemForCalculation))
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = PAGE_HEIGHT - MARGIN

  const header = () => {
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 6, width: PAGE_WIDTH * 0.7, height: 6, color: BRAND_PRIMARY })
    page.drawRectangle({ x: PAGE_WIDTH * 0.7, y: PAGE_HEIGHT - 6, width: PAGE_WIDTH * 0.3, height: 6, color: BRAND_SECONDARY })
    page.drawText(safeText(profile.legalName) || 'Tu negocio', { x: MARGIN, y: PAGE_HEIGHT - 54, size: 18, font: bold, color: INK })
    const contact = [profile.taxId ? `NIT / C.C. ${profile.taxId}` : '', profile.address, profile.email, profile.phone].filter(Boolean).join('  |  ')
    if (contact) page.drawText(contact, { x: MARGIN, y: PAGE_HEIGHT - 72, size: 8.5, font: regular, color: MUTED })
    right(page, 'COTIZACIÓN', PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 48, bold, 9, BRAND_VIOLET)
    right(page, quote.number, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 67, bold, 14)
    right(page, `Emitida ${formatDate(instantToDateInput(quote.issuedAt))}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 85, regular, 8.5, MUTED)
    right(page, `Valida hasta ${formatDate(quote.validUntil)}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 99, regular, 8.5, MUTED)
  }
  const newPage = () => { page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]); y = PAGE_HEIGHT - MARGIN; header(); y -= 122 }
  const ensure = (height: number) => { if (y - height < MARGIN + 36) newPage() }
  header(); y -= 122

  page.drawText('PARA', { x: MARGIN, y, size: 8, font: bold, color: MUTED })
  page.drawText(safeText(client.name) || safeText(quote.clientSnapshot.name) || 'Cliente', { x: MARGIN, y: y - 18, size: 12, font: bold, color: INK })
  const clientLine = [client.taxId ? `NIT / C.C. ${client.taxId}` : quote.clientSnapshot.taxId ? `NIT / C.C. ${quote.clientSnapshot.taxId}` : '', client.address || quote.clientSnapshot.address, client.email || quote.clientSnapshot.email, client.phone || quote.clientSnapshot.phone].filter(Boolean).join('  |  ')
  if (clientLine) page.drawText(clientLine, { x: MARGIN, y: y - 33, size: 8.5, font: regular, color: MUTED })
  if (quote.title) { right(page, 'ASUNTO', PAGE_WIDTH - MARGIN, y, bold, 8, MUTED); right(page, fit(quote.title, regular, 10, 230), PAGE_WIDTH - MARGIN, y - 18, regular, 10) }
  y -= 70
  line(page, MARGIN, y, PAGE_WIDTH - MARGIN, LIGHT); y -= 24

  const cols = { description: MARGIN, qty: 338, unit: 405, discount: 464, tax: 505, total: PAGE_WIDTH - MARGIN }
  const drawTableHeader = () => {
    page.drawText('DESCRIPCION', { x: cols.description, y, size: 7.5, font: bold, color: MUTED })
    right(page, 'CANT.', cols.qty, y, bold, 7.5, MUTED); right(page, 'PRECIO UNIT.', cols.unit, y, bold, 7.5, MUTED); right(page, 'DESC.', cols.discount, y, bold, 7.5, MUTED); right(page, 'IMP.', cols.tax, y, bold, 7.5, MUTED); right(page, 'IMPORTE', cols.total, y, bold, 7.5, MUTED)
    y -= 9; line(page, MARGIN, y, PAGE_WIDTH - MARGIN, INK); y -= 18
  }
  drawTableHeader()
  for (const item of quote.items) {
    const safe = itemForCalculation(item); const calc = calculateItem(safe); const descLines = wrap(item.description || 'Sin descripcion', regular, 9, 260); const height = Math.max(25, descLines.length * 12) + 8
    const previousPage = page
    ensure(height)
    if (page !== previousPage) drawTableHeader()
    descLines.forEach((text, i) => page.drawText(text, { x: cols.description, y: y - i * 12, size: 9, font: regular, color: INK }))
    right(page, String(item.quantity), cols.qty, y, regular, 8.5); right(page, money(safe.unitPrice), cols.unit, y, regular, 8.5); right(page, Number(safe.discountPercent) ? `${safe.discountPercent}%` : '-', cols.discount, y, regular, 8.5, MUTED); right(page, Number(safe.taxPercent) ? `${safe.taxPercent}%` : '-', cols.tax, y, regular, 8.5, MUTED); right(page, money(calc.total), cols.total, y, regular, 8.5)
    y -= height; line(page, MARGIN, y, PAGE_WIDTH - MARGIN, LIGHT)
  }
  ensure(125); y -= 22
  const totalRows = [['Subtotal', money(totals.subtotal)], ['Descuentos', `- ${money(totals.discount)}`], ['Impuestos', money(totals.tax)]]
  for (const [label, value] of totalRows) { page.drawText(label, { x: PAGE_WIDTH - 220, y, size: 9, font: regular, color: MUTED }); right(page, value, PAGE_WIDTH - MARGIN, y, regular, 9); y -= 16 }
  line(page, PAGE_WIDTH - 220, y + 5, PAGE_WIDTH - MARGIN, INK, 1.5); y -= 5
  page.drawText('Total', { x: PAGE_WIDTH - 220, y, size: 11, font: bold, color: INK }); right(page, money(totals.total), PAGE_WIDTH - MARGIN, y, bold, 16, BRAND_PRIMARY); y -= 28
  if (quote.notes?.trim()) {
    const noteLines = wrap(quote.notes, regular, 8.5, PAGE_WIDTH - MARGIN * 2 - 20)
    const noteHeight = 30 + noteLines.length * 11
    ensure(noteHeight + 10)
    page.drawRectangle({ x: MARGIN, y: y - noteHeight + 8, width: PAGE_WIDTH - MARGIN * 2, height: noteHeight, color: rgb(0.97, 0.96, 0.94) })
    page.drawText('NOTAS Y CONDICIONES', { x: MARGIN + 10, y, size: 7.5, font: bold, color: MUTED }); y -= 14
    for (const text of noteLines) { page.drawText(text, { x: MARGIN + 10, y, size: 8.5, font: regular, color: INK }); y -= 11 }
  }
  const pages = pdf.getPages()
  pages.forEach((current, index) => { current.drawText(`Estado: ${STATUS_META[quote.status].label}`, { x: MARGIN, y: 25, size: 7.5, font: regular, color: MUTED }); right(current, `Cotiza - ${index + 1}/${pages.length}`, PAGE_WIDTH - MARGIN, 25, regular, 7.5, MUTED) })
  return pdf.save()
}

export const pdfService: PdfService = { generateQuote: generateQuotePdf }

export function downloadPdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
