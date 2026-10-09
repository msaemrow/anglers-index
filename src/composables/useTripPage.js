import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useSession } from './useSession'
import { tripToday } from '@/utils/dateTime'
// Shared session and request lifecycle for the trip list and detail pages.
export function useTripPage(load, dependencies = []) {
  const session = useSession()
  const day = ref(tripToday())
  let timer
  function updateDay() {
    day.value = tripToday()
  }
  function refresh() {
    updateDay()
    attempt.value++
  }
  onMounted(() => {
    timer = setInterval(updateDay, 30000)
    window.addEventListener('focus', refresh)
  })
  onBeforeUnmount(() => {
    clearInterval(timer)
    window.removeEventListener('focus', refresh)
  })
  const data = ref(null),
    loading = ref(false),
    error = ref(''),
    loginError = ref(''),
    attempt = ref(0)
  function expired() {
    loginError.value = 'Your session has expired. Please sign in again.'
    session.signOut()
  }
  watch(
    [session.token, attempt, day, ...dependencies],
    async ([token], _, onCleanup) => {
      data.value = null
      loading.value = false
      error.value = ''
      if (!token) return
      const controller = new AbortController()
      onCleanup(() => controller.abort())
      loading.value = true
      try {
        const result = await load(token, controller.signal)
        if (!controller.signal.aborted) data.value = result
      } catch (failure) {
        if (!controller.signal.aborted) {
          if (failure.status === 401) expired()
          else
            error.value =
              failure.status === 404
                ? 'Fishing trip not found.'
                : 'Unable to load fishing trips. Please try again.'
        }
      } finally {
        if (!controller.signal.aborted) loading.value = false
      }
    },
    { immediate: true },
  )
  async function handleSignIn(credentials) {
    loginError.value = ''
    try {
      await session.signIn(credentials)
    } catch (failure) {
      if (failure.name !== 'AbortError')
        loginError.value =
          failure.status === 401
            ? 'Incorrect username or password.'
            : 'Unable to sign in. Please try again.'
    }
  }
  return { ...session, data, loading, error, loginError, attempt, expired, handleSignIn }
}
