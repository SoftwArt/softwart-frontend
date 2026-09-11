// src/features/clients/components/ClientsPage.tsx
import { useClients } from '../hooks/useClients'
import { useClientForm } from '../hooks/useClientForm'
import { useState } from 'react'
import type { Cliente } from '../types'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { EmptyState } from '@/src/shared/components/EmptyState'
import { CrudToolbar }   from '@/src/shared/components/CrudToolbar'
import { ClientsTable } from './ClientsTable'
import { ClientFormDialog } from './ClientFormDialog'
import { ClientViewDialog } from './ClientViewDialog'

export function ClientsPage() {
  const [filterEstado, setFilterEstado] = useState('')
  const {
    clientes, isLoading, total, page, setPage, totalPages, pageSize, setPageSize, q, setQ,
    onCreate, onEdit, onDelete, onToggleStatus,
  } = useClients({ estado: filterEstado })

  const [isViewOpen,  setIsViewOpen]  = useState(false)
  const [viewingItem, setViewingItem] = useState<Cliente | null>(null)
  const openView = (c: Cliente) => { setViewingItem(c); setIsViewOpen(true) }

  const form = useClientForm({ onCreate, onEdit })

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-serif text-3xl text-secondary">Clientes</h1>
        <p className="text-muted-foreground">Gestiona los clientes registrados</p>
      </div>

      {/* gap-2 (no gap-4) entre el toolbar y la tabla: se quiere la barra de
          búsqueda/filtro/crear pegada a la tabla, no separada como el resto
          de bloques de la página. */}
      <div className="flex flex-col gap-2">
        <CrudToolbar
          searchValue={q} onSearchChange={setQ}
          searchPlaceholder="Buscar nombre, documento, correo..."
          filters={[
            { key: 'estado', label: 'Estado', type: 'chips', value: filterEstado, onChange: setFilterEstado,
              options: [{ value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }] },
          ]}
          onClearFilters={() => setFilterEstado('')}
          createLabel="Registrar Cliente"
          onCreate={form.openCreate}
        />

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={`sk-${i}`} className="h-12 w-full rounded-md" />)}
          </div>
        ) : total === 0 ? (
          <EmptyState title="Sin resultados" description="No hay clientes que coincidan con la búsqueda." />
        ) : (
          <ClientsTable
            clientes={clientes}
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
        <ClientViewDialog open={isViewOpen} onOpenChange={setIsViewOpen} cliente={viewingItem} />
      )}

      <ClientFormDialog
        open={form.isFormOpen}
        onOpenChange={form.setIsFormOpen}
        editingId={form.editingId}
        tipoDocumento={form.tipoDocumento} onTipoDocumentoChange={form.setTipoDocumento}
        documento={form.documento} onDocumentoChange={form.setDocumento}
        nombre={form.nombre} onNombreChange={form.setNombre}
        correo={form.correo} onCorreoChange={form.setCorreo}
        telefono={form.telefono} onTelefonoChange={form.setTelefono}
        acceptToS={form.acceptToS} onAcceptToSChange={form.setAcceptToS}
        acceptPrivacy={form.acceptPrivacy} onAcceptPrivacyChange={form.setAcceptPrivacy}
        legalModal={form.legalModal} onLegalModalChange={form.setLegalModal}
        errors={form.errors}
        documentoFormatoError={form.documentoFormatoError}
        correoFormatoError={form.correoFormatoError}
        telefonoFormatoError={form.telefonoFormatoError}
        isSubmitting={form.isSubmitting}
        onSubmit={form.handleSubmit}
        onCancel={() => form.setIsFormOpen(false)}
      />
    </div>
  )
}
