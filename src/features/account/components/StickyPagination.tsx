// Pie de página fijo para las páginas con lista + paginación (Citas/
// Servicios/Abonos). A propósito NO usa `position: sticky` — con pocos
// registros el contenido nunca desborda su contenedor, así que sticky
// nunca "engancha" y la barra queda flotando donde termina la lista, más
// arriba de lo esperado (y cambia de lugar según el page size elegido).
// En cambio, esto es un hermano `shrink-0` dentro del `flex flex-col h-full`
// de la página (ver CitasPage/ServiciosPage/AbonosPage): el área de la
// lista es la que scrollea en su propio espacio (flex-1 overflow-y-auto),
// y este pie queda siempre en el mismo lugar exacto, sin importar cuántos
// registros haya ni qué tamaño de página se elija.
import { Pagination } from '@/src/shared/components/Pagination'

interface StickyPaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  maxWidthClassName?: string
}

export function StickyPagination({ maxWidthClassName = 'max-w-4xl', ...props }: StickyPaginationProps) {
  if (props.total === 0) return null

  return (
    <div className="shrink-0 border-t border-border bg-background px-6 py-3">
      <div className={`${maxWidthClassName} mx-auto`}>
        <Pagination {...props} />
      </div>
    </div>
  )
}
