// Reemplaza a MyAccountPage.tsx como layout de /my-account: llama useAccount()
// una sola vez (para no duplicar el polling) y expone todo a las sub-rutas
// (Resumen/Citas/Servicios/Mi cuenta) vía Outlet context. El modal de
// agendar cita vive acá porque cualquier página lo puede disparar; editar
// perfil ya no es un modal (vive inline en CuentaPage) y el de cancelar
// cita es local a cada CitaCard.
import { useEffect, useState, type FormEvent } from 'react'
import { Outlet, useSearchParams } from 'react-router-dom'
import { LazyMotion, domAnimation, AnimatePresence } from 'framer-motion'
import { useAccount } from '../hooks/useAccount'
import { AccountSidebar } from './AccountSidebar'
import { AccountTopbar } from './AccountTopbar'
import { AccountMobileNav } from './AccountMobileNav'
import { NewAppointmentModal } from './NewAppointmentModal'

export type AccountOutletContext = ReturnType<typeof useAccount> & {
  openNewAppointment: () => void
}

export function AccountLayout() {
  const [searchParams] = useSearchParams()
  const [showCitaForm, setShowCitaForm] = useState(false)

  const account = useAccount()
  const {
    perfil, citaFecha, citaHora, citaObs, setCitaObs,
    citaErrors, isAgendando, disponibilidad,
    onCitaFechaChange, onCitaHoraChange, submitCita, resetCitaForm, handleLogout,
  } = account

  const closeCitaForm = () => { setShowCitaForm(false); resetCitaForm() }

  useEffect(() => {
    if (searchParams.get('new-appointment') === 'true') setShowCitaForm(true)
  }, [searchParams])

  useEffect(() => {
    if (showCitaForm) onCitaFechaChange(citaFecha)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCitaForm])

  const handleSubmitCita = async (e: FormEvent) => {
    const ok = await submitCita(e)
    if (ok) closeCitaForm()
  }

  const outletContext: AccountOutletContext = {
    ...account,
    openNewAppointment: () => setShowCitaForm(true),
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="flex h-screen overflow-hidden bg-background">
        <AccountSidebar />

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <AccountTopbar nombre={perfil?.nombre ?? ''} correo={perfil?.correo ?? ''} onLogout={handleLogout} />
          <AccountMobileNav />

          {/* Sin overflow-y-auto/padding acá: cada página decide su propio
              scroll — las que tienen paginación (Citas/Servicios/Abonos)
              necesitan que la lista scrollee en su propio espacio para que
              la barra de paginación quede fija abajo del todo siempre, sin
              importar cuántos registros haya (ver StickyPagination.tsx). */}
          <main className="flex-1 min-h-0 overflow-hidden">
            <Outlet context={outletContext} />
          </main>
        </div>

        <AnimatePresence>
          {showCitaForm && (
            <NewAppointmentModal
              date={citaFecha}
              time={citaHora}
              notes={citaObs}
              onNotesChange={setCitaObs}
              errors={citaErrors}
              isSubmitting={isAgendando}
              bookedSlots={disponibilidad}
              onDateChange={onCitaFechaChange}
              onTimeChange={onCitaHoraChange}
              onSubmit={handleSubmitCita}
              onClose={closeCitaForm}
            />
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  )
}
