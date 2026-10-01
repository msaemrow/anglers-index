export function summarizeCatches(catches, dimension) {
  if (!['species', 'lake', 'lure'].includes(dimension)) return []
  const groups = new Map()
  for (const fish of catches) {
    const item = fish[dimension]
    const id = fish[`${dimension}_id`] ?? item?.id
    const label =
      dimension === 'lake'
        ? [item?.name, item?.county, item?.state].filter(Boolean).join(' · ')
        : item?.name
    const name =
      label ||
      (id != null ? `${dimension[0].toUpperCase()}${dimension.slice(1)} #${id}` : 'Not recorded')
    const key = id != null ? String(id) : name
    const tooltip =
      dimension === 'lure'
        ? [item?.brand, item?.name, item?.color, item?.size].filter(Boolean).join(' · ') || name
        : name
    const group = groups.get(key) ?? { key, label: name, tooltip, count: 0 }
    group.count++
    groups.set(key, group)
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}
