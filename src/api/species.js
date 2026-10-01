import { ApiError, request } from './client.js'

export async function getSpecies(userId, token, signal) {
  if (!userId) throw new ApiError('Sign in to load your species and personal bests.', 400)
  const query = new URLSearchParams({ includeCaughtSpecies: 'true', userId })
  const data = await request(`/species?${query}`, { token, signal })
  if (!Array.isArray(data) || data.some((species) => !species?.id))
    throw new ApiError('The API returned an unexpected species list.', 200)
  return data
}

export async function addSpecies(fields, token, signal) {
  const name = fields.name?.trim()
  const length = Number(fields.master_angler_length)
  if (
    !name ||
    String(fields.master_angler_length ?? '').trim() === '' ||
    !Number.isFinite(length) ||
    length <= 0
  )
    throw new ApiError('Enter a species name and a Master Angler length greater than zero.', 400)
  const data = await request('/species', {
    method: 'POST',
    token,
    signal,
    body: { name, master_angler_length: length },
  })
  if (!data.id) throw new ApiError('The API returned an unexpected species.', 200)
  return data
}
