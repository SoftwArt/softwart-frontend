import type { Pedido, EstadoServicio, SalePreview } from '../types'
import { formatCurrency, matchesMonto } from '@/src/shared/lib/formatCurrency'
import { matchesFecha } from '@/src/shared/lib/formatDate'

export const inputCls = 'w-full bg-muted border-0 border-b-2 border-transparent focus:border-secondary focus:ring-0 focus:outline-none px-4 py-3 rounded-t-lg transition-all text-sm'
export const labelCls = 'block text-xs font-bold capitalize tracking-widest text-muted-foreground mb-2'

export const BADGE_COLORS = [
  'border-amber-300 bg-amber-100 text-amber-800',
  'border-blue-300 bg-blue-100 text-blue-800',
  'border-emerald-300 bg-emerald-100 text-emerald-800',
  'border-slate-300 bg-slate-100 text-slate-600',
  'border-purple-300 bg-purple-100 text-purple-800',
]

export function badgeClass(index: number): string {
  return BADGE_COLORS[index % BADGE_COLORS.length]
}

// Color por nombre de estado (estable aunque cambie el id/orden del seed).
// Cae al color por índice para estados desconocidos.
const ESTADO_BADGE_BY_NAME: Record<string, string> = {
  'sin empezar':    'border-amber-300 bg-amber-100 text-amber-800',
  'en preparación': 'border-blue-300 bg-blue-100 text-blue-800',
  'finalizado':     'border-slate-400 bg-slate-200 text-slate-700',
  'entregado':      'border-emerald-300 bg-emerald-100 text-emerald-800',
  'cancelado':      'border-red-300 bg-red-100 text-red-800',
}

export function badgeClassByName(nombre: string, index: number): string {
  return ESTADO_BADGE_BY_NAME[nombre.trim().toLowerCase()] ?? badgeClass(index)
}

export function filterPedidos(
  pedidos:      Pedido[],
  ventasOpts:   { value: string; label: string }[],
  serviciosOpts: { value: string; label: string }[],
  marcosOpts:   { value: string; label: string }[],
  rawVentas:    { id_venta: number; client?: { nombre?: string } | null }[],
  estados:      { id_estado: number }[],
  q:            string,
  filterEstado: string,
  filterServicio: string = '',
): Pedido[] {
  const s = q.toLowerCase()
  const estadoOrder = new Map(estados.map((e, i) => [e.id_estado, i]))
  return pedidos.filter(p => {
    const ventaLabel    = ventasOpts.find(o => o.value === String(p.id_venta))?.label ?? ''
    const servicioLabel = serviciosOpts.find(o => o.value === String(p.id_servicio))?.label ?? ''
    const marcoLabel    = p.id_marco ? (marcosOpts.find(o => o.value === String(p.id_marco))?.label ?? '') : ''
    const clienteNombre = rawVentas.find(rv => rv.id_venta === p.id_venta)?.client?.nombre ?? ''
    const matchQ        = !s ||
      clienteNombre.toLowerCase().includes(s) ||
      ventaLabel.toLowerCase().includes(s) ||
      servicioLabel.toLowerCase().includes(s) ||
      marcoLabel.toLowerCase().includes(s) ||
      matchesMonto(p.precio, s) ||
      matchesFecha(p.fecha, s)
    const matchEstado   = !filterEstado   || String(p.id_estado)   === filterEstado
    const matchServicio = !filterServicio || String(p.id_servicio) === filterServicio
    return matchQ && matchEstado && matchServicio
  }).sort((a, b) => {
    const estCmp = (estadoOrder.get(a.id_estado) ?? 9) - (estadoOrder.get(b.id_estado) ?? 9)
    if (estCmp !== 0) return estCmp
    return a.fecha.localeCompare(b.fecha)
  })
}

// ── Estado de servicio ────────────────────────────────────────
export function estadoNombre(estados: EstadoServicio[], id: number): string {
  return estados.find(e => e.id_estado === id)?.nombre ?? `Estado ${id}`
}
export function estadoColor(estados: EstadoServicio[], id: number): string {
  const idx = estados.findIndex(e => e.id_estado === id)
  return badgeClassByName(estadoNombre(estados, id), idx === -1 ? 0 : idx)
}
export function isPedidoCancelado(estados: EstadoServicio[], id: number): boolean {
  return estadoNombre(estados, id).toLowerCase().includes('cancelado')
}
// Mismo estándar visual que la fila verde de Ventas (bg-emerald): un
// servicio Finalizado ya completó su flujo — se reconoce de un vistazo,
// sin tener que leer el badge de estado (procesamiento preatentivo).
export function isPedidoFinalizado(estados: EstadoServicio[], id: number): boolean {
  return estadoNombre(estados, id).toLowerCase().includes('finaliz')
}
// Entregado es el estado terminal real (después de Finalizado): el cliente
// ya se llevó la pieza — a partir de acá el servicio no admite más cambios.
export function isPedidoEntregado(estados: EstadoServicio[], id: number): boolean {
  return estadoNombre(estados, id).toLowerCase().includes('entreg')
}

export const MSG_CANCELAR_BASE = 'Esta acción es definitiva: un servicio cancelado no podrá modificarse ni volver a cambiar de estado.'

export function buildCancelCascadeLines(sale: SalePreview, idDetalleActual: number): string[] {
  const hermanosActivos = (sale.saleDetails ?? [])
    .filter(d => d.id_detalle !== idDetalleActual)
    .filter(d => {
      const n = d.serviceStatus?.nombre?.toLowerCase() ?? ''
      return !n.includes('finaliz') && !n.includes('entreg') && !n.includes('cancel')
    })

  if (hermanosActivos.length > 0) {
    // Quedan otros servicios activos: no cascadea, solo se informa.
    return [
      `El Pedido #${sale.id_venta} NO se anulará`,
      ...hermanosActivos.map(d => `Servicio #${d.id_detalle} sigue activo, no se ve afectado`),
    ]
  }

  // Es el último servicio activo → cascadea y anula también la Venta.
  const abonosAAnular = (sale.payments ?? [])
    .filter(p => p.paymentStatus?.nombre?.toLowerCase().includes('pendiente'))
  return [
    `Se anulará también el Pedido #${sale.id_venta} (era su último servicio activo)`,
    ...abonosAAnular.map(p => `Abono #${p.id_pago} (${formatCurrency(p.monto)}) se anulará`),
  ]
}

export function formatHistorialFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}
