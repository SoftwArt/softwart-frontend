// Reusa tal cual la UI de progreso de abonos del admin (InstallmentPlanProgress
// / InstallmentCompletedBanner son puramente presentacionales, sin acciones de
// staff adentro) — el cliente ve exactamente el mismo plan de pagos, solo que
// de solo lectura. Ver ClientAccountController.myAbonos para el cálculo.
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { m, LazyMotion, domAnimation, AnimatePresence } from 'framer-motion'
import { CreditCard } from 'lucide-react'
import { cn } from '@/src/shared/lib/utils'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { formatDate } from '@/src/shared/lib/formatDate'
import { usePagination } from '@/src/shared/hooks/usePagination'
import { StickyPagination } from './StickyPagination'
import { InstallmentPlanProgress } from '@/src/features/sales/components/InstallmentPlanProgress'
import { InstallmentCompletedBanner } from '@/src/features/sales/components/InstallmentCompletedBanner'
import { useMisAbonos } from '../hooks/useMisAbonos'

const EASE = [0.22, 1, 0.36, 1] as const

export function AbonosPage() {
  const { ventas, isLoading, error } = useMisAbonos()
  const [searchParams] = useSearchParams()
  // Llegar desde "Ver abonos" en un Servicio trae ?venta=ID — con varios
  // pedidos activos, sin esto el cliente no sabría cuál de las cards es la
  // suya.
  const ventaResaltada = Number(searchParams.get('venta')) || null
  const cardRefs = useRef<Record<number, HTMLElement | null>>({})

  const { paginated, page, setPage, totalPages, total, pageSize, setPageSize } = usePagination(ventas)

  // Si la venta resaltada quedó en otra página (viene por link desde
  // Servicios, no navegando la lista), saltar directo a esa página — si no,
  // el highlight nunca se ve.
  useEffect(() => {
    if (ventaResaltada == null) return
    const idx = ventas.findIndex(v => v.id_venta === ventaResaltada)
    if (idx === -1) return
    const paginaDestino = Math.floor(idx / pageSize) + 1
    setPage(paginaDestino)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ventaResaltada, ventas, pageSize])

  useEffect(() => {
    if (ventaResaltada && cardRefs.current[ventaResaltada]) {
      cardRefs.current[ventaResaltada]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [ventaResaltada, paginated])

  // La lista scrollea en su propio espacio (flex-1 overflow-y-auto) para
  // que StickyPagination quede siempre en el mismo lugar exacto, sin
  // importar cuántos registros haya — ver StickyPagination.tsx.
  return (
    <LazyMotion features={domAnimation}>
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="font-serif text-2xl text-secondary">Tus abonos</h1>
              <p className="text-sm text-muted-foreground mt-1">El plan de pago de cada pedido, y cuánto te falta.</p>
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive p-4 text-sm">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
              </div>
            ) : ventas.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-xl border border-border">
                <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No tienes abonos pendientes.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                  {paginated.map((venta, i) => (
                    <m.section
                      key={venta.id_venta}
                      ref={(el: HTMLElement | null) => { cardRefs.current[venta.id_venta] = el }}
                      className={cn(
                        'bg-card border rounded-xl p-6 space-y-4 transition-colors',
                        venta.id_venta === ventaResaltada ? 'border-primary ring-2 ring-primary/30' : 'border-border',
                      )}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.25, delay: i * 0.05, ease: EASE }}
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {formatDate(venta.fecha)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {venta.servicios.map(s => s.nombre).join(', ') || 'Sin servicios asociados'}
                        </p>
                      </div>

                      {venta.completado ? (
                        <InstallmentCompletedBanner estado={venta} />
                      ) : (
                        <>
                          <InstallmentPlanProgress estado={venta} />
                          {venta.pagos_realizados === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              El pedido se empieza a trabajar desde que se recibe y valida el primer abono.
                            </p>
                          ) : venta.fecha_estimada && (
                            <p className="text-xs text-muted-foreground">
                              El último abono se espera alrededor de la fecha estimada de entrega:{' '}
                              <span className="font-medium text-foreground">{formatDate(venta.fecha_estimada)}</span>
                            </p>
                          )}
                        </>
                      )}
                    </m.section>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {!isLoading && ventas.length > 0 && (
          <StickyPagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>
    </LazyMotion>
  )
}
