<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import AppNavbar from '@/components/AppNavbar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ContentPanel from '@/components/ui/ContentPanel.vue'
import PageLayout from '@/components/ui/PageLayout.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import SignInPanel from '@/components/SignInPanel.vue'
import { useSession } from '@/composables/useSession'
import { getLocationPreference, saveLocationPreference } from '@/api/catchLocations'

const { user, token, signingIn, signIn, signOut, sessionError } = useSession()
const loginError = ref('')
const loading = ref(false)
const busy = ref(false)
const enabled = ref(false)
const loaded = ref(false)
const error = ref('')
const notice = ref('')
const attempt = ref(0)
let saveController
onBeforeUnmount(() => saveController?.abort())
watch(
  [token, attempt],
  async ([currentToken], _, onCleanup) => {
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    saveController?.abort()
    loaded.value = false
    enabled.value = false
    error.value = notice.value = ''
    loading.value = !!currentToken
    busy.value = false
    if (!currentToken) return
    try {
      const preferences = await getLocationPreference(currentToken, controller.signal)
      if (!controller.signal.aborted) {
        enabled.value = preferences.capture_catch_location === true
        loaded.value = true
      }
    } catch (failure) {
      if (!controller.signal.aborted) error.value = failure.message
    } finally {
      if (!controller.signal.aborted) loading.value = false
    }
  },
  { immediate: true },
)
async function save() {
  if (busy.value || !loaded.value) return
  const controller = new AbortController()
  saveController = controller
  busy.value = true
  error.value = notice.value = ''
  try {
    await saveLocationPreference(enabled.value, token.value, controller.signal)
    if (!controller.signal.aborted) notice.value = 'Location preference saved.'
  } catch (failure) {
    if (!controller.signal.aborted) error.value = failure.message
  } finally {
    if (!controller.signal.aborted) busy.value = false
  }
}
async function handleSignIn(credentials) {
  loginError.value = ''
  try {
    await signIn(credentials)
  } catch (failure) {
    if (failure.name !== 'AbortError') loginError.value = failure.message
  }
}
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <AppNavbar :user="user" :session-error="sessionError" @sign-out="signOut" />
  <PageLayout v-if="user" id="main-content">
    <PageHeader
      ><template #heading><h1>Settings</h1></template></PageHeader
    >
    <ContentPanel
      title="Private catch location"
      description="Choose the default for new catches on all your devices."
    >
      <p v-if="loading" role="status">Loading preferences…</p>
      <form v-else-if="loaded" @submit.prevent="save">
        <label class="checkbox"
          ><input v-model="enabled" type="checkbox" :disabled="busy" @change="notice = ''" />Capture
          location for new catches</label
        >
        <p class="muted">
          When enabled, new catches logged now request your current device location. You can turn
          capture on or off for each catch. Older catches require an explicit location choice.
        </p>
        <p class="muted">
          Locations are private to you. Browser permission is separate, and device capture requires
          HTTPS. If location is unavailable, you can save your catch as usual.
        </p>
        <p class="muted">
          Changing this preference does not remove existing locations. Remove a saved location from
          its catch details.
        </p>
        <AppButton type="submit" :disabled="busy">{{
          busy ? 'Saving…' : 'Save preference'
        }}</AppButton>
      </form>
      <p v-if="error" class="error-message" role="alert">{{ error }}</p>
      <AppButton v-if="!loading && !loaded" variant="secondary" @click="attempt++"
        >Try again</AppButton
      >
      <p v-if="notice" role="status">{{ notice }}</p>
    </ContentPanel>
  </PageLayout>
  <PageLayout v-else id="main-content" variant="sign-in">
    <SignInPanel :busy="signingIn" :error="loginError" @submit="handleSignIn" />
  </PageLayout>
</template>

<style scoped>
form {
  display: grid;
  gap: 16px;
  max-width: 700px;
}
.checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}
.muted {
  font-size: 14px;
  line-height: 1.7;
}
form .button {
  justify-self: start;
}
[role='alert'],
[role='status'] {
  margin-top: 12px;
}
</style>
