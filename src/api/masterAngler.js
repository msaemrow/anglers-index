import { requestPdf } from './client.js'

export function getMasterAnglerCertificate(catchId, token, signal) {
  return requestPdf(`/masterangler/${encodeURIComponent(catchId)}/certificate`, { token, signal })
}
