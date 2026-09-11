// src/features/sales/components/SalesTable.tsx
import type { Venta } from '../types'
import type { ComboboxOption } from '@/src/shared/components/Combobox'
import type { ClienteOption } from '@/src/shared/hooks/useOptions'
import { Pagination } from '@/src/shared/components/Pagination'
import { Button } from '@/src/shared/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/shared/components/ui/table'
import { ToggleSwitch, ACTIVO_OPTIONS } from '@/src/shared/components/ToggleSwitch'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/src/shared/components/ui/tooltip'
import { formatDate } from '@/src/shared/lib/formatDate'
import { formatCurrency } from '@/src/shared/lib/formatCurrency'
import { CheckCircle2, CircleDashed, CreditCard, Eye, Trash2 } from 'lucide-react'

interface SalesTableProps {
  ventas: Venta[]
  clientesOpts: ComboboxOption[]; citasOpts: ComboboxOption[]
  rawClientes: ClienteOption[]
  page: number; totalPages: number; total: number; pageSize: number
  onPageChange: (p: number) => void; onPageSizeChange: (n: number) => void
  onView:        (v: Venta) => void
  onAnular:      (id: number, label: string) => void
  onEliminar:    (id: number, label: string) => void
  onManagePayments: (venta: { id: number; label: string }) => void
}

export function SalesTable({
  ventas, clientesOpts, citasOpts, rawClientes,
  page, totalPages, total, pageSize, onPageChange, onPageSizeChange,
  onView, onAnular, onEliminar, onManagePayments,
}: SalesTableProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[24%]">Cliente</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[15%]">Cita</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[12%]">Fecha</TableHead>
              <TableHead className="text-right text-xs font-semibold tracking-wide text-muted-foreground w-[17%]">Total</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[14%]">Estado</TableHead>
              <TableHead className="text-center text-xs font-semibold tracking-wide text-muted-foreground w-36">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ventas.map(v => {
              const clienteLabel = clientesOpts.find(o => o.value === String(v.id_cliente))?.label ?? `#${v.id_cliente}`
              const citaLabel = v.id_cita ? (citasOpts.find(o => o.value === String(v.id_cita))?.label ?? `#${v.id_cita}`) : '—'
              const pagada = v.pagos_realizados >= v.num_abonos
              const cliente = rawClientes.find(rc => rc.id_cliente === v.id_cliente)
              // Siglas (CC/TI/CE/PP), mismo formato que la columna Documento del CRUD de Clientes.
              const documentoLabel = cliente ? `${cliente.tipoDocumento} · ${cliente.documento}` : null
              return (
                <TableRow key={v.id_venta} className={pagada ? 'bg-emerald-50 dark:bg-emerald-950/30 border-border' : 'hover:bg-muted/40 transition-colors border-border'}>
                  <TableCell className="text-foreground">
                    <div className="font-medium">{clienteLabel}</div>
                    {documentoLabel && <div className="text-xs text-muted-foreground">{documentoLabel}</div>}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{citaLabel}</TableCell>
                  <TableCell className="text-foreground">{formatDate(v.fecha)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="font-medium tabular-nums text-foreground">{formatCurrency(v.total)}</span>
                      {pagada
                        ? <span className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium"><CheckCircle2 className="h-3 w-3" />Pagada</span>
                        : <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><CircleDashed className="h-3 w-3" />{v.pagos_realizados}/{v.num_abonos} abonos</span>
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    <ToggleSwitch value={v.estado ? 1 : 0} onChange={() => onAnular(v.id_venta, `Pedido #${v.id_venta} · ${clienteLabel}`)} options={ACTIVO_OPTIONS} disabled={!v.estado} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Ver detalle de pedido" onClick={() => onView(v)}>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver detalle</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost" size="icon"
                            aria-label="Gestionar abonos"
                            aria-disabled={!v.estado}
                            onClick={() => {
                              if (!v.estado) return
                              onManagePayments({ id: v.id_venta, label: `Pedido #${v.id_venta} · ${clienteLabel}` })
                            }}
                            className={!v.estado ? 'opacity-40 cursor-not-allowed' : ''}
                          >
                            <CreditCard className={`h-4 w-4 ${v.estado ? 'text-primary' : 'text-muted-foreground'}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {v.estado ? 'Gestionar abonos' : 'No se pueden gestionar abonos: el pedido está anulado'}
                        </TooltipContent>
                      </Tooltip>

                      {v.tiene_abono_validado ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost" size="icon"
                              aria-label="Eliminar pedido"
                              aria-disabled
                              onClick={() => {}}
                              className="opacity-40 cursor-not-allowed"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>No se puede eliminar: tiene abonos validados</TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost" size="icon" aria-label="Eliminar pedido"
                              onClick={() => onEliminar(v.id_venta, `Pedido #${v.id_venta} · ${clienteLabel}`)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Eliminar</TooltipContent>
                        </Tooltip>
                      )}
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
