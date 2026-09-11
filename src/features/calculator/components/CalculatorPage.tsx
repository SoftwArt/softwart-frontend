// src/features/calculator/components/CalculatorPage.tsx
import { useCalculator } from '../hooks/useCalculator'
import { useMarcoForm } from '../hooks/useMarcoForm'
import { useMarcoCalculator } from '../hooks/useMarcoCalculator'
import { useState } from 'react'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { CrudToolbar } from '@/src/shared/components/CrudToolbar'
import { EmptyState } from '@/src/shared/components/EmptyState'
import type { Marco } from '../types'
import { MarcosTable } from './MarcosTable'
import { MarcoFormDialog } from './MarcoFormDialog'
import { MarcoViewDialog } from './MarcoViewDialog'
import { MarcoCalculatorDialog } from './MarcoCalculatorDialog'

export function CalculatorPage() {
  const [filterEstado, setFilterEstado] = useState('')
  const {
    marcos, isLoading, total, page, setPage, totalPages, pageSize, setPageSize, q, setQ,
    onCreate, onEdit, onDelete, onToggleStatus,
  } = useCalculator({ estado: filterEstado })

  const [isViewOpen,  setIsViewOpen]  = useState(false)
  const [viewingItem, setViewingItem] = useState<Marco | null>(null)
  const openView = (m: Marco) => { setViewingItem(m); setIsViewOpen(true) }

  const form = useMarcoForm({ onCreate, onEdit })
  const calc = useMarcoCalculator()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-serif text-3xl text-secondary">Calculadora de Marcos</h1>
        <p className="text-muted-foreground">Gestiona marcos y calcula precios</p>
      </div>

      <div className="flex flex-col gap-2">
        <CrudToolbar
          searchValue={q} onSearchChange={setQ}
          searchPlaceholder="Buscar por código..."
          filters={[
            { key: 'estado', label: 'Estado', type: 'chips', value: filterEstado, onChange: setFilterEstado,
              options: [{ value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }] },
          ]}
          onClearFilters={() => setFilterEstado('')}
          createLabel="Registrar Marco"
          onCreate={form.openCreate}
        />

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={`sk-${i}`} className="h-12 w-full rounded-md" />)}</div>
        ) : total === 0 ? (
          <EmptyState title="Sin resultados" description="No hay marcos que coincidan." />
        ) : (
          <MarcosTable
            marcos={marcos}
            page={page} totalPages={totalPages} total={total} pageSize={pageSize}
            onPageChange={setPage} onPageSizeChange={setPageSize}
            onView={openView}
            onEdit={form.openEdit}
            onCalc={calc.openCalc}
            onToggleStatus={onToggleStatus}
            onDelete={onDelete}
          />
        )}
      </div>

      {viewingItem && (
        <MarcoViewDialog open={isViewOpen} onOpenChange={setIsViewOpen} marco={viewingItem} />
      )}

      <MarcoCalculatorDialog
        open={calc.isCalcOpen} onOpenChange={calc.setIsCalcOpen}
        marco={calc.calcMarco}
        largo={calc.largo} onLargoChange={calc.setLargo}
        ancho={calc.ancho} onAnchoChange={calc.setAncho}
        errors={calc.calcErrors}
        values={calc.calcValues}
      />

      <MarcoFormDialog
        open={form.isFormOpen}
        onOpenChange={(v) => { form.setIsFormOpen(v); if (!v) form.resetForm() }}
        editingId={form.editingId}
        codigo={form.codigo} onCodigoChange={form.setCodigo}
        colillaStr={form.colillaStr} onColillaChange={form.setColillaStr}
        precioStr={form.precioStr} onPrecioChange={form.setPrecioStr}
        errors={form.errors}
        isSubmitting={form.isSubmitting}
        onSubmit={form.handleSubmit}
        onCancel={() => { form.setIsFormOpen(false); form.resetForm() }}
      />
    </div>
  )
}
