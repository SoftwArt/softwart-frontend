// ============================================================
// src/shared/hooks/useOptions.ts
// Fetchers ligeros que devuelven ComboboxOption[] para los
// selects relacionales en Citas, Ventas, Pedidos y Pagos.
// ============================================================
import { useState, useEffect, useCallback, useMemo } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'
import type { ComboboxOption } from '@/src/shared/components/Combobox'

type ApiResponse<T> = { success: boolean; data: T; meta?: unknown }

// Upsert por id — nunca elimina entradas ya presentes. Así lo que ya estaba
// seleccionado/visible (el top-100 inicial del mount, o algo encontrado en
// una búsqueda anterior) no desaparece cuando una búsqueda nueva trae un
// subconjunto distinto — filterX/las filas de tabla/lookups de nombre en
// otras partes de la página siguen resolviendo lo que ya vieron sin cambios.
function mergeById<T>(prev: T[], next: T[], idOf: (item: T) => number): T[] {
  const byId = new Map(prev.map((item) => [idOf(item), item]))
  for (const item of next) byId.set(idOf(item), item)
  return Array.from(byId.values())
}

// ── Clientes ──────────────────────────────────────────────────
export type ClienteOption = { id_cliente: number; nombre: string; tipoDocumento: string; documento: string }

export function useClientsOptions() {
  const [rawClientes, setRawClientes] = useState<ClienteOption[]>([])
  const [isLoading,    setIsLoading]    = useState(true)
  const [isSearching,  setIsSearching]  = useState(false)

  useEffect(() => {
    apiRequest<ApiResponse<ClienteOption[]>>('/api/clients?limit=100')
      .then((res) => setRawClientes((prev) => mergeById(prev, res.data ?? [], (c) => c.id_cliente)))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  // Búsqueda contra el servidor (Combobox de Cliente en Citas/Ventas) — el
  // top-100 inicial por recencia no alcanza a cubrir clientes más antiguos.
  const search = useCallback((q: string) => {
    if (!q.trim()) return
    setIsSearching(true)
    apiRequest<ApiResponse<ClienteOption[]>>(`/api/clients?limit=20&q=${encodeURIComponent(q)}`)
      .then((res) => setRawClientes((prev) => mergeById(prev, res.data ?? [], (c) => c.id_cliente)))
      .catch(console.error)
      .finally(() => setIsSearching(false))
  }, [])

  const options = useMemo(
    () => rawClientes.map((c) => ({ value: String(c.id_cliente), label: c.nombre, sublabel: c.documento })),
    [rawClientes]
  )

  return { options, rawClientes, isLoading, isSearching, search }
}

// ── Ventas ────────────────────────────────────────────────────
type VentaPayment = { paymentStatus?: { nombre?: string } | null }
export type VentaOption = { id_venta: number; fecha: string; total: number; num_abonos?: number; porcentaje_primer_abono?: number; payments?: VentaPayment[]; client?: { id_cliente: number; nombre?: string } | null }

export function useSalesOptions() {
  const [rawVentas,   setRawVentas]   = useState<VentaOption[]>([])
  const [isLoading,   setIsLoading]   = useState(true)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    apiRequest<ApiResponse<VentaOption[]>>('/api/sales?limit=100')
      .then((res) => setRawVentas((prev) => mergeById(prev, res.data ?? [], (v) => v.id_venta)))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  // Búsqueda contra el servidor (Combobox de Venta en Pagos/Pedidos) — el
  // top-100 inicial por recencia no alcanza a cubrir ventas más antiguas.
  const search = useCallback((q: string) => {
    if (!q.trim()) return
    setIsSearching(true)
    apiRequest<ApiResponse<VentaOption[]>>(`/api/sales?limit=20&q=${encodeURIComponent(q)}`)
      .then((res) => setRawVentas((prev) => mergeById(prev, res.data ?? [], (v) => v.id_venta)))
      .catch(console.error)
      .finally(() => setIsSearching(false))
  }, [])

  const options = useMemo(
    () =>
      rawVentas.map((v) => ({
        value:    String(v.id_venta),
        // La entidad Sale se muestra como "Pedido" en el panel (Ventas -> Pedidos,
        // ver AdminSidebar.tsx) — este label lo consumen tanto la página de Ventas
        // (antes Pagos) como la de Servicios (antes/aún Pedidos) para referenciar
        // a qué Sale pertenece cada fila.
        label:    `Pedido #${v.id_venta} — ${new Date(v.fecha).toLocaleDateString('es-CO')}`,
        sublabel: v.total?.toLocaleString('es-CO', { style: 'currency', currency: 'COP' }),
      })),
    [rawVentas]
  )

  return { options, rawVentas, isLoading, isSearching, search }
}

// ── Citas ─────────────────────────────────────────────────────
export type CitaOption = { id_cita: number; fecha: string; hora: string; client?: { id_cliente: number } | null }

export function useAppointmentsOptions() {
  const [options,   setOptions]   = useState<ComboboxOption[]>([])
  const [rawCitas,  setRawCitas]  = useState<CitaOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiRequest<ApiResponse<CitaOption[]>>('/api/appointments?limit=100')
      .then((res) => {
        const data = res.data ?? []
        setRawCitas(data)
        setOptions(
          data.map((c) => ({
            value:    String(c.id_cita),
            label:    `Cita #${c.id_cita} — ${new Date(c.fecha).toLocaleDateString('es-CO')}`,
            sublabel: c.hora,
          }))
        )
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  return { options, rawCitas, isLoading }
}

// ── Servicios ─────────────────────────────────────────────────
// duracion (días) viaja en rawServicios — se necesita para sugerir la fecha
// estimada de un Pedido/SaleDetail (ver OrdersPage.tsx/useOrderForm.ts).
export type ServicioOption = { id_servicio: number; nombre: string; duracion: number }

export function useServicesOptions() {
  const [options,      setOptions]      = useState<ComboboxOption[]>([])
  const [rawServicios, setRawServicios] = useState<ServicioOption[]>([])
  const [isLoading,    setIsLoading]    = useState(true)

  useEffect(() => {
    apiRequest<ApiResponse<ServicioOption[]>>('/api/services')
      .then((res) => {
        const data = res.data ?? []
        setRawServicios(data)
        setOptions(
          data.map((s) => ({
            value: String(s.id_servicio),
            label: s.nombre,
          }))
        )
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  return { options, rawServicios, isLoading }
}

// ── Roles ─────────────────────────────────────────────────────
export type RolOption = { id_rol: number; nombre: string; estado: boolean }

export function useRolesOptions() {
  const [options,    setOptions]    = useState<ComboboxOption[]>([])
  const [rawRoles,   setRawRoles]   = useState<RolOption[]>([])
  const [isLoading,  setIsLoading]  = useState(true)

  useEffect(() => {
    apiRequest<ApiResponse<RolOption[]>>('/api/roles?limit=100')
      .then((res) => {
        const data = res.data ?? []
        setRawRoles(data)
        // Solo roles activos — no tendría sentido dejar crear un usuario
        // con un rol que el propio módulo de Roles marcó como inactivo.
        setOptions(
          data
            .filter((r) => r.estado)
            .map((r) => ({ value: String(r.id_rol), label: r.nombre }))
        )
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  return { options, rawRoles, isLoading }
}

// ── Métodos de pago ───────────────────────────────────────────
type MetodoPagoOption = { id_metodo_pago: number; nombre: string }

export function usePaymentMethodOptions() {
  const [options,   setOptions]   = useState<ComboboxOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiRequest<ApiResponse<MetodoPagoOption[]>>('/api/payment-methods')
      .then((res) => {
        setOptions(
          (res.data ?? []).map((m) => ({
            value: String(m.id_metodo_pago),
            label: m.nombre,
          }))
        )
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  return { options, isLoading }
}

// ── Marcos ────────────────────────────────────────────────────
type MarcoOption = { id_marco: number; codigo: string; precio_ensamblado: number }

export function useFrameOptions() {
  const [options,   setOptions]   = useState<ComboboxOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiRequest<ApiResponse<MarcoOption[]>>('/api/frames')
      .then((res) => {
        setOptions(
          (res.data ?? []).map((m) => ({
            value:    String(m.id_marco),
            label:    m.codigo,
            sublabel: m.precio_ensamblado?.toLocaleString('es-CO', { style: 'currency', currency: 'COP' }),
          }))
        )
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  return { options, isLoading }
}