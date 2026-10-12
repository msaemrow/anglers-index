import { computed, onScopeDispose, ref } from 'vue'
import { request, onSessionExpired } from '../api/client.js'
import { decodeSession } from './session.js'

const storageKey = 'anglers-index.session'

export function useSession() {
  const token = ref('')
  const signingIn = ref(false)
  const sessionError = ref('')
  let loginController
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored && decodeSession(stored)) token.value = stored
    else localStorage.removeItem(storageKey)
  } catch {
    /* The session can still be used when browser storage is unavailable. */
  }

  const user = computed(() => (token.value ? decodeSession(token.value) : null))

  async function authenticate(path, body) {
    loginController?.abort()
    loginController = new AbortController()
    signingIn.value = true
    try {
      const response = await request(path, {
        method: 'POST',
        body,
        signal: loginController.signal,
      })
      if (!decodeSession(response.token))
        throw new Error('The API returned an invalid session. Please sign in again.')
      sessionError.value = ''
      token.value = response.token
      try {
        localStorage.setItem(storageKey, response.token)
      } catch {
        /* Keep the in-memory session. */
      }
    } finally {
      signingIn.value = false
    }
  }

  function signIn(credentials) {
    return authenticate('/users/login', {
      username: credentials.username.trim().toLowerCase(),
      password: credentials.password,
    })
  }

  function signUp(details) {
    return authenticate('/users/signup', {
      username: details.username.trim().toLowerCase(),
      password: details.password,
      first_name: details.first_name.trim(),
      last_name: details.last_name.trim(),
      email: details.email.trim().toLowerCase(),
    })
  }

  function signOut() {
    sessionError.value = ''
    loginController?.abort()
    token.value = ''
    try {
      localStorage.removeItem(storageKey)
    } catch {
      /* Storage is optional. */
    }
  }

  const unsubscribe = onSessionExpired((failedToken) => {
    if (!token.value || failedToken !== token.value) return
    signOut()
    sessionError.value = 'Your session has expired. Please sign in again.'
  })
  onScopeDispose(() => {
    unsubscribe()
    loginController?.abort()
  })
  return { token, user, signingIn, signIn, signUp, signOut, sessionError }
}
