import type { EstadoPagos } from '@/src/features/sales/types'

export type PerfilCliente = {
  id_cliente:     number
  tipoDocumento?: string
  documento?:     string
  nombre:         string
  correo:         string
  telefono:       string | null
  estado:         boolean
}

export type Cita = {
  id_cita: number
  fecha:   string
  hora:    string
  // El cliente la escribe al agendar (NewAppointmentModal) — no son notas
  // internas del staff, es un recordatorio de lo que él mismo pidió.
  observacion?: string | null
  appointmentStatus?: { id_estado_cita: number; nombre: string } | null
}

export type Servicio = {
  id_detalle:  number
  fecha:       string
  servicio:    string
  estado:      string
  precio:      number
  observacion: string | null
  id_venta:    number | null
}

// Mismo shape que EstadoPagos (features/sales/types/index.ts) — es
// literalmente el mismo cálculo, solo que expuesto para el cliente en vez
// de para el admin (ver ClientAccountController.myAbonos). Se importa de
// ahí en vez de redefinirlo para no divergir si el shape cambia.
export type VentaAbonos = EstadoPagos & {
  fecha:      string
  servicios: { id_detalle: number; nombre: string }[]
}

export type HistorialEstado = {
  id_historial: number
  estado:       string
  fecha:        string
}
