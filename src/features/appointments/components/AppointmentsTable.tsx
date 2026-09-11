// src/features/appointments/components/AppointmentsTable.tsx
import type { Cita, EstadoCita } from '../types'
import { badgeClassByName, estadoLabel, isCitaCancelada, isCitaCompletada } from '../utils'
import type { ComboboxOption } from '@/src/shared/components/Combobox'
import type { ClienteOption } from '@/src/shared/hooks/useOptions'
import { Pagination } from '@/src/shared/components/Pagination'
import { Badge } from '@/src/shared/components/ui/badge'
import { Button } from '@/src/shared/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/shared/components/ui/table'
import { StatusSelect } from '@/src/shared/components/StatusSelect'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/src/shared/components/ui/tooltip'
import { formatDate, formatTime } from '@/src/shared/lib/formatDate'
import { Eye, Pencil, ShoppingCart, Trash2 } from 'lucide-react'

interface AppointmentsTableProps {
  citas:        Cita[]
  estadosCita:  EstadoCita[]
  clientesOpts: ComboboxOption[]
  rawClientes:  ClienteOption[]
  page: number; totalPages: number; total: number; pageSize: number
  onPageChange:     (p: number) => void
  onPageSizeChange: (n: number) => void
  onView:         (c: Cita) => void
  onEdit:         (c: Cita) => void
  onDelete:       (c: Cita) => void
  onCreateSale:   (c: Cita) => void
  onChangeStatus: (c: Cita, nuevoIdEstado: number) => void
}

export function AppointmentsTable({
  citas, estadosCita, clientesOpts, rawClientes,
  page, totalPages, total, pageSize, onPageChange, onPageSizeChange,
  onView, onEdit, onDelete, onCreateSale, onChangeStatus,
}: AppointmentsTableProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[34%]">Cliente</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[14%]">Fecha</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[12%]">Hora</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[20%]">Estado</TableHead>
              <TableHead className="text-center text-xs font-semibold tracking-wide text-muted-foreground w-44">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {citas.map((c) => {
              const clienteLabel = clientesOpts.find(o => o.value === String(c.id_cliente))?.label ?? `#${c.id_cliente}`
              const cliente = rawClientes.find(rc => rc.id_cliente === c.id_cliente)
              // Siglas (CC/TI/CE/PP), no el nombre completo — mismo formato que la
              // columna Documento del CRUD de Clientes.
              const documentoLabel = cliente ? `${cliente.tipoDocumento} · ${cliente.documento}` : null
              return (
                <TableRow
                  key={c.id_cita}
                  className={c.tieneVenta
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-border'
                    : 'hover:bg-muted/40 transition-colors border-border'}
                >
                  <TableCell className="text-foreground">
                    <div className="font-medium">{clienteLabel}</div>
                    {documentoLabel && <div className="text-xs text-muted-foreground">{documentoLabel}</div>}
                  </TableCell>
                  <TableCell className="text-foreground">{formatDate(c.fecha)}</TableCell>
                  <TableCell className="text-foreground">{formatTime(c.hora)}</TableCell>
                  <TableCell>
                    {isCitaCancelada(estadosCita, c.id_estado_cita) ? (
                      <Badge variant="outline" className={`${badgeClassByName(estadoLabel(estadosCita, c.id_estado_cita))} cursor-not-allowed opacity-70`}>
                        {estadoLabel(estadosCita, c.id_estado_cita)}
                      </Badge>
                    ) : (
                      <StatusSelect
                        value={String(c.id_estado_cita)}
                        onValueChange={(v) => onChangeStatus(c, Number(v))}
                        options={estadosCita.map((e, i) => ({
                          value:    String(e.id_estado_cita),
                          label:    e.nombre,
                          badgeCls: badgeClassByName(e.nombre, i),
                        }))}
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Botón siempre presente (no se esconde según contexto) — si la cita
                          no está Completada queda aria-disabled con tooltip explicando por
                          qué, en vez de desaparecer del DOM. Mismo criterio de accesibilidad
                          que RegisterPage/LoginPage: informar el estado, no ocultarlo. */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost" size="icon"
                            aria-label="Crear pedido desde cita"
                            aria-disabled={!isCitaCompletada(estadosCita, c.id_estado_cita) || c.tieneVenta}
                            onClick={() => { if (isCitaCompletada(estadosCita, c.id_estado_cita) && !c.tieneVenta) onCreateSale(c) }}
                            className={(!isCitaCompletada(estadosCita, c.id_estado_cita) || c.tieneVenta) ? 'opacity-40 cursor-not-allowed' : ''}
                          >
                            <ShoppingCart className={`h-4 w-4 ${isCitaCompletada(estadosCita, c.id_estado_cita) && !c.tieneVenta ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {!isCitaCompletada(estadosCita, c.id_estado_cita)
                            ? 'Solo se puede crear un pedido cuando la cita está Completada'
                            : c.tieneVenta
                              ? 'Esta cita ya tiene un pedido — si necesitas registrar otro (ej. un producto sin servicio asociado), créalo manual desde Pedidos sin vincular la cita'
                              : 'Crear pedido'}
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Ver detalle de cita" onClick={() => onView(c)}>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver detalle</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost" size="icon"
                            aria-label="Editar cita"
                            aria-disabled={isCitaCancelada(estadosCita, c.id_estado_cita) || isCitaCompletada(estadosCita, c.id_estado_cita)}
                            onClick={() => { if (!isCitaCancelada(estadosCita, c.id_estado_cita) && !isCitaCompletada(estadosCita, c.id_estado_cita)) onEdit(c) }}
                            className={(isCitaCancelada(estadosCita, c.id_estado_cita) || isCitaCompletada(estadosCita, c.id_estado_cita)) ? 'opacity-40 cursor-not-allowed' : ''}
                          >
                            <Pencil className="h-4 w-4 text-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isCitaCancelada(estadosCita, c.id_estado_cita)
                            ? 'No se puede editar una cita Cancelada'
                            : isCitaCompletada(estadosCita, c.id_estado_cita)
                              ? 'No se puede editar una cita Completada'
                              : 'Editar'}
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Eliminar cita" onClick={() => onDelete(c)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Eliminar</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
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
