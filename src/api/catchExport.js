import { apiClient, ApiError } from './client.js'

export async function exportCatchGpx(filters, token, signal) {
  const query = new URLSearchParams({ details: String(filters.details !== false) })
  if (filters.lake_id) query.set('lake_id', String(filters.lake_id))
  for (const field of ['from', 'to']) if (filters[field]) query.set(field, filters[field])
  if (filters.from && filters.to && filters.from > filters.to)
    throw new ApiError('The end date must be on or after the start date.', 400)
  const response = await apiClient.request({
    url: `/fishcatch/export/gpx?${query}`,
    method: 'GET',
    responseType: 'blob',
    signal,
    headers: { Accept: 'application/gpx+xml', Authorization: `Bearer ${token}` },
  })
  if (
    !response.headers['content-type']?.toLowerCase().startsWith('application/gpx+xml') ||
    !(response.data instanceof Blob)
  )
    throw new ApiError('The API did not return a GPX file.', response.status)
  const start = await response.data.slice(0, 512).text()
  if (!start.startsWith('<?xml') || !start.includes('<gpx '))
    throw new ApiError('The API returned an invalid GPX file.', response.status)
  const counts = ['x-export-count', 'x-skipped-count'].map((header) => {
    const value = response.headers[header]
    if (!/^\d+$/.test(value ?? '') || !Number.isSafeInteger(Number(value)))
      throw new ApiError('The API returned unexpected export counts.', response.status)
    return Number(value)
  })
  return {
    blob: response.data,
    exported: counts[0],
    skipped: counts[1],
    filename: 'anglers-index-catches.gpx',
  }
}
