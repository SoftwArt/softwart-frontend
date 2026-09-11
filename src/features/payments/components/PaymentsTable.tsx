// src/features/payments/components/PaymentsTable.tsx
import type { Pago, EstadoPago, MetodoPago } from '../types'
import { ESTADO_BADGE, METODO_BADGE, estadoLabel } from '../utils'
import type { ComboboxOption } from '@/src/shared/components/Combobox'
import type { VentaOption } from '@/src/shared/hooks/useOptions'
import { Pagination } from '@/src/shared/components/Pagination'
import { Badge } from '@/src/shared/components/ui/badge'
import { Button } from '@/src/shared/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/shared/components/ui/table'
import { StatusSelect } from '@/src/shared/components/StatusSelect'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/src/shared/components/ui/tooltip'
import { formatDate } from '@/src/shared/lib/formatDate'
import { formatCurrency } from '@/src/shared/lib/formatCurrency'
import { Eye } from 'lucide-react'

interface PaymentsTableProps {
  pagos: Pago[]
  metodosPago: MetodoPago[]; estadosPago: EstadoPago[]
  ventasOpts: ComboboxOption[]
  rawVentas: VentaOption[]
  page: number; totalPages: number; total: number; pageSize: number
  onPageChange: (p: number) => void; onPageSizeChange: (n: number) => void
  onView: (p: Pago) => void
  onChangeStatus: (p: Pago, nuevoIdEstado: number) => void
  onChangeMethod: (p: Pago, nuevoIdMetodo: number) => void
}

export function PaymentsTable({
  pagos, metodosPago, estadosPago, ventasOpts, rawVentas,
  page, totalPages, total, pageSize, onPageChange, onPageSizeChange,
  onView, onChangeStatus, onChangeMethod,
}: PaymentsTableProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[28%]">Pedido</TableHead>
              <TableHead className="text-right text-xs font-semibold tracking-wide text-muted-foreground w-[11%]">Monto</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[13%]">Fecha</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[16%]">Método</TableHead>
              <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[18%]">Estado</TableHead>
              <TableHead className="text-center text-xs font-semibold tracking-wide text-muted-foreground w-16">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagos.map(p => {
              const ventaLabel   = ventasOpts.find(o => o.value === String(p.id_venta))?.label ?? `#${p.id_venta}`
              const clienteLabel = rawVentas.find(rv => rv.id_venta === p.id_venta)?.client?.nombre ?? null
              const estadoNombre = estadoLabel(estadosPago, p.id_estado_pago)
              // Mismo estándar visual que Ventas/Servicios (bg-emerald): un
              // pago Validado ya completó su flujo — se reconoce de un
              // vistazo, sin tener que leer el badge de estado.
              const validado = estadoNombre.toLowerCase().includes('validado')
              return (
                <TableRow
                  key={p.id_pago}
                  className={validado
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-border'
                    : 'hover:bg-muted/40 transition-colors border-border'}
                >
                  <TableCell className="text-foreground text-sm">
                    <div className="font-medium">{ventaLabel}</div>
                    {clienteLabel && <div className="text-xs text-muted-foreground">{clienteLabel}</div>}
                  </TableCell>
                  <TableCell className="text-foreground text-right font-medium tabular-nums">{formatCurrency(p.monto)}</TableCell>
                  <TableCell className="text-foreground">{formatDate(p.fecha)}</TableCell>
                  <TableCell>
                    <StatusSelect
                      value={String(p.id_metodo_pago)}
                      onValueChange={v => onChangeMethod(p, Number(v))}
                      options={metodosPago.map(m => ({
                        value:    String(m.id_metodo_pago),
                        label:    m.nombre,
                        badgeCls: METODO_BADGE[m.nombre] ?? 'border-slate-300 bg-slate-100 text-slate-600',
                      }))}
                    />
                  </TableCell>
                  <TableCell>
                    {estadoNombre.toLowerCase().includes('anulado') ? (
                      <Badge variant="outline" className="border-red-300 bg-red-100 text-red-800 cursor-not-allowed opacity-70">{estadoNombre}</Badge>
                    ) : (
                      <StatusSelect
                        value={String(p.id_estado_pago)}
                        onValueChange={v => onChangeStatus(p, Number(v))}
                        options={estadosPago.map(e => ({
                          value:    String(e.id_estado_pago),
                          label:    e.nombre,
                          badgeCls: ESTADO_BADGE[e.nombre] ?? 'border-slate-300 bg-slate-100 text-slate-600',
                        }))}
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Ver detalle de venta" onClick={() => onView(p)}><Eye className="h-4 w-4 text-muted-foreground" /></Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver detalle</TooltipContent>
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
