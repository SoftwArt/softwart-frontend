// src/shared/hooks/useServerPagination.ts
// Reemplaza el patrón "fetch limit=500 + filtrar/paginar en memoria" (que se
// rompe silenciosamente pasados los 100 registros — el backend cachea el
// limit en Math.min(100, ...) pase lo que pase pida el frontend) por
// paginación real: cada cambio de página/búsqueda/filtro dispara un fetch
// nuevo al backend, que ya hace el WHERE + skip/take + total correcto.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100]
const DEFAULT_PAGE_SIZE = 5
const SEARCH_DEBOUNCE_MS = 300

export type FetchPageResult<T> = { data: T[]; total: number }

interface Params<T, F extends Record<string, string>> {
  // Debe pegarle al endpoint paginado del backend (page/limit/q/filtros) y
  // devolver { data, total } — total es el conteo real (sin capar), ya lo
  // calculan bien los controllers via getCount()/getManyAndCount().
  fetchPage: (opts: { page: number; pageSize: number; q: string; filters: F }) => Promise<FetchPageResult<T>>
  filters: F
  initialPageSize?: number
}

export function useServerPagination<T, F extends Record<string, string>>({
  fetchPage, filters, initialPageSize = DEFAULT_PAGE_SIZE,
}: Params<T, F>) {
  const [page,     setPage]     = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [q,        setQ]        = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')

  const [items,     setItems]     = useState<T[]>([])
  const [total,     setTotal]     = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  // Debounce de la búsqueda — igual criterio que SearchInput (200ms) un poco
  // más holgado acá porque cada tecla ahora sí dispara un request real.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [q])

  const filtersKey = JSON.stringify(filters)

  // Buscar/filtrar/cambiar pageSize invalida la página actual — sin esto se
  // podía quedar en "página 4" de un resultado filtrado que ya no tiene 4
  // páginas, mostrando una lista vacía en vez de volver al principio.
  const isFirstRun = useRef(true)
  useEffect(() => {
    if (isFirstRun.current) { isFirstRun.current = false; return }
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, filtersKey, pageSize])

  // Params vigentes en un ref — así `load()` siempre lee los últimos (page,
  // pageSize, etc.) sin tener que estar en las deps de useCallback, y
  // `refresh()` puede reusar exactamente la misma función.
  const latest = useRef({ page, pageSize, q: debouncedQ, filters })
  latest.current = { page, pageSize, q: debouncedQ, filters }

  const load = useCallback(() => {
    setIsLoading(true)
    setError(null)
    return fetchPage(latest.current)
      .then(res => {
        setItems(res.data)
        setTotal(res.total)
      })
      .catch(e => {
        setError(e instanceof Error ? e.message : 'Error al cargar')
        setItems([])
        setTotal(0)
      })
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPage])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)
    fetchPage({ page, pageSize, q: debouncedQ, filters })
      .then(res => {
        if (cancelled) return
        setItems(res.data)
        setTotal(res.total)
      })
      .catch(e => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Error al cargar')
        setItems([])
        setTotal(0)
      })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debouncedQ, filtersKey])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])

  // Para refrescar la página actual después de crear/editar/borrar sin
  // resetear a la página 1 (a diferencia de cambiar q/filtros/pageSize).
  // Devuelve una promesa real que resuelve cuando el fetch termina — código
  // que hace `await refresh()` esperando datos frescos sí los tiene.
  const refresh = useCallback(() => load(), [load])

  return {
    items, total, totalPages, isLoading, error,
    page, setPage, pageSize, setPageSize,
    q, setQ,
    refresh,
  }
}
