<script setup>
import { LABELS, US_STATES, DEFAULT_STATE, EVENTS } from '@/constants'

import AppSelect from '@/components/ui/AppSelect.vue'
import { reactive, ref, onBeforeUnmount } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { saveLake } from '@/api/lakes'
import CoordinatePicker from '@/components/maps/CoordinatePicker.vue'
const props = defineProps({
  lake: { type: Object, default: null },
  token: { type: String, required: true },
})
const emit = defineEmits([EVENTS.CLOSE, EVENTS.SAVED])
const fields = [
  { key: 'name', label: 'Lake name' },
  { key: 'nearest_town', label: 'Nearest town' },
  { key: 'county', label: 'County' },
]
const form = reactive({
  name: props.lake?.name ?? '',
  nearest_town: props.lake?.nearest_town ?? '',
  county: props.lake?.county ?? '',
  state: props.lake?.state ?? DEFAULT_STATE,
  latitude: props.lake?.latitude ?? '',
  longitude: props.lake?.longitude ?? '',
})
const busy = ref(false)
const error = ref('')
const controller = new AbortController()
onBeforeUnmount(() => controller.abort())
async function submit() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const lake = await saveLake(form, props.token, props.lake?.id, controller.signal)
    if (!controller.signal.aborted) emit(EVENTS.SAVED, lake)
  } catch (failure) {
    if (controller.signal.aborted) return
    error.value = failure.message
  } finally {
    if (!controller.signal.aborted) busy.value = false
  }
}
</script>
<template>
  <AppModal
    :title="lake ? 'Edit lake' : LABELS.ADD_LAKE"
    :busy="busy"
    @[EVENTS.CLOSE]="emit(EVENTS.CLOSE)"
  >
    <form @submit.prevent="submit">
      <label v-for="field in fields" :key="field.key" class="field"
        >{{ field.label
        }}<input
          v-model="form[field.key]"
          :name="field.key"
          maxlength="100"
          required
          :disabled="busy"
      /></label>
      <label class="field"
        >State<AppSelect size="regular" v-model="form.state" name="state" required :disabled="busy">
          <option value="" disabled>Select a state</option>
          <option v-if="form.state && !US_STATES.includes(form.state)" :value="form.state">
            {{ form.state }}
          </option>
          <option v-for="state in US_STATES" :key="state" :value="state">{{ state }}</option>
        </AppSelect></label
      >
      <CoordinatePicker
        :latitude="form.latitude"
        :longitude="form.longitude"
        :disabled="busy"
        @[EVENTS.SELECT]="Object.assign(form, $event)"
      />
      <div class="coordinates">
        <label class="field"
          >Latitude<input
            v-model="form.latitude"
            name="latitude"
            type="number"
            min="-90"
            max="90"
            step="any"
            :required="!!lake || form.longitude !== ''"
            :disabled="busy" /></label
        ><label class="field"
          >Longitude<input
            v-model="form.longitude"
            name="longitude"
            type="number"
            min="-180"
            max="180"
            step="any"
            :required="!!lake || form.latitude !== ''"
            :disabled="busy"
        /></label>
      </div>
      <p v-if="!lake" class="hint">
        If you leave coordinates blank, the nearest town will be used as an approximate location.
      </p>
      <p v-if="error" class="error-message" role="alert">{{ error }}</p>
      <div class="actions">
        <AppButton variant="secondary" :disabled="busy" @click="emit(EVENTS.CLOSE)">{{
          LABELS.CANCEL
        }}</AppButton
        ><AppButton type="submit" :disabled="busy">{{
          busy ? LABELS.SAVING : lake ? LABELS.SAVE_CHANGES : LABELS.ADD_LAKE
        }}</AppButton>
      </div>
    </form>
  </AppModal>
</template>
<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 600;
  min-width: 0;
}
.field input {
  width: 100%;
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 7px;
  color: var(--navy);
  background: white;
  font: inherit;
}
.coordinates {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}
.hint {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 18px;
}
</style>
