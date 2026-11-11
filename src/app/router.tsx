import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react'

/**
 * Enrutador mínimo basado en hash. Funciona en cualquier hosting estático y
 * no envía la ruta a ningún servidor.
 */
export type Route =
  | { name: 'home' }
  | { name: 'history' }
  | { name: 'new-quote' }
  | { name: 'edit-quote'; id: string }
  | { name: 'settings' }
  | { name: 'not-found' }

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '').replace(/\/+$/, '') || '/'
  if (path === '/') return { name: 'home' }
  if (path === '/cotizaciones') return { name: 'history' }
  if (path === '/cotizaciones/nueva') return { name: 'new-quote' }
  const edit = path.match(/^\/cotizaciones\/([\w-]+)$/)
  if (edit) return { name: 'edit-quote', id: edit[1] }
  if (path === '/ajustes') return { name: 'settings' }
  return { name: 'not-found' }
}

export const paths = {
  home: '/',
  history: '/cotizaciones',
  newQuote: '/cotizaciones/nueva',
  quote: (id: string) => `/cotizaciones/${id}`,
  settings: '/ajustes',
}

type Guard = () => boolean

interface RouterContextValue {
  route: Route
  path: string
  navigate: (path: string, options?: { replace?: boolean; force?: boolean }) => void
  /** Registra una función que puede cancelar la navegación interna (p. ej. cambios sin guardar). */
  setGuard: (guard: Guard | null) => void
}

const RouterContext = createContext<RouterContextValue | null>(null)

const currentPath = () => window.location.hash.replace(/^#/, '') || '/'

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(currentPath)
  const guardRef = useRef<Guard | null>(null)

  useEffect(() => {
    const onHashChange = () => {
      setPath(currentPath())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const navigate = useCallback<RouterContextValue['navigate']>((next, options) => {
    if (!options?.force && guardRef.current && !guardRef.current()) return
    if (next === currentPath()) return
    if (options?.replace) {
      window.history.replaceState(null, '', `#${next}`)
      setPath(next)
    } else {
      window.location.hash = next
    }
  }, [])

  const setGuard = useCallback((guard: Guard | null) => {
    guardRef.current = guard
  }, [])

  const value = useMemo(() => ({ route: parseRoute(path), path, navigate, setGuard }), [path, navigate, setGuard])
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export function useRouter() {
  const context = useContext(RouterContext)
  if (!context) throw new Error('useRouter debe usarse dentro de RouterProvider')
  return context
}

interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string
}

export function Link({ to, onClick, ...props }: LinkProps) {
  const { navigate } = useRouter()
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(to)
  }
  return <a href={`#${to}`} onClick={handleClick} {...props} />
}
