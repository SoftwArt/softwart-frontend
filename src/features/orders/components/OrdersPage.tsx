// src/features/orders/components/OrdersPage.tsx
import { useOrders } from '../hooks/useOrders'
import { useEstadosServicio } from '../hooks/useEstadosServicio'
import { useOrderForm } from '../hooks/useOrderForm'
import { useOrderStatusFlow } from '../hooks/useOrderStatusFlow'
import { useOrderHistory } from '../hooks/useOrderHistory'
import { useSalesOptions, useServicesOptions, useFrameOptions } from '@/src/shared/hooks/useOptions'
import { useEffect, useState } from 'react'
import type { Pedido } from '../types'
import { useSearchParams } from 'react-router-dom'
import { CrudToolbar } from '@/src/shared/components/CrudToolbar'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { EmptyState } from '@/src/shared/components/EmptyState'
import { OrdersTable } from './OrdersTable'
import { OrderFormDialog } from './OrderFormDialog'
import { OrderViewDialog } from './OrderViewDialog'
import { OrderCancelAlert } from './OrderCancelAlert'
import { OrderAdvanceAlert } from './OrderAdvanceAlert'
import { OrderDeleteAlert } from './OrderDeleteAlert'

export function OrdersPage() {
  const [searchParams] = useSearchParams()
  const [filterEstado,   setFilterEstado]   = useState('')
  const [filterServicio, setFilterServicio] = useState('')

  const {
    pedidos, isLoading, total, page, setPage, totalPages, pageSize, setPageSize, q, setQ,
    onCreate, onEdit, onChangeStatus, onDelete,
  } = useOrders({ estado: filterEstado, servicio: filterServicio })

  // Deep-link desde otra página (ej. "Ver pedidos" con ?q=...) — se aplica
  // una sola vez al montar.
  useEffect(() => {
    const initialQ = searchParams.get('q')
    if (initialQ) setQ(initialQ)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { options: ventasOpts, rawVentas, search: searchVentas } = useSalesOptions()
  const { options: serviciosOpts, rawServicios } = useServicesOptions()
  const { options: marcosOpts }    = useFrameOptions()
  const estados = useEstadosServicio()

  const [isViewOpen,  setIsViewOpen]  = useState(false)
  const [viewingItem, setViewingItem] = useState<Pedido | null>(null)

  const form = useOrderForm({ estados, rawVentas, rawServicios, onCreate, onEdit })
  const statusFlow = useOrderStatusFlow({ estados, onChangeStatus, onDelete })
  const history = useOrderHistory()

  const openView = (p: Pedido) => { setViewingItem(p); setIsViewOpen(true); history.load(p.id_detalle) }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl text-secondary">Servicios</h1>
        <p className="text-muted-foreground">Gestiona los servicios registrados</p>
      </div>

      <div className="flex flex-col gap-2">
        <CrudToolbar
          searchValue={q} onSearchChange={setQ}
          searchPlaceholder="Buscar pedido, tipo de servicio, marco, fecha..."
          filters={[
            { key: 'estado', label: 'Estado', type: 'select', value: filterEstado, onChange: setFilterEstado,
              options: estados.map(e => ({ value: String(e.id_estado), label: e.nombre })) },
            { key: 'servicio', label: 'Tipo de Servicio', type: 'select', value: filterServicio, onChange: setFilterServicio,
              options: serviciosOpts },
          ]}
          onClearFilters={() => { setFilterEstado(''); setFilterServicio('') }}
          createLabel="Registrar Servicio"
          onCreate={form.openCreate}
        />

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={`sk-${i}`} className="h-12 w-full rounded-md" />)}</div>
        ) : total === 0 ? (
          <EmptyState title="Sin registros" description="No hay pedidos registrados aún." />
        ) : (
          <OrdersTable
            pedidos={pedidos}
            estados={estados}
            ventasOpts={ventasOpts} serviciosOpts={serviciosOpts} marcosOpts={marcosOpts}
            rawVentas={rawVentas}
            page={page} totalPages={totalPages} total={total} pageSize={pageSize}
            onPageChange={setPage} onPageSizeChange={setPageSize}
            onView={openView}
            onEdit={form.openEdit}
            onDelete={(p, servicioLabel) => statusFlow.requestDelete(p.id_detalle, `Servicio #${p.id_detalle} · ${servicioLabel}`)}
            onChangeStatus={statusFlow.handleCambiarEstado}
          />
        )}
      </div>

      {viewingItem && (
        <OrderViewDialog
          open={isViewOpen} onOpenChange={setIsViewOpen}
          pedido={viewingItem}
          estados={estados}
          ventasOpts={ventasOpts} serviciosOpts={serviciosOpts} marcosOpts={marcosOpts}
          historial={history.historial}
        />
      )}

      <OrderFormDialog
        open={form.isFormOpen}
        onOpenChange={(v) => { form.setIsFormOpen(v); if (!v) form.resetForm() }}
        editingId={form.editingId}
        ventasOpts={ventasOpts} onSearchVentas={searchVentas}
        serviciosOpts={serviciosOpts} marcosOpts={marcosOpts}
        idVenta={form.idVenta} onIdVentaChange={form.onIdVentaChange}
        idServicio={form.idServicio} onIdServicioChange={form.setIdServicio}
        idMarco={form.idMarco} onIdMarcoChange={form.setIdMarco}
        fecha={form.fecha} onFechaChange={form.setFecha}
        fechaEstimada={form.fechaEstimada} onFechaEstimadaChange={form.onFechaEstimadaChange}
        precio={form.precio} onPrecioChange={form.onPrecioChange} restanteDisponible={form.restanteDisponible}
        observacion={form.observacion} onObservacionChange={form.setObservacion}
        errors={form.errors}
        isSubmitting={form.isSubmitting}
        onSubmit={form.handleSubmit}
        onCancel={() => { form.setIsFormOpen(false); form.resetForm() }}
      />

      <OrderCancelAlert
        target={statusFlow.cancelTarget}
        onOpenChange={(o) => { if (!o) statusFlow.setCancelTarget(null) }}
        onConfirm={statusFlow.confirmCancelarServicio}
      />

      <OrderAdvanceAlert
        open={statusFlow.advanceTarget !== null}
        onOpenChange={(o) => { if (!o) statusFlow.setAdvanceTarget(null) }}
        onConfirm={statusFlow.confirmAvanzarEstado}
      />

      <OrderDeleteAlert
        target={statusFlow.deleteTarget}
        onOpenChange={(o) => { if (!o) statusFlow.setDeleteTarget(null) }}
        onConfirm={statusFlow.confirmEliminarServicio}
      />
    </div>
  )
}
