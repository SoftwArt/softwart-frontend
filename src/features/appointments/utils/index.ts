import type { Cita, EstadoCita, PaymentPreview, SalePreview } from '../types'
import { bogotaTodayStr } from '@/src/shared/lib/bogotaTime'
import { fmtCOP } from '@/src/shared/lib/formatCurrency'
import { matchesFecha } from '@/src/shared/lib/formatDate'

export const inputCls  = 'w-full bg-muted border-0 border-b-2 border-transparent focus:border-secondary focus:ring-0 focus:outline-none px-4 py-3 rounded-t-lg transition-all text-sm'
export const labelCls  = 'block text-xs font-bold capitalize tracking-widest text-muted-foreground mb-2'
export const selectCls = 'w-full bg-muted border-0 border-b-2 border-transparent data-[state=open]:border-secondary !h-auto rounded-t-lg px-4 py-3 text-sm shadow-none focus-visible:ring-0 focus-visible:border-secondary'

// Color por nombre de estado (estable aunque cambie el id/orden del seed),
// igual al mecanismo ya usado en Pedidos (ver features/orders/utils).
const ESTADO_BADGE_BY_NAME: Record<string, string> = {
  'pendiente':   'border-amber-300 bg-amber-100 text-amber-800',
  'confirmada':  'border-emerald-300 bg-emerald-100 text-emerald-800',
  'completada':  'border-blue-300 bg-blue-100 text-blue-800',
  'no asistió':  'border-slate-300 bg-slate-100 text-slate-600',
  'cancelada':   'border-red-300 bg-red-100 text-red-800',
}

const FALLBACK_BADGE_COLORS = [
  'border-amber-300 bg-amber-100 text-amber-800',
  'border-blue-300 bg-blue-100 text-blue-800',
  'border-emerald-300 bg-emerald-100 text-emerald-800',
  'border-slate-300 bg-slate-100 text-slate-600',
  'border-purple-300 bg-purple-100 text-purple-800',
]

export function badgeClassByName(nombre: string, index = 0): string {
  return ESTADO_BADGE_BY_NAME[nombre.trim().toLowerCase()]
    ?? FALLBACK_BADGE_COLORS[index % FALLBACK_BADGE_COLORS.length]
}

// Pendiente > Confirmada > Completada > Cancelada > No Asistió — mismo
// criterio que el backend (AppointmentController.getAllAppointment) y que
// "Tus citas" del portal cliente (estadoCitaPriority en account/utils.ts).
// IDs fijos del seed: 1=Pendiente, 5=Confirmada, 2=Completada, 4=Cancelada,
// 3=No Asistió.
const ESTADO_ORDER: Record<number, number> = { 1: 0, 5: 1, 2: 2, 4: 3, 3: 4 }

export function filterCitas(
  citas: Cita[],
  clientesOpts: { value: string; label: string }[],
  rawClientes: { id_cliente: number; documento: string }[],
  q: string,
  filterEstado: string,
): Cita[] {
  const s = q.toLowerCase()
  return citas.filter(c => {
    const clienteLabel     = clientesOpts.find(o => o.value === String(c.id_cliente))?.label ?? ''
    const clienteDocumento = rawClientes.find(rc => rc.id_cliente === c.id_cliente)?.documento ?? ''
    const matchQ = !s ||
      String(c.id_cita).includes(s) ||
      matchesFecha(c.fecha, s) ||
      c.hora.includes(s) ||
      clienteLabel.toLowerCase().includes(s) ||
      clienteDocumento.includes(s)
    const matchEstado = !filterEstado || String(c.id_estado_cita) === filterEstado
    return matchQ && matchEstado
  }).sort((a, b) => {
    // Primero por prioridad de estado (esto pisaba el orden que ya venía
    // bien del backend porque acá se ordenaba por fecha primero) — dentro
    // de cada estado, de la fecha más nueva a la más vieja.
    const estadoCmp = (ESTADO_ORDER[a.id_estado_cita] ?? 9) - (ESTADO_ORDER[b.id_estado_cita] ?? 9)
    if (estadoCmp !== 0) return estadoCmp
    return b.fecha.localeCompare(a.fecha)
  })
}

export const todayStr = bogotaTodayStr

export function validateFecha(f: string): boolean {
  return f >= bogotaTodayStr()
}

export { fmtCOP } from '@/src/shared/lib/formatCurrency'

// ── Estado de cita ────────────────────────────────────────────
export function estadoLabel(estados: EstadoCita[], id: number): string {
  return estados.find(e => e.id_estado_cita === id)?.nombre ?? `Estado ${id}`
}
export function isCitaCancelada(estados: EstadoCita[], id: number): boolean {
  return estadoLabel(estados, id).toLowerCase().includes('cancelada')
}
export function isCitaCompletada(estados: EstadoCita[], id: number): boolean {
  return estadoLabel(estados, id).toLowerCase().includes('completada')
}
// Cancelada/No Asistió liberan el slot de hora — mismo criterio que el
// backend (`appointmentAvailability`, WHERE ... NOT IN ('cancelada', 'no asistió')).
export function isCitaOcupaSlot(estados: EstadoCita[], id: number): boolean {
  const n = estadoLabel(estados, id).toLowerCase()
  return !n.includes('cancelada') && !n.includes('no asisti')
}

// ── Cascadas (eliminar / cancelar) ───────────────────────────────
export function hasValidatedPayments(payments?: PaymentPreview[]): boolean {
  return (payments ?? []).some(p => p.paymentStatus?.nombre?.toLowerCase().includes('validado'))
}

export function buildDeleteCitaLines(sale: SalePreview): string[] {
  return [
    `Pedido #${sale.id_venta} se eliminará`,
    ...(sale.saleDetails ?? []).map(d => `Servicio #${d.id_detalle} se eliminará`),
    ...(sale.payments ?? []).map(p => `Abono #${p.id_pago} se eliminará`),
  ]
}

export function buildCancelCitaLines(sale: SalePreview): string[] {
  const serviciosACancelar = (sale.saleDetails ?? [])
    .filter(d => {
      const n = d.serviceStatus?.nombre?.toLowerCase() ?? ''
      return !n.includes('finaliz') && !n.includes('cancel')
    })
    .map(d => d.id_detalle)

  const abonosAAnular = (sale.payments ?? [])
    .filter(p => p.paymentStatus?.nombre?.toLowerCase().includes('pendiente'))

  return [
    `Se anulará el Pedido #${sale.id_venta}`,
    ...serviciosACancelar.map(id => `Servicio #${id} se cancelará`),
    ...abonosAAnular.map(p => `Abono #${p.id_pago} (${fmtCOP(p.monto)}) se anulará`),
  ]
}
