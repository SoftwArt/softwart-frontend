// src/features/orders/hooks/useOrderForm.ts
import { useEffect, useRef, useState } from 'react'
import type { Pedido, EstadoServicio } from '../types'
import { withToast } from '@/src/shared/lib/withToast'
import { apiRequest } from '@/src/shared/lib/apiClient'
import type { VentaOption } from '@/src/shared/hooks/useOptions'
import type { ServicioOption } from '@/src/shared/hooks/useOptions'
import { bogotaTodayStr, addDaysToDateStr } from '@/src/shared/lib/bogotaTime'

type CreateEditData = {
  id_venta: number; id_servicio: number; id_marco: number | null
  id_estado: number; fecha: string; fecha_estimada: string | null
  precio: number; observacion: string; estado: boolean
}

type Params = {
  estados: EstadoServicio[]
  rawVentas: VentaOption[]
  rawServicios: ServicioOption[]
  onCreate: (data: CreateEditData) => Promise<unknown>
  onEdit: (id: number, data: CreateEditData) => Promise<unknown>
}

// Suma de precios ya asignados a una Venta en sus otros servicios — vía
// endpoint dedicado (?venta=X) en vez de depender de tener cargada la lista
// completa de pedidos: con paginación real el frontend solo tiene la página
// actual, que puede no incluir todos los servicios de esa Venta.
async function fetchAsignado(idVenta: string, excluirIdDetalle: number | null): Promise<number> {
  const res = await apiRequest<{ data: { id_detalle: number; precio: number }[] }>(
    `/api/sale-details?venta=${idVenta}&limit=100`
  )
  return (res.data ?? [])
    .filter(d => d.id_detalle !== excluirIdDetalle)
    .reduce((suma, d) => suma + Number(d.precio), 0)
}

export function useOrderForm({ estados, rawVentas, rawServicios, onCreate, onEdit }: Params) {
  const [isFormOpen,   setIsFormOpen]   = useState(false)
  const [editingId,    setEditingId]    = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [idVenta,      setIdVenta]      = useState('')
  const [idServicio,   setIdServicioRaw] = useState('')
  const [idMarco,      setIdMarco]      = useState('')
  const [idEstado,     setIdEstado]     = useState('')
  const [fecha,        setFechaRaw]     = useState('')
  const [fechaEstimada, setFechaEstimada] = useState('')
  // Mientras esté en false, fechaEstimada se recalcula sola al cambiar
  // fecha/servicio. En cuanto el usuario la edita a mano queda "fija" — no
  // se le vuelve a pisar el valor aunque siga cambiando fecha o servicio.
  const [fechaEstimadaManual, setFechaEstimadaManual] = useState(false)
  const [precio,       setPrecio]       = useState('')
  const [observacion,  setObservacion]  = useState('')
  const [errors,       setErrors]       = useState<Record<string, string>>({})
  const [restanteDisponible, setRestanteDisponible] = useState(0)

  const rawVentasRef = useRef(rawVentas)
  useEffect(() => { rawVentasRef.current = rawVentas }, [rawVentas])

  const clearError = (field: string) => setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))

  // Mantiene restanteDisponible al día tanto al crear (idVenta cambia por el
  // Combobox) como al editar (openEdit fija idVenta directo) — fuente única,
  // separado del prefill de precio (que solo aplica al crear, ver handleVentaChange).
  useEffect(() => {
    let cancelled = false
    if (!idVenta) { setRestanteDisponible(0); return }
    const total = rawVentasRef.current.find(rv => String(rv.id_venta) === idVenta)?.total ?? 0
    fetchAsignado(idVenta, editingId)
      .then(asignado => { if (!cancelled) setRestanteDisponible(total - asignado) })
      .catch(() => { if (!cancelled) setRestanteDisponible(total) })
    return () => { cancelled = true }
  }, [idVenta, editingId])

  // Sugiere fecha_estimada = fecha + duración del servicio elegido, mientras
  // el usuario no la haya tocado a mano (fechaEstimadaManual).
  const sugerirFechaEstimada = (fechaBase: string, idServicioActual: string) => {
    if (fechaEstimadaManual || !fechaBase || !idServicioActual) return
    const servicio = rawServicios.find(s => String(s.id_servicio) === idServicioActual)
    if (!servicio) return
    setFechaEstimada(addDaysToDateStr(fechaBase, servicio.duracion))
  }

  const setFecha = (v: string) => {
    setFechaRaw(v)
    clearError('fecha')
    sugerirFechaEstimada(v, idServicio)
  }

  const setIdServicio = (v: string) => {
    setIdServicioRaw(v)
    clearError('idServicio')
    sugerirFechaEstimada(fecha, v)
  }

  const onFechaEstimadaChange = (v: string) => {
    setFechaEstimada(v)
    setFechaEstimadaManual(true)
  }

  const resetForm = () => {
    setIdVenta(''); setIdServicioRaw(''); setIdMarco(''); setIdEstado('')
    setFechaRaw(''); setFechaEstimada(''); setFechaEstimadaManual(false)
    setPrecio(''); setObservacion(''); setErrors({}); setEditingId(null)
  }
  const openCreate = () => {
    resetForm()
    const hoy = bogotaTodayStr()
    setFechaRaw(hoy)
    setIsFormOpen(true)
  }
  const openEdit   = (p: Pedido) => {
    setEditingId(p.id_detalle); setIdVenta(String(p.id_venta))
    setIdServicioRaw(String(p.id_servicio)); setIdMarco(p.id_marco ? String(p.id_marco) : '')
    setIdEstado(String(p.id_estado)); setFechaRaw(p.fecha)
    // Ya tiene una fecha estimada guardada (propia o previamente sugerida) —
    // se trata como "manual" para no pisarla si se toca fecha/servicio al editar.
    setFechaEstimada(p.fecha_estimada ?? '')
    setFechaEstimadaManual(!!p.fecha_estimada)
    setPrecio(String(p.precio)); setObservacion(p.observacion ?? '')
    setErrors({}); setIsFormOpen(true)
  }

  const handleVentaChange = (v: string) => {
    setIdVenta(v)
    clearError('idVenta')
    if (!editingId) {
      // Precarga con el restante (no el total) — si ya hay otros servicios
      // registrados en esa venta, el cliente todavía debe pagar la diferencia.
      const total = rawVentasRef.current.find(rv => String(rv.id_venta) === v)?.total ?? 0
      fetchAsignado(v, null)
        .then(asignado => {
          const restante = total - asignado
          setPrecio(restante > 0 ? String(restante) : '0')
          clearError('precio')
        })
        .catch(() => {
          setPrecio(total > 0 ? String(total) : '0')
          clearError('precio')
        })
    }
  }

  const handlePrecioChange = (v: string) => {
    setPrecio(v)
    clearError('precio')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!idVenta)      newErrors.idVenta    = 'Campo requerido'
    if (!idServicio)   newErrors.idServicio = 'Campo requerido'
    if (!fecha.trim()) newErrors.fecha      = 'Campo requerido'
    if (!precio)       newErrors.precio     = 'Campo requerido'
    // Tolerancia de un centavo por redondeo — el backend hace la validación
    // real (única fuente de verdad), esto es solo para no hacer un viaje al
    // servidor con un valor que ya sabemos que va a rechazar.
    else if (!editingId && Number(precio) - restanteDisponible > 0.01) {
      newErrors.precio = `No puede superar el restante disponible (${restanteDisponible.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })})`
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setIsSubmitting(true)
    try {
      const data = {
        id_venta: Number(idVenta), id_servicio: Number(idServicio),
        id_marco: idMarco ? Number(idMarco) : null,
        id_estado: idEstado ? Number(idEstado) : (estados[0]?.id_estado ?? 1), fecha,
        fecha_estimada: fechaEstimada || null,
        precio: Number(precio), observacion, estado: true,
      }
      await withToast(
        editingId ? onEdit(editingId, data) : onCreate(data),
        editingId ? 'Pedido actualizado' : 'Pedido registrado'
      )
      setIsFormOpen(false); resetForm()
    } catch { } finally { setIsSubmitting(false) }
  }

  return {
    isFormOpen, setIsFormOpen,
    editingId,
    idVenta, onIdVentaChange: handleVentaChange,
    idServicio, setIdServicio,
    idMarco, setIdMarco,
    fecha, setFecha,
    fechaEstimada, onFechaEstimadaChange,
    precio, onPrecioChange: handlePrecioChange,
    restanteDisponible,
    observacion, setObservacion,
    errors,
    isSubmitting,
    openCreate,
    openEdit,
    resetForm,
    handleSubmit,
  }
}
