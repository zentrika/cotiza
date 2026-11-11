import { useCallback, useEffect, useRef, useState } from 'react'

export type AsyncState<T> =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'success'; data: T; error?: undefined }
  | { status: 'error'; data?: undefined; error: Error }

/** Carga asíncrona con estados explícitos de carga, éxito y error. */
export function useAsync<T>(loader: () => Promise<T>, deps: React.DependencyList) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })
  const run = useRef(0)

  const load = useCallback(loader, deps)

  const reload = useCallback(async () => {
    const id = ++run.current
    setState((prev) => (prev.status === 'success' ? prev : { status: 'loading' }))
    try {
      const data = await load()
      if (id === run.current) setState({ status: 'success', data })
    } catch (error) {
      if (id === run.current) setState({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) })
    }
  }, [load])

  useEffect(() => {
    void reload()
  }, [reload])

  return { ...state, reload, setData: (data: T) => setState({ status: 'success', data }) }
}
