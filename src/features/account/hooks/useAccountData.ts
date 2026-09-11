// src/features/account/hooks/useAccountData.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'
import { usePolling } from '@/src/shared/hooks/usePolling'
import type { PerfilCliente, Cita, Servicio } from '../types'

type ApiResponse<T> = { success: boolean; message?: string; data: T }

export function useAccountData() {
  const [perfil,    setPerfil]    = useState<PerfilCliente | null>(null)
  const [citas,     setCitas]     = useState<Cita[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  // ── Derived ─────────────────────────────────────────────────────────────────
  const primerNombre = perfil?.nombre?.split(' ')[0] ?? ''

  const proximaCita = useMemo(() =>
    [...citas]
      .filter(c => {
        const n = c.appointmentStatus?.nombre?.toLowerCase() ?? ''
        return n.includes('pend') || n.includes('confirmada')
      })
      .sort((a, b) => a.fecha.localeCompare(b.fecha))[0] ?? null
  , [citas])

  const serviciosActivos = useMemo(() =>
    servicios.filter(s => {
      const e = s.estado.toLowerCase()
      return !e.includes('finaliz') && !e.includes('entreg') && !e.includes('cancel')
    }).length
  , [servicios])

  const ultimoServicio = useMemo(() =>
    [...servicios].sort((a, b) => b.fecha.localeCompare(a.fecha))[0] ?? null
  , [servicios])

  const serviciosRecientes = useMemo(() =>
    [...servicios].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 3)
  , [servicios])

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    const res = await apiRequest<ApiResponse<PerfilCliente>>('/api/account/perfil')
    setPerfil(res.data)
  }, [])

  // Diff antes de reemplazar el estado: si el refetch (manual o del polling) trae
  // exactamente lo mismo, se conserva la misma referencia y React no re-renderiza
  // la lista (evita parpadeo cuando no cambió nada).
  const fetchMyAppointments = useCallback(async () => {
    const res = await apiRequest<ApiResponse<Cita[]>>('/api/account/citas')
    const nuevas = res.data ?? []
    setCitas(prev => JSON.stringify(prev) === JSON.stringify(nuevas) ? prev : nuevas)
  }, [])

  const fetchMyServices = useCallback(async () => {
    const res = await apiRequest<ApiResponse<Servicio[]>>('/api/account/servicios')
    const nuevos = res.data ?? []
    setServicios(prev => JSON.stringify(prev) === JSON.stringify(nuevos) ? prev : nuevos)
  }, [])

  const refresh = useCallback(async () => {
    setIsLoading(true); setError(null)
    try {
      await Promise.all([fetchProfile(), fetchMyAppointments(), fetchMyServices()])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar tu cuenta')
    } finally {
      setIsLoading(false)
    }
  }, [fetchProfile, fetchMyAppointments, fetchMyServices])

  useEffect(() => { refresh() }, [refresh])

  // ── Refresh dinámico (polling scoped) ──────────────────────────────────────
  // Citas y servicios ya vienen filtrados por id_cliente del JWT en el backend
  // (myAppointments/myServices) — nunca puede traer datos de otro cliente.
  // Se pausa mientras hay una mutación propia en curso (cancelar cita, agendar)
  // para no pisar un update optimista con una respuesta vieja del servidor.
  const isMutatingRef = useRef(false)

  const pollQuietly = useCallback(() => {
    if (isMutatingRef.current) return
    fetchMyAppointments().catch(() => {})
    fetchMyServices().catch(() => {})
  }, [fetchMyAppointments, fetchMyServices])

  usePolling(pollQuietly, 15000)

  return {
    perfil, setPerfil, citas, servicios, isLoading, error, refresh,
    primerNombre, proximaCita, serviciosActivos, ultimoServicio, serviciosRecientes,
    fetchMyAppointments, isMutatingRef,
  }
}
