// src/features/orders/components/OrderViewDialog.tsx
import type { Pedido, EstadoServicio, HistorialEstado } from '../types'
import { estadoColor, estadoNombre, formatHistorialFecha } from '../utils'
import type { ComboboxOption } from '@/src/shared/components/Combobox'
import { Badge } from '@/src/shared/components/ui/badge'
import { ViewDialog } from '@/src/shared/components/ViewDialog'
import { formatDate } from '@/src/shared/lib/formatDate'
import { formatCurrency } from '@/src/shared/lib/formatCurrency'

interface OrderViewDialogProps {
  open: boolean; onOpenChange: (v: boolean) => void
  pedido: Pedido
  estados: EstadoServicio[]
  ventasOpts: ComboboxOption[]; serviciosOpts: ComboboxOption[]; marcosOpts: ComboboxOption[]
  historial: HistorialEstado[] | null
}

export function OrderViewDialog({ open, onOpenChange, pedido, estados, ventasOpts, serviciosOpts, marcosOpts, historial }: OrderViewDialogProps) {
  return (
    <ViewDialog
      open={open} onOpenChange={onOpenChange}
      title={`Pedido #${pedido.id_detalle}`}
      fields={[
        { label: 'Estado',      value: <Badge variant="outline" className={estadoColor(estados, pedido.id_estado)}>{estadoNombre(estados, pedido.id_estado)}</Badge> },
        { label: 'Venta',       value: ventasOpts.find(o => o.value === String(pedido.id_venta))?.label ?? `#${pedido.id_venta}`, fullWidth: true },
        { label: 'Servicio',    value: serviciosOpts.find(o => o.value === String(pedido.id_servicio))?.label ?? `#${pedido.id_servicio}` },
        { label: 'Marco',       value: pedido.id_marco ? (marcosOpts.find(o => o.value === String(pedido.id_marco))?.label ?? `#${pedido.id_marco}`) : '—' },
        { label: 'Fecha',       value: formatDate(pedido.fecha) },
        { label: 'Fecha estimada', value: pedido.fecha_estimada ? formatDate(pedido.fecha_estimada) : '—' },
        { label: 'Precio',      value: formatCurrency(pedido.precio) },
        { label: 'Observación', value: pedido.observacion, fullWidth: true },
        {
          label: 'Historial de estado',
          fullWidth: true,
          value: historial === null
            ? 'Cargando...'
            : historial.length === 0
              ? 'Sin historial disponible.'
              : (
                <div className="space-y-1">
                  {historial.map(h => (
                    <div key={h.id_historial} className="text-sm">
                      <span className="font-medium">{h.estado}</span>
                      <span className="text-muted-foreground"> — {formatHistorialFecha(h.fecha)}</span>
                    </div>
                  ))}
                </div>
              ),
        },
      ]}
    />
  )
}
