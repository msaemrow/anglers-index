import { request, requestPdf } from './client.js'

export function getMasterAnglerCertificate(catchId, token, signal) {
  return requestPdf(`/masterangler/${encodeURIComponent(catchId)}/certificate`, { token, signal })
}

export function getMasterAnglerReviews(token, signal) {
  return request('/masterangler', { token, signal })
}
export function reviewMasterAngler(id, status, denialReason, token, signal) {
  return request(`/masterangler/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: { status, denial_reason: denialReason },
    token,
    signal,
  })
}
