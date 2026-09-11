// src/features/clients/components/ClientsTable.tsx
import type { Cliente } from '../types'
import { withToast } from '@/src/shared/lib/withToast'
import { Pagination } from '@/src/shared/components/Pagination'
import { Button } from '@/src/shared/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/shared/components/ui/table'
import { ToggleSwitch, ACTIVO_OPTIONS } from '@/src/shared/components/ToggleSwitch'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/src/shared/components/ui/tooltip'
import { ClientDeleteAction } from './ClientDeleteAction'
import { Eye, Pencil } from 'lucide-react'

interface ClientsTableProps {
  clientes: Cliente[]
  page: number; totalPages: number; total: number; pageSize: number
  onPageChange: (p: number) => void; onPageSizeChange: (n: number) => void
  onView: (c: Cliente) => void
  onEdit: (c: Cliente) => void
  onToggleStatus: (id: number) => Promise<unknown>
  onDelete: (id: number) => Promise<unknown>
}

export function ClientsTable({
  clientes, page, totalPages, total, pageSize, onPageChange, onPageSizeChange,
  onView, onEdit, onToggleStatus, onDelete,
}: ClientsTableProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[22%]">Nombre</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[14%]">Documento</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[24%]">Correo</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[14%]">Teléfono</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[12%]">Estado</TableHead>
              <TableHead className="text-center text-xs font-semibold tracking-wide text-muted-foreground w-36">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((c) => (
              <TableRow key={c.id_cliente} className="hover:bg-muted/40 transition-colors border-border">
                <TableCell className="text-foreground font-medium">{c.nombre}</TableCell>
                <TableCell className="text-foreground">
                  <span className="text-xs text-muted-foreground mr-1">{c.tipoDocumento}</span>{c.documento}
                </TableCell>
                <TableCell className="text-foreground">{c.correo}</TableCell>
                <TableCell className="text-foreground">{c.telefono ?? '—'}</TableCell>
                <TableCell>
                  <ToggleSwitch value={c.estado ? 1 : 0} onChange={() => withToast(onToggleStatus(c.id_cliente), 'Estado actualizado')} options={ACTIVO_OPTIONS} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Ver detalle de cliente" onClick={() => onView(c)}>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Ver detalle</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Editar cliente" onClick={() => onEdit(c)}>
                          <Pencil className="h-4 w-4 text-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>
                    <ClientDeleteAction
                      nombre={c.nombre}
                      onConfirm={() => withToast(onDelete(c.id_cliente), 'Cliente eliminado')}
                    />
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
