export const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
export const dimensions = {
  month: 'Month',
  time: 'Time of day',
  temperature: 'Air temperature (°F)',
  wind_speed: 'Wind speed (mph)',
  barometric: 'Pressure (inHg)',
  weather_conditions: 'Weather description',
  wind_direction: 'Wind direction',
}
const missing = { key: 'missing', label: 'Not recorded', order: Infinity }
function numeric(value) {
  return value === null || value === undefined || String(value).trim() === ''
    ? null
    : Number.isFinite(Number(value))
      ? Number(value)
      : null
}
export function catchGroup(fish, dimension) {
  if (dimension === 'month') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fish.date || '')
    const date = match && new Date(`${fish.date}T12:00:00Z`)
    if (!date || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== fish.date)
      return missing
    const month = Number(match[2]) - 1
    return { key: String(month), label: months[month], order: month }
  }
  if (dimension === 'time') {
    const match = /^(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(fish.time || '')
    if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return missing
    const hour = Number(match[1])
    const index = Math.floor(hour / 6)
    return {
      key: String(index),
      label: [
        'Night · 12–6 AM',
        'Morning · 6 AM–noon',
        'Afternoon · noon–6 PM',
        'Evening · 6 PM–midnight',
      ][index],
      order: index,
    }
  }
  if (['temperature', 'wind_speed', 'barometric'].includes(dimension)) {
    const value = numeric(fish[dimension])
    if (
      value === null ||
      (dimension === 'wind_speed' && value < 0) ||
      (dimension === 'barometric' && value <= 0)
    )
      return missing
    const step = dimension === 'temperature' ? 10 : dimension === 'wind_speed' ? 5 : 0.2
    const lower = Math.floor(Math.round((value / step) * 1e8) / 1e8) * step
    const format = (n) => (dimension === 'barometric' ? n.toFixed(1) : String(Math.round(n)))
    return {
      key: format(lower),
      label: `${format(lower)} to <${format(lower + step)}`,
      order: lower,
    }
  }
  const value = String(fish[dimension] ?? '').trim()
  return value ? { key: value.toLowerCase(), label: value, order: 0 } : missing
}
export function groupCatches(catches, dimension) {
  const groups = new Map()
  for (const fish of catches) {
    const group = catchGroup(fish, dimension)
    if (!groups.has(group.key)) groups.set(group.key, { ...group, count: 0, days: new Set() })
    const row = groups.get(group.key)
    row.count++
    if (catchGroup(fish, 'month').key !== 'missing') row.days.add(fish.date)
  }
  return [...groups.values()]
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
    .map(({ days, ...row }) => ({ ...row, days: days.size }))
}
