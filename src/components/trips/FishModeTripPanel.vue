<script setup>
import { STATUS, LABELS, EVENTS } from '@/constants'

import AppSelect from '@/components/ui/AppSelect.vue'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import CollapsiblePanel from '@/components/ui/CollapsiblePanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import TripEditor from './TripEditor.vue'
import { getTrips } from '@/api/trips'
import { tripLabel } from '@/utils/dateTime'
const props = defineProps({
  expanded: { type: Boolean, default: true },
  token: { type: String, required: true },
  username: { type: String, required: true },
  lakeId: { type: [String, Number], default: '' },
  lakes: { type: Array, default: null },
  refresh: { type: Number, default: 0 },
  catchTripId: { type: [String, Number], default: '' },
  day: { type: String, required: true },
})
const emit = defineEmits([EVENTS.SELECTED, EVENTS.READY, EVENTS.TOGGLE])
const route = useRoute()
const trips = ref([]),
  selected = ref(''),
  loading = ref(false),
  error = ref(''),
  attempt = ref(0)
const editorOpen = ref(false)
watch(
  () => props.catchTripId,
  (id) => {
    if (id) selected.value = String(id)
  },
)
let initialized = false
watch(
  () => route.query.trip,
  (id) => {
    selected.value = id ? String(id) : ''
  },
)
watch(selected, (id) => {
  emit(EVENTS.SELECTED, trips.value.find((trip) => String(trip.id) === String(id)) || null)
  try {
    localStorage.setItem(`anglers-index.active-trip.${props.username}`, id)
  } catch {
    /* Storage is optional. */
  }
})
watch(
  [
    () => props.token,
    () => props.refresh,
    () => props.day,
    () => props.catchTripId,
    () => route.query.trip,
    attempt,
  ],
  async (_, __, onCleanup) => {
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    loading.value = true
    error.value = ''
    emit(EVENTS.READY, false)
    try {
      const data = await getTrips(props.token, controller.signal, STATUS.ACTIVE)
      if (controller.signal.aborted) return
      trips.value = data
      let remembered = ''
      try {
        remembered = localStorage.getItem(`anglers-index.active-trip.${props.username}`) || ''
      } catch {
        /* Storage is optional. */
      }
      const preferred = selected.value || (!initialized ? route.query.trip || remembered : '')
      initialized = true
      selected.value = data.some((trip) => String(trip.id) === String(preferred))
        ? String(preferred)
        : ''
      emit(EVENTS.READY, true)
      emit(EVENTS.SELECTED, data.find((trip) => String(trip.id) === selected.value) || null)
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
function saved(trip) {
  editorOpen.value = false
  if (trip.status === STATUS.ACTIVE) selected.value = String(trip.id)
  else selected.value = ''
  attempt.value++
}
</script>
<template>
  <CollapsiblePanel
    title="Fishing trip"
    class="trip-panel"
    :expanded="expanded"
    @[EVENTS.TOGGLE]="emit(EVENTS.TOGGLE)"
  >
    <p v-if="loading" role="status">Loading trips…</p>
    <template v-else-if="error"
      ><p role="alert" class="error-message">{{ error }}</p>
      <AppButton @click="attempt++">{{ LABELS.RETRY_TRIPS }}</AppButton></template
    >
    <template v-else>
      <label
        >{{ LABELS.ACTIVE_TRIP
        }}<AppSelect size="regular" v-model="selected">
          <option value="">Fishing without a trip</option>
          <option v-for="trip in trips" :key="trip.id" :value="String(trip.id)">
            {{ tripLabel(trip) }} · {{ trip.catch_count }} catches
          </option></AppSelect
        ></label
      >
      <div class="actions">
        <AppButton @click="editorOpen = true">New trip</AppButton>
      </div>
      <p class="hint">Trips complete automatically after their end date.</p>
    </template>
    <TripEditor
      v-if="editorOpen"
      :token="token"
      :lake-id="lakeId"
      :lakes="lakes"
      @[EVENTS.SAVED]="saved"
      @[EVENTS.CLOSE]="editorOpen = false"
    />
  </CollapsiblePanel>
</template>
<style scoped>
.trip-panel {
  padding: 14px;
  min-width: 0;
}
.hint {
  margin-top: 10px;
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
}
label {
  display: grid;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  margin-top: 12px;
  font-size: 12px;
}
</style>
