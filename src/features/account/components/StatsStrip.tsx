// Reemplaza el par de cards de AccountQuickAccessCards.tsx por una franja de
// stats en línea (próxima cita / servicios activos), con las mismas acciones.
import { m } from 'framer-motion'
import { ArrowRight, CalendarDays, Plus, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { formatDate } from '@/src/shared/lib/formatDate'
import type { Cita } from '../types'

const EASE = [0.22, 1, 0.36, 1] as const

interface StatsStripProps {
  isLoading: boolean
  proximaCita: Cita | null
  serviciosActivos: number
  onAgendarCita: () => void
}

export function StatsStrip({ isLoading, proximaCita, serviciosActivos, onAgendarCita }: StatsStripProps) {
  return (
    <m.div
      className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10 pb-8 border-b border-border"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
    >
      <div className="flex-1 flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <CalendarDays className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Próxima cita</p>
          {isLoading ? (
            <Skeleton className="h-6 w-40 mt-1.5" />
          ) : proximaCita ? (
            <p className="text-xl font-serif text-foreground mt-0.5">
              {formatDate(proximaCita.fecha)} · {proximaCita.hora?.slice(0, 5)}
            </p>
          ) : (
            <button onClick={onAgendarCita} className="text-left mt-0.5 cursor-pointer">
              <p className="text-sm text-muted-foreground">Sin citas próximas</p>
              <p className="text-xs text-primary mt-0.5 inline-flex items-center gap-1">
                Agendar cita <ArrowRight className="h-3 w-3" />
              </p>
            </button>
          )}
        </div>
      </div>

      <div className="hidden sm:block h-12 w-px bg-border" />

      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
          <Wrench className="h-6 w-6 text-secondary" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Servicios activos</p>
          {isLoading ? (
            <Skeleton className="h-6 w-24 mt-1.5" />
          ) : (
            <p className="text-xl font-serif text-foreground mt-0.5">
              {serviciosActivos > 0 ? `${serviciosActivos} en curso` : 'Sin servicios activos'}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:ml-auto">
        <Link to="/my-account/citas" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
          Ver todas las citas <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <button
          onClick={onAgendarCita}
          className="bg-primary text-primary-foreground h-10 px-5 rounded-md text-sm font-medium inline-flex items-center gap-2 hover:bg-primary/90 transition-colors active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Agendar cita
        </button>
      </div>
    </m.div>
  )
}
