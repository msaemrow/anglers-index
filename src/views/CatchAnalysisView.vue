<script setup>
import PageHeader from '@/components/ui/PageHeader.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { computed, ref, watch } from 'vue'
import AppNavbar from '@/components/AppNavbar.vue'
import SignInPanel from '@/components/SignInPanel.vue'
import ContentPanel from '@/components/ui/ContentPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import DataTable from '@/components/ui/DataTable.vue'
import AnalysisChart from '@/components/catches/AnalysisChart.vue'
import { useSession } from '@/composables/useSession'
import { getCatchAnalysis } from '@/api/catchAnalysis'
import { catchGroup, groupCatches, dimensions, months } from '@/utils/catchAnalysis'
const { user, token, signingIn, signIn, signOut } = useSession()
const catches = ref([]),
  loading = ref(false),
  error = ref(''),
  loginError = ref(''),
  attempt = ref(0)
const lake = ref(''),
  species = ref(''),
  start = ref(''),
  end = ref(''),
  month = ref('')
const weather = ref('temperature'),
  selected = ref(null)
function options(kind) {
  const map = new Map()
  for (const fish of catches.value) {
    const id = fish[`${kind}_id`]
    if (id == null) continue
    const relation = fish[kind]
    map.set(String(id), {
      id: String(id),
      label:
        kind === 'lake'
          ? [relation?.name || `Lake #${id}`, relation?.county, relation?.state]
              .filter(Boolean)
              .join(' · ')
          : relation?.name || `Species #${id}`,
    })
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label))
}
const lakes = computed(() => options('lake')),
  speciesOptions = computed(() => options('species'))
const invalidDates = computed(() => start.value && end.value && start.value > end.value)
const filtered = computed(() =>
  invalidDates.value
    ? []
    : catches.value.filter(
        (fish) =>
          (!lake.value || String(fish.lake_id) === lake.value) &&
          (!species.value || String(fish.species_id) === species.value) &&
          (!start.value || fish.date >= start.value) &&
          (!end.value || fish.date <= end.value) &&
          (!month.value || catchGroup(fish, 'month').key === String(Number(month.value) - 1)),
      ),
)
const monthRows = computed(() => groupCatches(filtered.value, 'month'))
const timeRows = computed(() => groupCatches(filtered.value, 'time'))
const weatherRows = computed(() => groupCatches(filtered.value, weather.value))
const coverage = computed(
  () => filtered.value.filter((fish) => catchGroup(fish, weather.value).key !== 'missing').length,
)
const days = computed(
  () =>
    new Set(
      filtered.value
        .filter((fish) => catchGroup(fish, 'month').key !== 'missing')
        .map((fish) => fish.date),
    ).size,
)
const detailRows = computed(() =>
  filtered.value
    .filter(
      (fish) =>
        !selected.value || catchGroup(fish, selected.value.dimension).key === selected.value.key,
    )
    .map((fish) => ({
      ...fish,
      species: fish.species?.name || 'Not recorded',
      lake: fish.lake?.name || 'Not recorded',
      condition: catchGroup(fish, weather.value).label,
    })),
)
const weatherOptions = Object.fromEntries(
  Object.entries(dimensions).filter(([key]) => !['month', 'time'].includes(key)),
)
function formatDate(value) {
  if (catchGroup({ date: value }, 'month').key === 'missing') return 'Not recorded'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}
function formatTime(value) {
  if (catchGroup({ time: value }, 'time').key === 'missing') return 'Not recorded'
  const [hour, minute] = value.split(':')
  return `${Number(hour) % 12 || 12}:${minute} ${Number(hour) >= 12 ? 'PM' : 'AM'}`
}
const columns = [
  { key: 'date', label: 'Date' },
  { key: 'time', label: 'Local time' },
  { key: 'species', label: 'Species' },
  { key: 'lake', label: 'Lake' },
  { key: 'condition', label: 'Selected weather' },
  { key: 'actions', label: 'Details', sortable: false },
]
function select(dimension, key) {
  selected.value =
    selected.value?.dimension === dimension && selected.value.key === key
      ? null
      : { dimension, key }
}
watch([lake, species, start, end, month, weather], () => {
  selected.value = null
})
function reset() {
  lake.value = ''
  species.value = ''
  start.value = ''
  end.value = ''
  month.value = ''
  selected.value = null
}
watch(
  [token, attempt],
  async ([currentToken], _, onCleanup) => {
    catches.value = []
    error.value = ''
    loading.value = false
    reset()
    if (!currentToken) return
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    loading.value = true
    try {
      const data = await getCatchAnalysis(currentToken, controller.signal)
      if (!controller.signal.aborted) catches.value = data
    } catch (failure) {
      if (controller.signal.aborted) return
      if (failure.status === 401) {
        loginError.value = 'Your session has expired. Please sign in again.'
        signOut()
      } else error.value = 'We couldn’t load your catch analysis. Please try again.'
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
          : 'Unable to sign in. Please try again.'
  }
}
</script>
<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <AppNavbar :user="user" @sign-out="signOut" />
  <main v-if="user" id="main-content" class="list-page header-page" :aria-busy="loading">
    <PageHeader title="Catch analysis" />
    <ContentPanel
      title="Reading your results"
      description="These are user-reported catches, not fishing success rates. More catches can reflect more time spent fishing. Missing catches and zero-catch outings affect these patterns."
    >
      <p class="muted">
        <RouterLink :to="{ name: 'trips', params: { username: user.username } }"
          >View your fishing trips.</RouterLink
        >
        These charts show catch counts. Reported days below are dates with catches, not trips.
        Weather describes the catch moment, not the whole outing or preceding weather pattern.
      </p>
    </ContentPanel>
    <p v-if="loading" role="status">Loading your catch history…</p>
    <ContentPanel v-else-if="error" title="Analysis couldn’t load"
      ><p role="alert">{{ error }}</p>
      <AppButton @click="attempt++">Try again</AppButton></ContentPanel
    >
    <ContentPanel v-else-if="!catches.length" title="No catches yet"
      ><p>Log catches to start exploring your history.</p>
      <RouterLink :to="{ name: 'fish-catches', params: { username: user.username } }"
        >Open catch log →</RouterLink
      ></ContentPanel
    >
    <template v-else>
      <ContentPanel title="Compare your catches">
        <div class="filters">
          <label
            >Lake<AppSelect size="compact" v-model="lake">
              <option value="">All lakes</option>
              <option v-for="item in lakes" :key="item.id" :value="item.id">
                {{ item.label }}
              </option>
            </AppSelect></label
          >
          <label
            >Species<AppSelect size="compact" v-model="species">
              <option value="">All species</option>
              <option v-for="item in speciesOptions" :key="item.id" :value="item.id">
                {{ item.label }}
              </option>
            </AppSelect></label
          >
          <label>From<input v-model="start" type="date" /></label
          ><label>Through<input v-model="end" type="date" /></label>
          <label
            >Month<AppSelect size="compact" v-model="month">
              <option value="">All months</option>
              <option v-for="(name, index) in months" :key="name" :value="String(index + 1)">
                {{ name }}
              </option>
            </AppSelect></label
          >
          <AppButton variant="secondary" @click="reset">Clear filters</AppButton>
        </div>
        <p v-if="invalidDates" role="alert">The start date must be on or before the end date.</p>
        <p class="summary" role="status">
          {{ filtered.length }} reported catches · {{ days }} reported days · {{ coverage }} of
          {{ filtered.length }} catches have {{ dimensions[weather].toLowerCase() }} recorded
        </p>
      </ContentPanel>
      <div class="charts">
        <ContentPanel
          title="Catches by month"
          description="Months combine all selected years. Select a bar to see its catches."
          ><AnalysisChart
            title="Month"
            :rows="monthRows"
            :selected="selected?.dimension === 'month' ? selected.key : null"
            @select="select('month', $event)"
        /></ContentPanel>
        <ContentPanel
          title="Catches by time of day"
          description="Uses the recorded local clock time. These are fixed time ranges, not sunrise or sunset windows."
          ><AnalysisChart
            title="Time of day"
            :rows="timeRows"
            :selected="selected?.dimension === 'time' ? selected.key : null"
            @select="select('time', $event)"
        /></ContentPanel>
      </div>
      <ContentPanel title="Weather at the catch">
        <label class="weather-select"
          >Compare<AppSelect size="compact" v-model="weather">
            <option v-for="(label, key) in weatherOptions" :key="key" :value="key">
              {{ label }}
            </option>
          </AppSelect></label
        >
        <AnalysisChart
          :title="dimensions[weather]"
          :rows="weatherRows"
          :selected="selected?.dimension === weather ? selected.key : null"
          @select="select(weather, $event)"
        />
      </ContentPanel>
      <ContentPanel
        :title="
          selected
            ? `Catches in selected group · ${detailRows.length}`
            : `Matching catches · ${detailRows.length}`
        "
      >
        <AppButton v-if="selected" variant="secondary" @click="selected = null"
          >Show all matching catches</AppButton
        >
        <DataTable
          v-if="detailRows.length"
          :rows="detailRows"
          :columns="columns"
          caption="Catches supporting this analysis"
          initial-sort="date"
          initial-direction="desc"
        >
          <template #cell-date="{ value }">{{ formatDate(value) }}</template>
          <template #cell-time="{ value }">{{ formatTime(value) }}</template>
          <template #cell-actions="{ row }"
            ><RouterLink
              :to="{ name: 'fish-catch', params: { username: user.username, id: row.id } }"
              >View catch →</RouterLink
            ></template
          >
        </DataTable>
        <p v-else role="status">No catches match these filters.</p>
      </ContentPanel>
    </template>
  </main>
  <main v-else id="main-content" class="sign-in-layout">
    <SignInPanel :busy="signingIn" :error="loginError" @submit="handleSignIn" />
  </main>
</template>
<style scoped>
.list-page {
  display: grid;
  gap: 22px;
}
.filters {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  align-items: end;
}
label {
  display: grid;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
}
input {
  padding: 10px;
  min-height: 41px;
  max-width: 100%;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--navy);
  background: white;
}
.summary {
  margin-top: 20px;
  font-size: 13px;
}
.charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}
.charts > * {
  min-width: 0;
}
.weather-select {
  max-width: 280px;
  margin-bottom: 20px;
}
.muted {
  line-height: 1.7;
}
@media (max-width: 1000px) {
  .charts {
    grid-template-columns: 1fr;
  }
}
</style>
