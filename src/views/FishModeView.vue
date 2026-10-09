<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Fish, Plus } from '@lucide/vue'
import AppNavbar from '@/components/AppNavbar.vue'
import SignInPanel from '@/components/SignInPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ContentPanel from '@/components/ui/ContentPanel.vue'
import CollapsiblePanel from '@/components/ui/CollapsiblePanel.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import DataTable from '@/components/ui/DataTable.vue'
import FishModeTripPanel from '@/components/trips/FishModeTripPanel.vue'
import { formatTime, tripToday } from '@/utils/dateTime'
import FishCatchModal from '@/components/catches/FishCatchModal.vue'
import { useSession } from '@/composables/useSession'
import { getLakes } from '@/api/lakes'
import { getLures, getTackleBox } from '@/api/lures'
import { getCatchSpecies, getFishCatches, localDateTime } from '@/api/fishCatch'

const { user, token, signingIn, signIn, signOut } = useSession()
const loginError = ref('')
const loading = ref(false)
const error = ref('')
const tackleError = ref('')
const notice = ref('')
const actionError = ref('')
const attempt = ref(0)
const catalog = ref(null)
const lakeId = ref('')
const activeTrip = ref(null)
const setupExpanded = ref(true)
const tripsReady = ref(false)
const catchTripId = ref('')
function selectTrip(trip) {
  activeTrip.value = trip
  if (trip) lakeId.value = trip.lake_id
}
const lureId = ref('')
const tackleOnly = ref(false)
const editor = ref(null)
const today = ref(localDateTime().slice(0, 10))
const tripDay = ref(tripToday())
const tripRefresh = ref(0)
const catches = ref([])
const catchesLoading = ref(false)
const catchesError = ref('')
const catchAttempt = ref(0)
const storageKey = computed(() =>
  user.value ? `anglers-index.fish-mode.${user.value.user_id}` : '',
)
const lakeOptions = computed(() =>
  (catalog.value?.lakes ?? []).map((item) => ({
    value: item.id,
    label: [item.name, item.county, item.state].filter(Boolean).join(' · '),
  })),
)
const lureOptions = computed(() =>
  (tackleOnly.value ? (catalog.value?.tackle ?? []) : (catalog.value?.lures ?? [])).map((item) => ({
    value: item.id,
    label: [item.brand, item.name, item.color, item.size].filter(Boolean).join(' · '),
  })),
)
const ready = computed(
  () =>
    tripsReady.value &&
    lakeOptions.value.some((item) => String(item.value) === String(lakeId.value)) &&
    lureOptions.value.some((item) => String(item.value) === String(lureId.value)),
)
const defaults = [
  'walleye',
  'black crappie',
  'bluegill',
  'pumpkinseed',
  'largemouth bass',
  'smallmouth bass',
  'yellow perch',
  'northern pike',
  'sauger',
]
const quickSpecies = computed(() =>
  defaults
    .map((name) => catalog.value?.species.find((item) => item.name.toLowerCase() === name))
    .filter(Boolean),
)
const rows = computed(() =>
  catches.value
    .filter((item) => item.date === today.value)
    .map((item) => ({
      ...item,
      speciesName:
        item.species?.name ??
        catalog.value?.species.find((species) => species.id === item.species_id)?.name ??
        'Unknown species',
      lakeName:
        item.lake?.name ??
        catalog.value?.lakes.find((lake) => lake.id === item.lake_id)?.name ??
        'Unknown lake',
    }))
    .sort(
      (a, b) =>
        String(b.time ?? '').localeCompare(String(a.time ?? '')) || Number(b.id) - Number(a.id),
    ),
)
const columns = [
  { key: 'time', label: 'Time' },
  { key: 'speciesName', label: 'Species' },
  { key: 'lakeName', label: 'Lake' },
  { key: 'length', label: 'Length (in)', numeric: true },
  { key: 'weight', label: 'Weight (lb)', numeric: true },
]
function expired() {
  loginError.value = 'Your session has expired. Please sign in again.'
  signOut()
}
watch(token, () => {
  editor.value = null
  notice.value = ''
  actionError.value = ''
})
watch(
  [token, attempt],
  async ([currentToken], _, onCleanup) => {
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    catalog.value = null
    loading.value = false
    error.value = tackleError.value = ''
    if (!currentToken || !user.value) return
    loading.value = true
    const results = await Promise.allSettled([
      getCatchSpecies(controller.signal),
      getLakes(controller.signal),
      getLures(controller.signal),
      getTackleBox(user.value.user_id, currentToken, controller.signal),
    ])
    if (controller.signal.aborted) return
    loading.value = false
    if (results.some((result) => result.status === 'rejected' && result.reason.status === 401)) {
      expired()
      return
    }
    if (results.slice(0, 3).some((result) => result.status === 'rejected')) {
      error.value = 'Unable to load fishing mode. Please try again.'
      return
    }
    const tackle = results[3].status === 'fulfilled' ? results[3].value : []
    catalog.value = {
      species: results[0].value,
      lakes: results[1].value,
      lures: results[2].value,
      tackle,
    }
    if (results[3].status === 'rejected')
      tackleError.value = 'Your tackle box couldn’t load. All lures are available instead.'
    let saved = {}
    try {
      saved = JSON.parse(localStorage.getItem(storageKey.value) || '{}') ?? {}
    } catch {
      /* Browser storage is optional. */
    }
    lakeId.value = catalog.value.lakes.some((item) => String(item.id) === String(saved.lakeId))
      ? saved.lakeId
      : ''
    if (activeTrip.value) lakeId.value = activeTrip.value.lake_id
    lureId.value = catalog.value.lures.some((item) => String(item.id) === String(saved.lureId))
      ? saved.lureId
      : ''
    tackleOnly.value =
      tackle.length > 0 &&
      (!lureId.value || tackle.some((item) => String(item.id) === String(lureId.value)))
  },
  { immediate: true },
)
watch([lakeId, lureId], () => {
  if (!catalog.value || !storageKey.value) return
  try {
    localStorage.setItem(
      storageKey.value,
      JSON.stringify({ lakeId: lakeId.value, lureId: lureId.value }),
    )
  } catch {
    /* Keep selections in memory. */
  }
})
watch(tackleOnly, () => {
  if (!lureOptions.value.some((item) => String(item.value) === String(lureId.value)))
    lureId.value = ''
})
watch(
  [token, today, catchAttempt],
  async ([currentToken, date], _, onCleanup) => {
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    catches.value = []
    catchesLoading.value = false
    catchesError.value = ''
    if (!currentToken || !user.value) return
    catchesLoading.value = true
    try {
      const data = await getFishCatches(user.value.user_id, currentToken, controller.signal, date)
      if (!controller.signal.aborted) catches.value = data
    } catch (failure) {
      if (controller.signal.aborted) return
      if (failure.status === 401) expired()
      else catchesError.value = 'Unable to load today’s catches. You can still log a new catch.'
    } finally {
      if (!controller.signal.aborted) catchesLoading.value = false
    }
  },
  { immediate: true },
)
function openCatch(speciesId = '') {
  if (!ready.value) {
    actionError.value = 'Choose a lake and lure first.'
    return
  }
  actionError.value = ''
  editor.value = {
    trip_id: activeTrip.value?.id,
    species_id: speciesId,
    lake_id: lakeId.value,
    lure_id: lureId.value,
    length: 0,
    weight: 0,
  }
}
function saved(item) {
  editor.value = null
  if (item.trip_id) catchTripId.value = item.trip_id
  notice.value = item.weather_warning
    ? `Catch saved. ${item.weather_warning}`
    : 'Catch saved. Ready for the next one.'
  updateDay()
  if (item.date === today.value)
    catches.value = [
      item,
      ...catches.value.filter((catchData) => String(catchData.id) !== String(item.id)),
    ]
  catchAttempt.value++
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
function updateDay() {
  today.value = localDateTime().slice(0, 10)
  tripDay.value = tripToday()
}
function refreshTrips() {
  updateDay()
  tripRefresh.value++
}
let timer
onMounted(() => {
  timer = setInterval(updateDay, 30000)
  window.addEventListener('focus', refreshTrips)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  window.removeEventListener('focus', refreshTrips)
})
</script>
<template>
  <a class="skip-link" href="#main-content">Skip to content</a
  ><AppNavbar :user="user" @sign-out="handleSignOut" />
  <main v-if="user" id="main-content" class="list-page fishing-page">
    <header class="page-header">
      <h1>Fishing mode</h1>
    </header>
    <p v-if="notice" class="catch-notice" role="status">{{ notice }}</p>
    <div v-if="loading" class="loading-state" role="status">Loading fishing mode…</div>
    <ContentPanel v-else-if="error" title="Fishing mode couldn’t load"
      ><p class="error-message" role="alert">{{ error }}</p>
      <AppButton @click="attempt++">Try again</AppButton></ContentPanel
    >
    <template v-else-if="catalog">
      <div class="fishing-setup">
        <FishModeTripPanel
          :expanded="setupExpanded"
          @toggle="setupExpanded = !setupExpanded"
          :token="token"
          :username="user.username"
          :lake-id="lakeId"
          :lakes="catalog.lakes"
          :refresh="catchAttempt + tripRefresh"
          :day="tripDay"
          :catch-trip-id="catchTripId"
          @ready="tripsReady = $event"
          @selected="selectTrip"
          @expired="expired"
        />
        <CollapsiblePanel
          title="Lake and lure"
          class="catch-controls"
          :expanded="setupExpanded"
          @toggle="setupExpanded = !setupExpanded"
        >
          <div class="setup">
            <SearchSelect
              v-model="lakeId"
              label="Lake"
              :options="lakeOptions"
              placeholder="Search lakes…"
              :disabled="!!activeTrip"
            /><SearchSelect
              v-model="lureId"
              label="Lure"
              :options="lureOptions"
              placeholder="Search lures…"
            />
          </div>
          <div class="setup-footer">
            <label v-if="catalog.tackle.length"
              ><input v-model="tackleOnly" type="checkbox" />My tackle box only</label
            >
          </div>
          <p v-if="tackleError" class="muted" role="status">{{ tackleError }}</p>
        </CollapsiblePanel>
      </div>
      <section class="panel catch-controls" aria-label="Quick catch entry">
        <p
          v-if="!catalog.lakes.length || !catalog.lures.length || !catalog.species.length"
          class="error-message"
        >
          Add a lake, lure, and species to the directories before logging a catch.
        </p>

        <p v-if="actionError" class="error-message" role="alert">{{ actionError }}</p>
        <p class="species-hint">Tap a species to log your catch.</p>
        <div class="species-buttons">
          <AppButton
            variant="navy"
            v-for="item in quickSpecies"
            :key="item.id"
            :disabled="!ready"
            @click="openCatch(item.id)"
            ><Fish :size="18" aria-hidden="true" />{{ item.name }}</AppButton
          ><AppButton
            variant="navy"
            :disabled="!ready || !catalog.species.length"
            @click="openCatch()"
            ><Plus :size="18" aria-hidden="true" />Other species</AppButton
          >
        </div>
      </section>
    </template>
    <ContentPanel
      :title="`Today’s catches${catchesLoading || catchesError ? '' : ` (${rows.length})`}`"
    >
      <div v-if="catchesLoading" role="status">Loading today’s catches…</div>
      <div v-else-if="catchesError">
        <p class="error-message" role="alert">{{ catchesError }}</p>
        <AppButton @click="catchAttempt++">Try again</AppButton>
      </div>
      <DataTable
        v-else-if="rows.length"
        :rows="rows"
        :columns="columns"
        caption="Today’s catches"
        initial-sort="time"
        initial-direction="desc"
        ><template #cell-time="{ value }">{{ formatTime(value) }}</template
        ><template #cell-speciesName="{ row }"
          ><RouterLink
            class="catch-link"
            :to="{ name: 'fish-catch', params: { username: user.username, id: row.id } }"
            >{{ row.speciesName }}</RouterLink
          ></template
        ></DataTable
      >
      <p v-else class="muted">No catches yet today. Your next catch starts here.</p>
    </ContentPanel>
    <FishCatchModal
      v-if="editor && catalog"
      :user="user"
      :token="token"
      :initial-values="editor"
      :choices="catalog"
      @close="editor = null"
      @saved="saved"
      @expired="expired"
    />
  </main>
  <main v-else id="main-content" class="sign-in-layout">
    <SignInPanel :busy="signingIn" :error="loginError" @submit="handleSignIn" />
  </main>
</template>
<style scoped>
.fishing-page {
  padding-top: 20px;
  gap: 16px;
}
.fishing-page > .page-header {
  padding-bottom: 12px;
}
h1 {
  font-size: 26px;
}
.catch-controls {
  padding: 16px;
}
.setup-footer {
  margin-bottom: 14px;
}
.fishing-page :deep(.panel:not(.is-collapsed) .panel__header) {
  padding-bottom: 12px;
  margin-bottom: 14px;
}

.fishing-setup {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: stretch;
}
.fishing-setup > * {
  min-width: 0;
}
.setup {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
.setup-footer {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
}
.setup-footer label {
  display: flex;
  align-items: center;
  gap: 8px;
}
.catch-link {
  color: var(--blue);
  font-weight: 600;
  text-decoration: underline;
}
.species-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
  gap: 12px;
}
.species-buttons .button {
  min-height: 64px;
  min-width: 0;
  padding: 14px 12px;
  text-align: left;
  touch-action: manipulation;
  justify-content: flex-start;
  text-transform: capitalize;
  font-size: 14px;
}
.species-buttons .button:disabled {
  cursor: not-allowed;
}
@media (max-width: 650px) {
  .fishing-setup {
    grid-template-columns: 1fr;
  }
  .setup {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .page-header {
    flex-direction: row;
    align-items: center;
  }
  .species-buttons {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .species-buttons .button {
    font-size: 14px;
    padding: 12px 10px;
  }
}
.species-hint {
  margin-bottom: 16px;
  color: var(--muted);
  font-size: 14px;
}
.species-buttons :deep(svg) {
  flex-shrink: 0;
}
.setup :deep(input) {
  min-height: 40px;
  font-size: 14px;
  padding-top: 7px;
  padding-bottom: 7px;
}
.setup :deep(label) {
  font-size: 12px;
}
.fishing-setup > .catch-controls {
  padding: 14px;
}
.fishing-setup :deep(.panel:not(.is-collapsed) .panel__header) {
  padding-bottom: 8px;
  margin-bottom: 10px;
}
.fishing-setup .setup-footer {
  margin-bottom: 0;
}
.setup-footer label {
  min-height: 32px;
  font-size: 12px;
}
</style>
