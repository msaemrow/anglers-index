<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { getLakes } from '@/api/lakes'
import { localDateTime } from '@/api/fishCatch'
import { createTrip } from '@/api/trips'
const props = defineProps({
  token: { type: String, required: true },
  lakeId: { type: [String, Number], default: '' },
  lakes: { type: Array, default: null },
})
const emit = defineEmits(['saved', 'close', 'expired'])
const busy = ref(false),
  error = ref(''),
  loading = ref(false),
  choices = ref(props.lakes || [])
const lake = ref(props.lakeId),
  start = ref(localDateTime().slice(0, 10)),
  end = ref(localDateTime().slice(0, 10)),
  multiDay = ref(false),
  notes = ref('')
const controller = new AbortController()
onBeforeUnmount(() => controller.abort())
const options = computed(() =>
  choices.value.map((item) => ({
    value: item.id,
    label: [item.name, item.county, item.state].filter(Boolean).join(' · '),
  })),
)
async function load() {
  loading.value = true
  error.value = ''
  try {
    choices.value = await getLakes(controller.signal)
  } catch (failure) {
    if (!controller.signal.aborted) error.value = failure.message
  } finally {
    if (!controller.signal.aborted) loading.value = false
  }
}
if (!props.lakes) load()
async function save() {
  if (busy.value || loading.value) return
  busy.value = true
  error.value = ''
  try {
    const endDate = multiDay.value ? end.value : start.value
    if (!start.value || !endDate || endDate < start.value)
      throw Error('End date must be on or after the start date.')
    const result = await createTrip(
      {
        lake_id: Number(lake.value),
        start_date: start.value,
        end_date: endDate,
        single_day: !multiDay.value,
        notes: notes.value,
      },
      props.token,
      controller.signal,
    )
    if (!controller.signal.aborted) emit('saved', result)
  } catch (failure) {
    if (!controller.signal.aborted) {
      if (failure.status === 401) emit('expired')
      else error.value = failure.message
    }
  } finally {
    if (!controller.signal.aborted) busy.value = false
  }
}
</script>
<template>
  <AppModal title="Add fishing trip" :busy="busy" @close="emit('close')">
    <p v-if="loading" role="status">Loading lakes…</p>
    <form v-else @submit.prevent="save">
      <fieldset :disabled="busy">
        <SearchSelect v-model="lake" label="Lake" :options="options" required />
        <label>Start date<input v-model="start" type="date" required /></label>
        <label class="checkbox"><input v-model="multiDay" type="checkbox" />Multi-day trip</label>
        <label v-if="multiDay"
          >End date<input v-model="end" type="date" :min="start" required
        /></label>
        <label>Notes<textarea v-model="notes" maxlength="2000" rows="3" /></label>
        <p class="muted">
          Trips complete automatically after their end date. Trip dates include the entire day.
          Single day trips use the start date for both dates.
        </p>
        <p v-if="error" role="alert" class="error-message">{{ error }}</p>
        <AppButton v-if="!choices.length" variant="secondary" @click="load">Reload lakes</AppButton>
        <div class="actions">
          <AppButton variant="secondary" @click="emit('close')">Cancel</AppButton
          ><AppButton type="submit" :disabled="busy || !lake">{{
            busy ? 'Saving…' : 'Save trip'
          }}</AppButton>
        </div>
      </fieldset>
    </form>
  </AppModal>
</template>
<style scoped>
fieldset {
  border: 0;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 16px;
  min-width: 0;
}
label {
  display: grid;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}
input,
textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font: inherit;
}
.checkbox {
  display: flex;
  align-items: center;
}
.checkbox input {
  width: auto;
}
.actions {
  display: flex;
  justify-content: end;
  gap: 10px;
}
.muted {
  font-size: 12px;
  line-height: 1.6;
}
</style>
