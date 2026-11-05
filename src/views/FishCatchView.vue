<script setup>
import CatchBadges from '@/components/catches/CatchBadges.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import PageLayout from '@/components/ui/PageLayout.vue'
import StatusMessage from '@/components/ui/StatusMessage.vue'

import { STATUS, LABELS, EVENTS } from '@/constants'

import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Download, MapPin, Clock, Pencil } from '@lucide/vue'
import AppNavbar from '@/components/AppNavbar.vue'
import SignInPanel from '@/components/SignInPanel.vue'
import ContentPanel from '@/components/ui/ContentPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import DetailList from '@/components/ui/DetailList.vue'
import FishCatchEditor from '@/components/catches/FishCatchEditor.vue'
import CatchLocationEditor from '@/components/catches/CatchLocationEditor.vue'
import CatchPhoto from '@/components/catches/CatchPhoto.vue'
import CatchPhotoPicker from '@/components/catches/CatchPhotoPicker.vue'
import MasterAnglerReviewControls from '@/components/catches/MasterAnglerReviewControls.vue'
import { useSession } from '@/composables/useSession'
import { getFishCatch, saveCatchPhoto, removeCatchPhoto } from '@/api/fishCatch'
import { getMasterAnglerCertificate } from '@/api/masterAngler'

const route = useRoute()
const router = useRouter()
const { token, user, signingIn, signIn, signOut, sessionError: loginError } = useSession()
const fish = ref(null)
const editing = ref(false)
const editNotice = ref('')
watch([token, () => route.params.id], () => {
  editing.value = false
  editNotice.value = ''
})
function catchSaved() {
  editing.value = false
  editNotice.value = 'Catch updated.'
  resetCertificate()
  attempt.value++
}
const loading = ref(false)
const error = ref('')
const missing = ref(false)
const attempt = ref(0)
const photoFile = ref(null)
const photoBusy = ref(false)
const photoError = ref('')
const photoVersion = ref(0)
const canEditPhoto = computed(
  () =>
    fish.value &&
    (String(fish.value.user_id) === String(user.value?.user_id) || user.value?.is_admin),
)
let photoController
onBeforeUnmount(() => photoController?.abort())
async function updatePhoto(remove = false) {
  if (photoBusy.value || !canEditPhoto.value || (!remove && !photoFile.value)) return
  const controller = new AbortController()
  photoController = controller
  photoBusy.value = true
  photoError.value = ''
  try {
    const saved = remove
      ? await removeCatchPhoto(fish.value.id, token.value, controller.signal)
      : await saveCatchPhoto(fish.value.id, photoFile.value, token.value, controller.signal)
    if (controller.signal.aborted) return
    fish.value = { ...fish.value, ...saved }
    photoFile.value = null
    photoVersion.value++
    resetCertificate()
  } catch (failure) {
    if (!controller.signal.aborted) photoError.value = failure.message
  } finally {
    if (!controller.signal.aborted) photoBusy.value = false
  }
}
const certificateBusy = ref(false)
const certificateError = ref('')
const certificateNotice = ref('')
let certificateController
const canDownloadCertificate = computed(
  () =>
    fish.value?.master_angler_status === STATUS.APPROVED &&
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
    certificateError.value = failure.message
  } finally {
    if (!controller.signal.aborted) certificateBusy.value = false
  }
}
function reviewSaved(review) {
  fish.value = {
    ...fish.value,
    master_angler_review: review,
    master_angler_status: review.status,
    master_angler: review.status === STATUS.APPROVED,
    approved_master_angler: review.status === STATUS.APPROVED,
    eligible_master_angler: false,
  }
}
const species = computed(() => fish.value?.species?.name || 'Unknown species')
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
const masterAnglerStatus = computed(() => {
  const status = fish.value?.master_angler_status
  return status && status !== 'not_eligible'
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : 'Not eligible'
})
const catchDetails = computed(() => [
  {
    label: 'Lake',
    value: fish.value?.lake?.name || 'Lake not recorded',
    to:
      fish.value?.lake?.id || fish.value?.lake_id
        ? { name: 'lake', params: { id: fish.value.lake?.id || fish.value.lake_id } }
        : null,
  },
  {
    label: 'Lure',
    value: fish.value?.lure?.name || 'Lure not recorded',
    to:
      fish.value?.lure?.id || fish.value?.lure_id
        ? { name: 'lure', params: { id: fish.value.lure?.id || fish.value.lure_id } }
        : null,
  },
  { label: 'Master Angler', value: masterAnglerStatus.value },
  ...(user.value?.is_admin && fish.value?.master_angler_status === STATUS.PENDING
    ? [
        {
          label: 'Required award length',
          value: recorded(fish.value.species?.master_angler_length, ' in'),
        },
      ]
    : []),
  ...(fish.value?.witness && !['NA', 'N/A'].includes(fish.value.witness)
    ? [{ label: 'Witness', value: fish.value.witness }]
    : []),
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
    photoController?.abort()
    photoBusy.value = false
    photoFile.value = null
    photoError.value = ''
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
      if (failure.status === 404) missing.value = true
      else error.value = failure.message
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
    if (failure.name !== 'AbortError') loginError.value = failure.message
  }
}
function handleSignOut() {
  loginError.value = ''
  signOut()
}
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <AppNavbar :user="user" :session-error="loginError" @[EVENTS.SIGN_OUT]="handleSignOut" />
  <main v-if="user" id="main-content" class="catch-page" :aria-busy="loading">
    <AppButton variant="link" class="back-link" @click="router.back()">
      <ArrowLeft :size="16" aria-hidden="true" />Back
    </AppButton>
    <StatusMessage as="div" variant="loading" v-if="loading" class="loading-state" role="status">
      <span class="loading-line" aria-hidden="true" />
      <p>Loading catch details…</p>
      <div class="skeleton-grid" aria-hidden="true">
        <div v-for="i in 3" :key="i" class="skeleton" />
      </div>
    </StatusMessage>
    <ContentPanel
      v-else-if="missing"
      title="Catch not found"
      description="This catch may have been removed or the link may be incorrect."
    />
    <ContentPanel v-else-if="error" title="This catch couldn’t load">
      <p class="error-message" role="alert">{{ error }}</p>
      <AppButton @click="attempt++">{{ LABELS.TRY_AGAIN }}</AppButton>
    </ContentPanel>
    <template v-else-if="fish">
      <PageHeader :compact="false" class="page-header catch-header"
        ><template #heading
          ><div class="catch-heading">
            <h1>{{ species }}</h1>
            <CatchBadges
              :personal-best="fish.personal_best"
              :master-angler-status="fish.master_angler_status"
            />
            <div class="catch-meta">
              <p class="catch-location">
                <MapPin :size="15" aria-hidden="true" />{{ fish.lake?.name || 'Lake not recorded' }}
              </p>
              <p>{{ date }} <span aria-hidden="true">·</span> {{ time }}</p>
            </div>
            <RouterLink
              v-if="fish.trip_id && String(fish.user_id) === String(user.user_id)"
              :to="{ name: 'trip', params: { username: user.username, id: fish.trip_id } }"
              >View fishing trip →</RouterLink
            >
          </div></template
        >
        <MasterAnglerReviewControls
          v-if="user.is_admin && fish.master_angler_status === STATUS.PENDING"
          :key="fish.master_angler_review.id"
          :submission-id="fish.master_angler_review.id"
          :token="token"
          :reasons="fish.master_angler_denial_reasons || []"
          @[EVENTS.REVIEWED]="reviewSaved"
          @[EVENTS.REFRESH]="attempt++"
        />
        <span v-if="fish.master_angler_status === STATUS.DENIED" class="denial-notice" role="status"
          >Denied - {{ fish.master_angler_review.denial_reason }}</span
        >
        <div
          v-if="fish.master_angler_status === STATUS.APPROVED || canEditPhoto"
          class="certificate-actions"
        >
          <AppButton
            v-if="canDownloadCertificate"
            variant="navy"
            :disabled="certificateBusy"
            :aria-busy="certificateBusy"
            @click="downloadCertificate"
          >
            <Download :size="16" aria-hidden="true" />{{
              certificateBusy ? 'Generating PDF…' : 'Generate certificate'
            }}
          </AppButton>
          <AppButton v-if="canEditPhoto" variant="secondary" @click="editing = true">
            <Pencil :size="15" aria-hidden="true" />Edit
          </AppButton>
        </div>
      </PageHeader>
      <p v-if="fish.master_angler_status === STATUS.PENDING" role="status" class="eligibility">
        <Clock :size="16" aria-hidden="true" />Catch is under review for Master Angler award.
      </p>
      <p v-if="editNotice" role="status">{{ editNotice }}</p>
      <p v-if="certificateError" role="alert" class="error-message">{{ certificateError }}</p>
      <p v-if="certificateNotice" role="status" class="muted">{{ certificateNotice }}</p>
      <div class="catch-overview">
        <section class="catch-photo" aria-label="Catch photo">
          <CatchPhoto
            :catch-id="fish.id"
            :photo-key="fish.fish_image"
            :token="token"
            :alt="`${species} caught on ${date}`"
          />
        </section>
        <ContentPanel title="Details" class="catch-details-panel">
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
          <DetailList class="catch-detail-list" :items="[...catchDetails, ...conditions]" compact />
        </ContentPanel>
      </div>
      <div v-if="canEditPhoto" class="catch-edit-sections">
        <ContentPanel v-if="canEditPhoto" title="Catch photo">
          <CatchPhotoPicker :key="photoVersion" v-model="photoFile" :disabled="photoBusy" />
          <p class="muted">
            A photo is required for Master Angler eligibility. Changing an approved catch’s photo
            requires another review.
          </p>
          <div class="certificate-actions">
            <AppButton :disabled="photoBusy || !photoFile" @click="updatePhoto()">{{
              photoBusy ? 'Saving…' : 'Save photo'
            }}</AppButton>
            <AppButton
              v-if="fish.fish_image && !fish.fish_image.includes('stock-fish.jpg')"
              variant="secondary"
              :disabled="photoBusy"
              @click="updatePhoto(true)"
              >Remove photo</AppButton
            >
          </div>
          <p v-if="photoError" role="alert" class="error-message">{{ photoError }}</p>
        </ContentPanel>
        <ContentPanel v-if="String(fish.user_id) === String(user.user_id)" title="Catch Location">
          <CatchLocationEditor :catch-id="fish.id" :token="token" :lake="fish.lake" />
        </ContentPanel>
      </div>
    </template>
    <FishCatchEditor
      v-if="editing && canEditPhoto"
      :key="fish.id"
      :fish="fish"
      :token="token"
      @[EVENTS.CLOSE]="editing = false"
      @[EVENTS.SAVED]="catchSaved"
    />
  </main>
  <PageLayout variant="sign-in" v-else id="main-content" class="sign-in-layout">
    <SignInPanel :busy="signingIn" :error="loginError" @[EVENTS.SUBMIT]="handleSignIn" />
  </PageLayout>
</template>

<style scoped>
.catch-heading {
  min-width: 0;
  max-width: 100%;
}
.denial-notice {
  margin-left: auto;
  max-width: 100%;
  padding: 8px 12px;
  border: 1px solid #e8b9b9;
  border-radius: 7px;
  background: #fff5f5;
  color: #a33b3b;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  overflow-x: auto;
}

.certificate-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
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
  padding: 12px clamp(20px, 4vw, 48px) 48px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.back-link {
  margin-bottom: -8px;
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-accent);
}
.back-link:hover {
  text-decoration: underline;
}
.catch-header {
  flex-wrap: wrap;
}
.catch-header h1 {
  overflow-wrap: anywhere;
}
.catch-header .muted span {
  padding: 0 6px;
}
.catch-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 18px;
  margin-top: 10px;
  color: var(--muted);
  font-size: 13px;
}
.catch-meta p {
  margin: 0;
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
  gap: 12px;
  align-items: stretch;
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
  border-radius: var(--radius-panel);
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
  margin: 0 0 8px;
}
.measurements > div {
  background: #f1f5fa;
  border-radius: 9px;
  padding: 10px 12px;
  min-width: 0;
}
.measurements dt {
  color: var(--muted);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.measurements dd {
  margin: 4px 0 0;
  color: var(--blue);
  font-size: 18px;
  font-weight: 650;
  overflow-wrap: anywhere;
}
.catch-details-panel {
  padding: 16px;
  display: flex;
  flex-direction: column;
}
.catch-details-panel :deep(.panel__header) {
  margin-bottom: 12px;
}
.catch-edit-sections {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
  gap: 12px;
}
.catch-edit-sections > :only-child {
  grid-column: 1 / -1;
}
@media (min-width: 651px) {
  .catch-detail-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
}
@media (max-width: 650px) {
  .catch-overview,
  .catch-edit-sections {
    grid-template-columns: 1fr;
  }
  .catch-photo {
    min-height: 240px;
  }
}
</style>
