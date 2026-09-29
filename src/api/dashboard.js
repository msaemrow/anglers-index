import { request } from './client'

export function getDashboard(token, signal) {
  return request('/dashboard', { token, signal })
}
