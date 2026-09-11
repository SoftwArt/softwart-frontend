// src/features/appointments/hooks/useAppointmentSaleForm.ts
import { useState, useCallback } from 'react'
import type { Cita, VentaLinea } from '../types'
import { fmtCOP } from '../utils'
import { buildQuotePdf } from '../utils/buildQuotePdf'
import type { ComboboxOption } from '@/src/shared/components/Combobox'
import type { ServicioOption } from '@/src/shared/hooks/useOptions'
import { apiRequest } from '@/src/shared/lib/apiClient'
import { withToast } from '@/src/shared/lib/withToast'
import { bogotaTodayStr, addDaysToDateStr } from '@/src/shared/lib/bogotaTime'
import { toast } from 'sonner'

type Params = { refresh: () => Promise<void>; rawServicios: ServicioOption[] }

// Misma validación para "Crear pedido" y "Crear cotización" — una cotización
// con un servicio vacío o un precio en $0 no tiene sentido para el cliente.
function validarLineas(lineas: VentaLinea[]): Record<string, string> {
  const errs: Record<string, string> = {}
  lineas.forEach((l, i) => {
    if (!l.id_servicio) errs[`servicio_${i}`] = 'Requerido'
    if (!l.precio || isNaN(Number(l.precio)) || Number(l.precio) <= 0)
      errs[`precio_${i}`] = 'Precio inválido'
  })
  return errs
}

export type ModoPrimerAbono = 'pct' | 'monto'

// Checkbox "Configurar plan de abonos" en el mismo modal — valida acá antes
// de armar el payload, mismos rangos que el backend (configureInstallments /
// createSaleFromAppointmentSchema), para que el error salga en el form y no
// como un 400/422 después de intentar crear la venta.
function validarPlanAbonos(
  numAbonos: string, modo: ModoPrimerAbono, pctPrimero: string, montoPrimero: string,
  idMetodoPago: string, total: number,
): Record<string, string> {
  const errs: Record<string, string> = {}
  const n = Number(numAbonos)
  if (!numAbonos || isNaN(n) || n < 1 || n > 12) errs.numAbonos = 'Entre 1 y 12'

  // Con 1 abono se paga el total completo — el form lo fuerza a 100%/pct y
  // bloquea los inputs (ver setNumAbonos), así que no hay nada más que
  // validar del modo/valor acá.
  if (n !== 1) {
    if (modo === 'pct') {
      const p = Number(pctPrimero)
      if (!pctPrimero || isNaN(p) || p < 1 || p > 99) errs.pctPrimero = 'Entre 1% y 99%'
    } else {
      const m = Number(montoPrimero)
      if (!montoPrimero || isNaN(m) || m <= 0 || m >= total) errs.montoPrimero = `Entre $1 y ${total - 1}`
    }
  }

  if (!idMetodoPago) errs.idMetodoPago = 'Requerido'
  return errs
}

export function useAppointmentSaleForm({ refresh, rawServicios }: Params) {
  const [ventaModalCita, setVentaModalCita] = useState<Cita | null>(null)
  const [ventaLineas,    setVentaLineas]    = useState<VentaLinea[]>([])
  const [ventaObs,       setVentaObs]       = useState('')
  const [ventaErrors,    setVentaErrors]    = useState<Record<string, string>>({})
  const [isCreandoVenta, setIsCreandoVenta] = useState(false)

  // Plan de abonos + primer abono — opcional, checkbox en el mismo modal
  // para hacer todo el flujo (Cita -> Venta -> primer abono) en un solo
  // paso. Mismos defaults que el backend (Sale.num_abonos=2,
  // porcentaje_primer_abono=70) para que el preview arranque coherente.
  const [configurarAbonos,  setConfigurarAbonos]  = useState(false)
  const [numAbonos,         setNumAbonosRaw]      = useState('2')
  const [modoPrimerAbono,   setModoPrimerAbono]   = useState<ModoPrimerAbono>('pct')
  const [pctPrimero,        setPctPrimeroRaw]     = useState('70')
  const [montoPrimero,      setMontoPrimeroRaw]   = useState('')
  const [idMetodoPago,      setIdMetodoPago]      = useState('')

  // Con 1 abono no hay nada que configurar del primer abono — es,
  // necesariamente, el 100% del total. Se fuerza acá (no solo se deshabilita
  // el input) para que el payload sea coherente aunque el usuario nunca haya
  // tocado el toggle %/$. Al volver a 2+ abonos se restaura el default (70%)
  // en vez de dejar el 100% inválido (máximo permitido es 99%).
  const setNumAbonos = (v: string) => {
    setNumAbonosRaw(v)
    if (v === '1') {
      setModoPrimerAbono('pct')
      setPctPrimeroRaw('100')
    } else if (numAbonos === '1' && v !== '1') {
      setPctPrimeroRaw('70')
    }
  }

  // 100% (o más) del primer abono es, otra vez, "págalo todo ahora" — mismo
  // caso que num_abonos=1, solo que llegado desde el otro campo. Se convierte
  // directo a pago único (1 abono) en vez de solo aceptar/clamear el 100%,
  // para que el estado del form quede coherente en los dos campos (num_abonos
  // y modo/valor) y no en una combinación rara como "2 abonos, 100% el
  // primero" que el backend igual rechazaría (máximo permitido es 99%).
  const setPctPrimero = (v: string) => {
    const p = Number(v)
    if (v && !isNaN(p) && p >= 100 && numAbonos !== '1') {
      setNumAbonos('1')
      toast.info(`El ${p}% ingresado cubre el total (100% o más) — se configuró como pago único (1 abono).`)
      return
    }
    setPctPrimeroRaw(v)
  }

  const lineaVacia = useCallback((id: number): VentaLinea =>
    ({ id, id_servicio: '', id_marco: '', precio: '', fecha_estimada: '', observacion: '' }), [])

  const openVentaModal = (cita: Cita) => {
    setVentaModalCita(cita)
    setVentaLineas([lineaVacia(Date.now())])
    setVentaObs('')
    setVentaErrors({})
    setConfigurarAbonos(false)
    setNumAbonos('2')
    setModoPrimerAbono('pct')
    setPctPrimero('70')
    setMontoPrimero('')
    setIdMetodoPago('')
  }
  const closeVentaModal = () => setVentaModalCita(null)

  const addLinea    = () => setVentaLineas(p => [...p, lineaVacia(Date.now())])
  const removeLinea = (id: number) => setVentaLineas(p => p.filter(l => l.id !== id))
  const updateLinea = (id: number, field: keyof VentaLinea, value: string) =>
    setVentaLineas(p => p.map(l => {
      if (l.id !== id) return l
      const actualizada = { ...l, [field]: value }
      // Al elegir el servicio, sugiere fecha_estimada = hoy + duración (la
      // venta se crea con fecha = hoy, ver AppointmentController.createSaleFromAppointment)
      // — solo si el usuario todavía no la había tocado a mano, para no
      // pisarle un valor que ya editó.
      if (field === 'id_servicio' && !l.fecha_estimada) {
        const servicio = rawServicios.find(s => String(s.id_servicio) === value)
        if (servicio) actualizada.fecha_estimada = addDaysToDateStr(bogotaTodayStr(), servicio.duracion)
      }
      return actualizada
    }))

  const totalVenta = ventaLineas.reduce((sum, l) => sum + (Number(l.precio) || 0), 0)

  // Un monto de primer abono >= total no tiene sentido como "primer" abono
  // — directamente cubre (o supera) toda la venta. En vez de solo bloquear
  // con un error (backend igual lo rechaza: monto_primer_abono debe ser <
  // total), se convierte de una vez a pago único (1 abono, ver setNumAbonos)
  // y se avisa con un toast — mismo criterio de accesibilidad que el resto
  // del form: informar y resolver, no solo tirar un error.
  const setMontoPrimero = (v: string) => {
    const monto = Number(v)
    if (v && totalVenta > 0 && !isNaN(monto) && monto >= totalVenta) {
      setNumAbonos('1')
      setMontoPrimeroRaw('')
      toast.info(`El monto ingresado (${fmtCOP(monto)}) cubre el total de la venta (${fmtCOP(totalVenta)}) — se configuró como pago único (1 abono).`)
      return
    }
    setMontoPrimeroRaw(v)
  }

  const handleCrearVenta = async () => {
    const errs = {
      ...validarLineas(ventaLineas),
      ...(configurarAbonos ? validarPlanAbonos(numAbonos, modoPrimerAbono, pctPrimero, montoPrimero, idMetodoPago, totalVenta) : {}),
    }
    if (Object.keys(errs).length) { setVentaErrors(errs); return }
    if (!ventaModalCita) return

    // El monto del primer abono nunca se envía — el backend lo deriva de
    // num_abonos/porcentaje (misma fuente que registerInstallment), acá solo
    // se manda la configuración del plan + el método de pago.
    const plan_abonos = configurarAbonos ? {
      num_abonos: Number(numAbonos),
      ...(modoPrimerAbono === 'pct'
        ? { porcentaje_primer_abono: Number(pctPrimero) }
        : { monto_primer_abono: Number(montoPrimero) }),
      id_metodo_pago: Number(idMetodoPago),
    } : undefined

    setIsCreandoVenta(true)
    try {
      await withToast(
        apiRequest(`/api/appointments/${ventaModalCita.id_cita}/create-sale`, {
          method: 'POST',
          body: JSON.stringify({
            observacion: ventaObs || undefined,
            servicios: ventaLineas.map(l => ({
              id_servicio:    Number(l.id_servicio),
              id_marco:       l.id_marco ? Number(l.id_marco) : null,
              precio:         Number(l.precio),
              fecha_estimada: l.fecha_estimada || null,
              observacion:    l.observacion || undefined,
            })),
            plan_abonos,
          }),
        }),
        `Venta creada por ${fmtCOP(totalVenta)}. La cita pasó a Completada.`
          + (configurarAbonos ? ` Primer abono registrado.` : ''),
      )
      await refresh()
      setVentaModalCita(null)
    } catch { } finally {
      setIsCreandoVenta(false)
    }
  }

  // Cotización — mismo form, sin tocar el backend: es un documento de un
  // solo uso (el admin lo comparte/guarda por su cuenta), no algo a
  // persistir ni auditar. Misma validación que "Crear pedido" para no
  // generar un PDF con un servicio vacío o precios en $0.
  const handleCrearCotizacion = (clienteLabel: string, serviciosOpts: ComboboxOption[], marcosOpts: ComboboxOption[]) => {
    const errs = validarLineas(ventaLineas)
    if (Object.keys(errs).length) { setVentaErrors(errs); return }
    if (!ventaModalCita) return

    buildQuotePdf({
      cita: ventaModalCita,
      clienteLabel,
      lineas: ventaLineas,
      serviciosOpts,
      marcosOpts,
      observacion: ventaObs,
      total: totalVenta,
    })
  }

  return {
    ventaModalCita, openVentaModal, closeVentaModal,
    ventaLineas, addLinea, removeLinea, updateLinea,
    ventaObs, setVentaObs,
    ventaErrors,
    isCreandoVenta,
    totalVenta,
    configurarAbonos, setConfigurarAbonos,
    numAbonos, setNumAbonos,
    modoPrimerAbono, setModoPrimerAbono,
    pctPrimero, setPctPrimero,
    montoPrimero, setMontoPrimero,
    idMetodoPago, setIdMetodoPago,
    handleCrearVenta,
    handleCrearCotizacion,
  }
}
