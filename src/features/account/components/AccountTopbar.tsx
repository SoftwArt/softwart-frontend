import { AccountSessionMenu } from './AccountSessionMenu'

interface AccountTopbarProps {
  nombre:   string
  correo:   string
  onLogout: () => void
}

// Mismo patrón que el topbar de AdminLayout (App.tsx): h-14, border-b,
// dropdown de sesión a la derecha. En mobile muestra además el logo (el
// sidebar con el logo solo vive en desktop).
export function AccountTopbar({ nombre, correo, onLogout }: AccountTopbarProps) {
  return (
    <header className="shrink-0 h-14 border-b border-border bg-card flex items-center justify-between px-4 md:justify-end md:px-6 gap-3">
      <div className="flex items-center gap-2 md:hidden">
        <img src="/softwart-logo.png" alt="SoftwArt" className="h-7 w-7 object-contain" />
        <span className="text-sm font-bold text-foreground">Arte Café</span>
      </div>

      <AccountSessionMenu nombre={nombre} correo={correo} onLogout={onLogout} />
    </header>
  )
}
