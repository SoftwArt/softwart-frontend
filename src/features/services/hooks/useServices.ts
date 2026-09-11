// src/features/services/hooks/useServices.ts
import { apiRequest } from '@/src/shared/lib/apiClient'
import { useServerPagination } from '@/src/shared/hooks/useServerPagination'
import type { Servicio, CreateServicioDto, UpdateServicioDto } from '../types'

type ApiResponse<T> = { success: boolean; data: T; meta?: { total: number } }
type Filters = { estado: string }

async function fetchServiciosPage({ page, pageSize, q, filters }: {
  page: number; pageSize: number; q: string; filters: Filters
}) {
  const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
  if (q) params.set('q', q)
  if (filters.estado) params.set('estado', filters.estado)
  const res = await apiRequest<ApiResponse<Servicio[]>>(`/api/services?${params}`)
  const data = (res.data ?? []).map(s => ({
    ...s,
    duracion: Number(s.duracion ?? 0),
    estado:   s.estado !== false,
  }))
  return { data, total: res.meta?.total ?? 0 }
}

export function useServices(filters: Filters) {
  const sp = useServerPagination<Servicio, Filters>({ fetchPage: fetchServiciosPage, filters })

  const onCreate = async (data: CreateServicioDto) => {
    await apiRequest('/api/services', { method: 'POST', body: JSON.stringify(data) })
    sp.refresh()
  }

  const onEdit = async (id: number, data: UpdateServicioDto) => {
    await apiRequest(`/api/services/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    sp.refresh()
  }

  const onDelete = async (id: number): Promise<string | null> => {
    try {
      await apiRequest(`/api/services/${id}`, { method: 'DELETE' })
      sp.refresh()
      return null
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al eliminar'
      const esFk = msg.includes('500') || msg.includes('409') ||
        msg.toLowerCase().includes('foreign') || msg.toLowerCase().includes('constraint')
      return esFk
        ? 'No se puede eliminar: este tipo de servicio está siendo usado en pedidos existentes.'
        : msg
    }
  }

  const onToggleStatus = async (id: number) => {
    await apiRequest(`/api/services/${id}/estado`, { method: 'PATCH' })
    sp.refresh()
  }

  return {
    servicios: sp.items, isLoading: sp.isLoading, error: sp.error,
    page: sp.page, setPage: sp.setPage, pageSize: sp.pageSize, setPageSize: sp.setPageSize,
    total: sp.total, totalPages: sp.totalPages,
    q: sp.q, setQ: sp.setQ,
    onCreate, onEdit, onDelete, onToggleStatus,
  }
}
