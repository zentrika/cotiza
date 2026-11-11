import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, Building2, Check, Eye, FileQuestion, Loader2, PencilLine, Save, Sparkles, UserPlus } from 'lucide-react'
import type { Currency, QuoteStatus } from '@/domain/models'
import { Link, paths, useRouter } from '@/app/router'
import { FormField } from '@/components/common/FormField'
import { EmptyState, ErrorState } from '@/components/common/States'
import { StatusBadge, StatusDot } from '@/components/common/StatusBadge'
import { Money } from '@/components/common/Money'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { dateInputToInstant, instantToDateInput } from '@/features/quotes/format'
import { QuotePreviewDialog } from '@/features/quotes/QuotePreviewDialog'
import { QUOTE_STATUSES, STATUS_META } from '@/features/quotes/status'
import { EditorSection } from './EditorSection'
import { ItemsEditor } from './ItemsEditor'
import { TotalsPanel } from './TotalsPanel'
import { NEW_CLIENT, useQuoteEditor } from './useQuoteEditor'

const NOTE_SUGGESTIONS = [
  'Forma de pago: 50 % al aprobar y 50 % contra entrega.',
  'Tiempo de entrega: 10 días hábiles a partir de la aprobación.',
  'Esta cotización no constituye una factura.',
  'Los precios pueden variar después de la fecha de vigencia.',
]

export function EditorPage({ quoteId }: { quoteId?: string }) {
  const editor = useQuoteEditor(quoteId)
  const { navigate, setGuard } = useRouter()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editingIssuer, setEditingIssuer] = useState(false)
  const { quote, totals, errors, dirty } = editor

  // Protege los cambios sin guardar al navegar dentro de la app y al cerrar la pestaña.
  useEffect(() => {
    setGuard(dirty ? () => window.confirm('Tienes cambios sin guardar. ¿Quieres salir sin guardarlos?') : null)
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      setGuard(null)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [dirty, setGuard])

  const handleSave = useCallback(async () => {
    try {
      const result = await editor.save()
      if (!result.ok) {
        if (Object.keys(result.errors).some((key) => key.startsWith('issuerSnapshot.'))) setEditingIssuer(true)
        toast.error('Revisa los campos marcados', { description: 'Hay datos incompletos o con formato incorrecto.' })
        requestAnimationFrame(() => {
          const first = document.querySelector<HTMLElement>('[data-field-error]')
          first?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          first?.focus({ preventScroll: true })
        })
        return
      }
      toast.success(`${result.quote.number} guardada`, { description: result.createdClient ? `También se guardó el cliente ${result.createdClient.name}.` : 'Los cambios quedaron guardados.' })
      if (editor.isNew) navigate(paths.quote(result.quote.id), { replace: true, force: true })
    } catch (error) {
      toast.error('No se pudo guardar la cotización', { description: error instanceof Error ? error.message : undefined })
    }
  }, [editor, navigate])

  // Atajo Ctrl/Cmd + S para guardar.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        if (!editor.saving) void handleSave()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSave, editor.saving])

  if (editor.load.status === 'loading') return <EditorSkeleton />
  if (editor.load.status === 'error') return <ErrorState title="No pudimos abrir la cotización" error={editor.load.error} onRetry={editor.reload} />
  if (editor.load.status === 'not-found' || !quote || !totals) {
    return (
      <EmptyState
        icon={<FileQuestion />}
        title="Esta cotización no existe"
        description="Puede que se haya eliminado o que el enlace sea incorrecto."
        action={<Link to={paths.history} className={buttonVariants({ variant: 'outline' })}>Ir al historial</Link>}
      />
    )
  }

  const issuer = quote.issuerSnapshot
  const showIssuerForm = editingIssuer || !editor.profile || !issuer.legalName

  const appendNote = (text: string) => editor.update({ notes: quote.notes?.trim() ? `${quote.notes.trimEnd()}\n${text}` : text })

  return (
    <div className="pb-20 lg:pb-0">
      {/* Barra de acciones */}
      <div className="sticky top-14 z-20 -mx-4 mb-6 border-b bg-background/85 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-10 lg:-mt-10 lg:px-10 lg:py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Link to={paths.history} className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), 'shrink-0')} aria-label="Volver al historial">
            <ArrowLeft />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-display text-lg font-medium tracking-tight sm:text-xl">{editor.isNew ? 'Nueva cotización' : quote.title || quote.number}</h1>
              <StatusBadge status={quote.status} className="hidden sm:inline-flex" />
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
              <span className="font-mono">{quote.number}</span>
              <span aria-hidden>·</span>
              {dirty ? (
                <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400"><span className="size-1.5 rounded-full bg-current" aria-hidden />Cambios sin guardar</span>
              ) : editor.isNew ? (
                <span>Sin guardar</span>
              ) : (
                <span className="inline-flex items-center gap-1"><Check className="size-3" aria-hidden />Guardada en este dispositivo</span>
              )}
            </p>
          </div>
          <Button variant="outline" onClick={() => setPreviewOpen(true)} className="max-sm:size-10 max-sm:px-0" aria-label="Vista previa">
            <Eye /> <span className="hidden sm:inline">Vista previa</span>
          </Button>
          <Button onClick={handleSave} disabled={editor.saving} className="hidden sm:inline-flex" title="Guardar (Ctrl/⌘ + S)">
            {editor.saving ? <Loader2 className="animate-spin" /> : <Save />} Guardar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="space-y-6">
          {/* 01 · Detalles */}
          <EditorSection index="01" title="Detalles" description="Identifica la cotización y define su vigencia.">
            <div className="grid gap-4 sm:grid-cols-6">
              <FormField label="Título o asunto" error={errors.title} className="sm:col-span-6">
                <Input value={quote.title} onChange={(e) => editor.update({ title: e.target.value })} placeholder="Ej.: Rediseño del sitio web" maxLength={120} />
              </FormField>
              <FormField label="Número" error={errors.number} hint={editor.numberTaken ? 'Ya existe otra cotización con este número.' : undefined} className="sm:col-span-3">
                <Input value={quote.number} onChange={(e) => editor.update({ number: e.target.value })} className="font-mono" maxLength={30} />
              </FormField>
              <FormField label="Moneda" className="sm:col-span-3">
                <Select value={quote.currency} onValueChange={(value) => editor.update({ currency: value as Currency })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COP">COP · Peso colombiano</SelectItem>
                    <SelectItem value="USD">USD · Dólar estadounidense</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Fecha de emisión" error={errors.issuedAt} className="sm:col-span-2">
                <Input type="date" value={instantToDateInput(quote.issuedAt)} onChange={(e) => e.target.value && editor.update({ issuedAt: dateInputToInstant(e.target.value) })} />
              </FormField>
              <FormField label="Válida desde" error={errors.validFrom} className="sm:col-span-2">
                <Input type="date" value={quote.validFrom} onChange={(e) => editor.update({ validFrom: e.target.value })} />
              </FormField>
              <FormField label="Válida hasta" error={errors.validUntil} className="sm:col-span-2">
                <Input type="date" value={quote.validUntil} min={quote.validFrom} onChange={(e) => editor.update({ validUntil: e.target.value })} />
              </FormField>
            </div>
          </EditorSection>

          {/* 02 · Cliente */}
          <EditorSection index="02" title="Cliente" description="A quién va dirigida la propuesta.">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Cliente" error={errors.clientId} className="sm:col-span-2">
                <Select value={editor.clientChoice} onValueChange={editor.selectClient}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NEW_CLIENT}>
                      <span className="inline-flex items-center gap-2"><UserPlus className="size-4 text-brand-strong" /> Nuevo cliente</span>
                    </SelectItem>
                    {editor.clients.length > 0 && <SelectSeparator />}
                    {editor.clients.map((client) => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Nombre o razón social" error={errors['clientSnapshot.name']} className="sm:col-span-2">
                <Input value={quote.clientSnapshot.name} onChange={(e) => editor.updateClient({ name: e.target.value })} placeholder="Ej.: Café La Montaña S.A.S." autoComplete="organization" />
              </FormField>
              <FormField label="NIT o cédula" optional error={errors['clientSnapshot.taxId']}>
                <Input value={quote.clientSnapshot.taxId ?? ''} onChange={(e) => editor.updateClient({ taxId: e.target.value })} placeholder="900.123.456-7" />
              </FormField>
              <FormField label="Teléfono" optional error={errors['clientSnapshot.phone']}>
                <Input type="tel" value={quote.clientSnapshot.phone ?? ''} onChange={(e) => editor.updateClient({ phone: e.target.value })} placeholder="+57 300 000 0000" autoComplete="tel" />
              </FormField>
              <FormField label="Correo" optional error={errors['clientSnapshot.email']}>
                <Input type="email" value={quote.clientSnapshot.email ?? ''} onChange={(e) => editor.updateClient({ email: e.target.value })} placeholder="compras@cliente.co" autoComplete="email" />
              </FormField>
              <FormField label="Dirección" optional error={errors['clientSnapshot.address']}>
                <Input value={quote.clientSnapshot.address ?? ''} onChange={(e) => editor.updateClient({ address: e.target.value })} placeholder="Ciudad, dirección" autoComplete="street-address" />
              </FormField>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {editor.isNewClient
                ? 'Al guardar, este cliente quedará disponible para tus próximas cotizaciones.'
                : 'Los cambios aquí solo afectan a esta cotización; la ficha del cliente no se modifica.'}
            </p>
          </EditorSection>

          {/* 03 · Productos y servicios */}
          <EditorSection index="03" title="Productos y servicios" description="Cada línea tiene su propio descuento e impuesto (p. ej., IVA 19 %).">
            <ItemsEditor
              items={quote.items}
              currency={quote.currency}
              errors={errors}
              onAdd={editor.addItem}
              onChange={editor.updateItem}
              onRemove={editor.removeItem}
              onDuplicate={editor.duplicateItem}
            />
          </EditorSection>

          {/* 04 · Notas */}
          <EditorSection index="04" title="Notas y condiciones" description="Forma de pago, tiempos de entrega, garantías…">
            <FormField label="Notas para el cliente" optional>
              <Textarea value={quote.notes ?? ''} onChange={(e) => editor.update({ notes: e.target.value })} rows={4} placeholder="Escribe las condiciones de tu propuesta" />
            </FormField>
            <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Sugerencias de condiciones">
              {NOTE_SUGGESTIONS.filter((text) => !quote.notes?.includes(text)).map((text) => (
                <button key={text} type="button" onClick={() => appendNote(text)} className="focus-ring inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-left text-xs text-muted-foreground transition-colors hover:border-brand/50 hover:text-foreground">
                  <Sparkles className="size-3 text-brand" aria-hidden /> {text}
                </button>
              ))}
            </div>
          </EditorSection>

          {/* 05 · Emisor */}
          <EditorSection
            index="05"
            title="Tu negocio"
            description="Datos del emisor tal como aparecerán en este documento."
            actions={
              !showIssuerForm ? (
                <Button variant="ghost" size="sm" onClick={() => setEditingIssuer(true)}><PencilLine /> Editar</Button>
              ) : undefined
            }
          >
            {showIssuerForm ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Nombre o razón social" error={errors['issuerSnapshot.legalName']} className="sm:col-span-2">
                  <Input value={issuer.legalName} onChange={(e) => editor.updateIssuer({ legalName: e.target.value })} placeholder="Tu nombre o el de tu empresa" autoComplete="organization" />
                </FormField>
                <FormField label="NIT o cédula" optional error={errors['issuerSnapshot.taxId']}>
                  <Input value={issuer.taxId ?? ''} onChange={(e) => editor.updateIssuer({ taxId: e.target.value })} />
                </FormField>
                <FormField label="Teléfono" optional error={errors['issuerSnapshot.phone']}>
                  <Input type="tel" value={issuer.phone ?? ''} onChange={(e) => editor.updateIssuer({ phone: e.target.value })} autoComplete="tel" />
                </FormField>
                <FormField label="Correo" optional error={errors['issuerSnapshot.email']}>
                  <Input type="email" value={issuer.email ?? ''} onChange={(e) => editor.updateIssuer({ email: e.target.value })} autoComplete="email" />
                </FormField>
                <FormField label="Dirección" optional error={errors['issuerSnapshot.address']}>
                  <Input value={issuer.address ?? ''} onChange={(e) => editor.updateIssuer({ address: e.target.value })} autoComplete="street-address" />
                </FormField>
                {!editor.profile && (
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-background/60 p-3 sm:col-span-2">
                    <input type="checkbox" checked={editor.saveAsProfile} onChange={(e) => editor.setSaveAsProfile(e.target.checked)} className="mt-0.5 size-4 accent-[hsl(var(--brand))]" />
                    <span className="text-sm">
                      <span className="font-medium">Guardar como perfil de mi negocio</span>
                      <span className="block text-xs text-muted-foreground">Se completará solo en tus próximas cotizaciones.</span>
                    </span>
                  </label>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Building2 className="size-5" /></span>
                <div className="min-w-0 text-sm">
                  <p className="font-medium">{issuer.legalName}</p>
                  <p className="text-muted-foreground">{[issuer.taxId && `NIT ${issuer.taxId}`, issuer.email, issuer.phone].filter(Boolean).join(' · ') || 'Sin datos de contacto'}</p>
                  <Link to={paths.settings} className="mt-1 inline-block text-xs font-medium text-brand-strong hover:underline">Editar perfil del negocio</Link>
                </div>
              </div>
            )}
          </EditorSection>
        </div>

        {/* Resumen lateral */}
        <aside className="space-y-4 lg:sticky lg:top-24" aria-label="Resumen de la cotización">
          <TotalsPanel totals={totals} currency={quote.currency} itemCount={quote.items.length} />
          <div className="rounded-2xl border bg-card p-4 shadow-lift">
            <FormField label="Estado" hint={STATUS_META[quote.status].description}>
              <Select value={quote.status} onValueChange={(value) => editor.update({ status: value as QuoteStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QUOTE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      <span className="inline-flex items-center gap-2"><StatusDot status={status} /> {STATUS_META[status].label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <div className="hidden gap-2 lg:grid">
            <Button size="lg" onClick={handleSave} disabled={editor.saving}>
              {editor.saving ? <Loader2 className="animate-spin" /> : <Save />} Guardar cotización
            </Button>
            <Button size="lg" variant="outline" onClick={() => setPreviewOpen(true)}><Eye /> Vista previa</Button>
            <p className="text-center text-[11px] text-muted-foreground">Atajo: <kbd className="rounded border bg-muted px-1 font-mono">Ctrl/⌘ S</kbd></p>
          </div>
        </aside>
      </div>

      {/* Barra inferior (móvil) */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t bg-card/95 px-4 py-2.5 backdrop-blur-md sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total</p>
            <Money value={totals.total} currency={quote.currency} className="font-display text-lg font-semibold" />
          </div>
          <Button onClick={handleSave} disabled={editor.saving}>
            {editor.saving ? <Loader2 className="animate-spin" /> : <Save />} Guardar
          </Button>
        </div>
      </div>

      <QuotePreviewDialog quote={quote} totals={totals} open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  )
}

function EditorSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando cotización" className="space-y-6">
      <div className="flex items-center gap-3"><Skeleton className="size-8" /><div className="space-y-2"><Skeleton className="h-5 w-48" /><Skeleton className="h-3 w-32" /></div></div>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}</div>
        <Skeleton className="hidden h-72 rounded-2xl lg:block" />
      </div>
    </div>
  )
}
