import type { ReactNode } from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card/50 px-6 py-12 text-center', className)}>
      {icon && <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-ember-soft text-ember-strong [&_svg]:size-5">{icon}</div>}
      <h3 className="font-display text-lg font-medium tracking-tight">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-balance text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ title = 'No pudimos cargar la información', error, onRetry, className }: { title?: string; error?: Error; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center', className)}>
      <AlertTriangle className="mb-3 size-6 text-destructive" aria-hidden />
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{error?.message ? `Detalle: ${error.message}` : 'Inténtalo de nuevo en unos segundos.'}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RotateCw /> Reintentar
        </Button>
      )}
    </div>
  )
}
