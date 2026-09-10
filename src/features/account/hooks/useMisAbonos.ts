// Standalone, igual criterio que useServiceHistory: es data de una sola
// página (AbonosPage), no hace falta meterla en la composición grande de
// useAccount() ni en su polling.
import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'
import type { VentaAbonos } from '../types'

type ApiResponse<T> = { success: boolean; message?: string; data: T }

export function useMisAbonos() {
  const [ventas, setVentas] = useState<VentaAbonos[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiRequest<ApiResponse<VentaAbonos[]>>('/api/account/abonos')
      setVentas(res.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar tus abonos')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { ventas, isLoading, error }
}
