// src/features/account/utils.ts
import type { Cita, Servicio, PedidoServicios } from './types'
import { bogotaNowMs, bogotaCitaMs } from '@/src/shared/lib/bogotaTime'
import { matchesFecha } from '@/src/shared/lib/formatDate'
import { matchesMonto } from '@/src/shared/lib/formatCurrency'

export const inputCls = 'w-full bg-muted border-0 border-b-2 border-transparent focus:border-secondary focus:ring-0 focus:outline-none px-4 py-3 rounded-t-lg transition-all'
export const labelCls = 'block text-xs font-bold capitalize tracking-widest text-muted-foreground mb-2'

export const modalBackdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
} as const

export const modalPanelVariants = {
  initial: { opacity: 0, y: 24, scale: 0.97 },
  animate: { opacity: 1, y: 0,  scale: 1,    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: 12, scale: 0.97, transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] } },
} as const

export const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export function filterCitasCuenta(citas: Cita[], q: string): Cita[] {
  const s = q.toLowerCase()
  if (!s) return citas
  return citas.filter(c =>
    String(c.id_cita).includes(s) ||
    matchesFecha(c.fecha, s) ||
    c.hora.includes(s) ||
    (c.appointmentStatus?.nombre ?? '').toLowerCase().includes(s)
  )
}

export function filterServiciosCuenta(servicios: Servicio[], q: string): Servicio[] {
  const s = q.toLowerCase()
  if (!s) return servicios
  return servicios.filter(sv =>
    sv.servicio.toLowerCase().includes(s) ||
    matchesFecha(sv.fecha, s) ||
    matchesMonto(sv.precio, s) ||
    sv.estado.toLowerCase().includes(s) ||
    (sv.observacion ?? '').toLowerCase().includes(s)
  )
}

// Agrupa la lista plana de /api/cuenta/servicios por Pedido (id_venta) — los
// abonos y el total son del Pedido, no de cada Servicio individual, así que
// la UI del cliente los presenta agrupados aunque el backend siga devolviendo
// la lista plana (ver ServiciosPage.tsx / PedidoServiciosCard.tsx). Se agrupa
// acá en vez de en el backend para no tocar el shape que también consume el
// preview de "Tus servicios" en el Resumen.
export function groupServiciosByPedido(servicios: Servicio[]): PedidoServicios[] {
  const grupos = new Map<number | null, Servicio[]>()
  for (const sv of servicios) {
    const key = sv.id_venta
    const lista = grupos.get(key)
    if (lista) lista.push(sv)
    else grupos.set(key, [sv])
  }

  return Array.from(grupos.entries()).map(([id_venta, lista]) => {
    const fechas = lista.map(s => s.fecha).sort()
    const fechasEstimadas = lista.map(s => s.fecha_estimada).filter((f): f is string => !!f).sort()
    // saldo_pendiente ya viene igual en todos los servicios de un mismo
    // pedido (lo calcula el backend por venta) — basta con tomarlo del primero.
    return {
      id_venta,
      fecha:           fechas[0],
      total:           lista.reduce((sum, s) => sum + Number(s.precio), 0),
      fecha_estimada:  fechasEstimadas.length ? fechasEstimadas[fechasEstimadas.length - 1] : null,
      saldo_pendiente: lista[0]?.saldo_pendiente ?? null,
      todosEntregados: lista.every(s => s.estado.toLowerCase().includes('entreg')),
      servicios:       lista,
    }
  })
  // Mismo orden que ya traía el backend (más reciente primero): los grupos
  // conservan el orden de aparición de su primer servicio en la lista plana,
  // así que no hace falta reordenar acá.
}

// Espeja la ventana mínima de 24h antes de la cita que valida el backend
// (ClientAccountController.cancelMyAppointment, Términos de Servicio §4) —
// evita ofrecer un botón que siempre fallaría al confirmar. fecha/hora son
// naive-Bogotá, igual que en el backend, así que ambos lados del guard usan
// la misma aritmética (bogotaCitaMs/bogotaNowMs en shared/lib/bogotaTime.ts).
export function canCancelCita(fecha: string, hora: string): boolean {
  const horaNormalizada = hora.length === 5 ? `${hora}:00` : hora
  const VEINTICUATRO_HORAS_MS = 24 * 60 * 60 * 1000
  return bogotaCitaMs(fecha, horaNormalizada) - bogotaNowMs() >= VEINTICUATRO_HORAS_MS
}

export function parseFechaBloque(fecha: string): { mes: string; dia: string } {
  const parts = fecha.split(/[-T]/)
  if (parts.length >= 3) {
    return { mes: MESES[parseInt(parts[1]) - 1] ?? '', dia: String(parseInt(parts[2])) }
  }
  return { mes: '', dia: fecha }
}

export function estadoBadgeClasses(nombre?: string): string {
  if (!nombre) return 'bg-muted text-muted-foreground'
  const s = nombre.toLowerCase()
  if (s.includes('pend'))     return 'bg-orange-100 text-orange-800'
  if (s.includes('confirmada')) return 'bg-blue-100 text-blue-800'
  if (s.includes('complet') || s.includes('val'))
    return 'bg-emerald-100 text-emerald-800'
  if (s.includes('cancel'))  return 'bg-destructive/15 text-destructive'
  return 'bg-muted text-muted-foreground'
}

// Orden de prioridad pedido para "Tus citas" del portal cliente: Pendiente
// (necesita que el taller la confirme) primero, luego Confirmada (ya
// agendada en firme, esperando la fecha), luego Completada, y por último
// No Asistió/Cancelada (resueltas, ya no requieren atención). Dentro de
// cada grupo, de la fecha más nueva a la más vieja.
export function estadoCitaPriority(nombre?: string): number {
  if (!nombre) return 99
  const s = nombre.toLowerCase()
  if (s.includes('pend'))       return 0
  if (s.includes('confirmada')) return 1
  if (s.includes('complet'))    return 2
  if (s.includes('cancel'))     return 3
  if (s.includes('asisti'))     return 4
  return 99
}

export function estadoServicioBadgeClasses(estado: string): string {
  const s = estado.toLowerCase()
  if (s.includes('cancel'))   return 'bg-red-100 text-red-800'
  if (s.includes('entreg'))   return 'bg-emerald-100 text-emerald-800'
  if (s.includes('finaliz'))  return 'bg-slate-200 text-slate-700'
  if (s.includes('preparac')) return 'bg-amber-100 text-amber-800'
  return 'bg-muted text-muted-foreground'
}

// Mismo criterio que estadoServicioBadgeClasses, para el punto de color de
// la línea de tiempo de servicios (ServiciosTimeline) en vez de un badge.
export function estadoDotClasses(estado: string): string {
  const s = estado.toLowerCase()
  if (s.includes('cancel'))   return 'bg-red-500'
  if (s.includes('entreg'))   return 'bg-emerald-500'
  if (s.includes('finaliz'))  return 'bg-slate-500'
  if (s.includes('preparac')) return 'bg-amber-500'
  return 'bg-muted-foreground/40'
}
