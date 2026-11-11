import { useEffect, useState } from 'react'
import { Toaster as Sonner } from 'sonner'
import { useTheme } from '@/app/theme'

const DESKTOP_QUERY = '(min-width: 1024px)'

/** En móvil y tableta los avisos van arriba para no tapar la navegación inferior ni la barra de guardado. */
function useIsDesktop() {
  const [desktop, setDesktop] = useState(() => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(DESKTOP_QUERY).matches)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia(DESKTOP_QUERY)
    const onChange = () => setDesktop(media.matches)
    media.addEventListener?.('change', onChange)
    return () => media.removeEventListener?.('change', onChange)
  }, [])
  return desktop
}

export function Toaster() {
  const { resolvedTheme } = useTheme()
  const desktop = useIsDesktop()
  return (
    <Sonner
      theme={resolvedTheme}
      position={desktop ? 'bottom-right' : 'top-center'}
      offset={desktop ? 20 : 12}
      containerAriaLabel="Notificaciones"
      toastOptions={{
        classNames: {
          toast: 'group !rounded-xl !border !border-border !bg-popover !text-popover-foreground !shadow-paper !font-sans',
          description: '!text-muted-foreground',
          actionButton: '!bg-primary !text-primary-foreground',
        },
      }}
    />
  )
}
