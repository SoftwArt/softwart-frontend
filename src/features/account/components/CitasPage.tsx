import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { CalendarDays, CalendarPlus } from 'lucide-react'
import { SearchInput } from '@/src/shared/components/SearchInput'
import { usePagination } from '@/src/shared/hooks/usePagination'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { estadoCitaPriority, filterCitasCuenta } from '../utils'
import { CitaCard } from './CitaCard'
import { StickyPagination } from './StickyPagination'
import type { AccountOutletContext } from './AccountLayout'

export function CitasPage() {
  const { citas, isLoading, onCancelAppointment, openNewAppointment } = useOutletContext<AccountOutletContext>()
  const [query, setQuery] = useState('')

  // Primero por estado (Confirmada > Pendiente > Completada > Cancelada >
  // No asistió), y dentro de cada estado de la fecha más nueva a la más
  // vieja — ver estadoCitaPriority en utils.ts.
  const sorted = useMemo(
    () =>
      [...citas].sort((a, b) => {
        const prioridad = estadoCitaPriority(a.appointmentStatus?.nombre) - estadoCitaPriority(b.appointmentStatus?.nombre)
        return prioridad !== 0 ? prioridad : b.fecha.localeCompare(a.fecha)
      }),
    [citas],
  )
  const filtered = useMemo(() => filterCitasCuenta(sorted, query), [sorted, query])
  const pagination = usePagination(filtered)

  // La lista scrollea en su propio espacio (flex-1 overflow-y-auto) para
  // que StickyPagination quede siempre en el mismo lugar exacto, sin
  // importar cuántos registros haya — ver StickyPagination.tsx.
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-serif text-2xl text-secondary">Tus citas</h1>
              <p className="text-sm text-muted-foreground mt-1">Historial completo, de la más próxima a la más antigua.</p>
            </div>
            <button
              onClick={openNewAppointment}
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-secondary/90 transition-all active:scale-95 shrink-0"
            >
              <CalendarPlus className="h-4 w-4" />
              Agendar cita
            </button>
          </div>

          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Buscar por ID, fecha o estado..."
            className="w-full sm:w-72 mb-6"
          />

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : citas.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-5">Aún no tienes citas agendadas.</p>
              <button
                onClick={openNewAppointment}
                className="bg-secondary text-secondary-foreground px-5 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 hover:bg-secondary/90 transition-all active:scale-95 text-sm"
              >
                <CalendarPlus className="h-4 w-4" />
                Agendar mi primera cita
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">Sin resultados para "{query}".</p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {pagination.paginated.map((c, i) => (
                  <CitaCard key={c.id_cita} cita={c} delay={i * 0.04} onCancelAppointment={onCancelAppointment} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {!isLoading && filtered.length > 0 && (
        <StickyPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      )}
    </div>
  )
}
