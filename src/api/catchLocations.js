import { request, ApiError } from './client.js'

export async function getLocationPreference(token, signal) {
  return preferenceResponse(await request('/users/me/preferences', { token, signal }))
}
export async function saveLocationPreference(enabled, token, signal) {
  return preferenceResponse(
    await request('/users/me/preferences', {
      method: 'PATCH',
      body: { capture_catch_location: enabled },
      token,
      signal,
    }),
  )
}
export async function getCatchLocation(id, token, signal) {
  const data = await request(`/fishcatch/${encodeURIComponent(id)}/location`, { token, signal })
  return locationResponse(data)
}
export async function saveCatchLocation(id, location, token, signal) {
  const data = await request(`/fishcatch/${encodeURIComponent(id)}/location`, {
    method: location ? 'PUT' : 'DELETE',
    ...(location ? { body: { location } } : {}),
    token,
    signal,
  })
  return locationResponse(data)
}

function preferenceResponse(data) {
  if (typeof data.capture_catch_location !== 'boolean')
    throw new ApiError('The API returned an unexpected location preference.', 200)
  return data
}

function locationResponse(data) {
  const point = data.location
  if (point === null) return null
  if (
    !point ||
    typeof point !== 'object' ||
    !Number.isFinite(point.latitude) ||
    Math.abs(point.latitude) > 90 ||
    !Number.isFinite(point.longitude) ||
    Math.abs(point.longitude) > 180 ||
    !['manual', 'device'].includes(point.source)
  )
    throw new ApiError('The API returned an unexpected catch location. Reload before editing.', 200)
  return point
}

// Fetch bounded cursor pages once per lake/session; filters run on lightweight records.
export async function getLakeCatchLocations(lakeId, token, signal) {
  const catches = []
  let after = null
  do {
    const query = new URLSearchParams({ lake_id: lakeId, ...(after ? { after } : {}) })
    const data = await request(`/fishcatch/locations?${query}`, { token, signal })
    if (
      !Array.isArray(data.catches) ||
      data.catches.some(
        (fish) =>
          !Number.isSafeInteger(fish?.id) ||
          fish.id <= (after ?? 0) ||
          !Number.isFinite(fish.latitude) ||
          Math.abs(fish.latitude) > 90 ||
          !Number.isFinite(fish.longitude) ||
          Math.abs(fish.longitude) > 180,
      ) ||
      (data.next_cursor !== null &&
        (!Number.isSafeInteger(data.next_cursor) ||
          data.next_cursor <= (after ?? 0) ||
          data.next_cursor !== data.catches.at(-1)?.id))
    )
      throw new ApiError('The API returned unexpected catch map data.', 200)
    catches.push(...data.catches)
    after = data.next_cursor
  } while (after !== null)
  return catches
}
