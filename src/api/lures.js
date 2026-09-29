import { ApiError, request } from './client.js'

function validateLure(data, id) {
  if (!data?.id || (id != null && String(data.id) !== String(id)))
    throw new ApiError('The API returned an unexpected lure.', 200)
  return data
}
export async function getLures(signal) {
  const data = await request('/lures?lures_only=Y', { signal })
  if (!Array.isArray(data) || data.some((lure) => !lure?.id))
    throw new ApiError('The API returned an unexpected lure list.', 200)
  return data
}
export async function getLure(id, signal) {
  return validateLure(await request(`/lures/${encodeURIComponent(id)}`, { signal }), id)
}
export async function saveLure(fields, token, id, signal) {
  const body = Object.fromEntries(
    ['brand', 'name', 'color', 'size'].map((field) => [field, fields[field]?.trim()]),
  )
  if (Object.values(body).some((value) => !value))
    throw new ApiError('Brand, name, color, and size are required.', 400)
  if (id == null) body.add_to_tackle_box = Boolean(fields.add_to_tackle_box)
  return validateLure(
    await request(id == null ? '/lures' : `/lures/${encodeURIComponent(id)}`, {
      method: id == null ? 'POST' : 'PUT',
      body,
      token,
      signal,
    }),
    id,
  )
}
export async function getTackleIds(userId, token, signal) {
  const data = await request(`/tackle-box/${encodeURIComponent(userId)}`, { token, signal })
  if (!Array.isArray(data.tackle_box) || data.tackle_box.some((lure) => !lure?.id))
    throw new ApiError('The API returned an unexpected tackle box.', 200)
  return data.tackle_box.map((lure) => String(lure.id))
}
export function setTackleMembership(userId, lureId, included, token, signal) {
  return request('/tackle-box', {
    method: included ? 'POST' : 'DELETE',
    body: { user_id: userId, lure_id: lureId },
    token,
    signal,
  })
}
