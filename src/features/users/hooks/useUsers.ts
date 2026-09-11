// ============================================================
// src/features/users/hooks/useUsers.ts
// ============================================================
import { apiRequest } from '@/src/shared/lib/apiClient'
import { useServerPagination } from '@/src/shared/hooks/useServerPagination'
import type { Usuario, CreateUsuarioDto, UpdateUsuarioDto, BackendUsuario } from '../types'

type ApiResponse<T> = { success: boolean; message?: string; data: T; meta?: { total: number } }
type Filters = { rol: string; estado: string }

async function fetchUsuariosPage({ page, pageSize, q, filters }: {
  page: number; pageSize: number; q: string; filters: Filters
}) {
  const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
  if (q) params.set('q', q)
  if (filters.rol)    params.set('rol', filters.rol)
  if (filters.estado) params.set('estado', filters.estado)
  const res = await apiRequest<ApiResponse<BackendUsuario[]>>(`/api/users?${params}`)
  const data: Usuario[] = (res.data ?? []).map((u) => ({
    id_usuario:    u.id_usuario,
    correo:        u.correo,
    clave:         '',
    estado:        u.estado,
    id_rol:        u.role?.id_rol ?? 0,
    es_admin_base: u.es_admin_base ?? false,
  }))
  return { data, total: res.meta?.total ?? 0 }
}

export function useUsers(filters: Filters) {
  const sp = useServerPagination<Usuario, Filters>({ fetchPage: fetchUsuariosPage, filters })

  const onCreate = async (data: CreateUsuarioDto) => {
    await apiRequest('/api/users', { method: 'POST', body: JSON.stringify(data) })
    sp.refresh()
  }

  const onEdit = async (id: number, data: UpdateUsuarioDto) => {
    await apiRequest(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    sp.refresh()
  }

  const onDelete = async (id: number) => {
    await apiRequest(`/api/users/${id}`, { method: 'DELETE' })
    sp.refresh()
  }

  const onToggleStatus = async (id: number) => {
    await apiRequest(`/api/users/${id}/estado`, { method: 'PATCH' })
    sp.refresh()
  }

  return {
    usuarios: sp.items, isLoading: sp.isLoading, error: sp.error,
    page: sp.page, setPage: sp.setPage, pageSize: sp.pageSize, setPageSize: sp.setPageSize,
    total: sp.total, totalPages: sp.totalPages,
    q: sp.q, setQ: sp.setQ,
    onCreate, onEdit, onDelete, onToggleStatus,
  }
}
