// src/features/roles/components/RolesPage.tsx
import { useRoles } from '../hooks/useRoles'
import { useRoleForm } from '../hooks/useRoleForm'
import { useState } from 'react'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { EmptyState }    from '@/src/shared/components/EmptyState'
import { CrudToolbar }   from '@/src/shared/components/CrudToolbar'
import type { Rol } from '../types'
import { RolesTable } from './RolesTable'
import { RoleFormDialog } from './RoleFormDialog'
import { RoleViewDialog } from './RoleViewDialog'

export function RolesPage() {
  const [filterEstado, setFilterEstado] = useState('')
  const {
    roles, isLoading, total, page, setPage, totalPages, pageSize, setPageSize, q, setQ,
    onCreate, onEdit, onDelete, onToggleStatus,
  } = useRoles({ estado: filterEstado })

  const [isViewOpen,  setIsViewOpen]  = useState(false)
  const [viewingItem, setViewingItem] = useState<Rol | null>(null)
  const openView = (r: Rol) => { setViewingItem(r); setIsViewOpen(true) }

  const form = useRoleForm({ onCreate, onEdit })

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-serif text-3xl text-secondary">Roles</h1>
        <p className="text-muted-foreground">Gestiona los roles del sistema</p>
      </div>

      <div className="flex flex-col gap-2">
        <CrudToolbar
          searchValue={q} onSearchChange={setQ}
          searchPlaceholder="Buscar nombre o descripción..."
          filters={[
            { key: 'estado', label: 'Estado', type: 'chips', value: filterEstado, onChange: setFilterEstado,
              options: [{ value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }] },
          ]}
          onClearFilters={() => setFilterEstado('')}
          createLabel="Registrar Rol"
          onCreate={form.openCreate}
        />

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={`sk-${i}`} className="h-12 w-full rounded-md" />)}</div>
        ) : total === 0 ? (
          <EmptyState title="Sin resultados" description="No hay roles que coincidan." />
        ) : (
          <RolesTable
            roles={roles}
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
        <RoleViewDialog open={isViewOpen} onOpenChange={setIsViewOpen} rol={viewingItem} />
      )}

      <RoleFormDialog
        open={form.isFormOpen}
        onOpenChange={(v) => { form.setIsFormOpen(v); if (!v) form.resetForm() }}
        editingId={form.editingId}
        nombre={form.nombre} onNombreChange={form.setNombre}
        descripcion={form.descripcion} onDescripcionChange={form.setDescripcion}
        errors={form.errors}
        isSubmitting={form.isSubmitting}
        onSubmit={form.handleSubmit}
        onCancel={() => { form.setIsFormOpen(false); form.resetForm() }}
      />
    </div>
  )
}
