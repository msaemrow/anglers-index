const apiBase = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function request(path, { token, body, signal, method = 'GET' } = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    method,
    signal,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      typeof data?.error === 'string' ? data.error : 'The request could not be completed.'
    throw new ApiError(message, response.status)
  }
  if (!data) throw new ApiError('The API returned an unexpected response.', response.status)
  return data
}
