export type Pedido = {
  id_detalle:      number
  id_venta:        number
  id_servicio:     number
  id_estado:       number
  id_marco:        number | null
  fecha:           string
  fecha_estimada?: string | null
  observacion?: string
  precio:       number
  estado:       boolean
}

export type CreatePedidoDto = Omit<Pedido, 'id_detalle'>
export type UpdatePedidoDto = Partial<CreatePedidoDto>

export type BackendDetalle = {
  id_detalle:      number
  fecha:           string
  fecha_estimada?: string | null
  precio:        number
  observacion?:  string
  estado:        boolean
  sale?:          { id_venta: number }    | null
  service?:       { id_servicio: number } | null
  serviceStatus?: { id_estado: number }   | null
  frame?:         { id_marco: number }    | null
}

export type EstadoServicio = { id_estado: number; nombre: string }

export type SiblingDetallePreview = { id_detalle: number; serviceStatus?: { nombre: string } | null }
export type PaymentPreview        = { id_pago: number; monto: number; paymentStatus?: { nombre: string } | null }
export type SalePreview           = { id_venta: number; saleDetails?: SiblingDetallePreview[]; payments?: PaymentPreview[] }
export type PedidoDetalle         = BackendDetalle & { sale?: SalePreview | null }

export type HistorialEstado = { id_historial: number; estado: string; fecha: string }

export type PedidoCancelTarget  = { id: number; id_estado: number; loading?: boolean; bloqueado?: boolean; msg?: string; lines: string[] }
export type PedidoAdvanceTarget = { id: number; id_estado: number }
export type PedidoDeleteTarget  = { id: number; label: string }
