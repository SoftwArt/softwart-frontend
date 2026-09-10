// ============================================================
// src/App.tsx
// ============================================================

import { lazy, Suspense, useEffect } from 'react'
import { useBackendWakeup }      from '@/src/shared/hooks/useBackendWakeup'
import { BackendWakeupBanner }   from '@/src/shared/components/BackendWakeupBanner'
import { Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { checkAuthValidity } from '@/src/shared/lib/checkAuth'
import { Toaster, toast } from 'sonner'
import { AdminSidebar }     from '@/src/shared/components/AdminSidebar'
import { LandingPage }      from '@/src/features/dashboard/components/LandingPage'
import { performLogout }    from '@/src/features/auth/utils'
import { useSessionKeepAlive } from '@/src/features/auth/hooks/useSessionKeepAlive'
import { useMyPermissions } from '@/src/shared/hooks/useMyPermissions'
import { LogOut, ChevronDown } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/src/shared/components/ui/dropdown-menu'

// Rutas bajo lazy loading — reducen el bundle inicial del landing
const LoginPage         = lazy(() => import('@/src/features/auth/components/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage      = lazy(() => import('@/src/features/auth/components/RegisterPage').then(m => ({ default: m.RegisterPage })))
const RecoveryPage      = lazy(() => import('@/src/features/auth/components/RecoveryPage').then(m => ({ default: m.RecoveryPage })))
const ResetPasswordPage = lazy(() => import('@/src/features/auth/components/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const AuthLayout        = lazy(() => import('@/src/features/auth/components/AuthLayout').then(m => ({ default: m.AuthLayout })))
const NotFoundPage      = lazy(() => import('@/src/features/auth/components/NotFoundPage').then(m => ({ default: m.NotFoundPage })))
const PoliticaPrivacidadPage = lazy(() => import('@/src/features/legal/components/PoliticaPrivacidadPage').then(m => ({ default: m.PoliticaPrivacidadPage })))
const TerminosServicioPage   = lazy(() => import('@/src/features/legal/components/TerminosServicioPage').then(m => ({ default: m.TerminosServicioPage })))
const AccountLayout     = lazy(() => import('@/src/features/account/components/AccountLayout').then(m => ({ default: m.AccountLayout })))
const AccountResumenPage    = lazy(() => import('@/src/features/account/components/ResumenPage').then(m => ({ default: m.ResumenPage })))
const AccountCitasPage      = lazy(() => import('@/src/features/account/components/CitasPage').then(m => ({ default: m.CitasPage })))
const AccountServiciosPage  = lazy(() => import('@/src/features/account/components/ServiciosPage').then(m => ({ default: m.ServiciosPage })))
const AccountAbonosPage     = lazy(() => import('@/src/features/account/components/AbonosPage').then(m => ({ default: m.AbonosPage })))
const AccountCuentaPage     = lazy(() => import('@/src/features/account/components/CuentaPage').then(m => ({ default: m.CuentaPage })))
const DashboardPage     = lazy(() => import('@/src/features/dashboard/components/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ClientsPage       = lazy(() => import('@/src/features/clients/components/ClientsPage').then(m => ({ default: m.ClientsPage })))
const UsersPage         = lazy(() => import('@/src/features/users/components/UsersPage').then(m => ({ default: m.UsersPage })))
const RolesPage         = lazy(() => import('@/src/features/roles/components/RolesPage').then(m => ({ default: m.RolesPage })))
const ServicesPage      = lazy(() => import('@/src/features/services/components/ServicesPage').then(m => ({ default: m.ServicesPage })))
const AppointmentsPage  = lazy(() => import('@/src/features/appointments/components/AppointmentsPage').then(m => ({ default: m.AppointmentsPage })))
const PaymentsPage      = lazy(() => import('@/src/features/payments/components/PaymentsPage').then(m => ({ default: m.PaymentsPage })))
const CalculatorPage    = lazy(() => import('@/src/features/calculator/components/CalculatorPage').then(m => ({ default: m.CalculatorPage })))
const SalesPage         = lazy(() => import('@/src/features/sales/components/SalesPage').then(m => ({ default: m.SalesPage })))
const OrdersPage        = lazy(() => import('@/src/features/orders/components/OrdersPage').then(m => ({ default: m.OrdersPage })))
const PermissionsPage   = lazy(() => import('@/src/features/permissions/components/PermissionsPage').then(m => ({ default: m.PermissionsPage })))

// Lee rol desde localStorage (recordarme) o sessionStorage (sesión temporal)
function getRol() { return localStorage.getItem('rol') ?? sessionStorage.getItem('rol') }

function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { can, isLoading } = useMyPermissions()
  // Verificar que el token no haya expirado antes de evaluar el permiso
  if (!checkAuthValidity()) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  const rol = getRol()
  if (!rol) return <Navigate to="/login" replace />
  // Mientras cargan los permisos no se puede decidir el acceso — useMyPermissions
  // por defecto deja pasar todo (pensado para no ocultar de más el sidebar
  // mientras carga), pero acá sí es un gate real: hay que esperar la respuesta.
  if (isLoading) return <RouteFallback />
  if (!can('PANEL.ACCESO')) return <Navigate to="/login" replace />
  return <RequireSession>{children}</RequireSession>
}

// El sidebar (AdminSidebar.tsx) ya oculta los módulos sin permiso, pero eso
// nunca bloqueaba la ruta en sí: un usuario con PANEL.ACCESO pero sin, ej.,
// CITAS.VER podía navegar directo a /admin/appointments por URL y ver una
// tabla vacía sin explicación (el backend sí devuelve 403 en la data, pero la
// UI no lo comunicaba). Cada módulo bajo /admin queda ahora protegido acá con
// el mismo nombre de permiso que ya usa el sidebar para decidir qué mostrar.
function RequireModulePermission({ permiso, children }: { permiso: string; children: React.ReactNode }) {
  const { can, isLoading } = useMyPermissions()
  useEffect(() => {
    if (!isLoading && !can(permiso)) {
      toast.error('No tienes permiso para acceder a esa sección')
    }
  }, [isLoading, permiso]) // eslint-disable-line react-hooks/exhaustive-deps
  if (isLoading) return <RouteFallback />
  if (!can(permiso)) return <Navigate to={firstAllowedAdminPath(can)} replace />
  return <>{children}</>
}

const ADMIN_MODULES = [
  { path: '/admin/dashboard', permiso: 'DASHBOARD.VER' },
  { path: '/admin/clients', permiso: 'CLIENTES.VER' },
  { path: '/admin/appointments', permiso: 'CITAS.VER' },
  { path: '/admin/sales', permiso: 'VENTAS.VER' },
  { path: '/admin/orders', permiso: 'PEDIDOS.VER' },
  { path: '/admin/payments', permiso: 'PAGOS.VER' },
  { path: '/admin/calculator', permiso: 'MARCOS.VER' },
  { path: '/admin/services', permiso: 'SERVICIOS.VER' },
  { path: '/admin/users', permiso: 'USUARIOS.VER' },
  { path: '/admin/roles', permiso: 'ROLES.VER' },
  { path: '/admin/permissions', permiso: 'PERMISOS.VER' },
] as const

function firstAllowedAdminPath(can: (permiso: string) => boolean): string {
  return ADMIN_MODULES.find(module => can(module.permiso))?.path ?? '/admin/access-denied'
}

function AdminIndexRedirect() {
  const { can, isLoading } = useMyPermissions()
  if (isLoading) return <RouteFallback />
  return <Navigate to={firstAllowedAdminPath(can)} replace />
}

function AccessDeniedPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
      <h1 className="text-2xl font-bold text-foreground">Acceso denegado</h1>
      <p className="text-muted-foreground">Tu rol no tiene módulos habilitados.</p>
    </div>
  )
}

function RequireCliente({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  if (!checkAuthValidity()) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  const rol = getRol()
  if (!rol) return <Navigate to="/login" replace />
  if (rol !== 'Cliente') return <Navigate to="/login" replace />
  return <RequireSession>{children}</RequireSession>
}

// Sliding expiration compartida entre panel admin y portal cliente — un solo
// código, montado una vez ya dentro de una ruta autenticada.
function RequireSession({ children }: { children: React.ReactNode }) {
  useSessionKeepAlive()
  return <>{children}</>
}

function AdminLayout() {
  const navigate = useNavigate()
  const rol      = getRol()   ?? ''
  const correo   = localStorage.getItem('correo') ?? sessionStorage.getItem('correo') ?? ''
  const inicial  = correo.charAt(0).toUpperCase()

  const handleLogout = async () => {
    await performLogout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="shrink-0 h-14 border-b border-border bg-card flex items-center justify-end px-6 gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent transition-colors outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]">
                <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-primary">{inicial}</span>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-medium text-foreground leading-tight truncate max-w-[160px]">{correo}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{rol}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-xs font-medium text-foreground truncate">{correo}</p>
                <p className="text-[10px] text-muted-foreground">{rol}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-rose-500 focus:text-rose-500 focus:bg-rose-500/10 cursor-pointer">
                <LogOut className="h-4 w-4 mr-2 shrink-0" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 min-h-0 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    </div>
  )
}

export default function App() {
  const showSplash = useBackendWakeup()

  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Públicas */}
          <Route path="/"          element={<LandingPage />} />
          <Route path="/politica-privacidad" element={<PoliticaPrivacidadPage />} />
          <Route path="/terminos-servicio"   element={<TerminosServicioPage />} />

          {/* Auth — bajo AuthLayout (header con volver al inicio) */}
          <Route element={<AuthLayout />}>
            <Route path="/login"     element={<LoginPage />} />
            <Route path="/register"  element={<RegisterPage />} />
            <Route path="/recover"   element={<RecoveryPage />} />
            <Route path="/reset"     element={<ResetPasswordPage />} />
          </Route>

          {/* Área cliente */}
          <Route path="/my-account" element={<RequireCliente><AccountLayout /></RequireCliente>}>
            <Route index          element={<AccountResumenPage />} />
            <Route path="citas"     element={<AccountCitasPage />} />
            <Route path="servicios" element={<AccountServiciosPage />} />
            <Route path="abonos"    element={<AccountAbonosPage />} />
            <Route path="perfil"    element={<AccountCuentaPage />} />
          </Route>

          {/* Panel admin */}
          <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
            <Route index              element={<AdminIndexRedirect />} />
            <Route path="dashboard"   element={<RequireModulePermission permiso="DASHBOARD.VER"><DashboardPage /></RequireModulePermission>} />
            <Route path="clients"      element={<RequireModulePermission permiso="CLIENTES.VER"><ClientsPage /></RequireModulePermission>} />
            <Route path="users"        element={<RequireModulePermission permiso="USUARIOS.VER"><UsersPage /></RequireModulePermission>} />
            <Route path="roles"        element={<RequireModulePermission permiso="ROLES.VER"><RolesPage /></RequireModulePermission>} />
            <Route path="services"     element={<RequireModulePermission permiso="SERVICIOS.VER"><ServicesPage /></RequireModulePermission>} />
            <Route path="appointments" element={<RequireModulePermission permiso="CITAS.VER"><AppointmentsPage /></RequireModulePermission>} />
            <Route path="payments"     element={<RequireModulePermission permiso="PAGOS.VER"><PaymentsPage /></RequireModulePermission>} />
            <Route path="calculator"   element={<RequireModulePermission permiso="MARCOS.VER"><CalculatorPage /></RequireModulePermission>} />
            <Route path="sales"        element={<RequireModulePermission permiso="VENTAS.VER"><SalesPage /></RequireModulePermission>} />
            <Route path="orders"       element={<RequireModulePermission permiso="PEDIDOS.VER"><OrdersPage /></RequireModulePermission>} />
            <Route path="permissions"  element={<RequireModulePermission permiso="PERMISOS.VER"><PermissionsPage /></RequireModulePermission>} />
            <Route path="access-denied" element={<AccessDeniedPage />} />
            <Route path="*"           element={<AdminIndexRedirect />} />
          </Route>

          {/* Catch-all global → 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>

      <Toaster position="bottom-right" richColors closeButton />
      <BackendWakeupBanner show={showSplash} />
    </>
  )
}
