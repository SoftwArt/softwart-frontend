import { AnimatePresence } from 'framer-motion'
import type { HistorialEstado, Servicio } from '../types'
import { ServicioTimelineItem } from './ServicioTimelineItem'

interface ServiciosTimelineProps {
  servicios: Servicio[]
  expandedId: number | null
  historyById: Record<number, HistorialEstado[]>
  historyLoadingId: number | null
  onToggleHistory: (id_detalle: number) => void
}

// Lista de servicios como línea de tiempo — reusada tanto en la vista previa
// del Resumen como en la página completa de Servicios.
export function ServiciosTimeline({
  servicios, expandedId, historyById, historyLoadingId, onToggleHistory,
}: ServiciosTimelineProps) {
  return (
    <div className="relative">
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" aria-hidden="true" />
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {servicios.map((s, i) => (
            <ServicioTimelineItem
              key={s.id_detalle}
              servicio={s}
              delay={i * 0.05}
              isExpanded={expandedId === s.id_detalle}
              isLoadingHistory={historyLoadingId === s.id_detalle}
              historial={historyById[s.id_detalle]}
              onToggleHistory={onToggleHistory}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
