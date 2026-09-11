// src/shared/components/CrudToolbar.tsx
// Fila única de buscador + filtros + botón de crear, reutilizada por los
// módulos administrativos (antes cada <Módulo>Page.tsx repetía este layout
// a mano, con el buscador+botón en una fila y el FilterBar en otra debajo).
import type { ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/src/shared/components/ui/button'
import { SearchInput } from '@/src/shared/components/SearchInput'
import { FilterBar } from '@/src/shared/components/FilterBar'
import { cn } from '@/src/shared/lib/utils'

type FilterOption = { value: string; label: string }
type FilterConfig = {
  key: string
  label: string
  type: 'select' | 'chips'
  value: string
  onChange: (val: string) => void
  options: FilterOption[]
}

interface CrudToolbarProps {
  searchValue: string
  onSearchChange: (v: string) => void
  searchPlaceholder?: string
  filters?: FilterConfig[]
  onClearFilters?: () => void
  createLabel: string
  onCreate: () => void
  /** Para casos donde el botón de crear no aplica (ej. permisos) o hay que
   *  reemplazarlo por otra acción. */
  createSlot?: ReactNode
  className?: string
}

export function CrudToolbar({
  searchValue, onSearchChange, searchPlaceholder,
  filters, onClearFilters,
  createLabel, onCreate, createSlot,
  className,
}: CrudToolbarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <SearchInput
        value={searchValue}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        className="w-72 shrink-0"
      />

      {filters && filters.length > 0 && (
        <FilterBar filters={filters} onClear={onClearFilters ?? (() => {})} className="flex-1" />
      )}

      <div className="ml-auto shrink-0">
        {createSlot ?? (
          <Button onClick={onCreate} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />{createLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
