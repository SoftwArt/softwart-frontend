import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Wrench } from 'lucide-react'
import { SearchInput } from '@/src/shared/components/SearchInput'
import { usePagination } from '@/src/shared/hooks/usePagination'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { filterServiciosCuenta, groupServiciosByPedido } from '../utils'
import { PedidoServiciosCard } from './PedidoServiciosCard'
import { StickyPagination } from './StickyPagination'
import { useServiceHistory } from '../hooks/useServiceHistory'
import type { AccountOutletContext } from './AccountLayout'

export function ServiciosPage() {
  const { servicios, isLoading } = useOutletContext<AccountOutletContext>()
  const [query, setQuery] = useState('')
  const { expandedId, historyById, historyLoadingId, toggleHistory } = useServiceHistory()

  // Se filtra a nivel de servicio individual (mismo criterio de siempre) y
  // LUEGO se agrupa por pedido — un pedido cuyos servicios no matchean la
  // búsqueda simplemente desaparece de la lista, ninguno queda a medias.
  const filtered = useMemo(() => filterServiciosCuenta(servicios, query), [servicios, query])
  const pedidos  = useMemo(() => groupServiciosByPedido(filtered), [filtered])
  const pagination = usePagination(pedidos)

  // La lista scrollea en su propio espacio (flex-1 overflow-y-auto) para
  // que StickyPagination quede siempre en el mismo lugar exacto, sin
  // importar cuántos registros haya — ver StickyPagination.tsx.
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="font-serif text-2xl text-secondary">Tus servicios</h1>
            <p className="text-sm text-muted-foreground mt-1">El estado de cada pieza que has llevado al taller.</p>
          </div>

          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Buscar por servicio o estado..."
            className="w-full sm:w-72 mb-6"
          />

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : servicios.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <Wrench className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Aún no tienes servicios registrados.</p>
            </div>
          ) : pedidos.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">Sin resultados para "{query}".</p>
          ) : (
            <div className="space-y-6">
              {pagination.paginated.map(pedido => (
                <PedidoServiciosCard
                  key={pedido.id_venta ?? `sin-pedido-${pedido.servicios[0]?.id_detalle}`}
                  pedido={pedido}
                  expandedId={expandedId}
                  historyById={historyById}
                  historyLoadingId={historyLoadingId}
                  onToggleHistory={toggleHistory}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {!isLoading && pedidos.length > 0 && (
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
