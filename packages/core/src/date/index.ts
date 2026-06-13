/**
 * Local-time `YYYY-MM-DD` key.
 *
 * Playtime/streak days must roll at the user's local midnight, not UTC.
 * `Date#toISOString()` formats in UTC, so in timezones east/west of UTC a
 * late-evening or early-morning session would be logged on the wrong day
 * (e.g. a 23:00–01:00 session in Kyiv straddling two calendar days). Building
 * the key from the local-time getters keeps the boundary at local midnight.
 */
export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
