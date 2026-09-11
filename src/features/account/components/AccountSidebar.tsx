// Sidebar del área cliente — calcado tal cual de AdminSidebar.tsx (mismos
// tokens --sidebar-*, misma estructura, mismo patrón de colapso) en vez de
// reinventarlo: aquella versión propia (Tooltip envolviendo un NavLink que
// navega) dejaba el arrow del tooltip "fantasma" al hacer clic mientras la
// transición seguía en curso. Acá, igual que en AdminSidebar, se usa
// useLocation + Link (no NavLink) con el estado activo calculado a mano.
// No comparte estado con AdminSidebar — es otro <aside>, para otras 5
// secciones del portal (Resumen/Citas/Servicios/Abonos/Mi cuenta).
import { useLocation, Link } from 'react-router-dom'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/src/shared/lib/utils'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/src/shared/components/ui/tooltip'
import { ACCOUNT_NAV_ITEMS } from '../nav'
import { SidebarContact } from './SidebarContact'

export function AccountSidebar() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={cn(
      'hidden md:flex md:flex-col bg-sidebar-accent border-r border-sidebar-border',
      'h-full min-h-0 shrink-0 transition-all duration-300 ease-in-out',
      collapsed ? 'md:w-[56px]' : 'md:w-64',
    )}>

      {/* Header */}
      <div className={cn(
        'shrink-0 flex items-center border-b border-sidebar-border h-14 px-3 gap-2',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <img src="/softwart-logo.png" alt="SoftwArt" className="h-8 w-8 object-contain shrink-0" />
            <span className="text-base font-bold text-sidebar-foreground truncate">Arte Café</span>
          </div>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setCollapsed(v => !v)}
              className="shrink-0 rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar transition-colors"
              aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
              {collapsed
                ? <ChevronRight className="h-4 w-4" />
                : <ChevronLeft  className="h-4 w-4" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{collapsed ? 'Expandir menú' : 'Colapsar menú'}</TooltipContent>
        </Tooltip>
      </div>

      {/* Nav */}
      <nav className="flex-1 min-h-0 overflow-y-auto py-2 px-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex flex-col gap-0.5">
          {ACCOUNT_NAV_ITEMS.map((item) => {
            const isActive = item.end
              ? pathname === item.to
              : pathname === item.to || pathname.startsWith(`${item.to}/`)
            const Icon = item.icon
            const linkCls = cn(
              'flex items-center gap-3 rounded-md text-sm transition-colors px-2 py-2',
              collapsed ? 'justify-center' : '',
              isActive
                ? 'bg-sidebar-primary/15 text-sidebar-primary font-semibold'
                : 'text-sidebar-accent-foreground hover:bg-sidebar hover:text-sidebar-foreground'
            )
            return (
              <li key={item.to}>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link to={item.to} aria-label={item.label} className={linkCls}>
                        <Icon className="h-4 w-4 shrink-0" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  <Link to={item.to} className={linkCls}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {!collapsed && <SidebarContact />}
    </aside>
  )
}
