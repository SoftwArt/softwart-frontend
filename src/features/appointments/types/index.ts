export type Cita = {
  id_cita:            number
  fecha:              string
  hora:               string
  id_estado_cita:     number
  id_cliente:         number
  clienteNombre?:     string
  motivoCancelacion?: string | null
  tieneVenta:         boolean
}

export type CreateCitaDto = Omit<Cita, 'id_cita' | 'tieneVenta'>
export type UpdateCitaDto = Partial<CreateCitaDto>

export type EstadoCita = {
  id_estado_cita: number
  nombre:         string
}

export type BackendCita = {
  id_cita: number
  fecha:   string
  hora:    string
  client?:            { id_cliente: number; nombre?: string } | null
  appointmentStatus?: { id_estado_cita: number } | null
  motivo_cancelacion?: string | null
  sale?:               { id_venta: number; estado: boolean } | null
}

export type VentaLinea = {
  id:              number
  id_servicio:     string
  id_marco:        string
  precio:          string
  fecha_estimada:  string
  observacion:     string
}

export type SaleDetailPreview = { id_detalle: number; serviceStatus?: { nombre: string } | null }
export type PaymentPreview    = { id_pago: number; monto: number; paymentStatus?: { nombre: string } | null }
export type SalePreview       = { id_venta: number; saleDetails?: SaleDetailPreview[]; payments?: PaymentPreview[] }
export type CitaDetalle       = Cita & { sale?: SalePreview | null }

export type CitaCascadeTarget = { id: number; label: string; loading?: boolean; bloqueado?: boolean; msg?: string; lines: string[] }
export type CitaEstadoAlert   = { open: boolean; msg: string; lines: string[]; citaId?: number; nuevoEstado?: number; loading?: boolean; bloqueado?: boolean }
