// src/features/services/components/ServicesTable.tsx
import type { Servicio } from '../types'
import { fmtDuracion } from '../utils'
import { withToast } from '@/src/shared/lib/withToast'
import { Pagination } from '@/src/shared/components/Pagination'
import { Button } from '@/src/shared/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/shared/components/ui/table'
import { ToggleSwitch, ACTIVO_OPTIONS } from '@/src/shared/components/ToggleSwitch'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/src/shared/components/ui/tooltip'
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/src/shared/components/ui/alert-dialog'
import { CalendarDays, Eye, Pencil, Trash2 } from 'lucide-react'

interface ServicesTableProps {
  servicios: Servicio[]
  page: number; totalPages: number; total: number; pageSize: number
  onPageChange: (p: number) => void; onPageSizeChange: (n: number) => void
  onView: (s: Servicio) => void
  onEdit: (s: Servicio) => void
  onToggleStatus: (id: number) => Promise<unknown>
  onDelete: (id: number) => void
}

export function ServicesTable({
  servicios, page, totalPages, total, pageSize, onPageChange, onPageSizeChange,
  onView, onEdit, onToggleStatus, onDelete,
}: ServicesTableProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[18%]">Nombre</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[10%]">Duración</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[36%]">Descripción</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[12%]">Estado</TableHead>
              <TableHead className="text-center text-xs font-semibold tracking-wide text-muted-foreground w-36">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servicios.map(s => (
              <TableRow key={s.id_servicio} className="hover:bg-muted/40 transition-colors border-border">
                <TableCell className="text-foreground font-medium">{s.nombre}</TableCell>
                <TableCell className="text-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    {fmtDuracion(s.duracion)}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">{s.descripcion ?? '—'}</TableCell>
                <TableCell>
                  <ToggleSwitch value={s.estado ? 1 : 0} onChange={() => withToast(onToggleStatus(s.id_servicio), 'Estado actualizado')} options={ACTIVO_OPTIONS} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Ver detalle de servicio" onClick={() => onView(s)}>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Ver detalle</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Editar servicio" onClick={() => onEdit(s)}>
                          <Pencil className="h-4 w-4 text-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>
                    <AlertDialog>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Eliminar tipo de servicio">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Eliminar</TooltipContent>
                      </Tooltip>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar este tipo de servicio?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Se eliminará <strong>{s.nombre}</strong>. Si ya está siendo usado en algún
                            pedido registrado, no podrá eliminarse. Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => onDelete(s.id_servicio)}
                          >
                            Eliminar
                          </AlertDialogAction>
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
      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize}
        onChange={onPageChange} onPageSizeChange={onPageSizeChange} className="px-2 pb-2" />
    </div>
  )
}
