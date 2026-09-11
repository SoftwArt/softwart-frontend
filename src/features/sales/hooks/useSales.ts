// src/features/sales/hooks/useSales.ts
import { apiRequest } from '@/src/shared/lib/apiClient'
import { useServerPagination } from '@/src/shared/hooks/useServerPagination'
import type { Venta, CreateVentaDto, UpdateVentaDto, BackendVenta } from '../types'

type ApiResponse<T> = { success: boolean; message?: string; data: T; meta?: { total: number } }
type Filters = { estado: string }

async function fetchVentasPage({ page, pageSize, q, filters }: {
  page: number; pageSize: number; q: string; filters: Filters
}) {
  const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
  if (q) params.set('q', q)
  if (filters.estado) params.set('estado', filters.estado)
  const res = await apiRequest<ApiResponse<BackendVenta[]>>(`/api/sales?${params}`)
  const data: Venta[] = (res.data ?? []).map(item => ({
    id_venta: item.id_venta, fecha: item.fecha, total: item.total,
    observacion: item.observacion, estado: item.estado,
    id_cliente: item.client?.id_cliente ?? 0,
    id_cita: item.appointment?.id_cita ?? null,
    num_abonos: item.num_abonos ?? 2,
    pagos_realizados: (item.payments ?? []).filter(p => !p.paymentStatus?.nombre?.toLowerCase().includes('anulado')).length,
    tiene_abono_validado: (item.payments ?? []).some(p => p.paymentStatus?.nombre?.toLowerCase().includes('validado')),
  }))
  return { data, total: res.meta?.total ?? 0 }
}

export function useSales(filters: Filters) {
  const sp = useServerPagination<Venta, Filters>({ fetchPage: fetchVentasPage, filters })

  const onCreate = async (data: CreateVentaDto) => {
    await apiRequest('/api/sales', { method: 'POST', body: JSON.stringify(data) })
    sp.refresh()
  }
  const onEdit = async (id: number, data: UpdateVentaDto) => {
    await apiRequest(`/api/sales/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    sp.refresh()
  }
  const onToggleStatus = async (id: number) => {
    await apiRequest(`/api/sales/${id}/estado`, { method: 'PATCH' })
    sp.refresh()
  }
  const onDelete = async (id: number) => {
    await apiRequest(`/api/sales/${id}`, { method: 'DELETE' })
    sp.refresh()
  }

  return {
    ventas: sp.items, isLoading: sp.isLoading, error: sp.error,
    page: sp.page, setPage: sp.setPage, pageSize: sp.pageSize, setPageSize: sp.setPageSize,
    total: sp.total, totalPages: sp.totalPages,
    q: sp.q, setQ: sp.setQ,
    onCreate, onEdit, onToggleStatus, onDelete, refetch: sp.refresh,
  }
}
