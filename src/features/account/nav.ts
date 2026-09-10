import type { LucideIcon } from 'lucide-react'
import { CalendarDays, CreditCard, LayoutGrid, User, Wrench } from 'lucide-react'

export interface AccountNavItem {
  to:    string
  label: string
  icon:  LucideIcon
  end:   boolean
}

export const ACCOUNT_NAV_ITEMS: AccountNavItem[] = [
  { to: '/my-account',           label: 'Resumen',   icon: LayoutGrid,   end: true },
  { to: '/my-account/citas',     label: 'Citas',     icon: CalendarDays, end: false },
  { to: '/my-account/servicios', label: 'Servicios', icon: Wrench,       end: false },
  { to: '/my-account/abonos',    label: 'Abonos',    icon: CreditCard,   end: false },
  { to: '/my-account/perfil',    label: 'Mi cuenta', icon: User,         end: false },
]
