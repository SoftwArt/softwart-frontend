// ============================================================
// src/features/appointments/hooks/useAppointments.ts
// ============================================================
import { useEffect, useState } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'
import { useServerPagination } from '@/src/shared/hooks/useServerPagination'
import type { Cita, CreateCitaDto, UpdateCitaDto, EstadoCita, BackendCita } from '../types'

type ApiResponse<T> = { success: boolean; message?: string; data: T; meta?: { total: number } }
type Filters = { estado: string }

// Orden de exhibición en selects/filtros — no es el orden de id_estado_cita
// (Confirmada se agregó después, id 5, pero conceptualmente va 2ª en el
// flujo). El backend no garantiza un ORDER BY particular.
const ORDEN_ESTADOS = ['Pendiente', 'Confirmada', 'Completada', 'No Asistió', 'Cancelada']
const ordenarEstados = (estados: EstadoCita[]): EstadoCita[] =>
  [...estados].sort((a, b) => ORDEN_ESTADOS.indexOf(a.nombre) - ORDEN_ESTADOS.indexOf(b.nombre))

function normalizar(item: BackendCita): Cita {
  return {
    id_cita:        item.id_cita,
    fecha:          item.fecha,
    hora:           item.hora,
    id_cliente:     item.client?.id_cliente ?? 0,
    id_estado_cita: item.appointmentStatus?.id_estado_cita ?? 1,
    clienteNombre:  item.client?.nombre ?? `Cliente #${item.client?.id_cliente ?? '?'}`,
    motivoCancelacion: item.motivo_cancelacion ?? null,
    // Verde solo si la Venta sigue activa — una Venta anulada (ej. al
    // cancelar la cita antes, o directo desde Ventas) no representa un
    // flujo completado, así que no debería seguir mostrándose como tal.
    tieneVenta:     item.sale != null && item.sale.estado === true,
  }
}

async function fetchCitasPage({ page, pageSize, q, filters }: {
  page: number; pageSize: number; q: string; filters: Filters
}) {
  const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
  if (q) params.set('q', q)
  if (filters.estado) params.set('estado', filters.estado)
  const res = await apiRequest<ApiResponse<BackendCita[]>>(`/api/appointments?${params}`)
  return { data: (res.data ?? []).map(normalizar), total: res.meta?.total ?? 0 }
}

export function useAppointments(filters: Filters) {
  const sp = useServerPagination<Cita, Filters>({ fetchPage: fetchCitasPage, filters })

  const [estadosCita, setEstadosCita] = useState<EstadoCita[]>([])
  useEffect(() => {
    apiRequest<ApiResponse<EstadoCita[]>>('/api/appointment-status')
      .then(res => setEstadosCita(ordenarEstados(res.data ?? [])))
      .catch(() => {})
  }, [])

  const onCreate = async (data: CreateCitaDto) => {
    await apiRequest('/api/appointments', { method: 'POST', body: JSON.stringify(data) })
    sp.refresh()
  }

  const onEdit = async (id: number, data: UpdateCitaDto) => {
    await apiRequest(`/api/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    sp.refresh()
  }

  const onDelete = async (id: number) => {
    await apiRequest(`/api/appointments/${id}`, { method: 'DELETE' })
    sp.refresh()
  }

  const onChangeStatus = async (id: number, id_estado_cita: number) => {
    await apiRequest(`/api/appointment-status/cita/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ id_estado_cita }),
    })
    sp.refresh()
  }

  return {
    citas: sp.items, estadosCita, isLoading: sp.isLoading, error: sp.error,
    page: sp.page, setPage: sp.setPage, pageSize: sp.pageSize, setPageSize: sp.setPageSize,
    total: sp.total, totalPages: sp.totalPages,
    q: sp.q, setQ: sp.setQ,
    onCreate, onEdit, onDelete, onChangeStatus, refresh: sp.refresh,
  }
}
