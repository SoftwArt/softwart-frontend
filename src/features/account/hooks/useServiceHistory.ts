// Extraído de ServicesModal.tsx: el historial de estado de un servicio se
// carga on-demand al expandir su fila, y se sondea en silencio mientras esa
// fila siga expandida. Antes vivía inline en el modal; ahora ServiciosPage y
// ResumenPage instancian este hook para tener la misma lógica sin duplicarla.
import { useCallback, useState } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'
import { usePolling } from '@/src/shared/hooks/usePolling'
import type { HistorialEstado } from '../types'

export function useServiceHistory() {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [historyById, setHistoryById] = useState<Record<number, HistorialEstado[]>>({})
  const [historyLoadingId, setHistoryLoadingId] = useState<number | null>(null)

  const fetchHistory = useCallback(async (id_detalle: number, opts?: { silent?: boolean }) => {
    if (!opts?.silent) setHistoryLoadingId(id_detalle)
    try {
      const res = await apiRequest<{ success: boolean; data: HistorialEstado[] }>(`/api/account/servicios/${id_detalle}/historial`)
      const next = res.data ?? []
      setHistoryById(prev =>
        JSON.stringify(prev[id_detalle]) === JSON.stringify(next) ? prev : { ...prev, [id_detalle]: next }
      )
    } catch {
      if (!opts?.silent) setHistoryById(prev => ({ ...prev, [id_detalle]: [] }))
    } finally {
      if (!opts?.silent) setHistoryLoadingId(null)
    }
  }, [])

  const toggleHistory = (id_detalle: number) => {
    if (expandedId === id_detalle) { setExpandedId(null); return }
    setExpandedId(id_detalle)
    if (!historyById[id_detalle]) fetchHistory(id_detalle)
  }

  const pollHistory = useCallback(() => {
    if (expandedId != null) fetchHistory(expandedId, { silent: true })
  }, [expandedId, fetchHistory])

  usePolling(pollHistory, 15000)

  return { expandedId, historyById, historyLoadingId, toggleHistory }
}
