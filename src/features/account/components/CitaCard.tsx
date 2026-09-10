// Una cita en la lista de CitasPage — el bloque de fecha + estado calcado de
// AppointmentsModal.tsx, y el flujo de cancelación (AlertDialog + motivo)
// movido acá tal cual (antes vivía en el modal, ahora es local a cada card).
import { useState } from 'react'
import { m } from 'framer-motion'
import { Clock } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/src/shared/components/ui/alert-dialog'
import { withToast } from '@/src/shared/lib/withToast'
import { estadoBadgeClasses, canCancelCita, parseFechaBloque, inputCls, labelCls } from '../utils'
import type { Cita } from '../types'

const EASE = [0.22, 1, 0.36, 1] as const

interface CitaCardProps {
  cita: Cita
  delay?: number
  onCancelAppointment: (id: number, motivo: string) => Promise<unknown>
}

export function CitaCard({ cita, delay = 0, onCancelAppointment }: CitaCardProps) {
  const [cancelMotivo, setCancelMotivo] = useState('')
  const [isCanceling, setIsCanceling] = useState(false)

  const { mes, dia } = parseFechaBloque(cita.fecha)
  const estadoLower = cita.appointmentStatus?.nombre?.toLowerCase() ?? ''
  const esCancelable = estadoLower.includes('pend') || estadoLower.includes('confirmada')
  const puedeCancelar = esCancelable && canCancelCita(cita.fecha, cita.hora)

  return (
    <m.div
      className="bg-card rounded-xl border border-border p-5 flex flex-col gap-3 hover:border-primary/20 transition-colors"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
      transition={{ duration: 0.25, delay, ease: EASE }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="bg-secondary/5 border border-secondary/10 rounded-lg p-3 flex flex-col items-center min-w-[56px] shrink-0">
            <span className="text-[10px] uppercase font-bold text-secondary/60 tracking-wider">{mes}</span>
            <span className="text-2xl font-bold text-secondary leading-none">{dia}</span>
          </div>
          <div className="min-w-0 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-xl font-semibold text-foreground">{cita.hora?.slice(0, 5)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${estadoBadgeClasses(cita.appointmentStatus?.nombre)}`}>
            {cita.appointmentStatus?.nombre ?? 'Sin estado'}
          </span>

          {esCancelable && !puedeCancelar && (
            <span className="text-muted-foreground text-xs italic" title="Solo se puede cancelar con al menos 24 horas de anticipación">
              No cancelable (faltan &lt;24h)
            </span>
          )}

          {puedeCancelar && (
            <AlertDialog onOpenChange={open => { if (!open) setCancelMotivo('') }}>
              <AlertDialogTrigger asChild>
                <button
                  disabled={isCanceling}
                  className="text-destructive text-xs font-medium hover:underline disabled:opacity-50 transition-all"
                >
                  {isCanceling ? 'Cancelando...' : 'Cancelar'}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card text-card-foreground border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-serif text-secondary">¿Cancelar esta cita?</AlertDialogTitle>
                  <AlertDialogDescription>
                    La cita del {dia} de {mes} a las {cita.hora?.slice(0, 5)} será cancelada. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div>
                  <label className={labelCls} htmlFor={`cancel-motivo-${cita.id_cita}`}>
                    Motivo{' '}
                    <span className="text-muted-foreground font-normal normal-case tracking-normal">(opcional)</span>
                  </label>
                  <textarea
                    id={`cancel-motivo-${cita.id_cita}`}
                    value={cancelMotivo}
                    onChange={e => setCancelMotivo(e.target.value)}
                    placeholder="Cuéntanos por qué cancelas, nos ayuda a mejorar..."
                    rows={3}
                    maxLength={500}
                    className={`${inputCls} resize-none`}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-border text-foreground">Volver</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground"
                    onClick={async () => {
                      const motivo = cancelMotivo
                      setIsCanceling(true)
                      try {
                        await withToast(onCancelAppointment(cita.id_cita, motivo), 'Cita cancelada')
                      } finally {
                        setIsCanceling(false)
                        setCancelMotivo('')
                      }
                    }}
                  >
                    Sí, cancelar cita
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {cita.observacion && (
        <p className="text-xs text-muted-foreground pl-1 border-l-2 border-border ml-1">
          <span className="font-medium text-foreground">Tu nota: </span>
          {cita.observacion}
        </p>
      )}
    </m.div>
  )
}
