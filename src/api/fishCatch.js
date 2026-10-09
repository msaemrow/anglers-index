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

export async function getFishCatches(userId, token, signal, date) {
  if (!userId) throw new ApiError('A user is required to load catches.', 400)
  try {
    const data = await request(
      `/fishcatch?${new URLSearchParams({ user_id: userId, orderBy: 'date:DESC', ...(date ? { date } : {}) })}`,
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

export async function getCatchSpecies(signal) {
  const data = await request('/species', { signal })
  if (!Array.isArray(data) || data.some((item) => !item?.id))
    throw new ApiError('The API returned an unexpected species list.', 200)
  return data
}

export async function createFishCatch(fields, token, signal) {
  const body = {}
  for (const field of ['species_id', 'lake_id', 'lure_id']) {
    const value = Number(fields[field])
    if (!Number.isSafeInteger(value) || value <= 0)
      throw new ApiError('Select a species, lake, and lure.', 400)
    body[field] = value
  }
  for (const field of ['length', 'weight']) {
    const value = Number(fields[field])
    if (String(fields[field] ?? '').trim() === '' || !Number.isFinite(value) || value < 0)
      throw new ApiError('Enter a nonnegative length and weight, or 0 if not measured.', 400)
    body[field] = value
  }
  const local = String(fields.datetime ?? '')
  const date = new Date(local)
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local) ||
    Number.isNaN(date.getTime()) ||
    localDateTime(date) !== local
  )
    throw new ApiError('Enter a valid catch date and time.', 400)
  if (fields.witness !== undefined) body.witness = String(fields.witness || '').trim()
  if (fields.fish_image !== undefined) body.fish_image = String(fields.fish_image || '').trim()
  if (fields.trip_id !== undefined && fields.trip_id !== null && fields.trip_id !== '') {
    const tripId = Number(fields.trip_id)
    if (!Number.isSafeInteger(tripId) || tripId <= 0)
      throw new ApiError('Choose a valid fishing trip.', 400)
    body.trip_id = tripId
  }
  if (fields.new_trip !== undefined) {
    const range = fields.new_trip
    const validDate = (value) => {
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
      const parsed = new Date(`${value}T00:00:00Z`)
      return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
    }
    const end = range?.single_day ? range.start_date : range?.end_date
    if (
      !validDate(range?.start_date) ||
      !validDate(end) ||
      range.start_date > local.slice(0, 10) ||
      end < local.slice(0, 10)
    )
      throw new ApiError('Choose valid trip dates that include the catch date.', 400)
    if (body.trip_id) throw new ApiError('Choose an existing trip or start a new one.', 400)
    body.new_trip = { start_date: range.start_date, end_date: end, single_day: !!range.single_day }
  }
  body.date = local.slice(0, 10)
  body.time = `${local.slice(11)}:00`
  body.timestamp = Math.floor(date.getTime() / 1000)
  const data = await request('/fishcatch', { method: 'POST', body, token, signal })
  if (!data.id) throw new ApiError('The API returned an unexpected catch.', 200)
  return data
}

export function localDateTime(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
