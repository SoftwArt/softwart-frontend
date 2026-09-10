import { NavLink } from 'react-router-dom'
import { cn } from '@/src/shared/lib/utils'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/src/shared/components/ui/tooltip'
import type { AccountNavItem } from '../nav'

interface AccountSidebarNavItemProps {
  item:      AccountNavItem
  collapsed: boolean
}

export function AccountSidebarNavItem({ item, collapsed }: AccountSidebarNavItemProps) {
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-md text-sm transition-colors px-2 py-2',
      collapsed && 'justify-center',
      isActive
        ? 'bg-sidebar-primary/15 text-sidebar-primary font-semibold'
        : 'text-sidebar-accent-foreground hover:bg-sidebar hover:text-sidebar-foreground',
    )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <NavLink to={item.to} end={item.end} aria-label={item.label} className={linkCls}>
            <item.icon className="h-4 w-4 shrink-0" />
          </NavLink>
        </TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <NavLink to={item.to} end={item.end} className={linkCls}>
      <item.icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  )
}
