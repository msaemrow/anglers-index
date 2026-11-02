export function catchFeatures(catches) {
  return {
    type: 'FeatureCollection',
    features: catches.map((fish) => ({
      type: 'Feature',
      id: fish.id,
      properties: { catch_id: fish.id },
      geometry: { type: 'Point', coordinates: [fish.longitude, fish.latitude] },
    })),
  }
}

// A geodesic circle in meters; map pixels would change meaning as the user zooms.
export function accuracyFeature(point) {
  if (
    point?.source !== 'device' ||
    !Number.isFinite(point.accuracy_meters) ||
    point.accuracy_meters <= 0
  )
    return { type: 'FeatureCollection', features: [] }
  const radians = Math.PI / 180
  const lat = point.latitude * radians
  const lon = point.longitude * radians
  const distance = point.accuracy_meters / 6371008.8
  const coordinates = []
  for (let step = 0; step <= 64; step++) {
    const bearing = (step / 64) * 2 * Math.PI
    const latitude = Math.asin(
      Math.sin(lat) * Math.cos(distance) + Math.cos(lat) * Math.sin(distance) * Math.cos(bearing),
    )
    const longitude =
      lon +
      Math.atan2(
        Math.sin(bearing) * Math.sin(distance) * Math.cos(lat),
        Math.cos(distance) - Math.sin(lat) * Math.sin(latitude),
      )
    coordinates.push([longitude / radians, latitude / radians])
  }
  coordinates[64] = [...coordinates[0]]
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [coordinates] },
      },
    ],
  }
}

export function catchBounds(catches) {
  if (!catches.length) return null
  const origin = catches[0].longitude
  return catches.reduce(
    (bounds, fish) => {
      const longitude = origin + ((fish.longitude - origin + 540) % 360) - 180
      bounds[0][0] = Math.min(bounds[0][0], longitude)
      bounds[0][1] = Math.min(bounds[0][1], fish.latitude)
      bounds[1][0] = Math.max(bounds[1][0], longitude)
      bounds[1][1] = Math.max(bounds[1][1], fish.latitude)
      return bounds
    },
    [
      [Infinity, Infinity],
      [-Infinity, -Infinity],
    ],
  )
}

export function catchesAtPoint(catches, coordinates) {
  return catches.filter(
    (fish) => fish.latitude === coordinates[1] && (fish.longitude - coordinates[0]) % 360 === 0,
  )
}

export function filterMapCatches(catches, { species = '', from = '', to = '' }) {
  return catches.filter(
    (fish) =>
      (!species || String(fish.species_id) === String(species)) &&
      (!from || (fish.date && fish.date >= from)) &&
      (!to || (fish.date && fish.date <= to)),
  )
}
