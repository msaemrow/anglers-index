<script setup>
import { reactive, ref, onMounted, onBeforeUnmount } from 'vue'
import { EVENTS } from '@/constants'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import FormField from '@/components/ui/FormField.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { getCatchSpecies, updateFishCatch } from '@/api/fishCatch'
import { getLakes } from '@/api/lakes'
import { getLures } from '@/api/lures'

const props = defineProps({
  fish: { type: Object, required: true },
  token: { type: String, required: true },
})
const emit = defineEmits([EVENTS.CLOSE, EVENTS.SAVED])
const form = reactive({
  species_id: props.fish.species_id,
  lake_id: props.fish.lake_id,
  lure_id: props.fish.lure_id,
  length: props.fish.length ?? 0,
  weight: props.fish.weight ?? 0,
  witness: props.fish.witness ?? '',
  datetime: `${props.fish.date}T${(props.fish.time || '00:00').slice(0, 5)}`,
})
const species = ref([])
const lakes = ref([])
const lures = ref([])
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const loadError = ref('')
const controller = new AbortController()
onBeforeUnmount(() => controller.abort())
async function loadChoices() {
  loading.value = true
  loadError.value = ''
  try {
    const choices = await Promise.all([
      getCatchSpecies(controller.signal),
      getLakes(controller.signal),
      getLures(controller.signal),
    ])
    if (!controller.signal.aborted)
      [species.value, lakes.value, lures.value] = choices.map((items) =>
        items.map((item) => ({
          value: item.id,
          label:
            item.name ||
            [item.brand, item.color, item.size].filter(Boolean).join(' · ') ||
            'Unnamed item',
        })),
      )
  } catch (failure) {
    if (!controller.signal.aborted) loadError.value = failure.message
  } finally {
    if (!controller.signal.aborted) loading.value = false
  }
}
onMounted(loadChoices)
async function submit() {
  if (busy.value || loading.value || loadError.value) return
  busy.value = true
  error.value = ''
  try {
    const saved = await updateFishCatch(props.fish.id, form, props.token, controller.signal)
    if (!controller.signal.aborted) emit(EVENTS.SAVED, saved)
  } catch (failure) {
    if (!controller.signal.aborted) error.value = failure.message
  } finally {
    if (!controller.signal.aborted) busy.value = false
  }
}
</script>

<template>
  <AppModal title="Edit catch" :busy="busy" @[EVENTS.CLOSE]="emit(EVENTS.CLOSE)">
    <p v-if="loading" role="status">Loading catch options…</p>
    <div v-else-if="loadError" role="alert">
      <p>{{ loadError }}</p>
      <AppButton variant="secondary" @click="loadChoices">Try again</AppButton>
    </div>
    <form v-else @submit.prevent="submit">
      <SearchSelect
        v-model="form.species_id"
        label="Species"
        :options="species"
        required
        :disabled="busy"
      />
      <SearchSelect
        v-model="form.lake_id"
        label="Lake"
        :options="lakes"
        required
        :disabled="busy || !!fish.trip_id"
      />
      <SearchSelect
        v-model="form.lure_id"
        label="Lure"
        :options="lures"
        required
        :disabled="busy"
      />
      <p v-if="fish.trip_id">Lake and date cannot be changed while this catch belongs to a trip.</p>
      <FormField
        id="edit-catch-datetime"
        v-model="form.datetime"
        label="Date and time"
        type="datetime-local"
        required
        :disabled="busy || !!fish.trip_id"
      />
      <FormField
        id="edit-catch-length"
        v-model="form.length"
        label="Length (in)"
        type="number"
        min="0"
        step="any"
        required
        :disabled="busy"
      />
      <FormField
        id="edit-catch-weight"
        v-model="form.weight"
        label="Weight (lb)"
        type="number"
        min="0"
        step="any"
        required
        :disabled="busy"
      />
      <FormField
        id="edit-catch-witness"
        v-model="form.witness"
        label="Witness"
        maxlength="75"
        :disabled="busy"
      />
      <p v-if="error" class="error-message" role="alert">{{ error }}</p>
      <div class="actions">
        <AppButton variant="secondary" :disabled="busy" @click="emit(EVENTS.CLOSE)"
          >Cancel</AppButton
        >
        <AppButton type="submit" :disabled="busy">{{
          busy ? 'Saving…' : 'Save changes'
        }}</AppButton>
      </div>
    </form>
  </AppModal>
</template>

<style scoped>
form {
  display: grid;
  gap: 16px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
