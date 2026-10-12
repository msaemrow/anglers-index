import { MESSAGES, HTTP_ERROR_MESSAGES } from '../constants.js'
import axios from 'axios'

const apiBase = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const apiClient = axios.create({
  baseURL: apiBase,
  headers: { Accept: 'application/json' },
})

const sessionExpirationHandlers = new Set()

export function onSessionExpired(handler) {
  sessionExpirationHandlers.add(handler)
  return () => sessionExpirationHandlers.delete(handler)
}

apiClient.interceptors.response.use(
  (response) => response,
  async (failure) => {
    // Preserve the cancellation convention used by the session and components.
    if (axios.isCancel(failure)) {
      failure.name = 'AbortError'
      throw failure
    }
    const status = failure.response?.status
    const authorization = failure.config?.headers?.get('Authorization')
    if (status === 401 && authorization?.startsWith('Bearer ') && !failure.config.signal?.aborted) {
      const token = authorization.slice(7)
      for (const handler of sessionExpirationHandlers) handler(token)
    }
    let data = failure.response?.data
    // PDF endpoints can return a JSON error body as a Blob.
    if (data instanceof Blob) {
      data = await data.text().then((value) => {
        try {
          return JSON.parse(value)
        } catch {
          return null
        }
      })
    }
    const message = [data?.error, data?.message].find(
      (value) => typeof value === 'string' && value.trim(),
    )
    throw new ApiError(
      message?.trim() ||
        HTTP_ERROR_MESSAGES[status] ||
        (status ? MESSAGES.REQUEST_FAILED : MESSAGES.CONNECTION_FAILED),
      status,
    )
  },
)

export async function request(path, { token, body, signal, method = 'GET' } = {}) {
  const response = await apiClient.request({
    url: path,
    method,
    signal,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    data: body,
  })
  const data = response.data
  if (!data || typeof data !== 'object')
    throw new ApiError(MESSAGES.UNEXPECTED_RESPONSE, response.status)
  return data
}

export async function requestPdf(path, { token, signal, method = 'POST' } = {}) {
  const response = await apiClient.request({
    url: path,
    method,
    signal,
    responseType: 'blob',
    headers: {
      Accept: 'application/pdf',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!response.headers['content-type']?.toLowerCase().startsWith('application/pdf'))
    throw new ApiError('The API did not return a PDF certificate.', response.status)
  const blob = response.data
  if (!(await blob.slice(0, 5).text()).startsWith('%PDF-'))
    throw new ApiError('The API returned an invalid PDF certificate.', response.status)
  return blob
}
