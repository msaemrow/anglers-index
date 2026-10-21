import { MESSAGES } from '../constants.js'
import { computed, onScopeDispose, ref } from 'vue'
import { request, onSessionExpired } from '../api/client.js'
import { decodeSession } from './session.js'

const storageKey = 'anglers-index.session'

export function useSession() {
  const token = ref('')
  const signingIn = ref(false)
  const sessionError = ref('')
  const signingOut = ref(false)
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
      if (!decodeSession(response.token)) throw new Error(MESSAGES.INVALID_SESSION)
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

  function clearSession() {
    sessionError.value = ''
    loginController?.abort()
    token.value = ''
    try {
      localStorage.removeItem(storageKey)
    } catch {
      /* Storage is optional. */
    }
  }

  async function signOut() {
    if (signingOut.value) return false
    sessionError.value = ''
    loginController?.abort()
    const currentToken = token.value
    if (!currentToken) {
      clearSession()
      return true
    }
    signingOut.value = true
    try {
      await request('/users/logout', {
        method: 'POST',
        token: currentToken,
        signal: AbortSignal.timeout(10000),
      })
      if (token.value === currentToken) clearSession()
      return true
    } catch (failure) {
      if (token.value !== currentToken) return false
      if (failure.status === 401) {
        clearSession()
        return true
      }
      sessionError.value =
        'Logout could not be confirmed. You are still signed in. Please try again.'
      return false
    } finally {
      signingOut.value = false
    }
  }

  const unsubscribe = onSessionExpired((failedToken) => {
    if (!token.value || failedToken !== token.value) return
    clearSession()
    sessionError.value = MESSAGES.SESSION_EXPIRED
  })
  onScopeDispose(() => {
    unsubscribe()
    loginController?.abort()
  })
  return { token, user, signingIn, signingOut, signIn, signUp, signOut, sessionError }
}
