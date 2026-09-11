// src/features/roles/hooks/useRoles.ts
import { apiRequest } from '@/src/shared/lib/apiClient'
import { useServerPagination } from '@/src/shared/hooks/useServerPagination'
import type { Rol, CreateRolDto, UpdateRolDto } from '../types'

type ApiResponse<T> = { success: boolean; message?: string; data: T; meta?: { total: number } }
type Filters = { estado: string }

async function fetchRolesPage({ page, pageSize, q, filters }: {
  page: number; pageSize: number; q: string; filters: Filters
}) {
  const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
  if (q) params.set('q', q)
  if (filters.estado) params.set('estado', filters.estado)
  const res = await apiRequest<ApiResponse<Rol[]>>(`/api/roles?${params}`)
  return { data: res.data ?? [], total: res.meta?.total ?? 0 }
}

export function useRoles(filters: Filters) {
  const sp = useServerPagination<Rol, Filters>({ fetchPage: fetchRolesPage, filters })

  const onCreate = async (data: CreateRolDto) => {
    await apiRequest('/api/roles', { method: 'POST', body: JSON.stringify(data) })
    sp.refresh()
  }
  const onEdit = async (id: number, data: UpdateRolDto) => {
    await apiRequest(`/api/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    sp.refresh()
  }
  const onDelete = async (id: number) => {
    await apiRequest(`/api/roles/${id}`, { method: 'DELETE' })
    sp.refresh()
  }
  const onToggleStatus = async (id: number) => {
    await apiRequest(`/api/roles/${id}/estado`, { method: 'PATCH' })
    sp.refresh()
  }

  return {
    roles: sp.items, isLoading: sp.isLoading, error: sp.error,
    page: sp.page, setPage: sp.setPage, pageSize: sp.pageSize, setPageSize: sp.setPageSize,
    total: sp.total, totalPages: sp.totalPages,
    q: sp.q, setQ: sp.setQ,
    onCreate, onEdit, onDelete, onToggleStatus,
  }
}
