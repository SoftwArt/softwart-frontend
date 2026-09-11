// src/features/services/components/ServicesPage.tsx
import { useServices } from '../hooks/useServices'
import { useServiceForm } from '../hooks/useServiceForm'
import { useState } from 'react'
import { toast } from 'sonner'
import type { Servicio } from '../types'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { EmptyState }    from '@/src/shared/components/EmptyState'
import { CrudToolbar }   from '@/src/shared/components/CrudToolbar'
import { ServicesTable } from './ServicesTable'
import { ServiceFormDialog } from './ServiceFormDialog'
import { ServiceViewDialog } from './ServiceViewDialog'

export function ServicesPage() {
  const [filterEstado, setFilterEstado] = useState('')
  const {
    servicios, isLoading, total, page, setPage, totalPages, pageSize, setPageSize, q, setQ,
    onCreate, onEdit, onDelete, onToggleStatus,
  } = useServices({ estado: filterEstado })

  const [isViewOpen,  setIsViewOpen]  = useState(false)
  const [viewingItem, setViewingItem] = useState<Servicio | null>(null)
  const openView = (s: Servicio) => { setViewingItem(s); setIsViewOpen(true) }

  const form = useServiceForm({ onCreate, onEdit })

  const handleDelete = async (id: number) => {
    const err = await onDelete(id)
    if (err) toast.error(err)
    else toast.success('Tipo de servicio eliminado')
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-serif text-3xl text-secondary">Tipos de Servicio</h1>
        <p className="text-muted-foreground">Gestiona los tipos de servicio disponibles</p>
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
          createLabel="Registrar Tipo"
          onCreate={form.openCreate}
        />

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={`sk-${i}`} className="h-12 w-full rounded-md" />)}</div>
        ) : total === 0 ? (
          <EmptyState title="Sin resultados" description="No hay servicios que coincidan." />
        ) : (
          <ServicesTable
            servicios={servicios}
            page={page} totalPages={totalPages} total={total} pageSize={pageSize}
            onPageChange={setPage} onPageSizeChange={setPageSize}
            onView={openView}
            onEdit={form.openEdit}
            onToggleStatus={onToggleStatus}
            onDelete={handleDelete}
          />
        )}
      </div>

      {viewingItem && (
        <ServiceViewDialog open={isViewOpen} onOpenChange={setIsViewOpen} servicio={viewingItem} />
      )}

      <ServiceFormDialog
        open={form.isFormOpen}
        onOpenChange={v => { form.setIsFormOpen(v); if (!v) form.resetForm() }}
        editingId={form.editingId}
        nombre={form.nombre} onNombreChange={form.setNombre}
        duracionStr={form.duracionStr} onDuracionChange={form.setDuracionStr}
        descripcion={form.descripcion} onDescripcionChange={form.setDescripcion}
        errors={form.errors}
        isSubmitting={form.isSubmitting}
        onSubmit={form.handleSubmit}
        onCancel={() => { form.setIsFormOpen(false); form.resetForm() }}
      />
    </div>
  )
}
