import { request, ApiError } from './client.js'
export async function getTrips(token, signal, status = '') {
  const trips = []
  let after = 0
  do {
    const data = await request(
      `/trips?${new URLSearchParams({ after, ...(status ? { status } : {}) })}`,
      { token, signal },
    )
    if (
      !Array.isArray(data.trips) ||
      data.trips.some((trip) => !trip?.id) ||
      (data.next !== null && (!Number.isSafeInteger(data.next) || data.next <= after))
    )
      throw new ApiError('Unexpected trip list.', 200)
    trips.push(...data.trips)
    after = data.next
  } while (after !== null)
  return trips
}
export async function getTrip(id, token, signal) {
  const data = await request(`/trips/${encodeURIComponent(id)}`, { token, signal })
  if (String(data.id) !== String(id) || !Array.isArray(data.catches))
    throw new ApiError('Unexpected fishing trip.', 200)
  return data
}
export function createTrip(fields, token, signal) {
  return request('/trips', { method: 'POST', body: fields, token, signal })
}
export function attachTripCatch(id, catch_id, token, signal) {
  return request(`/trips/${encodeURIComponent(id)}/catches`, {
    method: 'POST',
    body: { catch_id },
    token,
    signal,
  })
}
export function deleteTrip(id, token, signal) {
  return request(`/trips/${encodeURIComponent(id)}`, { method: 'DELETE', token, signal })
}
