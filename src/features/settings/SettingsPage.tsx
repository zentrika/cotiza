import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Check, Download, HardDrive, Loader2, ShieldCheck, Upload } from 'lucide-react'
import { useTheme } from '@/app/theme'
import { FormField } from '@/components/common/FormField'
import { ErrorState } from '@/components/common/States'
import { PageHeader } from '@/components/layout/PageHeader'
import { THEME_OPTIONS } from '@/components/layout/ThemeToggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useProfileForm } from './useProfileForm'
import { useServices } from '@/app/services'
import { backupService, parseBackupFile, summarizeBackup, type BackupSummary } from '@/services/backup'
import type { BackupPayload } from '@/domain/models'

export function SettingsPage() {
  // Tras restaurar un respaldo, el formulario del perfil se vuelve a montar para leer los datos restaurados
  // (evita que quede en pantalla, y se pueda volver a guardar, el perfil anterior).
  const [profileKey, setProfileKey] = useState(0)
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Ajustes" title="Configuración" description="Tu información y preferencias viven solo en este dispositivo." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <ProfileCard key={profileKey} />
        <div className="space-y-6">
          <AppearanceCard />
          <BackupCard onRestored={() => setProfileKey((key) => key + 1)} />
        </div>
      </div>
    </div>
  )
}

function ProfileCard() {
  const form = useProfileForm()
  const { profile, errors } = form

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      if (await form.save()) toast.success('Perfil guardado', { description: 'Se usará en tus próximas cotizaciones.' })
      else toast.error('Revisa los campos marcados')
    } catch (error) {
      toast.error('No se pudo guardar el perfil', { description: error instanceof Error ? error.message : undefined })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Perfil del negocio</CardTitle>
          {form.status === 'ready' && (form.exists ? <Badge variant="secondary"><Check className="size-3" /> Configurado</Badge> : <Badge variant="brand">Pendiente</Badge>)}
        </div>
        <CardDescription>Estos datos aparecen como emisor en cada cotización nueva. Las cotizaciones ya emitidas conservan los datos con los que se crearon.</CardDescription>
      </CardHeader>
      {form.status === 'loading' && (
        <CardContent className="space-y-4" aria-busy="true">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}</CardContent>
      )}
      {form.status === 'error' && <CardContent><ErrorState error={form.error} onRetry={form.reload} /></CardContent>}
      {form.status === 'ready' && (
        <form onSubmit={handleSave} noValidate>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nombre o razón social" error={errors.legalName} className="sm:col-span-2">
              <Input value={profile.legalName} onChange={(e) => form.update({ legalName: e.target.value })} placeholder="Ej.: Estudio Creativo Andes" autoComplete="organization" />
            </FormField>
            <FormField label="NIT o cédula" optional error={errors.taxId}>
              <Input value={profile.taxId ?? ''} onChange={(e) => form.update({ taxId: e.target.value })} placeholder="900.123.456-7" />
            </FormField>
            <FormField label="Teléfono" optional error={errors.phone}>
              <Input type="tel" value={profile.phone ?? ''} onChange={(e) => form.update({ phone: e.target.value })} placeholder="+57 300 000 0000" autoComplete="tel" />
            </FormField>
            <FormField label="Correo" optional error={errors.email}>
              <Input type="email" value={profile.email ?? ''} onChange={(e) => form.update({ email: e.target.value })} placeholder="hola@tunegocio.co" autoComplete="email" />
            </FormField>
            <FormField label="Dirección" optional error={errors.address}>
              <Input value={profile.address ?? ''} onChange={(e) => form.update({ address: e.target.value })} placeholder="Medellín, Antioquia" autoComplete="street-address" />
            </FormField>
            <FormField label="URL del logotipo" optional error={errors.logoUrl} hint="Enlace https a una imagen. La carga de archivos llegará más adelante." className="sm:col-span-2">
              <Input type="url" value={profile.logoUrl ?? ''} onChange={(e) => form.update({ logoUrl: e.target.value })} placeholder="https://…" />
            </FormField>
          </CardContent>
          <CardFooter className="justify-between">
            <span className="text-xs text-muted-foreground" aria-live="polite">{form.dirty ? 'Cambios sin guardar' : form.exists ? 'Todo guardado' : ''}</span>
            <Button type="submit" disabled={form.saving || !form.dirty}>
              {form.saving && <Loader2 className="animate-spin" />} Guardar perfil
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}

function AppearanceCard() {
  const { theme, setTheme } = useTheme()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Apariencia</CardTitle>
        <CardDescription>Elige cómo se ve Cotiza en este dispositivo.</CardDescription>
      </CardHeader>
      <CardContent>
        <fieldset>
          <legend className="sr-only">Tema</legend>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <label
                key={value}
                className={cn(
                  'relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border bg-background/60 p-3 text-center text-xs font-medium transition-colors focus-within:ring-2 focus-within:ring-ring hover:border-foreground/25',
                  theme === value && 'border-primary bg-accent',
                )}
              >
                <input type="radio" name="theme" value={value} checked={theme === value} onChange={() => setTheme(value)} className="sr-only" />
                <ThemeSwatch variant={value} />
                <span className="flex items-center gap-1"><Icon className="size-3.5" aria-hidden /> {value === 'system' ? 'Sistema' : label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </CardContent>
    </Card>
  )
}

function ThemeSwatch({ variant }: { variant: 'light' | 'dark' | 'system' }) {
  const half = (dark: boolean) => (
    <div className={cn('flex h-full flex-1 flex-col gap-1 p-1.5', dark ? 'bg-[hsl(var(--zk-obsidian))]' : 'bg-[hsl(220_33%_98%)]')}>
      <div className={cn('h-1.5 w-3/4 rounded-sm', dark ? 'bg-[hsl(220_30%_94%)]' : 'bg-[hsl(var(--zk-obsidian))]')} />
      <div className={cn('h-1 w-1/2 rounded-sm', dark ? 'bg-white/20' : 'bg-black/15')} />
      <div className="mt-auto h-1.5 w-1/3 rounded-sm bg-brand-gradient" />
    </div>
  )
  return (
    <div aria-hidden className="flex h-12 w-full overflow-hidden rounded-lg border">
      {variant === 'light' && half(false)}
      {variant === 'dark' && half(true)}
      {variant === 'system' && <>{half(false)}{half(true)}</>}
    </div>
  )
}

interface CurrentDataSummary { profile: boolean; clients: number; quotes: number }
interface PendingRestore { payload: BackupPayload; summary: BackupSummary; current?: CurrentDataSummary }

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

function BackupCard({ onRestored }: { onRestored?: () => void }) {
  const { backup = backupService, quotes, clients, profile } = useServices()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<PendingRestore>()
  const [acknowledged, setAcknowledged] = useState(false)
  const [busy, setBusy] = useState<'export' | 'read' | 'restore'>()

  const exportBackup = async () => {
    setBusy('export')
    try {
      const payload = await backup.create()
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `cotiza-respaldo-${new Date().toISOString().slice(0, 10)}.json`
      anchor.click()
      // Se libera después de que el navegador inicie la descarga (Safari y Firefox la cancelan si es inmediato).
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast.success('Respaldo exportado', { description: 'Revisa tu carpeta de descargas y guárdalo en un lugar seguro.' })
    } catch (error) {
      toast.error('No se pudo exportar el respaldo', { description: error instanceof Error ? error.message : undefined })
    } finally { setBusy(undefined) }
  }

  /** Lectura (solo consulta) de lo que hay hoy en el dispositivo, para mostrar qué se reemplazará. */
  const readCurrentData = async (): Promise<CurrentDataSummary | undefined> => {
    try {
      const [quoteList, clientList, storedProfile] = await Promise.all([quotes.list(), clients.list(), profile.get()])
      return { profile: Boolean(storedProfile), clients: clientList.length, quotes: quoteList.length }
    } catch {
      return undefined
    }
  }

  const selectFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy('read')
    try {
      const payload = await parseBackupFile(file)
      const current = await readCurrentData()
      setAcknowledged(false)
      setPending({ payload, summary: summarizeBackup(payload), current })
    } catch (error) {
      toast.error('No se pudo leer el respaldo', { description: error instanceof Error ? error.message : 'El archivo no es un respaldo válido de Cotiza.' })
    } finally { setBusy(undefined) }
  }

  const restore = async () => {
    if (!pending || !acknowledged) return
    setBusy('restore')
    try {
      await backup.restore(pending.payload)
      setPending(undefined)
      setAcknowledged(false)
      onRestored?.()
      toast.success('Respaldo restaurado', { description: 'Tus datos locales fueron reemplazados por los del archivo.' })
    } catch (error) {
      toast.error('No se pudo restaurar el respaldo', { description: `${error instanceof Error ? `${error.message} ` : ''}Tus datos actuales no se modificaron.` })
    } finally { setBusy(undefined) }
  }

  const closeDialog = (open: boolean) => {
    if (!open && busy !== 'restore') {
      setPending(undefined)
      setAcknowledged(false)
    }
  }

  const current = pending?.current
  const hasCurrentData = current ? current.profile || current.clients > 0 || current.quotes > 0 : true

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Respaldos</CardTitle>
          <Badge variant="secondary">Solo local</Badge>
        </div>
        <CardDescription>Exporta un archivo con tus datos para guardarlo donde quieras o pasarlo a otro dispositivo.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => void exportBackup()} disabled={Boolean(busy)}>
            {busy === 'export' ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />} Exportar
          </Button>
          <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={Boolean(busy)} aria-describedby="restore-warning">
            {busy === 'read' ? <Loader2 className="animate-spin" aria-hidden /> : <Upload aria-hidden />} Restaurar
          </Button>
          <input ref={inputRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} onChange={(event) => void selectFile(event)} aria-label="Seleccionar archivo de respaldo" />
        </div>
        <p id="restore-warning" role="note" className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12.5px] leading-relaxed text-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          <span>Restaurar <strong className="font-semibold">reemplaza todos los datos actuales</strong> de este navegador. Antes de confirmar verás qué contiene el archivo; exporta primero un respaldo si quieres conservar lo que tienes.</span>
        </p>
        <ul className="space-y-2.5 text-[13px] text-muted-foreground">
          <li className="flex gap-2"><HardDrive className="mt-0.5 size-4 shrink-0" aria-hidden /> Tus datos se guardan en el almacenamiento local de este navegador.</li>
          <li className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> El respaldo será un archivo que solo tú controlas; nada se sube a internet.</li>
        </ul>
      </CardContent>
      <AlertDialog open={Boolean(pending)} onOpenChange={closeDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reemplazar tus datos con este respaldo?</AlertDialogTitle>
            <AlertDialogDescription>
              {hasCurrentData
                ? 'Los datos que tienes ahora en este navegador se eliminarán y se sustituirán por los del archivo. Esta acción no se puede deshacer.'
                : 'Este navegador no tiene datos guardados; se cargarán los del archivo.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pending && (
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <section aria-labelledby="restore-current" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <h3 id="restore-current" className="text-xs font-semibold uppercase tracking-wider text-destructive">Se eliminará</h3>
                {current ? (
                  <ul className="mt-1.5 space-y-0.5 text-foreground">
                    <li>{plural(current.quotes, 'cotización', 'cotizaciones')}</li>
                    <li>{plural(current.clients, 'cliente', 'clientes')}</li>
                    <li>{current.profile ? 'Perfil del negocio' : 'Sin perfil del negocio'}</li>
                  </ul>
                ) : (
                  <p className="mt-1.5 text-foreground">Todos los datos actuales de este navegador.</p>
                )}
              </section>
              <section aria-labelledby="restore-incoming" className="rounded-lg border bg-muted/40 p-3">
                <h3 id="restore-incoming" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Se restaurará</h3>
                <ul className="mt-1.5 space-y-0.5">
                  <li>{plural(pending.summary.quotes, 'cotización', 'cotizaciones')} ({plural(pending.summary.items, 'línea', 'líneas')})</li>
                  <li>{plural(pending.summary.clients, 'cliente', 'clientes')}</li>
                  <li>{pending.summary.profile ? 'Perfil del negocio' : 'Sin perfil del negocio'}</li>
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">Generado el {formatBackupDate(pending.summary.exportedAt)}</p>
              </section>
            </div>
          )}
          {hasCurrentData && (
            <Button variant="link" size="sm" className="h-auto justify-start px-0" onClick={() => void exportBackup()} disabled={Boolean(busy)}>
              <Download aria-hidden /> Exportar primero mis datos actuales
            </Button>
          )}
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm">
            <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} disabled={busy === 'restore'} className="mt-0.5 size-4 shrink-0 accent-[hsl(var(--destructive))]" />
            <span>Entiendo que mis datos actuales se reemplazarán por los del respaldo.</span>
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy === 'restore'}>Cancelar</AlertDialogCancel>
            <AlertDialogAction destructive disabled={!acknowledged || Boolean(busy)} onClick={(event) => { event.preventDefault(); void restore() }}>
              {busy === 'restore' && <Loader2 className="animate-spin" aria-hidden />} {busy === 'restore' ? 'Restaurando…' : 'Reemplazar datos'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function formatBackupDate(iso: string) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? 'fecha desconocida' : date.toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })
}
