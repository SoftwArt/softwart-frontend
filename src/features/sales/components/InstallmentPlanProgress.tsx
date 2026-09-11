// src/features/sales/components/InstallmentPlanProgress.tsx
import type { EstadoPagos } from '../types'
import { formatCurrency } from '@/src/shared/lib/formatCurrency'
import { formatDate } from '@/src/shared/lib/formatDate'
import { CheckCircle2 } from 'lucide-react'

interface InstallmentPlanProgressProps {
  estado: EstadoPagos
}

export function InstallmentPlanProgress({ estado }: InstallmentPlanProgressProps) {
  return (
    <>
      {/* ── Barra de progreso ────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Pagado: {formatCurrency(estado.total_pagado)}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, estado.total_pagado / estado.total * 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-semibold text-primary">
            Saldo pendiente: {formatCurrency(estado.saldo_pendiente)}
          </span>
        </div>
      </div>

      {/* ── Plan de abonos ───────────────────────────────────────────── */}
      <div className="grid gap-1.5">
        {estado.plan_abonos.map(ab => {
          const pagado = estado.historial_pagos[ab.number - 1]
          return (
            <div key={ab.number}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm
                ${pagado ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-800'
                         : ab.number === (estado.pagos_realizados + 1)
                           ? 'border-primary/40 bg-primary/5'
                           : 'border-border bg-muted/30'}`}
            >
              <div className="flex items-center gap-2">
                {pagado
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  : <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                }
                <span className="font-medium text-foreground">Abono {ab.number}</span>
                <span className="text-muted-foreground text-xs">({ab.percentage}%)</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-foreground">{formatCurrency(ab.amount)}</span>
                {pagado && (
                  <span className="ml-2 text-xs text-emerald-600">{formatDate(pagado.fecha)}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
