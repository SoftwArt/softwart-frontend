// src/features/users/components/UsersPage.tsx
import { useUsers } from '../hooks/useUsers'
import { useUserForm } from '../hooks/useUserForm'
import { useRolesOptions } from '@/src/shared/hooks/useOptions'
import { useState } from 'react'
import type { Usuario } from '../types'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { EmptyState } from '@/src/shared/components/EmptyState'
import { CrudToolbar }  from '@/src/shared/components/CrudToolbar'
import { UsersTable } from './UsersTable'
import { UserFormDialog } from './UserFormDialog'
import { UserViewDialog } from './UserViewDialog'

export function UsersPage() {
  const [filterRol,    setFilterRol]    = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const {
    usuarios, isLoading, total, page, setPage, totalPages, pageSize, setPageSize, q, setQ,
    onCreate, onEdit, onDelete, onToggleStatus,
  } = useUsers({ rol: filterRol, estado: filterEstado })
  const { options: rolesOptsActivos, rawRoles } = useRolesOptions()

  const [isViewOpen,  setIsViewOpen]  = useState(false)
  const [viewingItem, setViewingItem] = useState<Usuario | null>(null)
  const openView = (u: Usuario) => { setViewingItem(u); setIsViewOpen(true) }

  const form = useUserForm({ usuarios, rolesOptsActivos, rawRoles, onCreate, onEdit })

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-serif text-3xl text-secondary">Usuarios</h1>
        <p className="text-muted-foreground">Gestiona los usuarios del sistema</p>
      </div>

      <div className="flex flex-col gap-2">
        <CrudToolbar
          searchValue={q} onSearchChange={setQ}
          searchPlaceholder="Buscar por correo o rol..."
          filters={[
            { key: 'rol', label: 'Rol', type: 'select', value: filterRol, onChange: setFilterRol,
              options: [{ value: '1', label: 'Admin' }, { value: '3', label: 'Cliente' }] },
            { key: 'estado', label: 'Estado', type: 'chips', value: filterEstado, onChange: setFilterEstado,
              options: [{ value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }] },
          ]}
          onClearFilters={() => { setFilterRol(''); setFilterEstado('') }}
          createLabel="Registrar Usuario"
          onCreate={form.openCreate}
        />

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={`sk-${i}`} className="h-12 w-full rounded-md" />)}</div>
        ) : total === 0 ? (
          <EmptyState title="Sin resultados" description="No hay usuarios que coincidan con la búsqueda." />
        ) : (
          <UsersTable
            usuarios={usuarios}
            rawRoles={rawRoles}
            page={page} totalPages={totalPages} total={total} pageSize={pageSize}
            onPageChange={setPage} onPageSizeChange={setPageSize}
            onView={openView}
            onEdit={form.openEdit}
            onToggleStatus={onToggleStatus}
            onDelete={onDelete}
          />
        )}
      </div>

      {viewingItem && (
        <UserViewDialog open={isViewOpen} onOpenChange={setIsViewOpen} usuario={viewingItem} rawRoles={rawRoles} />
      )}

      <UserFormDialog
        open={form.isFormOpen}
        onOpenChange={(v) => { form.setIsFormOpen(v); if (!v) form.resetForm() }}
        editingId={form.editingId}
        correo={form.correo} onCorreoChange={form.setCorreo}
        clave={form.clave} onClaveChange={form.setClave}
        idRol={form.idRol} onIdRolChange={form.setIdRol}
        rolesOptsForm={form.rolesOptsForm}
        errors={form.errors}
        correoFormatoError={form.correoFormatoError}
        editingIsAdminBase={form.editingIsAdminBase}
        isSubmitting={form.isSubmitting}
        onSubmit={form.handleSubmit}
        onCancel={() => { form.setIsFormOpen(false); form.resetForm() }}
      />
    </div>
  )
}
