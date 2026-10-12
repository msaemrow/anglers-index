import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useSession } from './useSession'
import { tripToday } from '@/utils/dateTime'
// Shared session and request lifecycle for the trip list and detail pages.
export function useTripPage(load, dependencies = []) {
  const session = useSession()
  const loginError = session.sessionError
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
    attempt = ref(0)
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
          error.value = failure.message
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
      if (failure.name !== 'AbortError') loginError.value = failure.message
    }
  }
  return { ...session, data, loading, error, loginError, attempt, handleSignIn }
}
