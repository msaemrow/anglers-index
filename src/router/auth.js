import { decodeSession } from '../composables/session.js'

export function requireSession(to) {
  if (!to.meta.requiresAuth) return true
  try {
    if (decodeSession(localStorage.getItem('anglers-index.session'))) return true
  } catch {
    // Missing browser storage means there is no restorable session.
  }
  return { name: 'home', replace: true }
}
