export const TZ = 'Europe/Helsinki'
const DEFAULT_TIME = '21:00'

/**
 * Returns today's date string (YYYY-MM-DD) in Helsinki time.
 */
export function todayHelsinki() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/**
 * Converts a Helsinki local date + time to a UTC ISO string.
 * Works correctly across DST boundaries.
 */
export function helsinkiToISO(dateStr, timeStr) {
  const naive = `${dateStr}T${timeStr}:00Z`
  const probe = new Date(naive)

  // What Helsinki's clock shows for that UTC instant
  const shown = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(probe)

  // offset = (Helsinki display as UTC ms) - probe ms  →  how far ahead Helsinki is
  const shownMs = new Date(shown.replace(' ', 'T') + 'Z').getTime()
  const offsetMs = shownMs - probe.getTime()

  return new Date(probe.getTime() - offsetMs).toISOString()
}

/**
 * Applies defaulting rules and returns a UTC ISO string.
 *   - no date, no time  → today 21:00 Helsinki
 *   - date only         → that date 21:00 Helsinki
 *   - time only         → today Helsinki at that time
 *   - both              → that date + time Helsinki
 */
export function buildReminderTime(dateStr, timeStr) {
  const d = dateStr || todayHelsinki()
  const t = timeStr || DEFAULT_TIME
  return helsinkiToISO(d, t)
}

/**
 * Formats a UTC ISO string for display in Finnish format.
 * e.g. "20.2.2026 klo 21.00"
 */
export function formatFinnish(iso) {
  return new Date(iso).toLocaleString('fi-FI', {
    timeZone: TZ,
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Converts a UTC ISO string back to Helsinki date/time parts for editing.
 */
export function isoToHelsinki(iso) {
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  const parts = formatter.formatToParts(new Date(iso))
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]))
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    time: `${p.hour}:${p.minute}`,
  }
}
