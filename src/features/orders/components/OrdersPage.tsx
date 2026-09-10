// src/features/orders/components/OrdersPage.tsx
import { useOrders } from '../hooks/useOrders'
import { useEstadosServicio } from '../hooks/useEstadosServicio'
import { useOrderForm } from '../hooks/useOrderForm'
import { useOrderStatusFlow } from '../hooks/useOrderStatusFlow'
import { useOrderHistory } from '../hooks/useOrderHistory'
import { useSalesOptions, useServicesOptions, useFrameOptions } from '@/src/shared/hooks/useOptions'
import { useState, useMemo } from 'react'
import type { Pedido } from '../types'
import { filterPedidos } from '../utils'
import { useSearchParams } from 'react-router-dom'
import { SearchInput } from '@/src/shared/components/SearchInput'
import { usePagination } from '@/src/shared/hooks/usePagination'
import { FilterBar } from '@/src/shared/components/FilterBar'
import { Plus } from 'lucide-react'
import { Button } from '@/src/shared/components/ui/button'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { EmptyState } from '@/src/shared/components/EmptyState'
import { OrdersTable } from './OrdersTable'
import { OrderFormDialog } from './OrderFormDialog'
import { OrderViewDialog } from './OrderViewDialog'
import { OrderCancelAlert } from './OrderCancelAlert'
import { OrderAdvanceAlert } from './OrderAdvanceAlert'
import { OrderDeleteAlert } from './OrderDeleteAlert'

export function OrdersPage() {
  const { pedidos, isLoading, onCreate, onEdit, onChangeStatus, onDelete } = useOrders()
  const { options: ventasOpts, rawVentas, search: searchVentas } = useSalesOptions()
  const { options: serviciosOpts } = useServicesOptions()
  const { options: marcosOpts }    = useFrameOptions()
  const estados = useEstadosServicio()
  const [searchParams] = useSearchParams()

  const [q,              setQ]              = useState(searchParams.get('q') ?? '')
  const [filterEstado,   setFilterEstado]   = useState('')
  const [filterServicio, setFilterServicio] = useState('')

  const filtered = useMemo(
    () => filterPedidos(pedidos, ventasOpts, serviciosOpts, marcosOpts, rawVentas, estados, q, filterEstado, filterServicio),
    [pedidos, ventasOpts, serviciosOpts, marcosOpts, rawVentas, estados, q, filterEstado, filterServicio],
  )
  const { paginated, page, setPage, totalPages, total, pageSize, setPageSize } = usePagination(filtered)

  const [isViewOpen,  setIsViewOpen]  = useState(false)
  const [viewingItem, setViewingItem] = useState<Pedido | null>(null)

  const form = useOrderForm({ estados, rawVentas, pedidos, onCreate, onEdit })
  const statusFlow = useOrderStatusFlow({ estados, onChangeStatus, onDelete })
  const history = useOrderHistory()

  const openView = (p: Pedido) => { setViewingItem(p); setIsViewOpen(true); history.load(p.id_detalle) }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-secondary">Servicios</h1>
          <p className="text-muted-foreground">Gestiona los servicios registrados</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Buscar pedido, tipo de servicio, marco, fecha..." className="w-96" />
          <Button onClick={form.openCreate} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
            <Plus className="mr-2 h-4 w-4" />Registrar Servicio
          </Button>
        </div>
      </div>

      <FilterBar
        filters={[
          { key: 'estado', label: 'Estado', type: 'select', value: filterEstado, onChange: setFilterEstado,
            options: estados.map(e => ({ value: String(e.id_estado), label: e.nombre })) },
          { key: 'servicio', label: 'Tipo de Servicio', type: 'select', value: filterServicio, onChange: setFilterServicio,
            options: serviciosOpts },
        ]}
        onClear={() => { setFilterEstado(''); setFilterServicio('') }}
      />

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={`sk-${i}`} className="h-12 w-full rounded-md" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Sin registros" description="No hay pedidos registrados aún." />
      ) : (
        <OrdersTable
          pedidos={paginated}
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
