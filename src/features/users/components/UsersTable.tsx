// src/features/users/components/UsersTable.tsx
import type { Usuario } from '../types'
import { getRolLabel, getRolBadgeClass } from '../utils'
import type { RolOption } from '@/src/shared/hooks/useOptions'
import { withToast } from '@/src/shared/lib/withToast'
import { Pagination } from '@/src/shared/components/Pagination'
import { Badge } from '@/src/shared/components/ui/badge'
import { Button } from '@/src/shared/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/shared/components/ui/table'
import { ToggleSwitch, ACTIVO_OPTIONS } from '@/src/shared/components/ToggleSwitch'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/src/shared/components/ui/tooltip'
import { UserDeleteAction } from './UserDeleteAction'
import { Eye, Pencil } from 'lucide-react'

interface UsersTableProps {
  usuarios: Usuario[]
  rawRoles: RolOption[]
  page: number; totalPages: number; total: number; pageSize: number
  onPageChange: (p: number) => void; onPageSizeChange: (n: number) => void
  onView: (u: Usuario) => void
  onEdit: (u: Usuario) => void
  onToggleStatus: (id: number) => Promise<unknown>
  onDelete: (id: number) => Promise<unknown>
}

export function UsersTable({
  usuarios, rawRoles, page, totalPages, total, pageSize, onPageChange, onPageSizeChange,
  onView, onEdit, onToggleStatus, onDelete,
}: UsersTableProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[50%]">Correo</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[18%]">Rol</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[14%]">Estado</TableHead>
              <TableHead className="text-center text-xs font-semibold tracking-wide text-muted-foreground w-36">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => (
              <TableRow key={u.id_usuario} className="hover:bg-muted/40 transition-colors border-border">
                <TableCell className="text-foreground">{u.correo}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getRolBadgeClass(rawRoles, u.id_rol)}>
                    {getRolLabel(rawRoles, u.id_rol)}
                  </Badge>
                </TableCell>
                <TableCell><ToggleSwitch value={u.estado ? 1 : 0} onChange={() => withToast(onToggleStatus(u.id_usuario), 'Estado actualizado')} options={ACTIVO_OPTIONS} disabled={u.es_admin_base} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Ver detalle de usuario" onClick={() => onView(u)}><Eye className="h-4 w-4 text-muted-foreground" /></Button>
                      </TooltipTrigger>
                      <TooltipContent>Ver detalle</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Editar usuario" onClick={() => onEdit(u)}><Pencil className="h-4 w-4 text-foreground" /></Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>
                    <UserDeleteAction
                      correo={u.correo}
                      isCliente={getRolLabel(rawRoles, u.id_rol) === 'Cliente'}
                      esAdminBase={!!u.es_admin_base}
                      onConfirm={() => withToast(onDelete(u.id_usuario), 'Usuario eliminado')}
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
