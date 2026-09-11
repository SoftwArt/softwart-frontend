// src/features/payments/hooks/usePaymentForm.ts
import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { EstadoPago, PagoStatusAlert } from '../types'
import { withToast } from '@/src/shared/lib/withToast'
import { formatCurrency } from '@/src/shared/lib/formatCurrency'
import { apiRequest } from '@/src/shared/lib/apiClient'
import type { VentaOption } from '@/src/shared/hooks/useOptions'

type PagoLike = { id_venta: number; id_estado_pago: number; monto: number }
type CreateData = { id_venta: number; monto: number; fecha: string; id_metodo_pago: number; id_estado_pago: number }

type Params = {
  estadosPago: EstadoPago[]
  rawVentas: VentaOption[]
  onCreate: (data: CreateData) => Promise<unknown>
  onAlert: (alert: PagoStatusAlert) => void
}

export function usePaymentForm({ estadosPago, rawVentas, onCreate, onAlert }: Params) {
  const [isFormOpen,   setIsFormOpen]   = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [idVenta,  setIdVentaRaw]  = useState('')
  const [monto,    setMontoRaw]    = useState('')
  const [fecha,    setFecha]       = useState('')
  const [idMetodo, setIdMetodo]    = useState('')
  const [idEstado, setIdEstado]    = useState('')
  const [errors,   setErrors]      = useState<Record<string, string>>({})

  // Pagos de la Venta seleccionada — se traen aparte (no de la lista
  // paginada de la página, que puede no incluir todos los pagos de esta
  // Venta) para calcular saldo pendiente / próximo abono correctamente.
  const [pagos, setPagos] = useState<PagoLike[]>([])
  useEffect(() => {
    if (!idVenta) { setPagos([]); return }
    let cancelled = false
    apiRequest<{ data: PagoLike[] }>(`/api/payments?venta=${idVenta}&limit=100`)
      .then(res => { if (!cancelled) setPagos(res.data ?? []) })
      .catch(() => { if (!cancelled) setPagos([]) })
    return () => { cancelled = true }
  }, [idVenta])

  const clearError = (field: string) => setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))

  const ventaPagada = useMemo(() => {
    if (!idVenta) return false
    const v = rawVentas.find(rv => String(rv.id_venta) === idVenta)
    if (!v) return false
    const pagosValidados = pagos.filter(p => {
      if (String(p.id_venta) !== idVenta) return false
      const estado = estadosPago.find(e => e.id_estado_pago === p.id_estado_pago)?.nombre ?? ''
      return estado.toLowerCase().includes('validado')
    })
    const totalInstallments = Number(v.num_abonos)
    return Number.isFinite(totalInstallments) && totalInstallments > 0 && pagosValidados.length >= totalInstallments
  }, [idVenta, rawVentas, pagos, estadosPago])

  const totalVenta = useMemo(() => {
    if (!idVenta) return null
    const venta = rawVentas.find(rv => String(rv.id_venta) === idVenta) as any
    if (!venta) return null
    const total = Number(venta.total ?? venta.total_venta ?? venta.monto_total ?? venta.valor_total)
    return Number.isFinite(total) && total >= 0 ? total : null
  }, [idVenta, rawVentas])

  const saldoPendiente = useMemo(() => {
    if (!idVenta || totalVenta === null) return null
    const pagosActivos = pagos.filter(p => {
      if (String(p.id_venta) !== idVenta) return false
      const estado = estadosPago.find(e => e.id_estado_pago === p.id_estado_pago)?.nombre ?? ''
      return !estado.toLowerCase().includes('anulado')
    })
    const pagado = pagosActivos.reduce((sum, p) => sum + Number(p.monto ?? 0), 0)
    return Math.max(0, totalVenta - pagado)
  }, [idVenta, pagos, estadosPago, totalVenta])

  const ventaCompletada = ventaPagada || saldoPendiente === 0

  // Primer abono con 70% por defecto; los siguientes reparten el saldo
  // pendiente entre los installments restantes.
  const nextInstallment = useMemo(() => {
    if (!idVenta) return null
    const venta = rawVentas.find(rv => String(rv.id_venta) === idVenta) as any
    if (!venta) return null

    const total = Number(venta.total ?? venta.total_venta ?? venta.monto_total ?? venta.valor_total)
    const totalInstallments = Number(venta.num_abonos ?? venta.numero_abonos ?? venta.installments)
    if (!Number.isFinite(total) || !Number.isFinite(totalInstallments) || totalInstallments <= 0) return null

    const pagosActivos = pagos.filter(p => {
      if (String(p.id_venta) !== idVenta) return false
      const estado = estadosPago.find(e => e.id_estado_pago === p.id_estado_pago)?.nombre ?? ''
      return !estado.toLowerCase().includes('anulado')
    })
    const pagado = pagosActivos.reduce((sum, p) => sum + Number(p.monto ?? 0), 0)
    const installmentsRestantes = totalInstallments - pagosActivos.length
    if (installmentsRestantes <= 0) return null

    if (pagosActivos.length === 0) {
      const porcentajePrimerAbono = Number(venta.porcentaje_primer_abono ?? venta.porcentajePrimerAbono ?? 70)
      if (Number.isFinite(porcentajePrimerAbono) && porcentajePrimerAbono > 0 && porcentajePrimerAbono < 100) {
        return Math.max(0, total * porcentajePrimerAbono / 100)
      }
    }
    return Math.max(0, (total - pagado) / installmentsRestantes)
  }, [idVenta, rawVentas, pagos, estadosPago])

  useEffect(() => {
    setMontoRaw(nextInstallment === null ? '' : String(Math.round(nextInstallment)))
  }, [nextInstallment])

  const resetForm  = () => { setIdVentaRaw(''); setMontoRaw(''); setFecha(''); setIdMetodo(''); setIdEstado(''); setErrors({}) }
  const openCreate = (preIdVenta = '') => {
    resetForm()
    if (preIdVenta) setIdVentaRaw(preIdVenta)
    setFecha(new Date().toISOString().slice(0, 10))
    setIsFormOpen(true)
  }

  // Abrir form automáticamente si viene ?id_venta=X en la URL
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    const idVentaParam = searchParams.get('id_venta')
    if (idVentaParam) {
      openCreate(idVentaParam)
      // Limpiar el param de la URL sin redirigir
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setIdVenta = (v: string) => { setIdVentaRaw(v); clearError('idVenta') }

  const setMonto = (digits: string) => {
    const numericValue = Number(digits)
    const cappedValue = saldoPendiente !== null && Number.isFinite(numericValue) && numericValue > saldoPendiente
      ? String(saldoPendiente)
      : digits
    setMontoRaw(cappedValue)
    if (saldoPendiente !== null && Number.isFinite(numericValue) && numericValue > saldoPendiente) {
      onAlert({
        open: true,
        title: 'Monto superior al saldo pendiente',
        msg: `No se puede ingresar más de ${formatCurrency(saldoPendiente)} en este pedido.`,
      })
    }
    clearError('monto')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (ventaCompletada) {
      onAlert({
        open: true,
        title: 'Pedido completado',
        msg: ventaPagada
          ? 'Este pedido ya tiene todos sus abonos registrados y no admite más ventas.'
          : 'Este pedido ya tiene el total pagado y no admite más ventas.',
      })
      return
    }

    const montoIngresado = Number(monto)
    if (saldoPendiente !== null && Number.isFinite(montoIngresado) && montoIngresado > saldoPendiente) {
      onAlert({
        open: true,
        title: 'Monto superior al saldo pendiente',
        msg: `No se puede ingresar más de ${formatCurrency(saldoPendiente)} en este pedido.`,
      })
      return
    }

    const errs: Record<string, string> = {}
    if (!idVenta)      errs.idVenta  = 'Campo requerido'
    if (!monto.trim()) errs.monto    = 'Campo requerido'
    if (!fecha.trim()) errs.fecha    = 'Campo requerido'
    if (!idMetodo)     errs.idMetodo = 'Campo requerido'
    if (!idEstado)     errs.idEstado = 'Campo requerido'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setIsSubmitting(true)
    try {
      await withToast(
        onCreate({ id_venta: Number(idVenta), monto: Number(monto), fecha, id_metodo_pago: Number(idMetodo), id_estado_pago: Number(idEstado) }),
        'Venta registrada correctamente'
      )
      setIsFormOpen(false); resetForm()
    } catch { } finally { setIsSubmitting(false) }
  }

  return {
    isFormOpen, setIsFormOpen,
    isSubmitting,
    idVenta, setIdVenta,
    monto, setMonto,
    fecha, setFecha: (v: string) => { setFecha(v); clearError('fecha') },
    idMetodo, setIdMetodo: (v: string) => { setIdMetodo(v); clearError('idMetodo') },
    idEstado, setIdEstado: (v: string) => { setIdEstado(v); clearError('idEstado') },
    errors,
    ventaPagada, saldoPendiente, nextInstallment,
    openCreate,
    resetForm,
    handleSubmit,
  }
}
