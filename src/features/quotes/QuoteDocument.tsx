import type { Quote, QuoteTotals } from '@/domain/models'
import { calculateItem } from '@/domain/calculations'
import { cn } from '@/lib/utils'
import { formatDate, formatMoney, instantToDateInput } from './format'
import { itemForCalculation } from './draft'
import { STATUS_META } from './status'

/**
 * Representación "en papel" de una cotización. Siempre usa colores de papel
 * (también en modo oscuro) porque representa el documento que verá el cliente.
 * Servirá como referencia visual para la futura generación de PDF.
 */
export function QuoteDocument({ quote, totals, className }: { quote: Quote; totals: QuoteTotals; className?: string }) {
  const { issuerSnapshot: issuer, clientSnapshot: client } = quote
  const money = (value: string) => formatMoney(value, quote.currency)
  const issuerContact = [issuer.email, issuer.phone].filter(Boolean)
  const clientContact = [client.email, client.phone].filter(Boolean)

  return (
    <article
      aria-label={`Vista previa de la cotización ${quote.number}`}
      className={cn('relative mx-auto w-full max-w-[794px] overflow-hidden rounded-sm bg-white text-[13px] leading-relaxed text-[#0f1729] shadow-paper ring-1 ring-black/5', className)}
    >
      <div aria-hidden className="h-1.5 bg-[linear-gradient(110deg,#2A66FF_0%,#2450EE_45%,#6366F1_78%,#8B5CF6_100%)]" />
      <div className="p-6 sm:p-10">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {issuer.logoUrl && <img src={issuer.logoUrl} alt="" className="mb-3 h-10 w-auto object-contain" referrerPolicy="no-referrer" />}
            <p className="font-display text-xl font-semibold tracking-tight">{issuer.legalName || 'Tu negocio'}</p>
            <div className="mt-1 space-y-0.5 text-[12px] text-[#5b6070]">
              {issuer.taxId && <p>NIT / C.C. {issuer.taxId}</p>}
              {issuer.address && <p>{issuer.address}</p>}
              {issuerContact.length > 0 && <p>{issuerContact.join(' · ')}</p>}
            </div>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#2450EE]">Cotización</p>
            <p className="mt-1 font-mono text-lg font-semibold tracking-tight">{quote.number || '—'}</p>
            <dl className="mt-2 grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 text-[12px] sm:justify-end">
              <dt className="text-[#5b6070]">Emitida</dt>
              <dd>{formatDate(instantToDateInput(quote.issuedAt))}</dd>
              <dt className="text-[#5b6070]">Válida hasta</dt>
              <dd>{formatDate(quote.validUntil)}</dd>
            </dl>
          </div>
        </header>

        <section className="mt-8 grid gap-6 border-y border-[#dfe5ee] py-5 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#5f6b7d]">Para</p>
            <p className="mt-1 text-[15px] font-semibold">{client.name || 'Cliente'}</p>
            <div className="mt-0.5 space-y-0.5 text-[12px] text-[#5b6070]">
              {client.taxId && <p>NIT / C.C. {client.taxId}</p>}
              {client.address && <p>{client.address}</p>}
              {clientContact.length > 0 && <p>{clientContact.join(' · ')}</p>}
            </div>
          </div>
          {quote.title && (
            <div className="sm:max-w-[260px] sm:text-right">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#5f6b7d]">Asunto</p>
              <p className="mt-1 font-medium">{quote.title}</p>
            </div>
          )}
        </section>

        <div className="focus-ring mt-6 overflow-x-auto rounded-sm" role="region" aria-label="Detalle de productos y servicios" tabIndex={0}>
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#0f1729] text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#5b6070]">
                <th scope="col" className="py-2 pr-3 font-semibold">Descripción</th>
                <th scope="col" className="px-2 py-2 text-right font-semibold">Cant.</th>
                <th scope="col" className="px-2 py-2 text-right font-semibold">Precio unit.</th>
                <th scope="col" className="px-2 py-2 text-right font-semibold">Desc.</th>
                <th scope="col" className="px-2 py-2 text-right font-semibold">Imp.</th>
                <th scope="col" className="py-2 pl-2 text-right font-semibold">Importe</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {quote.items.map((item) => {
                const safe = itemForCalculation(item)
                const line = calculateItem(safe)
                return (
                  <tr key={item.id} className="border-b border-[#e9edf3] align-top">
                    <td className="py-3 pr-3 font-medium">{item.description || <span className="text-[#64748b]">Sin descripción</span>}</td>
                    <td className="px-2 py-3 text-right">{item.quantity}</td>
                    <td className="px-2 py-3 text-right">{money(safe.unitPrice)}</td>
                    <td className="px-2 py-3 text-right text-[#5b6070]">{Number(safe.discountPercent) > 0 ? `${safe.discountPercent}%` : '—'}</td>
                    <td className="px-2 py-3 text-right text-[#5b6070]">{Number(safe.taxPercent) > 0 ? `${safe.taxPercent}%` : '—'}</td>
                    <td className="py-3 pl-2 text-right font-medium">{money(line.total)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <dl className="tabular w-full max-w-[280px] space-y-1.5 text-[13px]">
            <div className="flex justify-between gap-4"><dt className="text-[#5b6070]">Subtotal</dt><dd>{money(totals.subtotal)}</dd></div>
            {Number(totals.discount) > 0 && <div className="flex justify-between gap-4"><dt className="text-[#5b6070]">Descuentos</dt><dd>− {money(totals.discount)}</dd></div>}
            <div className="flex justify-between gap-4"><dt className="text-[#5b6070]">Impuestos</dt><dd>{money(totals.tax)}</dd></div>
            <div className="mt-2 flex items-baseline justify-between gap-4 border-t-2 border-[#0f1729] pt-2.5">
              <dt className="font-semibold">Total</dt>
              <dd className="font-display text-xl font-semibold">{money(totals.total)}</dd>
            </div>
            <p className="pt-1 text-right text-[11px] text-[#5f6b7d]">Valores en {quote.currency === 'COP' ? 'pesos colombianos (COP)' : 'dólares (USD)'}</p>
          </dl>
        </div>

        {quote.notes?.trim() && (
          <section className="mt-8 rounded-md bg-[#f3f6fa] p-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#5f6b7d]">Notas y condiciones</p>
            <p className="mt-1.5 whitespace-pre-line text-[12.5px] text-[#3b3f4c]">{quote.notes}</p>
          </section>
        )}

        <footer className="mt-10 flex items-center justify-between border-t border-[#e9edf3] pt-4 text-[10.5px] text-[#64748b]">
          <span>Estado: {STATUS_META[quote.status].label}</span>
          <span>Hecho con Cotiza · ZENTRIKA</span>
        </footer>
      </div>
    </article>
  )
}
