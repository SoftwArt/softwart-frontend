// src/features/appointments/utils/buildQuotePdf.ts
// Cotización descargable en PDF a partir del mismo form de "Crear pedido"
// desde una Cita — documento de un solo uso (el admin lo comparte/guarda
// por su cuenta), no se persiste nada en la BD ni se golpea el backend.
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Cita, VentaLinea } from '../types'
import type { ComboboxOption } from '@/src/shared/components/Combobox'
import { fmtCOP } from '@/src/shared/lib/formatCurrency'
import { formatDate, formatTime } from '@/src/shared/lib/formatDate'

const ARTE_CAFE_MARRON: [number, number, number] = [124, 74, 45] // #7c4a2d — mismo tono que el header de los correos
const DIRECCION = 'Los Colores - Estadio, Cra. 74 #50, Medellín'

function labelDe(opts: ComboboxOption[], id: string): string {
  return opts.find(o => o.value === id)?.label ?? '—'
}

type BuildQuotePdfParams = {
  cita:          Cita
  clienteLabel:  string
  lineas:        VentaLinea[]
  serviciosOpts: ComboboxOption[]
  marcosOpts:    ComboboxOption[]
  observacion:   string
  total:         number
}

export function buildQuotePdf({
  cita, clienteLabel, lineas, serviciosOpts, marcosOpts, observacion, total,
}: BuildQuotePdfParams): void {
  const doc = new jsPDF()

  // ── Header ────────────────────────────────────────────────────────────
  doc.setFillColor(...ARTE_CAFE_MARRON)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Arte Café', 14, 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(DIRECCION, 14, 21)

  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Cotización', 14, 38)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const hoy = new Date()
  const fmtDDMMYYYY = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  const fechaEmision = fmtDDMMYYYY(hoy)
  // La cotización es un documento de un solo uso (no se persiste, ver nota
  // arriba) — la validez de 15 días se calcula al vuelo cada vez que se
  // genera el PDF, no hay nada que expirar en base de datos.
  const vencimiento = new Date(hoy)
  vencimiento.setDate(vencimiento.getDate() + 15)
  const fechaVencimiento = fmtDDMMYYYY(vencimiento)
  doc.text(`Fecha de emisión: ${fechaEmision}`, 14, 45)
  doc.text(`Válida hasta: ${fechaVencimiento}`, 14, 51)
  doc.text(`Cliente: ${clienteLabel}`, 14, 57)
  doc.text(`Cita #${cita.id_cita} · ${formatDate(cita.fecha)} ${formatTime(cita.hora)}`, 14, 63)

  // ── Tabla de líneas ───────────────────────────────────────────────────
  autoTable(doc, {
    startY: 70,
    head: [['Servicio', 'Marco', 'Observación', 'Subtotal']],
    body: lineas.map(l => [
      labelDe(serviciosOpts, l.id_servicio),
      l.id_marco ? labelDe(marcosOpts, l.id_marco) : 'Sin marco',
      l.observacion || '—',
      fmtCOP(Number(l.precio) || 0),
    ]),
    foot: [['', '', 'Total del pedido', fmtCOP(total)]],
    headStyles: { fillColor: ARTE_CAFE_MARRON, textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [253, 248, 245], textColor: 0, fontStyle: 'bold' },
    columnStyles: { 3: { halign: 'right' } },
    styles: { fontSize: 10, cellPadding: 3 },
  })

  // ── Observación general + nota legal ─────────────────────────────────
  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 70
  let y = finalY + 10
  if (observacion.trim()) {
    doc.setFont('helvetica', 'bold')
    doc.text('Observación general:', 14, y)
    doc.setFont('helvetica', 'normal')
    const obsLines = doc.splitTextToSize(observacion, 180) as string[]
    doc.text(obsLines, 14, y + 6)
    y += 6 + obsLines.length * 5 + 4
  }

  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(
    'Esta cotización no tiene validez fiscal ni constituye un pedido en firme.',
    14, y + 4
  )
  doc.text('Los precios pueden cambiar hasta que el pedido sea registrado.', 14, y + 9)

  doc.save(`cotizacion-cita-${cita.id_cita}.pdf`)
}
