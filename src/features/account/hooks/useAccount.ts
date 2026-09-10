// src/features/account/hooks/useAccount.ts
import { useNavigate } from 'react-router-dom'
import { performLogout } from '@/src/features/auth/utils'
import { useAccountData } from './useAccountData'
import { useProfileForm } from './useProfileForm'
import { usePasswordForm } from './usePasswordForm'
import { useAppointmentBooking } from './useAppointmentBooking'
import { useDeleteAccount } from './useDeleteAccount'
import type { PerfilCliente, Cita, Servicio } from '../types'

export type { PerfilCliente, Cita, Servicio } from '../types'

// ── Hook ──────────────────────────────────────────────────────────────────────
// Composición de los hooks especializados de la cuenta del cliente — mantiene
// la misma forma plana de retorno para no tocar los consumidores
// (AccountLayout y las páginas bajo /my-account, NewAppointmentModal).
export function useAccount() {
  const navigate = useNavigate()

  const data = useAccountData()
  const profileForm = useProfileForm(data.perfil, data.setPerfil)
  const passwordForm = usePasswordForm()
  const booking = useAppointmentBooking({ fetchMyAppointments: data.fetchMyAppointments, isMutatingRef: data.isMutatingRef })
  const { isDeleting, onDeleteAccount } = useDeleteAccount()

  // ── Auth ────────────────────────────────────────────────────────────────────
  const handleLogout = async () => { await performLogout(); navigate('/', { replace: true }) }

  return {
    // servidor
    perfil: data.perfil, citas: data.citas, servicios: data.servicios,
    isLoading: data.isLoading, error: data.error, refresh: data.refresh,
    // derivado
    primerNombre: data.primerNombre, proximaCita: data.proximaCita,
    serviciosActivos: data.serviciosActivos, ultimoServicio: data.ultimoServicio,
    serviciosRecientes: data.serviciosRecientes,
    // form perfil
    ...profileForm,
    // form clave
    ...passwordForm,
    // form cita + cancelar
    ...booking,
    // eliminar cuenta
    isDeleting, onDeleteAccount,
    // auth
    handleLogout,
  }
}
