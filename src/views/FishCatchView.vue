<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { ArrowLeft, Download, MapPin, Trophy } from '@lucide/vue'
import AppNavbar from '@/components/AppNavbar.vue'
import SignInPanel from '@/components/SignInPanel.vue'
import ContentPanel from '@/components/ui/ContentPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import DetailList from '@/components/ui/DetailList.vue'
import { useSession } from '@/composables/useSession'
import { getFishCatch, catchPhotoUrl } from '@/api/fishCatch'
import { getMasterAnglerCertificate } from '@/api/masterAngler'

const route = useRoute()
const { token, user, signingIn, signIn, signOut } = useSession()
const fish = ref(null)
const loading = ref(false)
const error = ref('')
const missing = ref(false)
const loginError = ref('')
const attempt = ref(0)
const imageFailed = ref(false)
const certificateBusy = ref(false)
const certificateError = ref('')
const certificateNotice = ref('')
let certificateController
const canDownloadCertificate = computed(
  () =>
    fish.value?.master_angler === true &&
    (String(fish.value.user_id) === String(user.value?.user_id) || user.value?.is_admin),
)
function resetCertificate() {
  certificateController?.abort()
  certificateBusy.value = false
  certificateError.value = ''
  certificateNotice.value = ''
}
onBeforeUnmount(resetCertificate)
async function downloadCertificate() {
  if (certificateBusy.value || !canDownloadCertificate.value) return
  const id = fish.value.id
  const controller = new AbortController()
  certificateController = controller
  certificateBusy.value = true
  certificateError.value = ''
  certificateNotice.value = ''
  try {
    const pdf = await getMasterAnglerCertificate(id, token.value, controller.signal)
    if (controller.signal.aborted) return
    const url = URL.createObjectURL(pdf)
    const link = document.createElement('a')
    link.href = url
    link.download = `master_angler_${id}_certificate.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    certificateNotice.value = 'Your certificate download has started.'
  } catch (failure) {
    if (controller.signal.aborted) return
    if (failure.status === 401) {
      loginError.value = 'Your session has expired. Please sign in again.'
      signOut()
    } else
      certificateError.value =
        failure.status === 403 || failure.status === 404
          ? failure.message
          : 'Unable to generate your certificate. Please try again.'
  } finally {
    if (!controller.signal.aborted) certificateBusy.value = false
  }
}
const species = computed(() => fish.value?.species?.name || 'Unknown species')
const photo = computed(() => catchPhotoUrl(fish.value?.fish_image))
const date = computed(() => {
  if (!fish.value?.date) return 'Date not recorded'
  const parsed = new Date(`${fish.value.date.slice(0, 10)}T12:00:00`)
  return Number.isNaN(parsed.getTime())
    ? 'Date not recorded'
    : parsed.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
})
const time = computed(() => {
  const parts = /^(\d{2}):(\d{2})/.exec(fish.value?.time || '')
  if (!parts || Number(parts[1]) > 23 || Number(parts[2]) > 59) return 'Time not recorded'
  const hour = Number(parts[1])
  return `${hour % 12 || 12}:${parts[2]} ${hour >= 12 ? 'PM' : 'AM'}`
})
function recorded(value, unit = '') {
  return value === null || value === undefined || value === '' ? 'Not recorded' : `${value}${unit}`
}
const catchDetails = computed(() => [
  { label: 'Species', value: species.value },
  { label: 'Date caught', value: date.value },
  { label: 'Time caught', value: time.value },
  { label: 'Master Angler', value: fish.value?.master_angler ? 'Yes' : 'No' },
  ...(fish.value?.witness && !['NA', 'N/A'].includes(fish.value.witness)
    ? [{ label: 'Witness', value: fish.value.witness }]
    : []),
])
const locationDetails = computed(() => [
  { label: 'Nearest town', value: recorded(fish.value?.lake?.nearest_town) },
  { label: 'County', value: recorded(fish.value?.lake?.county) },
  { label: 'State', value: recorded(fish.value?.lake?.state) },
])
const lureDetails = computed(() => [
  { label: 'Brand', value: recorded(fish.value?.lure?.brand) },
  { label: 'Color', value: recorded(fish.value?.lure?.color) },
  { label: 'Size', value: recorded(fish.value?.lure?.size) },
])
const conditions = computed(() => [
  { label: 'Weather', value: recorded(fish.value?.weather_conditions) },
  { label: 'Temperature', value: recorded(fish.value?.temperature, ' °F') },
  { label: 'Pressure', value: recorded(fish.value?.barometric, ' inHg') },
  { label: 'Wind speed', value: recorded(fish.value?.wind_speed, ' mph') },
  { label: 'Wind direction', value: recorded(fish.value?.wind_direction) },
])

watch(
  [() => route.params.id, token, attempt],
  async ([id, currentToken], _, onCleanup) => {
    resetCertificate()
    fish.value = null
    error.value = ''
    missing.value = false
    imageFailed.value = false
    loading.value = false
    if (!currentToken) return
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    loading.value = true
    try {
      const response = await getFishCatch(id, currentToken, controller.signal)
      if (!controller.signal.aborted) fish.value = response
    } catch (failure) {
      if (controller.signal.aborted) return
      if (failure.status === 401) {
        loginError.value = 'Your session has expired. Please sign in again.'
        signOut()
      } else if (failure.status === 404) missing.value = true
      else error.value = 'We couldn’t load this catch. Please try again.'
    } finally {
      if (!controller.signal.aborted) loading.value = false
    }
  },
  { immediate: true },
)

async function handleSignIn(credentials) {
  loginError.value = ''
  try {
    await signIn(credentials)
  } catch (failure) {
    if (failure.name !== 'AbortError')
      loginError.value =
        failure.status === 401
          ? 'Incorrect username or password.'
          : 'Unable to sign in. Check your connection and try again.'
  }
}
function handleSignOut() {
  loginError.value = ''
  signOut()
}
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <AppNavbar :user="user" @sign-out="handleSignOut" />
  <main v-if="user" id="main-content" class="catch-page" :aria-busy="loading">
    <RouterLink
      :to="{ name: 'fish-catches', params: { username: user.username } }"
      class="back-link"
      ><ArrowLeft :size="16" aria-hidden="true" />Back to dashboard</RouterLink
    >
    <div v-if="loading" class="loading-state" role="status">
      <span class="loading-line" aria-hidden="true" />
      <p>Loading catch details…</p>
      <div class="skeleton-grid" aria-hidden="true">
        <div v-for="i in 3" :key="i" class="skeleton" />
      </div>
    </div>
    <ContentPanel
      v-else-if="missing"
      title="Catch not found"
      description="This catch may have been removed or the link may be incorrect."
    />
    <ContentPanel v-else-if="error" title="This catch couldn’t load">
      <p class="error-message" role="alert">{{ error }}</p>
      <AppButton @click="attempt++">Try again</AppButton>
    </ContentPanel>
    <template v-else-if="fish">
      <header class="page-header catch-header">
        <div>
          <p class="eyebrow">Your fishing journal · Catch #{{ fish.id }}</p>
          <h1>{{ species }}</h1>
          <p class="muted">{{ date }} <span aria-hidden="true">·</span> {{ time }}</p>
          <p class="catch-location">
            <MapPin :size="15" aria-hidden="true" />{{ fish.lake?.name || 'Lake not recorded' }}
          </p>
        </div>
        <div v-if="fish.master_angler" class="certificate-actions">
          <span class="eligibility"><Trophy :size="16" aria-hidden="true" />Master Angler</span>
          <AppButton
            v-if="canDownloadCertificate"
            variant="navy"
            :disabled="certificateBusy"
            :aria-busy="certificateBusy"
            @click="downloadCertificate"
          >
            <Download :size="16" aria-hidden="true" />{{
              certificateBusy ? 'Generating PDF…' : 'Download certificate'
            }}
          </AppButton>
        </div>
      </header>
      <p v-if="certificateError" role="alert" class="error-message">{{ certificateError }}</p>
      <p v-if="certificateNotice" role="status" class="muted">{{ certificateNotice }}</p>
      <div class="catch-overview">
        <section class="catch-photo" aria-label="Catch photo">
          <img
            :src="photo && !imageFailed ? photo : '/images/stock-fish.jpg'"
            :alt="
              photo && !imageFailed
                ? `${species} caught on ${date}`
                : 'Default fish image — no catch photo available'
            "
            @error="imageFailed = true"
          />
        </section>
        <ContentPanel title="Catch details">
          <dl class="measurements">
            <div>
              <dt>Length</dt>
              <dd>{{ recorded(fish.length, ' in') }}</dd>
            </div>
            <div>
              <dt>Weight</dt>
              <dd>{{ recorded(fish.weight, ' lb') }}</dd>
            </div>
          </dl>
          <DetailList :items="catchDetails" />
        </ContentPanel>
      </div>
      <div class="catch-info-grid">
        <ContentPanel title="Location">
          <h3>{{ fish.lake?.name || 'Lake not recorded' }}</h3>
          <DetailList :items="locationDetails" />
          <RouterLink
            v-if="fish.lake?.id || fish.lake_id"
            class="detail-link"
            :to="{ name: 'lake', params: { id: fish.lake?.id || fish.lake_id } }"
            >View lake details →</RouterLink
          >
        </ContentPanel>
        <ContentPanel title="Lure used">
          <h3>{{ fish.lure?.name || 'Lure not recorded' }}</h3>
          <DetailList :items="lureDetails" />
          <RouterLink
            v-if="fish.lure?.id || fish.lure_id"
            class="detail-link"
            :to="{ name: 'lure', params: { id: fish.lure?.id || fish.lure_id } }"
            >View lure details →</RouterLink
          >
        </ContentPanel>
        <ContentPanel title="Conditions"><DetailList :items="conditions" /></ContentPanel>
      </div>
    </template>
  </main>
  <main v-else id="main-content" class="sign-in-layout">
    <SignInPanel :busy="signingIn" :error="loginError" @submit="handleSignIn" />
  </main>
</template>

<style scoped>
.certificate-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
@media (max-width: 650px) {
  .certificate-actions {
    width: 100%;
  }
  .certificate-actions .button {
    width: 100%;
    min-height: 44px;
  }
}

.catch-page {
  max-width: 1250px;
  margin: 0 auto;
  padding: 30px clamp(20px, 4vw, 48px) 48px;
  display: flex;
  flex-direction: column;
  gap: 26px;
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  font-size: 12px;
  font-weight: 600;
  color: #577394;
}
.back-link:hover,
.detail-link:hover {
  text-decoration: underline;
}
.catch-header {
  flex-wrap: wrap;
}
.catch-header h1,
.catch-info-grid h3 {
  overflow-wrap: anywhere;
}
.catch-header .muted span {
  padding: 0 6px;
}
.catch-location {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 13px;
  margin-top: 10px;
}
.catch-location svg {
  flex-shrink: 0;
}
.eligibility {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff3d8;
  color: #886620;
  border: 1px solid #f0e2bd;
  border-radius: 7px;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 600;
}
.catch-overview {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 22px;
}
.catch-photo {
  min-width: 0;
  min-height: 350px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  background: #eaf0f6;
  border-radius: 14px;
}
.catch-photo img {
  display: block;
  width: 100%;
  max-height: 500px;
  object-fit: contain;
}
.measurements {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}
.measurements > div {
  background: #f1f5fa;
  border-radius: 9px;
  padding: 16px;
  min-width: 0;
}
.measurements dt {
  color: var(--muted);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.measurements dd {
  margin: 8px 0 0;
  color: var(--blue);
  font-size: clamp(19px, 2.5vw, 28px);
  font-weight: 650;
  overflow-wrap: anywhere;
}
.catch-info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
}
.catch-info-grid h3 {
  margin-bottom: 12px;
}
.detail-link {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  color: #577394;
  margin-top: 20px;
}
@media (max-width: 900px) {
  .catch-info-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 650px) {
  .catch-overview {
    grid-template-columns: 1fr;
  }
  .catch-photo {
    min-height: 240px;
  }
}
</style>
