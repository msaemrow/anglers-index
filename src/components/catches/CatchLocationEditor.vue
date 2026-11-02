<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import LocationMap from '@/components/maps/LocationMap.vue'
import CoordinatePicker from '@/components/maps/CoordinatePicker.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { getCatchLocation, saveCatchLocation } from '@/api/catchLocations'
import { lakeCoordinates } from '@/api/lakes'
import { manualLocation } from '@/utils/geolocation'

const props = defineProps({
  catchId: { type: [Number, String], required: true },
  token: { type: String, required: true },
  lake: { type: Object, default: null },
})
const location = ref(null)
const latitude = ref('')
const longitude = ref('')
const savedLocation = ref(null)
const editing = ref(false)
const mapPoints = computed(() =>
  savedLocation.value ? [{ ...savedLocation.value, id: Number(props.catchId) }] : [],
)
const lakeCenter = computed(() => lakeCoordinates(props.lake))
const loading = ref(true)
const loaded = ref(false)
const busy = ref(false)
const error = ref('')
const notice = ref('')
const attempt = ref(0)
let saveController
onBeforeUnmount(() => saveController?.abort())
watch(
  [() => props.catchId, () => props.token, attempt],
  async ([id, token], _, onCleanup) => {
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    saveController?.abort()
    loading.value = true
    loaded.value = busy.value = editing.value = false
    error.value = notice.value = ''
    location.value = savedLocation.value = null
    try {
      const saved = await getCatchLocation(id, token, controller.signal)
      if (!controller.signal.aborted) {
        location.value = savedLocation.value = saved
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
function startEditing() {
  location.value = savedLocation.value
  latitude.value = savedLocation.value?.latitude ?? ''
  longitude.value = savedLocation.value?.longitude ?? ''
  error.value = notice.value = ''
  editing.value = true
}
function cancelEditing() {
  location.value = savedLocation.value
  latitude.value = savedLocation.value?.latitude ?? ''
  longitude.value = savedLocation.value?.longitude ?? ''
  error.value = notice.value = ''
  editing.value = false
}
function selectPoint(point) {
  latitude.value = point.latitude
  longitude.value = point.longitude
  manualChange()
}
function manualChange() {
  location.value = manualLocation(latitude.value, longitude.value)
}
async function save(remove = false) {
  if (!loaded.value || busy.value || (!remove && !location.value)) return
  const controller = new AbortController()
  saveController = controller
  busy.value = true
  error.value = notice.value = ''
  try {
    const saved = await saveCatchLocation(
      props.catchId,
      remove ? null : location.value,
      props.token,
      controller.signal,
    )
    if (!controller.signal.aborted) {
      location.value = savedLocation.value = saved
      notice.value = saved ? 'Location saved.' : ''
      editing.value = false
    }
  } catch (failure) {
    if (!controller.signal.aborted) error.value = failure.message
  } finally {
    if (!controller.signal.aborted) busy.value = false
  }
}
</script>

<template>
  <p v-if="loading" role="status">Loading location…</p>
  <template v-else-if="loaded">
    <form v-if="editing" @submit.prevent="save()">
      <CoordinatePicker
        :latitude="latitude"
        :longitude="longitude"
        :fallback-coordinates="lakeCenter"
        use-device-location
        location-label="catch"
        :disabled="busy"
        @select="selectPoint"
      />
      <details class="manual-coordinates">
        <summary>Enter coordinates</summary>
        <div class="coordinate-fields">
          <label
            >Latitude<input
              v-model="latitude"
              type="text"
              inputmode="decimal"
              :disabled="busy"
              placeholder="−90 to 90"
              @input="manualChange"
          /></label>
          <label
            >Longitude<input
              v-model="longitude"
              type="text"
              inputmode="decimal"
              :disabled="busy"
              placeholder="−180 to 180"
              @input="manualChange"
          /></label>
        </div>
      </details>
      <div class="actions">
        <AppButton type="submit" :disabled="busy || !location">{{
          busy ? 'Saving…' : 'Save location'
        }}</AppButton>
        <AppButton variant="secondary" :disabled="busy" @click="cancelEditing">Cancel</AppButton>
      </div>
    </form>
    <template v-else-if="savedLocation">
      <LocationMap :points="mapPoints" show-accuracy label="Catch location" />
      <p v-if="savedLocation.source === 'device'" class="hint">
        Accuracy: approximately {{ Math.round(savedLocation.accuracy_meters) }} meters.
      </p>
      <div class="actions">
        <AppButton variant="secondary" :disabled="busy" @click="startEditing"
          >Edit location</AppButton
        >
        <AppButton variant="secondary" :disabled="busy" @click="save(true)">{{
          busy ? 'Removing…' : 'Remove location'
        }}</AppButton>
      </div>
    </template>
    <template v-else>
      <p class="hint" role="status">No location saved.</p>
      <AppButton @click="startEditing">Add location</AppButton>
    </template>
  </template>
  <p v-if="error" class="error-message" role="alert">{{ error }}</p>
  <AppButton v-if="!loading && !loaded" variant="secondary" @click="attempt++"
    >Reload location</AppButton
  >
  <p v-if="notice" class="hint" role="status">{{ notice }}</p>
</template>

<style scoped>
.hint {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
  margin: 12px 0;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.manual-coordinates {
  margin: 12px 0;
  font-size: 13px;
}
summary {
  cursor: pointer;
}
.coordinate-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}
.coordinate-fields label {
  display: grid;
  gap: 5px;
  flex: 1 1 150px;
}
.coordinate-fields input {
  width: 100%;
  min-height: 44px;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-control);
  font: inherit;
  font-size: 16px;
  color: var(--navy);
  background: var(--surface);
}
</style>
