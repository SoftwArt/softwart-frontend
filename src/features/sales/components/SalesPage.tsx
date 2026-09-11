// src/features/sales/components/SalesPage.tsx
import { useSales } from '../hooks/useSales'
import { useSaleForm } from '../hooks/useSaleForm'
import { useSaleDangerZone } from '../hooks/useSaleDangerZone'
import { useClientsOptions, useAppointmentsOptions } from '@/src/shared/hooks/useOptions'
import { SaleInstallmentModal } from './SaleInstallmentModal'
import { useEffect, useState } from 'react'
import type { Venta } from '../types'
import { useSearchParams } from 'react-router-dom'
import { CrudToolbar } from '@/src/shared/components/CrudToolbar'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { EmptyState } from '@/src/shared/components/EmptyState'
import { SalesTable } from './SalesTable'
import { SaleFormDialog } from './SaleFormDialog'
import { SaleViewDialog } from './SaleViewDialog'
import { SaleAnnulAlert } from './SaleAnnulAlert'
import { SaleDeleteAlert } from './SaleDeleteAlert'

export function SalesPage() {
  const [searchParams] = useSearchParams()
  const [filterEstado, setFilterEstado] = useState('')
  const {
    ventas, isLoading, total, page, setPage, totalPages, pageSize, setPageSize, q, setQ,
    onCreate, onEdit, onToggleStatus, onDelete, refetch,
  } = useSales({ estado: filterEstado })

  useEffect(() => {
    const initialQ = searchParams.get('q')
    if (initialQ) setQ(initialQ)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [abonoModalVenta, setAbonoModalVenta] = useState<{ id: number; label: string } | null>(null)
  const { options: clientesOpts, rawClientes, search: searchClientes } = useClientsOptions()
  const { options: citasOpts, rawCitas } = useAppointmentsOptions()

  const [isViewOpen,  setIsViewOpen]  = useState(false)
  const [viewingItem, setViewingItem] = useState<Venta | null>(null)
  const openView = (v: Venta) => { setViewingItem(v); setIsViewOpen(true) }

  const form = useSaleForm({ citasOpts, rawCitas, onCreate, onEdit })
  const dangerZone = useSaleDangerZone({ onToggleStatus, onDelete, refetch })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl text-secondary">Pedidos</h1>
        <p className="text-muted-foreground">Gestiona los pedidos registrados</p>
      </div>

      <div className="flex flex-col gap-2">
        <CrudToolbar
          searchValue={q} onSearchChange={setQ}
          searchPlaceholder="Buscar cliente, cita, fecha..."
          filters={[
            { key: 'estado', label: 'Estado', type: 'chips', value: filterEstado, onChange: setFilterEstado,
              options: [{ value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }] },
          ]}
          onClearFilters={() => setFilterEstado('')}
          createLabel="Registrar Pedido"
          onCreate={form.openCreate}
        />

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={`sk-${i}`} className="h-12 w-full rounded-md" />)}</div>
        ) : total === 0 ? (
          <EmptyState title="Sin registros" description="No hay pedidos registrados aún." />
        ) : (
          <SalesTable
            ventas={ventas}
            clientesOpts={clientesOpts} citasOpts={citasOpts}
            rawClientes={rawClientes}
            page={page} totalPages={totalPages} total={total} pageSize={pageSize}
            onPageChange={setPage} onPageSizeChange={setPageSize}
            onView={openView}
            onAnular={dangerZone.openAnular}
            onEliminar={dangerZone.openEliminar}
            onManagePayments={setAbonoModalVenta}
          />
        )}
      </div>

      {viewingItem && (
        <SaleViewDialog
          open={isViewOpen} onOpenChange={setIsViewOpen}
          venta={viewingItem}
          clientesOpts={clientesOpts} citasOpts={citasOpts} rawClientes={rawClientes}
        />
      )}

      <SaleFormDialog
        open={form.isFormOpen}
        onOpenChange={v => { form.setIsFormOpen(v); if (!v) form.resetForm() }}
        editingId={form.editingId}
        clientesOpts={clientesOpts} onSearchClientes={searchClientes}
        citasFormOpts={form.citasFormOpts}
        idCliente={form.idCliente} onIdClienteChange={form.setIdCliente}
        idCita={form.idCita} onIdCitaChange={form.setIdCita}
        fecha={form.fecha} onFechaChange={form.setFecha}
        total={form.total} onTotalChange={form.setTotal}
        observacion={form.observacion} onObservacionChange={form.setObservacion}
        errors={form.errors}
        isSubmitting={form.isSubmitting}
        onSubmit={form.handleSubmit}
        onCancel={() => { form.setIsFormOpen(false); form.resetForm() }}
      />

      <SaleAnnulAlert
        target={dangerZone.anularTarget}
        onOpenChange={(o) => { if (!o) dangerZone.setAnularTarget(null) }}
        onConfirm={dangerZone.confirmAnular}
      />

      <SaleDeleteAlert
        target={dangerZone.eliminarTarget}
        onOpenChange={(o) => { if (!o) dangerZone.setEliminarTarget(null) }}
        onConfirm={dangerZone.confirmEliminar}
      />

      {abonoModalVenta && (
        <SaleInstallmentModal
          open={abonoModalVenta !== null}
          onClose={() => setAbonoModalVenta(null)}
          idVenta={abonoModalVenta.id}
          labelVenta={abonoModalVenta.label}
          onSuccess={refetch}
        />
      )}
    </div>
  )
}
