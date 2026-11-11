import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Sección numerada del editor: da ritmo y orden de lectura al formulario. */
export function EditorSection({ index, title, description, actions, children, className, id }: { index: string; title: string; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  const headingId = `${id ?? index}-heading`
  return (
    <section id={id} aria-labelledby={headingId} className={cn('scroll-mt-32 rounded-2xl border bg-card shadow-lift', className)}>
      <header className="flex items-start justify-between gap-4 px-5 pb-1 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-baseline gap-3">
          <span aria-hidden className="font-mono text-[11px] font-semibold text-ember-strong">{index}</span>
          <div>
            <h2 id={headingId} className="text-[15px] font-semibold tracking-tight">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
          </div>
        </div>
        {actions}
      </header>
      <div className="p-5 pt-4 sm:p-6 sm:pt-4">{children}</div>
    </section>
  )
}
