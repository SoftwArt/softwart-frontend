// Una fila de la línea de tiempo de servicios (ServiciosTimeline) — mismo
// contenido/expansión de historial que tenía cada fila de ServicesModal.tsx,
// solo que el fetch/estado de historial ahora vive en useServiceHistory
// (compartido por el padre) en vez de estar duplicado por fila.
import { m } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { formatCurrency } from '@/src/shared/lib/formatCurrency'
import { formatDate } from '@/src/shared/lib/formatDate'
import { estadoDotClasses, estadoServicioBadgeClasses } from '../utils'
import type { HistorialEstado, Servicio } from '../types'

const EASE = [0.22, 1, 0.36, 1] as const

interface ServicioTimelineItemProps {
  servicio: Servicio
  delay?: number
  isExpanded: boolean
  isLoadingHistory: boolean
  historial: HistorialEstado[] | undefined
  onToggleHistory: (id_detalle: number) => void
}

export function ServicioTimelineItem({
  servicio, delay = 0, isExpanded, isLoadingHistory, historial, onToggleHistory,
}: ServicioTimelineItemProps) {
  return (
    <m.div
      className="relative flex gap-5 pl-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
      transition={{ duration: 0.25, delay, ease: EASE }}
    >
      <span
        className={`absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full ring-4 ring-background ${estadoDotClasses(servicio.estado)}`}
        aria-hidden="true"
      />
      <div className="flex-1 rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition-colors">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <p className="font-medium text-foreground">{servicio.servicio}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <span className="text-xs text-muted-foreground">{formatDate(servicio.fecha)}</span>
              <span className="text-xs font-medium text-primary">{formatCurrency(servicio.precio)}</span>
              {servicio.estado.toLowerCase().includes('entreg') ? (
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Entregado</span>
              ) : servicio.fecha_estimada && (
                <span className="text-xs text-muted-foreground">
                  Entrega estimada: <span className="font-medium text-foreground">{formatDate(servicio.fecha_estimada)}</span>
                </span>
              )}
            </div>
            {servicio.observacion && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{servicio.observacion}</p>
            )}
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${estadoServicioBadgeClasses(servicio.estado)}`}
          >
            {servicio.estado}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-4">
          <button
            type="button"
            onClick={() => onToggleHistory(servicio.id_detalle)}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            {isExpanded ? 'Ocultar historial' : 'Ver historial'}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-3 pl-2 border-l-2 border-border space-y-2">
            {isLoadingHistory ? (
              <p className="text-xs text-muted-foreground">Cargando...</p>
            ) : (historial?.length ?? 0) === 0 ? (
              <p className="text-xs text-muted-foreground">Sin historial disponible.</p>
            ) : (
              historial!.map(h => (
                <div key={h.id_historial} className="text-xs">
                  <span className="font-medium text-foreground">{h.estado}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    — {new Date(h.fecha).toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </m.div>
  )
}
