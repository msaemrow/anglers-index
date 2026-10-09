<script setup>
import AppSelect from '@/components/ui/AppSelect.vue'
import { computed, reactive, ref, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { getTrips } from '@/api/trips'
import { tripLabel } from '@/utils/dateTime'
import { getLakes } from '@/api/lakes'
import { getLures, getTackleBox } from '@/api/lures'
import { getCatchSpecies, createFishCatch, localDateTime } from '@/api/fishCatch'
const props = defineProps({
  user: { type: Object, required: true },
  token: { type: String, required: true },
  initialValues: { type: Object, default: () => ({}) },
  choices: { type: Object, default: null },
})
const emit = defineEmits(['saved', 'expired', 'busy', 'close'])
const form = reactive({
  species_id: props.initialValues.species_id ?? '',
  lake_id: props.initialValues.lake_id ?? '',
  lure_id: props.initialValues.lure_id ?? '',
  length: props.initialValues.length ?? '',
  weight: props.initialValues.weight ?? '',
  trip_id: props.initialValues.trip_id ?? '',
  datetime: props.initialValues.datetime ?? localDateTime(),
  witness: '',
  fish_image: '',
})
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const loadError = ref('')
const tackleError = ref('')
const attempt = ref(0)
const species = ref([])
const lakes = ref([])
const lures = ref([])
const tackle = ref([])
const tackleOnly = ref(false)
const tripStart = ref(form.datetime.slice(0, 10))
const tripEnd = ref(form.datetime.slice(0, 10))
const multiDayTrip = ref(false)
const startingTrip = computed(() => form.trip_id === 'new')
watch(
  () => form.datetime,
  (value, previous) => {
    if (tripStart.value === previous.slice(0, 10)) tripStart.value = value.slice(0, 10)
    if (tripEnd.value === previous.slice(0, 10)) tripEnd.value = value.slice(0, 10)
  },
)
const trips = ref([])
const tripsLoading = ref(false)
const tripsError = ref('')
const tripAttempt = ref(0)
const selectedTrip = computed(() =>
  trips.value.find((item) => String(item.id) === String(form.trip_id)),
)
watch(selectedTrip, (trip) => {
  if (trip) form.lake_id = trip.lake_id
})
watch(
  [() => props.token, tripAttempt],
  async (_, __, onCleanup) => {
    const current = new AbortController()
    onCleanup(() => current.abort())
    tripsLoading.value = true
    tripsError.value = ''
    trips.value = []
    try {
      const data = await getTrips(props.token, current.signal)
      if (!current.signal.aborted) {
        trips.value = data
        if (!form.trip_id) {
          let remembered = ''
          try {
            remembered =
              localStorage.getItem(`anglers-index.active-trip.${props.user.username}`) || ''
          } catch {
            /* Storage is optional. */
          }
          const trip = data.find(
            (item) =>
              String(item.id) === remembered &&
              item.status === 'active' &&
              (!form.lake_id || String(item.lake_id) === String(form.lake_id)) &&
              form.datetime.slice(0, 10) >= item.start_date &&
              form.datetime.slice(0, 10) <= item.end_date,
          )
          if (trip) form.trip_id = trip.id
        }
      }
    } catch (failure) {
      if (!current.signal.aborted) {
        if (failure.status === 401) emit('expired')
        else
          tripsError.value =
            'Fishing trips couldn’t load. Retry to select a trip, or log without a trip.'
      }
    } finally {
      if (!current.signal.aborted) tripsLoading.value = false
    }
  },
  { immediate: true },
)
let controller
const lakeLabel = (lake) => [lake.name, lake.county, lake.state].filter(Boolean).join(' · ')
const lureLabel = (lure) =>
  [lure.brand, lure.name, lure.color, lure.size].filter(Boolean).join(' · ')
const speciesOptions = computed(() =>
  species.value.map((item) => ({ value: item.id, label: item.name })),
)
const lakeOptions = computed(() =>
  lakes.value.map((item) => ({ value: item.id, label: lakeLabel(item) })),
)
const lureOptions = computed(() =>
  (tackleOnly.value ? tackle.value : lures.value).map((item) => ({
    value: item.id,
    label: lureLabel(item),
  })),
)
watch(tackleOnly, () => {
  if (!lureOptions.value.some((item) => String(item.value) === String(form.lure_id)))
    form.lure_id = ''
})
watch(
  [() => props.token, attempt],
  async (_, __, onCleanup) => {
    controller = new AbortController()
    const current = controller
    onCleanup(() => current.abort())
    loading.value = true
    loadError.value = tackleError.value = ''
    if (props.choices) {
      species.value = props.choices.species
      lakes.value = props.choices.lakes
      lures.value = props.choices.lures
      tackle.value = props.choices.tackle
      tackleOnly.value =
        tackle.value.length > 0 &&
        (!form.lure_id || tackle.value.some((item) => String(item.id) === String(form.lure_id)))
      loading.value = false
      return
    }
    const results = await Promise.allSettled([
      getCatchSpecies(current.signal),
      getLakes(current.signal),
      getLures(current.signal),
      getTackleBox(props.user.user_id, props.token, current.signal),
    ])
    if (current.signal.aborted) return
    loading.value = false
    if (results.some((result) => result.status === 'rejected' && result.reason.status === 401)) {
      emit('expired')
      return
    }
    if (results.slice(0, 3).some((result) => result.status === 'rejected')) {
      loadError.value = 'We couldn’t load the species, lakes, and lures. Please try again.'
      return
    }
    species.value = results[0].value.sort((a, b) => a.name.localeCompare(b.name))
    lakes.value = results[1].value
    lures.value = results[2].value
    tackle.value = results[3].status === 'fulfilled' ? results[3].value : []
    tackleOnly.value = tackle.value.length > 0
    if (results[3].status === 'rejected')
      tackleError.value = 'Your tackle box couldn’t load. You can select from all lures below.'
  },
  { immediate: true },
)
async function submit() {
  if (
    busy.value ||
    loading.value ||
    loadError.value ||
    (form.trip_id && !startingTrip.value && (tripsLoading.value || !selectedTrip.value))
  )
    return
  busy.value = true
  emit('busy', true)
  error.value = ''
  const current = controller
  try {
    const saved = await createFishCatch(
      {
        ...form,
        ...(startingTrip.value
          ? {
              trip_id: null,
              new_trip: {
                start_date: tripStart.value,
                end_date: tripEnd.value,
                single_day: !multiDayTrip.value,
              },
            }
          : {}),
      },
      props.token,
      current.signal,
    )
    if (!current.signal.aborted) {
      try {
        localStorage.setItem(
          `anglers-index.active-trip.${props.user.username}`,
          saved.trip_id ? String(saved.trip_id) : '',
        )
      } catch {
        /* Storage is optional. */
      }
      emit('saved', saved)
    }
  } catch (failure) {
    if (current.signal.aborted) return
    if (failure.status === 401) emit('expired')
    else
      error.value =
        failure.status === 400
          ? failure.message
          : 'Unable to save this catch. Your entries are still here; please try again.'
  } finally {
    if (!current.signal.aborted) {
      busy.value = false
      emit('busy', false)
    }
  }
}
</script>
<template>
  <div v-if="loading" role="status" class="loading-state">Loading species, lakes, and lures…</div>
  <div v-else-if="loadError">
    <p class="error-message" role="alert">{{ loadError }}</p>
    <AppButton @click="attempt++">Try again</AppButton>
  </div>
  <div v-else-if="!species.length || !lakes.length || !lures.length" role="status">
    <h3>The catch form isn’t ready yet</h3>
    <p>At least one species, lake, and lure must be added before you can log a catch.</p>
  </div>
  <form v-else @submit.prevent="submit" :aria-busy="busy">
    <fieldset :disabled="busy">
      <div class="form-grid">
        <SearchSelect
          v-model="form.species_id"
          label="Species"
          :options="speciesOptions"
          placeholder="Search species…"
          required
          :disabled="busy"
        />
        <SearchSelect
          v-model="form.lake_id"
          label="Lake"
          :options="lakeOptions"
          placeholder="Search lakes…"
          required
          :disabled="busy || !!selectedTrip"
        />
        <SearchSelect
          v-model="form.lure_id"
          label="Lure"
          :options="lureOptions"
          placeholder="Search lures…"
          required
          :disabled="busy"
        />
        <label class="field"
          >Date &amp; time<input v-model="form.datetime" type="datetime-local" required
        /></label>
        <label class="field"
          >Length (in)<input
            v-model="form.length"
            type="number"
            min="0"
            step="any"
            required
            placeholder="0 if not measured"
        /></label>
        <label class="field"
          >Weight (lb)<input
            v-model="form.weight"
            type="number"
            min="0"
            step="any"
            required
            placeholder="0 if not weighed"
        /></label>
        <label class="field"
          >Witness (for Master Angler review)
          <input v-model="form.witness" maxlength="75" placeholder="Witness name" />
        </label>
        <label class="field"
          >Catch photo URL (for Master Angler review)
          <input v-model="form.fish_image" type="url" placeholder="https://…" />
        </label>
      </div>
      <p class="hint">
        Catches meeting the species length requirement with a witness and catch photo are
        automatically submitted for review.
      </p>
      <div class="options">
        <label v-if="tackle.length" class="checkbox"
          ><input v-model="tackleOnly" type="checkbox" />My tackle box only</label
        >
      </div>
      <p v-if="tackleError" class="hint" role="status">{{ tackleError }}</p>
      <div class="trip-selection">
        <label class="field"
          >Fishing trip (optional)
          <AppSelect size="large" v-model="form.trip_id" :disabled="busy || tripsLoading">
            <option value="">No trip</option>
            <option value="new">Start a trip with this catch</option>
            <option v-for="trip in trips" :key="trip.id" :value="trip.id">
              {{ tripLabel(trip) }}
            </option>
          </AppSelect>
        </label>
        <AppButton v-if="!form.trip_id" variant="secondary" @click="form.trip_id = 'new'"
          >Start a trip with this catch</AppButton
        >
      </div>
      <div v-if="startingTrip" class="trip-start">
        <label class="field"
          >Trip start date<input
            v-model="tripStart"
            type="date"
            :max="form.datetime.slice(0, 10)"
            required
        /></label>
        <label class="checkbox"
          ><input v-model="multiDayTrip" type="checkbox" />Multi-day trip</label
        >
        <label v-if="multiDayTrip" class="field"
          >Trip end date<input v-model="tripEnd" type="date" :min="tripStart" required
        /></label>
        <p class="hint">
          Uses the catch’s lake. Choose the days you’re fishing; saving creates the trip and adds
          this catch. The trip completes automatically after its end date.
        </p>
      </div>
      <p v-if="tripsLoading" role="status" class="hint">Loading trips…</p>
      <p v-if="tripsError" role="alert" class="error-message">{{ tripsError }}</p>
      <AppButton v-if="tripsError" variant="secondary" @click="tripAttempt++"
        >Reload trips</AppButton
      >
      <p
        v-if="form.trip_id && !startingTrip && !tripsLoading && !selectedTrip"
        role="alert"
        class="error-message"
      >
        The selected trip isn’t available. Reload trips or select No trip.
      </p>
      <p v-if="selectedTrip" class="hint">
        The lake is set by your trip. Choose a catch date within the trip’s date range.
      </p>
      <p v-if="error" class="error-message" role="alert">{{ error }}</p>
      <div class="actions">
        <AppButton variant="secondary" :disabled="busy" @click="emit('close')">Cancel</AppButton>
        <AppButton
          variant="navy"
          type="submit"
          :disabled="busy || (!!form.trip_id && !startingTrip && (tripsLoading || !selectedTrip))"
          >{{
            busy ? 'Saving…' : startingTrip ? 'Start trip & save catch' : 'Save catch'
          }}</AppButton
        >
      </div>
    </fieldset>
  </form>
</template>
<style scoped>
fieldset {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}
.trip-selection {
  display: grid;
  gap: 12px;
  margin: 16px 0;
}
.trip-selection > .button {
  justify-self: start;
}
.trip-start {
  display: grid;
  gap: 8px;
  padding: 12px;
  margin: 12px 0;
  background: #eef4fa;
  border-radius: 8px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 16px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
}
.field input {
  width: 100%;
  min-height: 48px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: white;
  color: var(--navy);
  font: inherit;
}
.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 400;
}
.checkbox input {
  width: 16px;
  min-height: 16px;
}
.hint {
  color: var(--muted);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.6;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}
@media (max-width: 650px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .actions {
    flex-direction: column-reverse;
    gap: 12px;
  }
  .actions .button {
    width: 100%;
    min-height: 48px;
    font-size: 16px;
  }
}
.options {
  display: flex;
  flex-wrap: wrap;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  font-size: 12px;
}
.form-grid :deep(input) {
  min-height: 48px;
  font-size: 16px;
}
</style>
