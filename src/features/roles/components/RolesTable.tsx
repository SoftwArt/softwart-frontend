// src/features/roles/components/RolesTable.tsx
import type { Rol } from '../types'
import { withToast } from '@/src/shared/lib/withToast'
import { Pagination } from '@/src/shared/components/Pagination'
import { Button } from '@/src/shared/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/shared/components/ui/table'
import { ToggleSwitch, ACTIVO_OPTIONS } from '@/src/shared/components/ToggleSwitch'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/src/shared/components/ui/tooltip'
import { RoleDeleteAction } from './RoleDeleteAction'
import { Eye, Pencil } from 'lucide-react'

interface RolesTableProps {
  roles: Rol[]
  page: number; totalPages: number; total: number; pageSize: number
  onPageChange: (p: number) => void; onPageSizeChange: (n: number) => void
  onView: (r: Rol) => void
  onEdit: (r: Rol) => void
  onToggleStatus: (id: number) => Promise<unknown>
  onDelete: (id: number) => Promise<unknown>
}

export function RolesTable({
  roles, page, totalPages, total, pageSize, onPageChange, onPageSizeChange,
  onView, onEdit, onToggleStatus, onDelete,
}: RolesTableProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[22%]">Nombre</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[42%]">Descripción</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[14%]">Estado</TableHead>
              <TableHead className="text-center text-xs font-semibold tracking-wide text-muted-foreground w-36">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((r) => {
              // Admin y Cliente son estructurales: inactivar o eliminar cualquiera
              // de los dos deja al sistema sin sentido (sin acceso administrativo,
              // o sin poder registrar clientes desde el portal). Se muestran los
              // controles igual que en el resto de filas, pero aria-disabled con
              // el motivo — no se esconden.
              // Por nombre, no por id_rol — el id no es un número fijo
              // garantizado (depende del orden en que se sembró cada rol).
              const nombreLower = r.nombre.toLowerCase()
              const esRolEstructural = nombreLower === 'admin' || nombreLower === 'cliente'
              return (
                <TableRow key={r.id_rol} className="hover:bg-muted/40 transition-colors border-border">
                  <TableCell className="text-foreground font-medium">{r.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{r.descripcion ?? '—'}</TableCell>
                  <TableCell>
                    <ToggleSwitch
                      value={r.estado ? 1 : 0}
                      onChange={() => withToast(onToggleStatus(r.id_rol), 'Estado actualizado')}
                      options={ACTIVO_OPTIONS}
                      disabled={esRolEstructural}
                      disabledReason={esRolEstructural ? `El rol ${r.nombre} no puede desactivarse — es necesario para el funcionamiento del sistema` : undefined}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Ver detalle de rol" onClick={() => onView(r)}><Eye className="h-4 w-4 text-muted-foreground" /></Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver detalle</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Editar rol" onClick={() => onEdit(r)}><Pencil className="h-4 w-4 text-foreground" /></Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>
                      <RoleDeleteAction
                        nombre={r.nombre}
                        esRolEstructural={esRolEstructural}
                        onConfirm={() => withToast(onDelete(r.id_rol), 'Rol eliminado')}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize}
        onChange={onPageChange} onPageSizeChange={onPageSizeChange} className="px-2 pb-2" />
    </div>
  )
}
