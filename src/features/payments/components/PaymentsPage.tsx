// src/features/payments/components/PaymentsPage.tsx
import { usePayments } from '../hooks/usePayments'
import { usePaymentForm } from '../hooks/usePaymentForm'
import { usePaymentStatusFlow } from '../hooks/usePaymentStatusFlow'
import { useSalesOptions } from '@/src/shared/hooks/useOptions'
import { useState } from 'react'
import type { Pago } from '../types'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { EmptyState } from '@/src/shared/components/EmptyState'
import { CrudToolbar } from '@/src/shared/components/CrudToolbar'
import { PaymentsTable } from './PaymentsTable'
import { PaymentFormDialog } from './PaymentFormDialog'
import { PaymentViewDialog } from './PaymentViewDialog'
import { PaymentStatusAlert } from './PaymentStatusAlert'

export function PaymentsPage() {
  const [filterMetodo, setFilterMetodo] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const {
    pagos, metodosPago, estadosPago, isLoading, total, page, setPage, totalPages, pageSize, setPageSize, q, setQ,
    onCreate, onChangeStatus, onChangeMethod,
  } = usePayments({ metodo: filterMetodo, estado: filterEstado })
  const { options: ventasOpts, rawVentas, search: searchVentas } = useSalesOptions()

  const [isViewOpen,  setIsViewOpen]  = useState(false)
  const [viewingItem, setViewingItem] = useState<Pago | null>(null)
  const openView = (p: Pago) => { setViewingItem(p); setIsViewOpen(true) }

  const statusFlow = usePaymentStatusFlow({ estadosPago, onChangeStatus })
  const form = usePaymentForm({ estadosPago, rawVentas, onCreate, onAlert: statusFlow.setAlertEstado })

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-serif text-3xl text-secondary">Ventas</h1>
        <p className="text-muted-foreground">Gestiona las ventas registradas</p>
      </div>

      <div className="flex flex-col gap-2">
        <CrudToolbar
          searchValue={q} onSearchChange={setQ}
          searchPlaceholder="Buscar pedido, monto, fecha..."
          filters={[
            { key: 'metodo', label: 'Método de pago', type: 'select', value: filterMetodo, onChange: setFilterMetodo,
              options: metodosPago.map(m => ({ value: String(m.id_metodo_pago), label: m.nombre })) },
            { key: 'estado', label: 'Estado', type: 'chips', value: filterEstado, onChange: setFilterEstado,
              options: estadosPago.map(e => ({ value: String(e.id_estado_pago), label: e.nombre })) },
          ]}
          onClearFilters={() => { setFilterMetodo(''); setFilterEstado('') }}
          createLabel="Registrar Venta"
          onCreate={() => form.openCreate()}
        />

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={`sk-${i}`} className="h-12 w-full rounded-md" />)}</div>
        ) : total === 0 ? (
          <EmptyState title="Sin resultados" description="No hay ventas que coincidan." />
        ) : (
          <PaymentsTable
            pagos={pagos}
            metodosPago={metodosPago} estadosPago={estadosPago}
            ventasOpts={ventasOpts} rawVentas={rawVentas}
            page={page} totalPages={totalPages} total={total} pageSize={pageSize}
            onPageChange={setPage} onPageSizeChange={setPageSize}
            onView={openView}
            onChangeStatus={statusFlow.handleChangeStatus}
            onChangeMethod={(p, nuevoIdMetodo) => onChangeMethod(p.id_pago, nuevoIdMetodo)}
          />
        )}
      </div>

      {viewingItem && (
        <PaymentViewDialog
          open={isViewOpen} onOpenChange={setIsViewOpen}
          pago={viewingItem}
          ventasOpts={ventasOpts}
          metodosPago={metodosPago} estadosPago={estadosPago}
        />
      )}

      <PaymentStatusAlert
        state={statusFlow.alertEstado}
        hasIdEstadoAnulado={!!statusFlow.idEstadoAnulado}
        onOpenChange={(v) => { if (!v) statusFlow.closeAlertEstado() }}
        onConfirmAnular={statusFlow.confirmAnular}
      />

      <PaymentFormDialog
        open={form.isFormOpen}
        onOpenChange={v => { form.setIsFormOpen(v); if (!v) form.resetForm() }}
        ventasOpts={ventasOpts} onSearchVentas={searchVentas}
        metodosPago={metodosPago} estadosPago={estadosPago}
        idVenta={form.idVenta} onIdVentaChange={form.setIdVenta}
        monto={form.monto} onMontoChange={form.setMonto}
        fecha={form.fecha} onFechaChange={form.setFecha}
        idMetodo={form.idMetodo} onIdMetodoChange={form.setIdMetodo}
        idEstado={form.idEstado} onIdEstadoChange={form.setIdEstado}
        errors={form.errors}
        isSubmitting={form.isSubmitting}
        ventaPagada={form.ventaPagada}
        saldoPendiente={form.saldoPendiente}
        nextInstallment={form.nextInstallment}
        onSubmit={form.handleSubmit}
        onCancel={() => { form.setIsFormOpen(false); form.resetForm() }}
      />
    </div>
  )
}
