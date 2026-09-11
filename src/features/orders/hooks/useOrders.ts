// src/features/orders/hooks/useOrders.ts
import { apiRequest } from '@/src/shared/lib/apiClient'
import { useServerPagination } from '@/src/shared/hooks/useServerPagination'
import type { Pedido, CreatePedidoDto, UpdatePedidoDto, BackendDetalle } from '../types'

type ApiResponse<T> = { success: boolean; message?: string; data: T; meta?: { total: number } }
type Filters = { estado: string; servicio: string }

async function fetchPedidosPage({ page, pageSize, q, filters }: {
  page: number; pageSize: number; q: string; filters: Filters
}) {
  const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
  if (q) params.set('q', q)
  if (filters.estado)   params.set('estado', filters.estado)
  if (filters.servicio) params.set('servicio', filters.servicio)
  const res = await apiRequest<ApiResponse<BackendDetalle[]>>(`/api/sale-details?${params}`)
  const data: Pedido[] = (res.data ?? []).map(item => ({
    id_detalle:     item.id_detalle,
    fecha:          item.fecha,
    fecha_estimada: item.fecha_estimada ?? null,
    precio:      item.precio,
    observacion: item.observacion,
    estado:      item.estado,
    id_venta:    item.sale?.id_venta         ?? 0,
    id_servicio: item.service?.id_servicio   ?? 0,
    id_estado:   item.serviceStatus?.id_estado ?? 1,
    id_marco:    item.frame?.id_marco         ?? null,
  }))
  return { data, total: res.meta?.total ?? 0 }
}

export function useOrders(filters: Filters) {
  const sp = useServerPagination<Pedido, Filters>({ fetchPage: fetchPedidosPage, filters })

  const onCreate = async (data: CreatePedidoDto) => {
    await apiRequest('/api/sale-details', { method: 'POST', body: JSON.stringify(data) })
    sp.refresh()
  }

  const onEdit = async (id: number, data: UpdatePedidoDto) => {
    await apiRequest(`/api/sale-details/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    sp.refresh()
  }

  const onChangeStatus = async (id: number, id_estado: number) => {
    // FIX: backend lee req.body.id_estado, no id_estado_servicio
    await apiRequest(`/api/service-status/detalle/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ id_estado }),
    })
    sp.refresh()
  }

  const onDelete = async (id: number) => {
    await apiRequest(`/api/sale-details/${id}`, { method: 'DELETE' })
    sp.refresh()
  }

  return {
    pedidos: sp.items, isLoading: sp.isLoading, error: sp.error,
    page: sp.page, setPage: sp.setPage, pageSize: sp.pageSize, setPageSize: sp.setPageSize,
    total: sp.total, totalPages: sp.totalPages,
    q: sp.q, setQ: sp.setQ,
    onCreate, onEdit, onChangeStatus, onDelete,
  }
}
