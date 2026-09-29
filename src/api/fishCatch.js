import { ApiError, request } from './client.js'

export async function getFishCatch(id, token, signal) {
  const catchData = await request(`/fishcatch/${encodeURIComponent(id)}`, { token, signal })
  if (!catchData.id || String(catchData.id) !== String(id))
    throw new ApiError('The API returned an unexpected catch.', 200)
  return catchData
}

export function catchPhotoUrl(path) {
  if (typeof path !== 'string' || !path.trim() || path.includes('stock-fish.jpg')) return null
  if (/^https?:\/\//i.test(path)) return path
  if (/^[a-z][a-z\d+.-]*:/i.test(path) || path.startsWith('//')) return null
  const base = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')
  return `${base}/${path.replace(/^\/+/, '')}`
}

export async function getFishCatches(userId, token, signal) {
  if (!userId) throw new ApiError('A user is required to load catches.', 400)
  try {
    const data = await request(
      `/fishcatch?${new URLSearchParams({ user_id: userId, orderBy: 'date:DESC' })}`,
      { token, signal },
    )
    if (!Array.isArray(data) || data.some((fish) => !fish?.id))
      throw new ApiError('The API returned an unexpected catch list.', 200)
    return data
  } catch (error) {
    // The existing API reports an empty filtered collection as 404.
    if (error.status === 404 && error.message === 'No fish catches found matching criteria')
      return []
    throw error
  }
}
