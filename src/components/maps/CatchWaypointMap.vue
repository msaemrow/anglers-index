<script setup>
import { computed, ref, watch } from 'vue'
import CollapsibleFilters from '@/components/ui/CollapsibleFilters.vue'
import { getLakeCatchLocations } from '@/api/catchLocations'
import { lakeCoordinates, getLakes } from '@/api/lakes'
import { filterMapCatches } from '@/utils/catchMap'
import LocationMap from './LocationMap.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import DataCardList from '@/components/ui/DataCardList.vue'

const props = defineProps({
  lake: { type: Object, default: null },
  token: { type: String, required: true },
  username: { type: String, required: true },
})
const catches = ref([])
const lakes = ref([])
const lakeId = ref('')
const loading = ref(true)
const error = ref('')
const attempt = ref(0)
const species = ref('')
const from = ref('')
const to = ref('')
const activeFilterCount = computed(
  () => [lakeId.value, species.value, from.value, to.value].filter(Boolean).length,
)
const selected = ref(null)
const shown = ref(10)
const reference = computed(() => (props.lake ? lakeCoordinates(props.lake) : null))
const invalidRange = computed(() => !!from.value && !!to.value && from.value > to.value)
const speciesOptions = computed(() =>
  [...new Map(catches.value.map((fish) => [fish.species_id, fish.species_name])).entries()].sort(
    (a, b) => a[1].localeCompare(b[1]),
  ),
)
const exportFilters = computed(() => ({
  lake_id: lakeId.value,
  species_id: species.value,
  from: from.value,
  to: to.value,
}))
const filtered = computed(() =>
  invalidRange.value
    ? []
    : filterMapCatches(catches.value, {
        species: species.value,
        lake: lakeId.value,
        from: from.value,
        to: to.value,
      }),
)
const details = computed(() => {
  const ids = selected.value === null ? null : new Set(selected.value)
  return filtered.value
    .filter((fish) => !ids || ids.has(fish.id))
    .slice()
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id - a.id)
})
const cards = computed(() =>
  details.value.slice(0, shown.value).map((fish) => ({
    ...fish,
    caught: fish.date
      ? new Date(`${fish.date}T12:00:00`).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Not recorded',
    measurement: `${fish.length ?? '—'} in · ${fish.weight ?? '—'} lb`,
    lure: fish.lure_label || 'Not recorded',
  })),
)
const columns = [
  { key: 'species_name', label: 'Species' },
  { key: 'caught', label: 'Date caught' },
  { key: 'measurement', label: 'Length / weight' },
  { key: 'lure', label: 'Lure' },
]
watch([species, lakeId, from, to], () => {
  selected.value = null
  shown.value = 10
})
function showAll() {
  selected.value = null
  shown.value = 10
}
function select(ids) {
  selected.value = ids
  shown.value = 10
}
function resetFilters() {
  species.value = lakeId.value = from.value = to.value = ''
  selected.value = null
  shown.value = 10
}
watch(
  [() => props.lake?.id, () => props.token, attempt],
  async ([id, token], _, onCleanup) => {
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    catches.value = []
    resetFilters()
    loading.value = true
    error.value = ''
    try {
      const [data, lakeChoices] = await Promise.all([
        getLakeCatchLocations(id, token, controller.signal),
        props.lake ? Promise.resolve([]) : getLakes(controller.signal),
      ])
      if (!controller.signal.aborted) {
        catches.value = data
        lakes.value = lakeChoices.slice().sort((a, b) => a.name.localeCompare(b.name))
      }
    } catch (failure) {
      if (!controller.signal.aborted) error.value = failure.message
    } finally {
      if (!controller.signal.aborted) loading.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <slot
    name="header"
    :filters="exportFilters"
    :disabled="loading || !!error || !filtered.length || invalidRange"
  />
  <p v-if="loading" role="status" class="hint">Loading your catch locations…</p>
  <div v-if="error" role="alert">
    <p class="error-message">Your catch locations couldn’t load. {{ error }}</p>
    <AppButton variant="secondary" @click="attempt++">Retry catch locations</AppButton>
  </div>
  <CollapsibleFilters :active-count="activeFilterCount" :class="{ 'lake-map-filters': lake }">
    <div class="filters">
      <label v-if="!lake"
        >Lake<AppSelect v-model="lakeId">
          <option value="">All lakes</option>
          <option v-for="item in lakes" :key="item.id" :value="item.id">
            {{ [item.name, item.county, item.state].filter(Boolean).join(' · ') }}
          </option>
        </AppSelect></label
      >
      <label
        >Species<AppSelect v-model="species"
          ><option value="">All species</option>
          <option v-for="[id, name] in speciesOptions" :key="id" :value="id">
            {{ name }}
          </option></AppSelect
        ></label
      >
      <label>From<input v-model="from" type="date" /></label>
      <label>Through<input v-model="to" type="date" /></label>
      <AppButton variant="secondary" @click="resetFilters">Clear filters</AppButton>
    </div>
  </CollapsibleFilters>
  <p v-if="invalidRange" class="error-message" role="status">
    Choose an end date on or after the start date.
  </p>
  <LocationMap
    :large="!lake"
    :reference="reference"
    :points="filtered"
    :label="lake ? `${lake.name} map with your private catch locations` : `Your private waypoints`"
    :reference-label="lake ? `${lake.name} approximate lake location` : ``"
    @select="select"
  />
  <p v-if="lake" class="hint">
    Orange dots are your private catches. Numbered dots group nearby catches; tap or click to see
    their details below and zoom in.
    <template v-if="lake">The blue pin is the lake’s approximate reference point.</template>
  </p>
  <p v-if="!loading && !error" class="hint" role="status">
    {{ filtered.length }} of {{ catches.length }} waypoints shown.
  </p>
  <p v-if="lake && !loading && !error && !catches.length" class="hint">
    You haven’t saved any catch locations{{ lake ? ' for this lake' : '' }} yet.
  </p>
  <p v-else-if="lake && !loading && !error && !filtered.length && !invalidRange" class="hint">
    No located catches match these filters.
  </p>
  <section v-if="details.length" aria-label="Catch map details" class="map-details">
    <div class="details-heading">
      <h3>
        {{
          selected === null
            ? 'Your catches on this map'
            : `${details.length} catches in selected point or group`
        }}
      </h3>
      <AppButton v-if="selected !== null" variant="secondary" @click="showAll"
        >Show all catches</AppButton
      >
    </div>
    <p v-if="selected !== null" class="hint" role="status">
      Selected {{ details.length }} catches. Catches at the same coordinates are listed
      individually.
    </p>
    <DataCardList
      :rows="cards"
      :columns="columns"
      title-key="species_name"
      caption="Your mapped catches"
    >
      <template #cell-species_name="{ row }"
        ><RouterLink :to="{ name: 'fish-catch', params: { username, id: row.id } }"
          >{{ row.species_name }} →</RouterLink
        ></template
      >
    </DataCardList>
    <AppButton v-if="details.length > shown" variant="secondary" @click="shown += 10"
      >Show more catches ({{ details.length - shown }} remaining)</AppButton
    >
  </section>
</template>

<style scoped>
.hint {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
  margin: 10px 0;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: end;
  margin: 0;
}
.lake-map-filters {
  display: block;
  margin-bottom: 16px;
}
.lake-map-filters .filters {
  justify-content: flex-start;
}
.lake-map-filters :deep(.filters-toggle) {
  margin-left: 0;
  margin-right: auto;
}
.filters label {
  display: grid;
  gap: 5px;
  min-width: 120px;
  font-size: 13px;
}
.filters input {
  min-height: 40px;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-control);
  background: var(--surface);
  color: var(--navy);
  font: inherit;
}
.details-heading {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.map-details {
  margin-top: 18px;
}
.map-details > .button {
  margin-top: 12px;
}
.map-details :deep(a) {
  color: var(--text-accent);
}
.map-details :deep(a:hover) {
  text-decoration: underline;
}
@media (max-width: 650px) {
  .filters label {
    flex: 1 1 100%;
    min-width: 0;
  }
  .filters input {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    font-size: 16px;
  }
}
</style>
