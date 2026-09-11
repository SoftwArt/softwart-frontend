// src/features/calculator/hooks/useCalculator.ts
import { apiRequest } from '@/src/shared/lib/apiClient'
import { useServerPagination } from '@/src/shared/hooks/useServerPagination'
import type { Marco, CreateMarcoDto, UpdateMarcoDto } from '../types'

type ApiResponse<T> = { success: boolean; message?: string; data: T; meta?: { total: number } }
type Filters = { estado: string }

async function fetchMarcosPage({ page, pageSize, q, filters }: {
  page: number; pageSize: number; q: string; filters: Filters
}) {
  const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
  if (q) params.set('q', q)
  if (filters.estado) params.set('estado', filters.estado)
  const res = await apiRequest<ApiResponse<Marco[]>>(`/api/frames?${params}`)
  return { data: res.data ?? [], total: res.meta?.total ?? 0 }
}

export function useCalculator(filters: Filters) {
  const sp = useServerPagination<Marco, Filters>({ fetchPage: fetchMarcosPage, filters })

  const onCreate = async (data: CreateMarcoDto) => {
    await apiRequest('/api/frames', { method: 'POST', body: JSON.stringify(data) })
    sp.refresh()
  }
  const onEdit = async (id: number, data: UpdateMarcoDto) => {
    await apiRequest(`/api/frames/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    sp.refresh()
  }
  const onDelete = async (id: number) => {
    await apiRequest(`/api/frames/${id}`, { method: 'DELETE' })
    sp.refresh()
  }
  const onToggleStatus = async (id: number) => {
    await apiRequest(`/api/frames/${id}/estado`, { method: 'PATCH' })
    sp.refresh()
  }

  return {
    marcos: sp.items, isLoading: sp.isLoading, error: sp.error,
    page: sp.page, setPage: sp.setPage, pageSize: sp.pageSize, setPageSize: sp.setPageSize,
    total: sp.total, totalPages: sp.totalPages,
    q: sp.q, setQ: sp.setQ,
    onCreate, onEdit, onDelete, onToggleStatus,
  }
}
