import { useState } from 'react'

// Estado local, sin persistencia entre sesiones — mismo comportamiento que
// el colapso de AdminSidebar.tsx, pero independiente de él (no comparten
// estado: son sidebars de áreas distintas).
export function useSidebarCollapse(initial = false) {
  const [collapsed, setCollapsed] = useState(initial)
  const toggle = () => setCollapsed(v => !v)
  return { collapsed, toggle }
}
