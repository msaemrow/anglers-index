import { ApiError, request } from './client.js'

export async function getLakes(signal) {
  const data = await request('/lakes', { signal })
  if (!Array.isArray(data) || data.some((lake) => !lake?.id))
    throw new ApiError('The API returned an unexpected lake list.', 200)
  return data
}

export async function getLake(id, signal) {
  const data = await request(`/lakes/${encodeURIComponent(id)}`, { signal })
  if (!data.id || String(data.id) !== String(id))
    throw new ApiError('The API returned an unexpected lake.', 200)
  return data
}

export function lakeCoordinates(lake) {
  const values = [lake?.longitude, lake?.latitude]
  if (
    values.some(
      (value) =>
        value == null ||
        (typeof value !== 'string' && typeof value !== 'number') ||
        String(value).trim() === '',
    )
  )
    return null
  const [longitude, latitude] = values.map(Number)
  return Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    Math.abs(longitude) <= 180 &&
    Math.abs(latitude) <= 90
    ? [longitude, latitude]
    : null
}
