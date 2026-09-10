import { NavLink } from 'react-router-dom'
import { cn } from '@/src/shared/lib/utils'
import { ACCOUNT_NAV_ITEMS } from '../nav'

// El sidebar solo vive en desktop — en mobile la navegación es una tira de
// chips horizontal, mismo criterio de estado activo.
export function AccountMobileNav() {
  return (
    <nav className="md:hidden flex gap-2 px-4 py-3 overflow-x-auto border-b border-border bg-card">
      {ACCOUNT_NAV_ITEMS.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium border',
              isActive ? 'bg-primary/10 text-primary border-primary/20' : 'text-muted-foreground border-border',
            )
          }
        >
          <item.icon className="h-3.5 w-3.5" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
