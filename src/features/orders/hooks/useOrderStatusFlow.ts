// src/features/orders/hooks/useOrderStatusFlow.ts
import { useState } from 'react'
import type { EstadoServicio, PedidoDetalle, PedidoCancelTarget, PedidoAdvanceTarget, PedidoDeleteTarget } from '../types'
import { estadoNombre, isPedidoFinalizado, buildCancelCascadeLines, MSG_CANCELAR_BASE } from '../utils'
import { apiRequest } from '@/src/shared/lib/apiClient'
import { withToast } from '@/src/shared/lib/withToast'
import { undoableAction } from '@/src/shared/lib/undoableAction'

type Params = {
  estados: EstadoServicio[]
  onChangeStatus: (id: number, id_estado: number) => Promise<unknown>
  onDelete: (id: number) => Promise<unknown>
}

export function useOrderStatusFlow({ estados, onChangeStatus, onDelete }: Params) {
  const estadoCanceladoObj = estados.find(e => e.nombre.toLowerCase().includes('cancelado'))

  // Confirmación antes de cancelar (estado terminal e irreversible)
  const [cancelTarget, setCancelTarget] = useState<PedidoCancelTarget | null>(null)

  // Confirmación al avanzar el estado (a cualquiera que no sea "Sin
  // empezar" ni el flujo de cancelar, que ya tiene su propia confirmación)
  // si la Venta todavía no tiene ningún abono Validado — evita que el
  // servicio arranque en el taller antes de que el cliente haya pagado el
  // primer abono.
  const [advanceTarget, setAdvanceTarget] = useState<PedidoAdvanceTarget | null>(null)

  // Confirmación antes de eliminar (hard-delete: solo para corregir un error
  // de captura antes de que el servicio avance — bloqueado si ya está
  // Cancelado/Finalizado, ahí el camino es anular, no borrar).
  const [deleteTarget, setDeleteTarget] = useState<PedidoDeleteTarget | null>(null)

  const requestDelete = (id: number, label: string) => setDeleteTarget({ id, label })

  const confirmEliminarServicio = () => {
    if (!deleteTarget) return
    const { id, label } = deleteTarget
    setDeleteTarget(null)
    undoableAction({
      message: `Eliminando ${label}...`,
      successMsg: 'Servicio eliminado',
      onCommit: () => onDelete(id),
    })
  }

  const aplicarCambioEstado = async (id: number, id_estado: number) => {
    try { await withToast(onChangeStatus(id, id_estado), 'Estado actualizado') } catch { }
  }

  const handleCambiarEstado = async (id: number, id_estadoSeleccionado: number, idEstadoActual?: number) => {
    // Un servicio Finalizado ya está listo en el taller (pero aún no se lo
    // llevó el cliente) — desde ahí solo puede avanzar a Entregado o
    // cancelarse, nunca "retroceder" a Sin empezar/En preparación. En vez de
    // solo bloquear con un error, se redirige a la misma confirmación de
    // cancelar (igual que Citas Completada / Pagos Validado) salvo que el
    // destino elegido ya sea Entregado, que pasa directo.
    const targetNombre = estadoNombre(estados, id_estadoSeleccionado).toLowerCase()
    const bloqueadoDesdeFinalizado = idEstadoActual !== undefined
      && isPedidoFinalizado(estados, idEstadoActual)
      && !targetNombre.includes('cancelado')
      && !targetNombre.includes('entregado')
    const id_estado = bloqueadoDesdeFinalizado && estadoCanceladoObj
      ? estadoCanceladoObj.id_estado
      : id_estadoSeleccionado

    // Cancelar es terminal → pedir confirmación antes de aplicar
    if (estadoNombre(estados, id_estado).toLowerCase().includes('cancelado')) {
      setCancelTarget({
        id, id_estado, loading: true, lines: [],
        msg: bloqueadoDesdeFinalizado
          ? `Este servicio ya está Finalizado — no puede cambiar a otro estado, solo cancelarse. ${MSG_CANCELAR_BASE}`
          : undefined,
      })
      apiRequest<{ success: boolean; data: PedidoDetalle }>(`/api/sale-details/${id}`)
        .then((res) => {
          const sale = res.data?.sale
          if (!sale) {
            setCancelTarget(prev => prev && prev.id === id ? { ...prev, loading: false, lines: [] } : prev)
            return
          }
          setCancelTarget(prev => prev && prev.id === id ? { ...prev, loading: false, lines: buildCancelCascadeLines(sale, id) } : prev)

          const pagosValidados = (sale.payments ?? []).some(
            p => p.paymentStatus?.nombre?.toLowerCase().includes('validado')
          )
          const hermanosActivos = (sale.saleDetails ?? [])
            .filter(d => d.id_detalle !== id)
            .filter(d => {
              const n = d.serviceStatus?.nombre?.toLowerCase() ?? ''
              return !n.includes('finaliz') && !n.includes('entreg') && !n.includes('cancel')
            })
          if (hermanosActivos.length === 0 && pagosValidados) {
            setCancelTarget(prev => prev && prev.id === id ? {
              ...prev,
              loading: false,
              bloqueado: true,
              msg: `Es el único servicio activo del Pedido #${sale.id_venta} y tiene pagos validados. Registra la devolución antes de cancelarlo.`,
              lines: [],
            } : prev)
          }
        })
        .catch(() => setCancelTarget(prev => prev && prev.id === id ? { ...prev, loading: false, lines: [] } : prev))
      return
    }

    // "Sin empezar" es el estado inicial — no hace falta advertir nada al
    // volver ahí. Para cualquier otro avance, se verifica si la Venta ya
    // tiene su primer abono Validado antes de aplicar directo.
    if (estadoNombre(estados, id_estado).toLowerCase().includes('sin empezar')) {
      await aplicarCambioEstado(id, id_estado)
      return
    }

    try {
      const res = await apiRequest<{ success: boolean; data: PedidoDetalle }>(`/api/sale-details/${id}`)
      const pagos = res.data?.sale?.payments ?? []
      const tieneAbonoValidado = pagos.some(p => p.paymentStatus?.nombre?.toLowerCase().includes('validado'))
      if (tieneAbonoValidado) {
        await aplicarCambioEstado(id, id_estado)
        return
      }
      setAdvanceTarget({ id, id_estado })
    } catch {
      // Si no se pudo verificar, no bloquear el cambio — solo se pierde la advertencia.
      await aplicarCambioEstado(id, id_estado)
    }
  }

  const confirmAvanzarEstado = async () => {
    if (!advanceTarget) return
    const { id, id_estado } = advanceTarget
    setAdvanceTarget(null)
    await aplicarCambioEstado(id, id_estado)
  }

  const confirmCancelarServicio = () => {
    if (!cancelTarget || cancelTarget.loading || cancelTarget.bloqueado) return
    const { id, id_estado } = cancelTarget
    setCancelTarget(null)
    undoableAction({
      message: 'Cancelando servicio...',
      successMsg: 'Servicio cancelado',
      onCommit: () => onChangeStatus(id, id_estado),
    })
  }

  return {
    cancelTarget, setCancelTarget, confirmCancelarServicio,
    advanceTarget, setAdvanceTarget, confirmAvanzarEstado,
    deleteTarget, setDeleteTarget, requestDelete, confirmEliminarServicio,
    handleCambiarEstado,
  }
}
