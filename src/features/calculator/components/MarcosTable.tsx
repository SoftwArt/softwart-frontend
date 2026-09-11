// src/features/calculator/components/MarcosTable.tsx
import type { Marco } from '../types'
import { withToast } from '@/src/shared/lib/withToast'
import { formatCurrency as fmt } from '@/src/shared/lib/formatCurrency'
import { Pagination } from '@/src/shared/components/Pagination'
import { Button } from '@/src/shared/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/shared/components/ui/table'
import { ToggleSwitch, ACTIVO_OPTIONS } from '@/src/shared/components/ToggleSwitch'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/src/shared/components/ui/tooltip'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/src/shared/components/ui/alert-dialog'
import { Calculator, Eye, Pencil, Trash2 } from 'lucide-react'

interface MarcosTableProps {
  marcos: Marco[]
  page: number; totalPages: number; total: number; pageSize: number
  onPageChange: (p: number) => void; onPageSizeChange: (n: number) => void
  onView: (m: Marco) => void
  onEdit: (m: Marco) => void
  onCalc: (m: Marco) => void
  onToggleStatus: (id: number) => Promise<unknown>
  onDelete: (id: number) => Promise<unknown>
}

export function MarcosTable({
  marcos, page, totalPages, total, pageSize, onPageChange, onPageSizeChange,
  onView, onEdit, onCalc, onToggleStatus, onDelete,
}: MarcosTableProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[28%]">Código</TableHead>
              <TableHead className="text-right text-xs font-semibold tracking-wide text-muted-foreground w-[20%]">Colilla (mm)</TableHead>
              <TableHead className="text-right text-xs font-semibold tracking-wide text-muted-foreground w-[24%]">Precio ensamblado</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[14%]">Estado</TableHead>
              <TableHead className="text-center text-xs font-semibold tracking-wide text-muted-foreground w-36">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {marcos.map((m) => (
              <TableRow key={m.id_marco} className="hover:bg-muted/40 transition-colors border-border">
                <TableCell className="text-foreground font-medium">{m.codigo}</TableCell>
                <TableCell className="text-foreground text-right tabular-nums">{m.colilla}</TableCell>
                <TableCell className="text-foreground text-right tabular-nums">{fmt(m.precio_ensamblado)}</TableCell>
                <TableCell>
                  <ToggleSwitch value={m.estado ? 1 : 0} onChange={() => withToast(onToggleStatus(m.id_marco), 'Estado actualizado')} options={ACTIVO_OPTIONS} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {m.estado ? (
                          <Button variant="ghost" size="icon" aria-label="Calcular precio del marco" onClick={() => onCalc(m)}><Calculator className="h-4 w-4 text-muted-foreground" /></Button>
                        ) : (
                          <Button variant="ghost" size="icon" aria-label="Calcular precio del marco" aria-disabled onClick={() => {}} className="opacity-40 cursor-not-allowed"><Calculator className="h-4 w-4 text-muted-foreground" /></Button>
                        )}
                      </TooltipTrigger>
                      <TooltipContent>{m.estado ? 'Calcular precio' : 'Marco inactivo — actívalo para calcular su precio'}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Ver detalle de marco" onClick={() => onView(m)}><Eye className="h-4 w-4 text-muted-foreground" /></Button>
                      </TooltipTrigger>
                      <TooltipContent>Ver detalle</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Editar marco" onClick={() => onEdit(m)}><Pencil className="h-4 w-4 text-foreground" /></Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>
                    <AlertDialog>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" aria-label="Eliminar marco"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Eliminar</TooltipContent>
                      </Tooltip>
                      <AlertDialogContent className="bg-card text-card-foreground border-border">
                        <AlertDialogHeader><AlertDialogTitle className="font-serif text-secondary">Eliminar marco</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-border text-foreground">Cancelar</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { await withToast(onDelete(m.id_marco), 'Marco eliminado') }}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={page} totalPages={totalPages} total={total} pageSize={pageSize}
        onChange={onPageChange} onPageSizeChange={onPageSizeChange} className="px-2 pb-2"
      />
    </div>
  )
}
