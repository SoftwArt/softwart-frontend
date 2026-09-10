import { ArrowRight } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'
import { m } from 'framer-motion'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { StatsStrip } from './StatsStrip'
import { ServiciosTimeline } from './ServiciosTimeline'
import { useServiceHistory } from '../hooks/useServiceHistory'
import type { AccountOutletContext } from './AccountLayout'

const EASE = [0.22, 1, 0.36, 1] as const

export function ResumenPage() {
  const { isLoading, error, primerNombre, proximaCita, serviciosActivos, serviciosRecientes, openNewAppointment } =
    useOutletContext<AccountOutletContext>()
  const { expandedId, historyById, historyLoadingId, toggleHistory } = useServiceHistory()

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="font-serif text-3xl text-secondary">
          {isLoading ? <Skeleton className="h-9 w-56" /> : `Hola, ${primerNombre} 👋`}
        </h1>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 text-destructive p-4 text-sm">
            {error}
          </div>
        )}

        <StatsStrip
          isLoading={isLoading}
          proximaCita={proximaCita}
          serviciosActivos={serviciosActivos}
          onAgendarCita={openNewAppointment}
        />

        <m.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08, ease: EASE }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl text-secondary">Tus servicios</h2>
            {serviciosRecientes.length > 0 && (
              <Link to="/my-account/servicios" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : serviciosRecientes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no tienes servicios registrados.</p>
          ) : (
            <ServiciosTimeline
              servicios={serviciosRecientes}
              expandedId={expandedId}
              historyById={historyById}
              historyLoadingId={historyLoadingId}
              onToggleHistory={toggleHistory}
            />
          )}
        </m.section>
      </div>
    </div>
  )
}
