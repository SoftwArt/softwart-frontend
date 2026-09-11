// src/features/orders/components/OrderFormDialog.tsx
import { inputCls, labelCls } from '../utils'
import type { ComboboxOption } from '@/src/shared/components/Combobox'
import { Combobox } from '@/src/shared/components/Combobox'
import { DatePicker } from '@/src/shared/components/DatePicker'
import { FieldErrorTooltip } from '@/src/shared/components/FieldErrorTooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/src/shared/components/ui/dialog'
import { bogotaMaxFuturoStr } from '@/src/shared/lib/bogotaTime'
import { fmtCOP } from '@/src/shared/lib/formatCurrency'

interface OrderFormDialogProps {
  open: boolean; onOpenChange: (v: boolean) => void
  editingId: number | null
  ventasOpts: ComboboxOption[]; onSearchVentas: (q: string) => void
  serviciosOpts: ComboboxOption[]; marcosOpts: ComboboxOption[]
  idVenta: string;    onIdVentaChange:    (v: string) => void
  idServicio: string; onIdServicioChange: (v: string) => void
  idMarco: string;    onIdMarcoChange:    (v: string) => void
  fecha: string;      onFechaChange:      (v: string) => void
  fechaEstimada: string; onFechaEstimadaChange: (v: string) => void
  precio: string;     onPrecioChange:     (v: string) => void
  restanteDisponible: number
  observacion: string; onObservacionChange: (v: string) => void
  errors: Record<string, string>
  isSubmitting: boolean
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

export function OrderFormDialog({
  open, onOpenChange, editingId,
  ventasOpts, onSearchVentas, serviciosOpts, marcosOpts,
  idVenta, onIdVentaChange,
  idServicio, onIdServicioChange,
  idMarco, onIdMarcoChange,
  fecha, onFechaChange,
  fechaEstimada, onFechaEstimadaChange,
  precio, onPrecioChange, restanteDisponible,
  observacion, onObservacionChange,
  errors, isSubmitting, onSubmit, onCancel,
}: OrderFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card text-card-foreground border-border max-w-md overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-secondary">{editingId ? 'Editar Servicio' : 'Registrar Servicio'}</DialogTitle>
          <DialogDescription className="text-muted-foreground">Completa los datos del servicio.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-5 mt-2" noValidate>
          <div>
            <label className={labelCls} htmlFor="ped-venta">
              Pedido <span className="text-destructive">*</span>
              {!!editingId && <span className="text-muted-foreground font-normal normal-case tracking-normal"> (no editable)</span>}
            </label>
            <FieldErrorTooltip error={errors.idVenta}>
              <div>
                <Combobox id="ped-venta" options={ventasOpts} value={idVenta} onValueChange={onIdVentaChange} onSearchChange={onSearchVentas} placeholder="Buscar pedido..." searchPlaceholder="ID o fecha..." disabled={!!editingId} />
              </div>
            </FieldErrorTooltip>
          </div>
          <div>
            <label className={labelCls} htmlFor="ped-servicio">Tipo de Servicio <span className="text-destructive">*</span></label>
            <FieldErrorTooltip error={errors.idServicio}>
              <div>
                <Combobox id="ped-servicio" options={serviciosOpts} value={idServicio} onValueChange={onIdServicioChange} placeholder="Buscar servicio..." searchPlaceholder="Nombre del servicio..." />
              </div>
            </FieldErrorTooltip>
          </div>
          <div>
            <label className={labelCls} htmlFor="ped-marco">Marco (opcional)</label>
            <Combobox id="ped-marco" options={marcosOpts} value={idMarco} onValueChange={onIdMarcoChange} placeholder="Seleccionar marco..." searchPlaceholder="Código del marco..." clearable />
          </div>

          <div>
            <label className={labelCls} htmlFor="ped-fecha">Fecha <span className="text-destructive">*</span></label>
            <FieldErrorTooltip error={errors.fecha}>
              <div>
                <DatePicker
                  id="ped-fecha"
                  value={fecha}
                  max={bogotaMaxFuturoStr()}
                  onChange={onFechaChange}
                  error={errors.fecha}
                />
              </div>
            </FieldErrorTooltip>
          </div>
          <div>
            <label className={labelCls} htmlFor="ped-fecha-estimada">
              Fecha estimada
              <span className="text-muted-foreground font-normal normal-case tracking-normal"> (sugerida según el servicio, editable)</span>
            </label>
            <DatePicker
              id="ped-fecha-estimada"
              value={fechaEstimada}
              min={fecha || undefined}
              onChange={onFechaEstimadaChange}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="ped-precio">
              Precio <span className="text-destructive">*</span>
              {!!editingId && <span className="text-muted-foreground font-normal normal-case tracking-normal"> (no editable)</span>}
            </label>
            {editingId ? (
              <FieldErrorTooltip error={errors.precio}>
                <input
                  id="ped-precio"
                  type="text"
                  value={precio ? fmtCOP(Number(precio)) : ''}
                  readOnly
                  className={inputCls + ' opacity-60 cursor-not-allowed'}
                />
              </FieldErrorTooltip>
            ) : (
              <>
                <FieldErrorTooltip error={errors.precio}>
                  <input
                    id="ped-precio"
                    type="number"
                    step="0.01"
                    min="0"
                    max={idVenta ? restanteDisponible : undefined}
                    value={precio}
                    onChange={(e) => onPrecioChange(e.target.value)}
                    className={inputCls}
                    placeholder="Se sugiere el restante del pedido"
                    disabled={!idVenta}
                  />
                </FieldErrorTooltip>
                {!!idVenta && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Restante disponible en este pedido: <strong>{fmtCOP(restanteDisponible)}</strong>
                  </p>
                )}
              </>
            )}
          </div>
          <div>
            <label className={labelCls} htmlFor="ped-observacion">Observación (opcional)</label>
            <textarea id="ped-observacion" value={observacion} onChange={(e) => onObservacionChange(e.target.value)} className={inputCls + ' resize-none'} rows={3} placeholder='Detalles adicionales del pedido...'/>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50">
              {editingId ? 'Guardar cambios' : 'Registrar'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
