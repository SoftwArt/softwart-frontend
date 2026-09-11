// src/shared/lib/bogotaTime.ts
// fecha/hora de citas siempre representan hora de pared de America/Bogota
// (UTC-5 fijo, sin horario de verano) — pero el navegador puede estar en
// cualquier zona horaria. Cualquier cálculo de "ahora"/"hoy" que se compare
// contra esos valores naive debe pasar por acá, no por `new Date()` crudo.
export const BOGOTA_TZ = 'America/Bogota'

const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BOGOTA_TZ,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hourCycle: 'h23',
})

function bogotaParts(instant: Date) {
  const parts = Object.fromEntries(partsFormatter.formatToParts(instant).map(p => [p.type, p.value]))
  return {
    y: Number(parts.year), mo: Number(parts.month), d: Number(parts.day),
    h: Number(parts.hour), mi: Number(parts.minute), s: Number(parts.second),
  }
}

// 'YYYY-MM-DD' — reemplaza cualquier `new Date().toISOString().slice(0, 10)`.
export function bogotaTodayStr(): string {
  const { y, mo, d } = bogotaParts(new Date())
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

// 'YYYY-MM-DD' del día siguiente — sin DST en Colombia, sumar 24h al
// instante y reformatear en la zona de Bogotá es seguro.
export function bogotaTomorrowStr(): string {
  const { y, mo, d } = bogotaParts(new Date(Date.now() + 86400000))
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

// 'YYYY-MM-DD' de hoy + N meses (default 3) — límite superior para los
// selectores de fecha (citas, ventas, pagos, servicios, abonos): sin esto no
// había ningún tope a futuro, se podía agendar/registrar para dentro de
// décadas. `Date.setMonth` maneja el rollover de año solo.
export function bogotaMaxFuturoStr(mesesAdelante = 3): string {
  const { y, mo, d } = bogotaParts(new Date())
  const limite = new Date(y, mo - 1, d)
  limite.setMonth(limite.getMonth() + mesesAdelante)
  return `${limite.getFullYear()}-${String(limite.getMonth() + 1).padStart(2, '0')}-${String(limite.getDate()).padStart(2, '0')}`
}

// 'YYYY-MM-DD' + N días, en calendario puro (sin horas/zona horaria — la
// entrada ya es una fecha naive tipo las de DatePicker). Usado para sugerir
// la fecha estimada de un servicio a partir de fecha + duración (días).
export function addDaysToDateStr(dateStr: string, days: number): string {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const date = new Date(y, mo - 1, d)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// Epoch ms real de "ahora" — para comparaciones de precisión horaria.
export function bogotaNowMs(): number {
  const { y, mo, d, h, mi, s } = bogotaParts(new Date())
  // La hora de pared de Bogotá + 5h = el instante UTC equivalente.
  return Date.UTC(y, mo - 1, d, h + 5, mi, s)
}

// Epoch ms de una fecha+hora de cita (ambas naive-Bogotá) — misma
// conversión que bogotaNowMs, para comparar en la misma base.
export function bogotaCitaMs(fecha: string, hora: string): number {
  const [y, mo, d] = fecha.split('-').map(Number)
  const [h, mi, s] = hora.split(':').map(Number)
  return Date.UTC(y, mo - 1, d, h + 5, mi ?? 0, s ?? 0)
}
