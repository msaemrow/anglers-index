import { computed, ref, watch } from 'vue'
import { useSession } from './useSession'
import { getLure, getLures, getTackleIds, setTackleMembership } from '@/api/lures'

export function useLurePage(id = ref(null)) {
  const session = useSession()
  const { token, user, signIn, signOut } = session
  const lures = ref([])
  const loading = ref(false)
  const error = ref('')
  const missing = ref(false)
  const loginError = ref('')
  const attempt = ref(0)
  const tackleIds = ref(new Set())
  const tackleError = ref('')
  const tackleReady = ref(false)
  const pending = ref(new Set())
  const notice = ref('')
  const actionError = ref('')
  const editor = ref(null)
  let currentController
  function expired() {
    loginError.value = 'Your session has expired. Please sign in again.'
    signOut()
  }
  watch(
    [token, id, attempt],
    async ([currentToken, lureId], _, onCleanup) => {
      const controller = new AbortController()
      currentController = controller
      onCleanup(() => controller.abort())
      lures.value = []
      error.value = ''
      missing.value = false
      editor.value = null
      tackleIds.value = new Set()
      pending.value = new Set()
      tackleError.value = ''
      tackleReady.value = false
      notice.value = ''
      actionError.value = ''
      loading.value = false
      if (!currentToken) return
      loading.value = true
      const [catalog, tackle] = await Promise.allSettled([
        lureId
          ? getLure(lureId, controller.signal).then((lure) => [lure])
          : getLures(controller.signal),
        getTackleIds(user.value.user_id, currentToken, controller.signal),
      ])
      if (controller.signal.aborted) return
      loading.value = false
      if (
        [catalog, tackle].some(
          (result) => result.status === 'rejected' && result.reason.status === 401,
        )
      ) {
        expired()
        return
      }
      if (catalog.status === 'fulfilled') lures.value = catalog.value
      else if (lureId && catalog.reason.status === 404) missing.value = true
      else error.value = 'We couldn’t load the lures. Please try again.'
      if (tackle.status === 'fulfilled') {
        tackleIds.value = new Set(tackle.value)
        tackleReady.value = true
      } else
        tackleError.value = 'Your tackle box couldn’t load. Refresh to enable tackle-box actions.'
    },
    { immediate: true },
  )
  async function toggle(lure) {
    const key = String(lure.id)
    if (!tackleReady.value || pending.value.has(key) || !user.value) return
    const controller = currentController
    const include = !tackleIds.value.has(key)
    pending.value.add(key)
    actionError.value = ''
    notice.value = ''
    try {
      await setTackleMembership(
        user.value.user_id,
        lure.id,
        include,
        token.value,
        controller.signal,
      )
      if (controller.signal.aborted) return
      if (include) tackleIds.value.add(key)
      else tackleIds.value.delete(key)
      notice.value = `${lure.name || 'Lure'} ${include ? 'added to' : 'removed from'} your tackle box.`
    } catch (failure) {
      if (controller.signal.aborted) return
      if (failure.status === 401) expired()
      else actionError.value = 'Unable to update your tackle box. Please try again.'
    } finally {
      if (!controller.signal.aborted) pending.value.delete(key)
    }
  }
  function saved({ lure, added }) {
    if (editor.value.editing)
      lures.value = lures.value.map((item) => (String(item.id) === String(lure.id) ? lure : item))
    else if (!id.value) lures.value = [...lures.value, lure]
    if (added) tackleIds.value.add(String(lure.id))
    notice.value = `${lure.name} saved${added ? ' and added to your tackle box' : ''}.`
    editor.value = null
  }
  async function handleSignIn(credentials) {
    loginError.value = ''
    try {
      await signIn(credentials)
    } catch (failure) {
      if (failure.name !== 'AbortError')
        loginError.value =
          failure.status === 401
            ? 'Incorrect username or password.'
            : 'Unable to sign in. Please try again.'
    }
  }
  function handleSignOut() {
    loginError.value = ''
    signOut()
  }
  return {
    ...session,
    lures,
    lure: computed(() => lures.value[0]),
    loading,
    error,
    missing,
    loginError,
    attempt,
    tackleIds,
    tackleError,
    tackleReady,
    pending,
    notice,
    actionError,
    editor,
    toggle,
    saved,
    expired,
    handleSignIn,
    handleSignOut,
  }
}
