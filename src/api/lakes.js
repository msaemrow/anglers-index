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

export async function saveLake(fields, token, id, signal) {
  const body = Object.fromEntries(
    ['name', 'nearest_town', 'state', 'county'].map((field) => [
      field,
      String(fields[field] ?? '').trim(),
    ]),
  )
  if (Object.values(body).some((value) => !value))
    throw new ApiError('Lake name, nearest town, state, and county are required.', 400)
  if (
    body.name.length > 100 ||
    body.nearest_town.length > 100 ||
    body.county.length > 100 ||
    body.state.length > 20
  )
    throw new ApiError('One or more lake fields are too long.', 400)
  const hasCoordinates = ['latitude', 'longitude'].some(
    (field) => String(fields[field] ?? '').trim() !== '',
  )
  if (id != null || hasCoordinates) {
    const coordinates = lakeCoordinates(fields)
    if (!coordinates)
      throw new ApiError('Enter a latitude from −90 to 90 and a longitude from −180 to 180.', 400)
    ;[body.longitude, body.latitude] = coordinates
  }
  const data = await request(id == null ? '/lakes' : `/lakes/${encodeURIComponent(id)}`, {
    method: id == null ? 'POST' : 'PUT',
    body,
    token,
    signal,
  })
  if (!data.id || (id != null && String(data.id) !== String(id)))
    throw new ApiError('The API returned an unexpected lake.', 200)
  return data
}
