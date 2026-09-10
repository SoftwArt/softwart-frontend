// Contacto del taller (dirección/horario/WhatsApp) — es información del
// negocio, no del cliente, así que no va en "Mi cuenta". Vive al pie del
// sidebar, aprovechando el espacio que quedaba vacío ahí. Solo se muestra
// con el sidebar expandido (igual criterio que el footer de AdminSidebar).
import { Clock, MapPin, MessageCircle } from 'lucide-react'

export function SidebarContact() {
  return (
    <div className="shrink-0 border-t border-sidebar-border p-4 space-y-3 text-xs">
      <div className="flex gap-2.5 items-start">
        <MapPin className="h-3.5 w-3.5 text-sidebar-primary mt-0.5 shrink-0" />
        <span className="text-sidebar-foreground/70 leading-snug">
          Cra. 74 #50, Los Colores – Estadio, Medellín
        </span>
      </div>
      <div className="flex gap-2.5 items-start">
        <Clock className="h-3.5 w-3.5 text-sidebar-primary mt-0.5 shrink-0" />
        <div className="text-sidebar-foreground/70 leading-snug">
          <p>Lun – Vie: 09:00 – 18:00</p>
          <p>Sábado: 10:00 – 14:00</p>
        </div>
      </div>
      <div className="flex gap-2.5 items-start">
        <MessageCircle className="h-3.5 w-3.5 text-sidebar-primary mt-0.5 shrink-0" />
        <a
          href="https://wa.me/573005414130"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sidebar-primary hover:underline"
        >
          +57 300 5414130
        </a>
      </div>
    </div>
  )
}
