export function formatDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '')
  if (!match) return 'Not recorded'
  return `${match[3]}/${match[2]}/${match[1]}`
}
export function formatTime(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)/.exec(value || '')
  if (!match) return 'Not recorded'
  const hour = Number(match[1])
  return `${hour % 12 || 12}:${match[2]} ${hour >= 12 ? 'PM' : 'AM'}`
}
export function tripLabel(trip) {
  return `${trip.lake?.name || `Lake #${trip.lake_id}`} · ${formatDate(trip.start_date)}${trip.start_date === trip.end_date ? '' : `–${formatDate(trip.end_date)}`} · ${trip.status}`
}

export function tripToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const value = (type) => parts.find((part) => part.type === type).value
  return `${value('year')}-${value('month')}-${value('day')}`
}
