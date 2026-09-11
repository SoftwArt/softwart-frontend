// src/features/account/components/PedidoServiciosCard.tsx
// Contenedor de un Pedido dentro de "Tus servicios" — agrupa los mismos
// componentes de servicio que ya existían (ServiciosTimeline/ServicioTimelineItem,
// sin cambios), y sube a este nivel lo que es del Pedido como un todo: total,
// fecha estimada de entrega (la más lejana entre sus servicios) y el CTA de
// abonos (los pagos son del Pedido, no de cada servicio suelto).
import { CreditCard } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '@/src/shared/lib/formatCurrency'
import { formatDate } from '@/src/shared/lib/formatDate'
import type { HistorialEstado, PedidoServicios } from '../types'
import { ServiciosTimeline } from './ServiciosTimeline'

interface PedidoServiciosCardProps {
  pedido: PedidoServicios
  expandedId: number | null
  historyById: Record<number, HistorialEstado[]>
  historyLoadingId: number | null
  onToggleHistory: (id_detalle: number) => void
}

export function PedidoServiciosCard({
  pedido, expandedId, historyById, historyLoadingId, onToggleHistory,
}: PedidoServiciosCardProps) {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-5 py-4">
        <div>
          <p className="text-xs text-muted-foreground">Pedido del {formatDate(pedido.fecha)}</p>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 mt-0.5">
            <span className="text-lg font-semibold text-foreground">{formatCurrency(pedido.total)}</span>
            {pedido.fecha_estimada && (
              <span className="text-xs text-muted-foreground">
                Entrega estimada: <span className="font-medium text-foreground">{formatDate(pedido.fecha_estimada)}</span>
              </span>
            )}
          </div>
        </div>

        {pedido.id_venta != null && (
          <Link
            to={`/my-account/abonos?venta=${pedido.id_venta}`}
            className="flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <CreditCard className="h-3.5 w-3.5" />
            Ver abonos
          </Link>
        )}
      </div>

      <div className="p-5">
        <ServiciosTimeline
          servicios={pedido.servicios}
          expandedId={expandedId}
          historyById={historyById}
          historyLoadingId={historyLoadingId}
          onToggleHistory={onToggleHistory}
        />
      </div>
    </section>
  )
}
