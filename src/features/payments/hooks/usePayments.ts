// ============================================================
// src/features/payments/hooks/usePayments.ts
// ============================================================
import { useEffect, useState } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'
import { useServerPagination } from '@/src/shared/hooks/useServerPagination'
import type { Pago, MetodoPago, EstadoPago, CreatePagoDto, UpdatePagoDto, BackendPago } from '../types'

type ApiResponse<T> = { success: boolean; message?: string; data: T; meta?: { total: number } }
type Filters = { metodo: string; estado: string }

async function fetchPagosPage({ page, pageSize, q, filters }: {
  page: number; pageSize: number; q: string; filters: Filters
}) {
  const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
  if (q) params.set('q', q)
  if (filters.metodo) params.set('metodo', filters.metodo)
  if (filters.estado) params.set('estado', filters.estado)
  const res = await apiRequest<ApiResponse<BackendPago[]>>(`/api/payments?${params}`)
  const data: Pago[] = (res.data ?? []).map((item) => ({
    id_pago:        item.id_pago,
    fecha:          item.fecha,
    monto:          item.monto,
    observacion:    item.observacion,
    id_venta:       item.sale?.id_venta               ?? 0,
    id_metodo_pago: item.paymentMethod?.id_metodo_pago ?? 0,
    id_estado_pago: item.paymentStatus?.id_estado_pago ?? 0,
  }))
  return { data, total: res.meta?.total ?? 0 }
}

export function usePayments(filters: Filters) {
  const sp = useServerPagination<Pago, Filters>({ fetchPage: fetchPagosPage, filters })

  // Catálogos chicos (no paginados) — se cargan una vez, aparte de la lista.
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [estadosPago, setEstadosPago] = useState<EstadoPago[]>([])
  useEffect(() => {
    Promise.all([
      apiRequest<ApiResponse<MetodoPago[]>>('/api/payment-methods'),
      apiRequest<ApiResponse<EstadoPago[]>>('/api/payment-status'),
    ]).then(([m, e]) => {
      setMetodosPago(m.data ?? [])
      setEstadosPago(e.data ?? [])
    }).catch(() => {})
  }, [])

  const onCreate = async (data: CreatePagoDto) => {
    await apiRequest('/api/payments', { method: 'POST', body: JSON.stringify(data) })
    sp.refresh()
  }

  const onEdit = async (id: number, data: UpdatePagoDto) => {
    await apiRequest(`/api/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    sp.refresh()
  }

  const onDelete = async (id: number) => {
    await apiRequest(`/api/payments/${id}`, { method: 'DELETE' })
    sp.refresh()
  }

  const onChangeStatus = async (id: number, id_estado_pago: number) => {
    await apiRequest(`/api/payment-status/pago/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ id_estado_pago }),
    })
    sp.refresh()
  }

  const onChangeMethod = async (id: number, id_metodo_pago: number) => {
    await apiRequest(`/api/payment-methods/pago/${id}/metodo`, {
      method: 'PATCH',
      body: JSON.stringify({ id_metodo_pago }),
    })
    sp.refresh()
  }

  return {
    pagos: sp.items, metodosPago, estadosPago, isLoading: sp.isLoading, error: sp.error,
    page: sp.page, setPage: sp.setPage, pageSize: sp.pageSize, setPageSize: sp.setPageSize,
    total: sp.total, totalPages: sp.totalPages,
    q: sp.q, setQ: sp.setQ,
    onCreate, onEdit, onDelete, onChangeStatus, onChangeMethod,
  }
}
