// src/shared/components/Pagination.tsx
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/src/shared/lib/utils'
import { PAGE_SIZE_OPTIONS } from '@/src/shared/hooks/usePagination'

interface PaginationProps {
  page:              number       // 1-indexed
  totalPages:        number
  total:             number
  pageSize:          number
  onChange:          (page: number) => void
  onPageSizeChange?: (size: number) => void
  className?:        string
}

export function Pagination({
  page, totalPages, total, pageSize,
  onChange, onPageSizeChange, className,
}: PaginationProps) {
  if (total === 0) return null

  const from = (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, total)

  // Páginas visibles: primera, última y ventana ±2 alrededor de la actual
  const pages: (number | '...')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  const navBtn = (
    icon:     React.ReactNode,
    disabled: boolean,
    onClick:  () => void,
    label:    string
  ) => (
    <button
      type="button" disabled={disabled} onClick={onClick} aria-label={label} title={label}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        disabled
          ? 'cursor-not-allowed border-border text-muted-foreground opacity-40'
          : 'border-border bg-card text-foreground hover:bg-muted hover:border-primary/40'
      )}
    >
      {icon}
    </button>
  )

  return (
    // min-h-10 iguala la altura total con pt-2 incluido (8px + 32px de los
    // botones h-8 = 40px) — con min-h-8 (solo 32px) el estado "sin botones"
    // seguía siendo más bajo (36px) y la barra se veía "temblar" 1-2px al
    // aparecer/desaparecer el bloque de números de página.
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 min-h-10', className)}>

      {/* Izquierda: info + selector de registros por página */}
      <div className="flex items-center gap-3">
        <p className="text-xs text-muted-foreground whitespace-nowrap">
          Mostrando <span className="font-medium text-foreground">{from}–{to}</span>{' '}
          de <span className="font-medium text-foreground">{total}</span> registros
        </p>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Por página:</span>
            <select
              value={pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
              aria-label="Registros por página"
              className={cn(
                'h-7 rounded-md border border-border bg-card px-2 text-xs text-foreground',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
              )}
            >
              {PAGE_SIZE_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Derecha: controles de página — solo si hay más de una, con
          transición de entrada/salida en vez de aparecer/desaparecer en seco */}
      <AnimatePresence>
        {totalPages > 1 && (
          <motion.div
            className="flex items-center gap-1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {navBtn(<ChevronsLeft  className="h-3.5 w-3.5" />, page === 1,          () => onChange(1),           'Primera página')}
            {navBtn(<ChevronLeft   className="h-3.5 w-3.5" />, page === 1,          () => onChange(page - 1),    'Anterior')}

            {pages.map((p, i) =>
              p === '...' ? (
                <span key={`e-${i}`} className="px-1 text-muted-foreground text-sm select-none">…</span>
              ) : (
                <button
                  key={p} type="button" onClick={() => onChange(p as number)}
                  aria-current={p === page ? 'page' : undefined}
                  className={cn(
                    'flex h-8 min-w-[2rem] items-center justify-center rounded-md border px-2 text-sm transition-colors',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                    p === page
                      ? 'border-primary bg-primary text-primary-foreground font-medium'
                      : 'border-border bg-card text-foreground hover:bg-muted hover:border-primary/40'
                  )}
                >
                  {p}
                </button>
              )
            )}

            {navBtn(<ChevronRight  className="h-3.5 w-3.5" />, page === totalPages, () => onChange(page + 1),    'Siguiente')}
            {navBtn(<ChevronsRight className="h-3.5 w-3.5" />, page === totalPages, () => onChange(totalPages),  'Última página')}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
