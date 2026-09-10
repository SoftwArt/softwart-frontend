// Sidebar del área cliente — mismos tokens --sidebar-* y mismo patrón de
// colapso que AdminSidebar.tsx, pero para las 4 secciones del portal
// (Resumen/Citas/Servicios/Mi cuenta). No comparte estado con AdminSidebar.
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/src/shared/lib/utils'
import { useSidebarCollapse } from '../hooks/useSidebarCollapse'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/src/shared/components/ui/tooltip'
import { ACCOUNT_NAV_ITEMS } from '../nav'
import { AccountSidebarNavItem } from './AccountSidebarNavItem'
import { SidebarContact } from './SidebarContact'

export function AccountSidebar() {
  const { collapsed, toggle } = useSidebarCollapse()

  return (
    <aside
      className={cn(
        'hidden md:flex md:flex-col shrink-0 bg-sidebar-accent border-r border-sidebar-border',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'md:w-[56px]' : 'md:w-64',
      )}
    >
      <div
        className={cn(
          'shrink-0 flex items-center border-b border-sidebar-border h-14 px-3 gap-2',
          collapsed ? 'justify-center' : 'justify-between',
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <img src="/softwart-logo.png" alt="SoftwArt" className="h-8 w-8 object-contain shrink-0" />
            <span className="text-base font-bold text-sidebar-foreground truncate">Arte Café</span>
          </div>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggle}
              className="shrink-0 rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar transition-colors"
              aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{collapsed ? 'Expandir menú' : 'Colapsar menú'}</TooltipContent>
        </Tooltip>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto py-2 px-1.5">
        <ul className="flex flex-col gap-0.5">
          {ACCOUNT_NAV_ITEMS.map(item => (
            <li key={item.to}>
              <AccountSidebarNavItem item={item} collapsed={collapsed} />
            </li>
          ))}
        </ul>
      </nav>

      {!collapsed && <SidebarContact />}
    </aside>
  )
}
