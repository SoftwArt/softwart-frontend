// src/features/orders/components/OrdersTable.tsx
import type { Pedido, EstadoServicio } from '../types'
import { badgeClassByName, estadoNombre, isPedidoCancelado, isPedidoFinalizado } from '../utils'
import type { ComboboxOption } from '@/src/shared/components/Combobox'
import type { VentaOption } from '@/src/shared/hooks/useOptions'
import { Pagination } from '@/src/shared/components/Pagination'
import { Button } from '@/src/shared/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/shared/components/ui/table'
import { StatusSelect } from '@/src/shared/components/StatusSelect'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/src/shared/components/ui/tooltip'
import { formatDate } from '@/src/shared/lib/formatDate'
import { formatCurrency } from '@/src/shared/lib/formatCurrency'
import { Eye, Pencil, Trash2 } from 'lucide-react'

interface OrdersTableProps {
  pedidos: Pedido[]
  estados: EstadoServicio[]
  ventasOpts: ComboboxOption[]; serviciosOpts: ComboboxOption[]; marcosOpts: ComboboxOption[]
  rawVentas: VentaOption[]
  page: number; totalPages: number; total: number; pageSize: number
  onPageChange: (p: number) => void; onPageSizeChange: (n: number) => void
  onView: (p: Pedido) => void
  onEdit: (p: Pedido) => void
  onDelete: (p: Pedido, servicioLabel: string) => void
  onChangeStatus: (idDetalle: number, nuevoIdEstado: number, idEstadoActual: number) => void
}

export function OrdersTable({
  pedidos, estados, ventasOpts, serviciosOpts, marcosOpts, rawVentas,
  page, totalPages, total, pageSize, onPageChange, onPageSizeChange,
  onView, onEdit, onDelete, onChangeStatus,
}: OrdersTableProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[18%]">Pedido</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[14%]">Tipo de Servicio</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[13%]">Marco</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[11%]">Fecha</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[10%]">Precio</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[18%]">Estado</TableHead>
              <TableHead className="text-center text-xs font-semibold tracking-wide text-muted-foreground w-36">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pedidos.map((p) => {
              const ventaLabel    = ventasOpts.find(o => o.value === String(p.id_venta))?.label ?? `#${p.id_venta}`
              const servicioLabel = serviciosOpts.find(o => o.value === String(p.id_servicio))?.label ?? `#${p.id_servicio}`
              const marcoLabel    = p.id_marco
                ? (marcosOpts.find(o => o.value === String(p.id_marco))?.label ?? `#${p.id_marco}`)
                : '—'
              const clienteNombre = rawVentas.find(rv => rv.id_venta === p.id_venta)?.client?.nombre ?? '—'
              return (
                <TableRow
                  key={p.id_detalle}
                  className={isPedidoFinalizado(estados, p.id_estado)
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-border'
                    : 'hover:bg-muted/40 transition-colors border-border'}
                >
                  <TableCell className="text-foreground text-sm">
                    <div className="font-medium">{ventaLabel}</div>
                    <div className="text-xs text-muted-foreground">{clienteNombre}</div>
                  </TableCell>
                  <TableCell className="text-foreground">{servicioLabel}</TableCell>
                  <TableCell className="text-foreground">{marcoLabel}</TableCell>
                  <TableCell className="text-foreground">{formatDate(p.fecha)}</TableCell>
                  <TableCell className="text-foreground">{formatCurrency(p.precio)}</TableCell>
                  <TableCell>
                    <StatusSelect
                      value={String(p.id_estado)}
                      onValueChange={(v) => onChangeStatus(p.id_detalle, Number(v), p.id_estado)}
                      disabled={isPedidoCancelado(estados, p.id_estado)}
                      options={estados.map((e, i) => ({
                        value: String(e.id_estado),
                        label: e.nombre,
                        badgeCls: badgeClassByName(e.nombre, i),
                      }))}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Ver detalle de pedido" onClick={() => onView(p)}>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver detalle</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost" size="icon"
                            aria-label="Editar pedido"
                            aria-disabled={isPedidoCancelado(estados, p.id_estado) || isPedidoFinalizado(estados, p.id_estado)}
                            onClick={() => { if (!isPedidoCancelado(estados, p.id_estado) && !isPedidoFinalizado(estados, p.id_estado)) onEdit(p) }}
                            className={(isPedidoCancelado(estados, p.id_estado) || isPedidoFinalizado(estados, p.id_estado)) ? 'opacity-40 cursor-not-allowed' : ''}
                          >
                            <Pencil className={`h-4 w-4 ${(isPedidoCancelado(estados, p.id_estado) || isPedidoFinalizado(estados, p.id_estado)) ? 'text-muted-foreground' : 'text-foreground'}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isPedidoCancelado(estados, p.id_estado)
                            ? 'No se puede editar un servicio Cancelado'
                            : isPedidoFinalizado(estados, p.id_estado)
                              ? 'No se puede editar un servicio Finalizado'
                              : 'Editar'}
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost" size="icon"
                            aria-label="Eliminar servicio"
                            aria-disabled={isPedidoCancelado(estados, p.id_estado) || isPedidoFinalizado(estados, p.id_estado)}
                            onClick={() => {
                              if (isPedidoCancelado(estados, p.id_estado) || isPedidoFinalizado(estados, p.id_estado)) return
                              onDelete(p, servicioLabel)
                            }}
                            className={(isPedidoCancelado(estados, p.id_estado) || isPedidoFinalizado(estados, p.id_estado)) ? 'opacity-40 cursor-not-allowed' : ''}
                          >
                            <Trash2 className={`h-4 w-4 ${(isPedidoCancelado(estados, p.id_estado) || isPedidoFinalizado(estados, p.id_estado)) ? 'text-muted-foreground' : 'text-destructive'}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isPedidoCancelado(estados, p.id_estado)
                            ? 'No se puede eliminar: ya está Cancelado'
                            : isPedidoFinalizado(estados, p.id_estado)
                              ? 'No se puede eliminar: ya está Finalizado — solo se puede cancelar'
                              : 'Eliminar'}
                        </TooltipContent>
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
