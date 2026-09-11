// src/features/appointments/components/AppointmentSaleDialog.tsx
import type { Cita, VentaLinea } from '../types'
import type { ModoPrimerAbono } from '../hooks/useAppointmentSaleForm'
import { labelCls, fmtCOP } from '../utils'
import type { ComboboxOption } from '@/src/shared/components/Combobox'
import { Button } from '@/src/shared/components/ui/button'
import { Input } from '@/src/shared/components/ui/input'
import { Checkbox } from '@/src/shared/components/ui/checkbox'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/src/shared/components/ui/tooltip'
import { FieldErrorTooltip } from '@/src/shared/components/FieldErrorTooltip'
import { DatePicker } from '@/src/shared/components/DatePicker'
import { bogotaTodayStr } from '@/src/shared/lib/bogotaTime'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/src/shared/components/ui/dialog'
import { PlusCircle, ShoppingCart, FileText, Trash, CreditCard } from 'lucide-react'

const MODO_TOOLTIP: Record<ModoPrimerAbono, string> = {
  pct:   'Calcular el primer abono como porcentaje del total',
  monto: 'Calcular el primer abono a partir de su valor en pesos',
}

interface AppointmentSaleDialogProps {
  cita: Cita | null
  onClose: () => void
  clientesOpts: ComboboxOption[]
  serviciosOpts: ComboboxOption[]
  marcosOpts: ComboboxOption[]
  metodosPagoOpts: ComboboxOption[]
  lineas: VentaLinea[]
  onAddLinea: () => void
  onRemoveLinea: (id: number) => void
  onUpdateLinea: (id: number, field: keyof VentaLinea, value: string) => void
  observacion: string; onObservacionChange: (v: string) => void
  errors: Record<string, string>
  total: number
  isSubmitting: boolean
  onSubmit: () => void
  onCrearCotizacion: () => void
  // Plan de abonos + primer abono — opcional, para dejar hecho todo el
  // flujo del negocio (Cita -> Venta -> primer abono) desde este mismo modal.
  configurarAbonos: boolean; onConfigurarAbonosChange: (v: boolean) => void
  numAbonos: string; onNumAbonosChange: (v: string) => void
  modoPrimerAbono: ModoPrimerAbono; onModoPrimerAbonoChange: (v: ModoPrimerAbono) => void
  pctPrimero: string; onPctPrimeroChange: (v: string) => void
  montoPrimero: string; onMontoPrimeroChange: (v: string) => void
  idMetodoPago: string; onIdMetodoPagoChange: (v: string) => void
}

export function AppointmentSaleDialog({
  cita, onClose, clientesOpts, serviciosOpts, marcosOpts, metodosPagoOpts,
  lineas, onAddLinea, onRemoveLinea, onUpdateLinea,
  observacion, onObservacionChange, errors, total, isSubmitting, onSubmit, onCrearCotizacion,
  configurarAbonos, onConfigurarAbonosChange,
  numAbonos, onNumAbonosChange,
  modoPrimerAbono, onModoPrimerAbonoChange,
  pctPrimero, onPctPrimeroChange,
  montoPrimero, onMontoPrimeroChange,
  idMetodoPago, onIdMetodoPagoChange,
}: AppointmentSaleDialogProps) {
  // Con 1 abono no hay nada que repartir: es, por definición, el 100% del
  // total en un solo pago. Se bloquea el modo/valor (el hook ya lo fuerza a
  // pct=100 al llegar a este número) para no dejar un campo editable que de
  // todos modos el backend va a ignorar.
  const abonoUnico = Number(numAbonos) === 1

  // Preview informativo del primer abono — el cálculo real (y su validación
  // de rango) los hace el backend con la misma fórmula (calculateInstallments).
  const pctEfectivo = modoPrimerAbono === 'pct'
    ? Number(pctPrimero)
    : total > 0 ? Math.round((Number(montoPrimero) / total) * 100) : 0
  const primerAbonoPreview = modoPrimerAbono === 'monto'
    ? Number(montoPrimero) || 0
    : Math.round(total * (Number(pctPrimero) || 0) / 100 * 100) / 100

  // Aviso (no bloqueante) cuando el primer abono queda por debajo de lo que
  // le tocaría en un reparto parejo — ej. 2 abonos y 20% de primero deja el
  // segundo con el 80%, al revés de cómo se suele estructurar un primer
  // abono. Se permite igual (es una decisión válida del negocio), solo se
  // avisa — mismo criterio de accesibilidad que el resto del panel: informar,
  // no asumir que quien usa el form no sabe lo que está haciendo.
  const promedioEsperado = Number(numAbonos) > 0 ? Math.round(100 / Number(numAbonos)) : 0
  const avisoAbonoBajo = !abonoUnico && pctEfectivo >= 1 && pctEfectivo <= 99 && pctEfectivo < promedioEsperado
  return (
    <Dialog open={cita !== null} onOpenChange={v => { if (!v) onClose() }}>
      {/* max-w-3xl (antes 2xl) — con 3 acciones + el total en el footer,
          2xl dejaba "Crear pedido" apretado contra el borde.
          overflow-x-hidden explícito: `overflow-y-auto` por sí solo hace que
          el navegador compute el eje X como 'auto' también (regla de CSS de
          "un eje no-visible fuerza al otro"), así que con un total de 9+
          dígitos el desborde interno de unos pocos px (el ancho mínimo del
          footer con truncate+min-w-0 en el total) alcanzaba a disparar una
          scrollbar horizontal real, aunque nada se viera recortado. Bajarle
          el tamaño de letra al total solo corría el umbral más arriba, no
          lo eliminaba — bloquear el eje X sí, de raíz.
          max-w-4xl (antes 3xl) — con el bloque de plan de abonos (label
          "Número de abonos *" + su input, col-span-3 dentro de un pl-6) el
          ancho de 3xl ya no le alcanzaba a la etiqueta en una sola línea y
          se envolvía, empujando el input más abajo que sus columnas
          vecinas. Más ancho de base también deja más margen para cuando el
          total crece de dígitos. */}
      <DialogContent className="bg-card text-card-foreground border-border max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-emerald-600" />
            Crear pedido — Cita #{cita?.id_cita}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {cita != null
              ? `${clientesOpts.find(o => o.value === String(cita.id_cliente))?.label ?? 'Cliente'} · ${cita.fecha} ${cita.hora}`
              : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 mt-2">
          {/* Líneas de servicio */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className={labelCls}>Servicios</span>
              <Button type="button" variant="outline" size="sm" onClick={onAddLinea} className="gap-1 h-7 text-xs">
                <PlusCircle className="h-3.5 w-3.5" />Agregar servicio
              </Button>
            </div>

            {lineas.map((linea, i) => (
              <div key={linea.id} className="grid grid-cols-12 gap-2 items-start p-3 rounded-lg border border-border bg-background">
                <div className="col-span-4 flex flex-col gap-1">
                  <label className="block text-xs text-muted-foreground mb-0.5" htmlFor={`srv-svc-${i}`}>Tipo de Servicio <span className="text-destructive">*</span></label>
                  <FieldErrorTooltip error={errors[`servicio_${i}`]}>
                    <select
                      id={`srv-svc-${i}`}
                      value={linea.id_servicio}
                      onChange={e => onUpdateLinea(linea.id, 'id_servicio', e.target.value)}
                      className="flex h-8 w-full rounded-md border border-border bg-card px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Seleccionar...</option>
                      {serviciosOpts.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </FieldErrorTooltip>
                </div>
                <div className="col-span-3 flex flex-col gap-1">
                  <label className="block text-xs text-muted-foreground mb-0.5" htmlFor={`srv-marco-${i}`}>Marco (opcional)</label>
                  <select
                    id={`srv-marco-${i}`}
                    value={linea.id_marco}
                    onChange={e => onUpdateLinea(linea.id, 'id_marco', e.target.value)}
                    className="flex h-8 w-full rounded-md border border-border bg-card px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Sin marco</option>
                    {marcosOpts.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div className="col-span-3 flex flex-col gap-1">
                  <label className="block text-xs text-muted-foreground mb-0.5" htmlFor={`srv-precio-${i}`}>Precio (COP) <span className="text-destructive">*</span></label>
                  <FieldErrorTooltip error={errors[`precio_${i}`]}>
                    <Input
                      id={`srv-precio-${i}`}
                      type="number" min="0" placeholder="0"
                      value={linea.precio}
                      onChange={e => onUpdateLinea(linea.id, 'precio', e.target.value)}
                      className="h-8 text-xs bg-card border-border"
                    />
                  </FieldErrorTooltip>
                </div>
                <div className="col-span-2 flex items-end pb-0.5">
                  <Button
                    type="button" variant="ghost" size="icon"
                    disabled={lineas.length === 1}
                    onClick={() => onRemoveLinea(linea.id)}
                    title="Quitar línea" aria-label="Quitar línea de servicio"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="col-span-5 flex flex-col gap-1">
                  <label className="block text-xs text-muted-foreground mb-0.5" htmlFor={`srv-fecha-est-${i}`}>
                    Fecha estimada
                  </label>
                  <DatePicker
                    id={`srv-fecha-est-${i}`}
                    value={linea.fecha_estimada}
                    min={bogotaTodayStr()}
                    onChange={v => onUpdateLinea(linea.id, 'fecha_estimada', v)}
                    triggerClassName="flex h-8 w-full items-center justify-between gap-1 whitespace-nowrap rounded-md border border-border bg-card px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="col-span-7 flex flex-col gap-1">
                  <label className="block text-xs text-muted-foreground mb-0.5" htmlFor={`srv-obs-${i}`}>
                    Observación (opcional)
                  </label>
                  <Input
                    id={`srv-obs-${i}`}
                    placeholder="Observación de este servicio"
                    value={linea.observacion}
                    onChange={e => onUpdateLinea(linea.id, 'observacion', e.target.value)}
                    className="h-8 text-xs bg-card border-border"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Observación general */}
          <div>
            <label className={labelCls} htmlFor="venta-obs">Observación general (opcional)</label>
            <textarea
              id="venta-obs"
              value={observacion}
              onChange={e => onObservacionChange(e.target.value)}
              placeholder="Notas sobre el pedido..."
              className="w-full bg-muted border-0 border-b-2 border-transparent focus:border-secondary focus:ring-0 focus:outline-none px-4 py-3 rounded-t-lg transition-all text-sm resize-none"
              rows={2}
            />
          </div>

          {/* Plan de abonos + primer abono — opcional. Deja hecho todo el
              flujo del negocio (Cita -> Venta -> primer abono) sin salir de
              este modal. El monto del primer abono nunca se teclea a mano
              — se deriva de num_abonos/% (misma fórmula que Ventas ->
              Gestionar abonos), acá solo se ve como preview informativo. */}
          <div className="rounded-lg border border-border p-3 flex flex-col gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="venta-config-abonos"
                checked={configurarAbonos}
                onCheckedChange={v => onConfigurarAbonosChange(v === true)}
              />
              <label htmlFor="venta-config-abonos" className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Configurar plan de abonos y registrar el primer abono
              </label>
            </div>

            {configurarAbonos && (
              <div className="grid grid-cols-12 gap-3 pl-6">
                <div className="col-span-3">
                  <label className="flex h-5 items-center text-xs text-muted-foreground mb-1 whitespace-nowrap" htmlFor="venta-num-abonos">
                    Número de abonos <span className="text-destructive">*</span>
                  </label>
                  <FieldErrorTooltip error={errors.numAbonos}>
                    <Input
                      id="venta-num-abonos"
                      type="number" min="1" max="12" placeholder="Ej: 2"
                      value={numAbonos}
                      onChange={e => onNumAbonosChange(e.target.value)}
                      className="h-8 text-xs bg-card border-border"
                    />
                  </FieldErrorTooltip>
                </div>

                <div className="col-span-5">
                  <div className="flex h-5 items-center justify-between mb-1">
                    <label className="text-xs text-muted-foreground" htmlFor="venta-primer-abono">
                      Primer abono <span className="text-destructive">*</span>
                    </label>
                    <div className="flex rounded-md border border-border overflow-hidden text-[11px]">
                      {(['pct', 'monto'] as const).map(m => (
                        <Tooltip key={m}>
                          <TooltipTrigger asChild>
                            <button type="button"
                              onClick={() => onModoPrimerAbonoChange(m)}
                              disabled={abonoUnico}
                              aria-label={abonoUnico ? 'Con 1 abono se paga el total completo' : MODO_TOOLTIP[m]}
                              className={`px-2 py-0.5 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                                ${modoPrimerAbono === m ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                              {m === 'pct' ? '%' : '$'}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{abonoUnico ? 'Con 1 abono se paga el total completo — no hay nada que repartir' : MODO_TOOLTIP[m]}</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                  {(() => {
                    const inputField = (
                      <FieldErrorTooltip error={modoPrimerAbono === 'pct' ? errors.pctPrimero : errors.montoPrimero}>
                        {modoPrimerAbono === 'pct' ? (
                          <Input
                            id="venta-primer-abono"
                            type="number" min="1" max="99" placeholder="Ej: 70"
                            value={pctPrimero}
                            disabled={abonoUnico}
                            onChange={e => onPctPrimeroChange(e.target.value)}
                            className="h-8 text-xs bg-card border-border disabled:opacity-70"
                          />
                        ) : (
                          <Input
                            id="venta-primer-abono"
                            type="number" min="1" placeholder={`Ej: ${Math.round(total * 0.7)}`}
                            value={montoPrimero}
                            disabled={abonoUnico}
                            onChange={e => onMontoPrimeroChange(e.target.value)}
                            className="h-8 text-xs bg-card border-border disabled:opacity-70"
                          />
                        )}
                      </FieldErrorTooltip>
                    )
                    if (!abonoUnico) return inputField
                    return (
                      <Tooltip>
                        <TooltipTrigger asChild><div>{inputField}</div></TooltipTrigger>
                        <TooltipContent>Con 1 abono, el pago es del 100% del total — no hay nada que configurar acá.</TooltipContent>
                      </Tooltip>
                    )
                  })()}
                </div>

                <div className="col-span-4">
                  <label className="flex h-5 items-center text-xs text-muted-foreground mb-1" htmlFor="venta-metodo-pago">
                    Método de pago <span className="text-destructive">*</span>
                  </label>
                  <FieldErrorTooltip error={errors.idMetodoPago}>
                    <select
                      id="venta-metodo-pago"
                      value={idMetodoPago}
                      onChange={e => onIdMetodoPagoChange(e.target.value)}
                      className="flex h-8 w-full rounded-md border border-border bg-card px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Seleccionar...</option>
                      {metodosPagoOpts.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </FieldErrorTooltip>
                </div>

                {total > 0 && (abonoUnico || (pctEfectivo >= 1 && pctEfectivo <= 99)) && (
                  <div className="col-span-12 rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                    {abonoUnico ? (
                      <>Se paga el total completo en un solo abono: <span className="font-semibold text-foreground">{fmtCOP(total)}</span>.</>
                    ) : (
                      <>
                        Primer abono: <span className="font-semibold text-foreground">{fmtCOP(primerAbonoPreview)}</span>
                        {' '}({pctEfectivo}% del total) — el resto se reparte en {Math.max(1, Number(numAbonos) - 1)} abono(s) más.
                      </>
                    )}
                  </div>
                )}

                {/* Aviso no bloqueante — el primer abono queda por debajo de
                    lo que le tocaría en un reparto parejo entre los N
                    abonos. Se permite igual (puede ser intencional), solo
                    se avisa para que no sea un error de tipeo. */}
                {avisoAbonoBajo && (
                  <div className="col-span-12 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    ⚠ El primer abono ({pctEfectivo}%) es menor al {promedioEsperado}% que le tocaría en un reparto
                    parejo entre los {numAbonos} abonos. Podés continuar si es intencional (ej. dejar los pagos
                    más grandes para el final), pero confirma que no fue un error de tipeo.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Total + confirmar — shrink-0 en los botones y tabular-nums en el
              total: antes, al pasar el precio de $0 a un número con más
              dígitos, el total empujaba el grupo de botones y lo comprimía
              (el texto de "Crear cotización" alcanzaba a envolver).
              sticky bottom-0: el DialogContent es el mismo elemento que
              scrollea (overflow-y-auto) y tiene padding p-6 — las márgenes
              negativas cancelan ese padding para que la barra llegue de
              borde a borde, y bg-background la hace opaca sobre el
              contenido que sigue scrolleando detrás. */}
          <div className="sticky bottom-0 -mx-6 -mb-6 flex items-center justify-between gap-3 border-t border-b border-border bg-background px-6 pt-2 pb-6">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-foreground tabular-nums truncate">{fmtCOP(total)}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={onClose} disabled={isSubmitting} className="whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50">
                Cancelar
              </button>
              {/* Cotización — mismo form, sin tocar el backend: descarga un
                  PDF de un solo uso (el admin lo comparte/guarda por su
                  cuenta), no crea ningún registro. Misma validación que
                  "Crear pedido" (servicio + precio por línea). Label corto
                  ("Cotizar") a propósito — con las 3 acciones + el total no
                  entraba "Crear cotización" sin apretar el resto. */}
              <button
                type="button"
                onClick={onCrearCotizacion}
                disabled={isSubmitting}
                className="flex items-center gap-2 whitespace-nowrap px-5 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted active:scale-95 transition-all disabled:opacity-50"
              >
                <FileText className="h-4 w-4" />
                Cotizar
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 whitespace-nowrap px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 transition-all disabled:opacity-50"
              >
                <ShoppingCart className="h-4 w-4" />
                {isSubmitting ? 'Creando...' : 'Crear pedido'}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
