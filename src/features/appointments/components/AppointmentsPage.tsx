// src/features/appointments/components/AppointmentsPage.tsx
import { useAppointments } from '../hooks/useAppointments'
import { useAppointmentForm } from '../hooks/useAppointmentForm'
import { useAppointmentSaleForm } from '../hooks/useAppointmentSaleForm'
import { useAppointmentDangerZone } from '../hooks/useAppointmentDangerZone'
import { useServicesOptions, useFrameOptions, useClientsOptions, usePaymentMethodOptions } from '@/src/shared/hooks/useOptions'
import { useEffect, useState } from 'react'
import type { Cita } from '../types'
import { useSearchParams } from 'react-router-dom'
import { CrudToolbar } from '@/src/shared/components/CrudToolbar'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { EmptyState } from '@/src/shared/components/EmptyState'
import { AppointmentsTable } from './AppointmentsTable'
import { AppointmentFormDialog } from './AppointmentFormDialog'
import { AppointmentViewDialog } from './AppointmentViewDialog'
import { AppointmentSaleDialog } from './AppointmentSaleDialog'
import { AppointmentCancelAlert } from './AppointmentCancelAlert'
import { AppointmentDeleteAlert } from './AppointmentDeleteAlert'

export function AppointmentsPage() {
  const [searchParams] = useSearchParams()
  const [filterEstado, setFilterEstado] = useState('')
  const {
    citas, estadosCita, isLoading, total, page, setPage, totalPages, pageSize, setPageSize, q, setQ,
    onCreate, onEdit, onDelete, onChangeStatus, refresh,
  } = useAppointments({ estado: filterEstado })

  useEffect(() => {
    const initialQ = searchParams.get('q')
    if (initialQ) setQ(initialQ)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { options: clientesOpts, rawClientes, search: searchClientes } = useClientsOptions()
  const { options: serviciosOpts, rawServicios } = useServicesOptions()
  const { options: marcosOpts }    = useFrameOptions()
  const { options: metodosPagoOpts } = usePaymentMethodOptions()

  const [isViewOpen,  setIsViewOpen]  = useState(false)
  const [viewingItem, setViewingItem] = useState<Cita | null>(null)
  const openView = (c: Cita) => { setViewingItem(c); setIsViewOpen(true) }

  const form = useAppointmentForm({ estadosCita, onCreate, onEdit })
  const saleForm = useAppointmentSaleForm({ refresh, rawServicios })
  const dangerZone = useAppointmentDangerZone({ estadosCita, clientesOpts, onDelete, onChangeStatus })

  return (
    <>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-serif text-3xl text-secondary">Citas</h1>
          <p className="text-muted-foreground">Gestiona las citas programadas</p>
        </div>

        <div className="flex flex-col gap-2">
          <CrudToolbar
            searchValue={q} onSearchChange={setQ}
            searchPlaceholder="Buscar por fecha, hora o #cita..."
            filters={[
              { key: 'estado', label: 'Estado', type: 'select', value: filterEstado, onChange: setFilterEstado,
                options: estadosCita.map(e => ({ value: String(e.id_estado_cita), label: e.nombre })) },
            ]}
            onClearFilters={() => setFilterEstado('')}
            createLabel="Registrar Cita"
            onCreate={form.openCreate}
          />

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={`sk-${i}`} className="h-12 w-full rounded-md" />)}
            </div>
          ) : total === 0 ? (
            <EmptyState title="Sin registros" description="No hay citas registradas aún." />
          ) : (
            <AppointmentsTable
              citas={citas}
              estadosCita={estadosCita}
              clientesOpts={clientesOpts}
              rawClientes={rawClientes}
              page={page} totalPages={totalPages} total={total} pageSize={pageSize}
              onPageChange={setPage} onPageSizeChange={setPageSize}
              onView={openView}
              onEdit={form.openEdit}
              onDelete={dangerZone.openEliminarCita}
              onCreateSale={saleForm.openVentaModal}
              onChangeStatus={dangerZone.handleChangeStatus}
            />
          )}
        </div>
      </div>

      {viewingItem && (
        <AppointmentViewDialog
          open={isViewOpen} onOpenChange={setIsViewOpen}
          cita={viewingItem}
          estadosCita={estadosCita}
          clientesOpts={clientesOpts}
          rawClientes={rawClientes}
        />
      )}

      <AppointmentFormDialog
        open={form.isFormOpen}
        onOpenChange={(v) => { form.setIsFormOpen(v); if (!v) form.resetForm() }}
        editingId={form.editingId}
        clientesOpts={clientesOpts}
        onSearchClientes={searchClientes}
        estadosCita={estadosCita}
        idCliente={form.idCliente} onIdClienteChange={form.setIdCliente}
        fecha={form.fecha} onFechaChange={form.setFecha}
        hora={form.hora} onHoraChange={form.setHora}
        idEstado={form.idEstado} onIdEstadoChange={form.setIdEstado}
        bookedSlots={form.bookedSlots}
        errors={form.errors}
        isSubmitting={form.isSubmitting}
        onSubmit={form.handleSubmit}
        onCancel={() => { form.setIsFormOpen(false); form.resetForm() }}
      />

      <AppointmentSaleDialog
        cita={saleForm.ventaModalCita}
        onClose={saleForm.closeVentaModal}
        clientesOpts={clientesOpts}
        serviciosOpts={serviciosOpts}
        marcosOpts={marcosOpts}
        metodosPagoOpts={metodosPagoOpts}
        lineas={saleForm.ventaLineas}
        onAddLinea={saleForm.addLinea}
        onRemoveLinea={saleForm.removeLinea}
        onUpdateLinea={saleForm.updateLinea}
        observacion={saleForm.ventaObs} onObservacionChange={saleForm.setVentaObs}
        errors={saleForm.ventaErrors}
        total={saleForm.totalVenta}
        isSubmitting={saleForm.isCreandoVenta}
        onSubmit={saleForm.handleCrearVenta}
        onCrearCotizacion={() => saleForm.handleCrearCotizacion(
          clientesOpts.find(o => o.value === String(saleForm.ventaModalCita?.id_cliente))?.label ?? 'Cliente',
          serviciosOpts,
          marcosOpts,
        )}
        configurarAbonos={saleForm.configurarAbonos} onConfigurarAbonosChange={saleForm.setConfigurarAbonos}
        numAbonos={saleForm.numAbonos} onNumAbonosChange={saleForm.setNumAbonos}
        modoPrimerAbono={saleForm.modoPrimerAbono} onModoPrimerAbonoChange={saleForm.setModoPrimerAbono}
        pctPrimero={saleForm.pctPrimero} onPctPrimeroChange={saleForm.setPctPrimero}
        montoPrimero={saleForm.montoPrimero} onMontoPrimeroChange={saleForm.setMontoPrimero}
        idMetodoPago={saleForm.idMetodoPago} onIdMetodoPagoChange={saleForm.setIdMetodoPago}
      />

      <AppointmentCancelAlert
        state={dangerZone.alertEstado}
        onOpenChange={(v) => { if (!v) dangerZone.closeAlertEstado() }}
        onConfirm={dangerZone.confirmCancelarCita}
      />

      <AppointmentDeleteAlert
        target={dangerZone.eliminarTarget}
        onOpenChange={(o) => { if (!o) dangerZone.closeEliminarTarget() }}
        onConfirm={dangerZone.confirmEliminarCita}
      />
    </>
  )
}
