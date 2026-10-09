<script setup>
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
const emit = defineEmits(['close', 'saved', 'expired'])
const states =
  'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'
    .split(' ')
    .sort()
const fields = [
  { key: 'name', label: 'Lake name' },
  { key: 'nearest_town', label: 'Nearest town' },
  { key: 'county', label: 'County' },
]
const form = reactive({
  name: props.lake?.name ?? '',
  nearest_town: props.lake?.nearest_town ?? '',
  county: props.lake?.county ?? '',
  state: props.lake?.state ?? 'MN',
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
    if (!controller.signal.aborted) emit('saved', lake)
  } catch (failure) {
    if (controller.signal.aborted) return
    if (failure.status === 401) emit('expired')
    else
      error.value =
        failure.status === 400
          ? failure.message
          : failure.status === 403
            ? 'You don’t have permission to save lakes.'
            : failure.status === 404
              ? 'This lake no longer exists. Close this form and refresh the page.'
              : 'Unable to save this lake. Please try again.'
  } finally {
    if (!controller.signal.aborted) busy.value = false
  }
}
</script>
<template>
  <AppModal :title="lake ? 'Edit lake' : 'Add lake'" :busy="busy" @close="emit('close')">
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
          <option v-if="form.state && !states.includes(form.state)" :value="form.state">
            {{ form.state }}
          </option>
          <option v-for="state in states" :key="state" :value="state">{{ state }}</option>
        </AppSelect></label
      >
      <CoordinatePicker
        :latitude="form.latitude"
        :longitude="form.longitude"
        :disabled="busy"
        @select="Object.assign(form, $event)"
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
        <AppButton variant="secondary" :disabled="busy" @click="emit('close')">Cancel</AppButton
        ><AppButton type="submit" :disabled="busy">{{
          busy ? 'Saving…' : lake ? 'Save changes' : 'Add lake'
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
