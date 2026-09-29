import { computed, onScopeDispose, ref } from 'vue'
import { request } from '@/api/client'
import { decodeSession } from './session'

const storageKey = 'anglers-index.session'

export function useSession() {
  const token = ref('')
  const signingIn = ref(false)
  let loginController
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored && decodeSession(stored)) token.value = stored
    else localStorage.removeItem(storageKey)
  } catch {
    /* The session can still be used when browser storage is unavailable. */
  }

  const user = computed(() => (token.value ? decodeSession(token.value) : null))

  async function signIn(credentials) {
    loginController?.abort()
    loginController = new AbortController()
    signingIn.value = true
    try {
      const response = await request('/users/login', {
        method: 'POST',
        body: {
          username: credentials.username.trim().toLowerCase(),
          password: credentials.password,
        },
        signal: loginController.signal,
      })
      if (!decodeSession(response.token))
        throw new Error('The API returned an invalid session. Please sign in again.')
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

  function signOut() {
    loginController?.abort()
    token.value = ''
    try {
      localStorage.removeItem(storageKey)
    } catch {
      /* Storage is optional. */
    }
  }

  onScopeDispose(() => loginController?.abort())
  return { token, user, signingIn, signIn, signOut }
}
