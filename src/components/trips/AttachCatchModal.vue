<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import SearchSelect from '@/components/ui/SearchSelect.vue'
import { getFishCatches } from '@/api/fishCatch'
import { attachTripCatch } from '@/api/trips'
import { formatDate, formatTime } from '@/utils/dateTime'
const props = defineProps({
  trip: { type: Object, required: true },
  user: { type: Object, required: true },
  token: { type: String, required: true },
})
const emit = defineEmits(['saved', 'close', 'expired'])
const catches = ref([]),
  loading = ref(false),
  busy = ref(false),
  error = ref(''),
  selected = ref('')
const controller = new AbortController()
onBeforeUnmount(() => controller.abort())
const options = computed(() =>
  catches.value
    .filter(
      (fish) =>
        !fish.trip_id &&
        String(fish.lake_id) === String(props.trip.lake_id) &&
        fish.date >= props.trip.start_date &&
        fish.date <= props.trip.end_date,
    )
    .map((fish) => ({
      value: fish.id,
      label: `${formatDate(fish.date)} · ${formatTime(fish.time)} · ${fish.species?.name || 'Unknown species'} · #${fish.id}`,
    })),
)
async function load() {
  loading.value = true
  error.value = ''
  try {
    catches.value = await getFishCatches(props.user.user_id, props.token, controller.signal)
  } catch (failure) {
    if (!controller.signal.aborted) {
      if (failure.status === 401) emit('expired')
      else error.value = 'Unable to load catches. Please retry.'
    }
  } finally {
    if (!controller.signal.aborted) loading.value = false
  }
}
load()
async function save() {
  if (busy.value || !selected.value) return
  busy.value = true
  error.value = ''
  try {
    await attachTripCatch(props.trip.id, Number(selected.value), props.token, controller.signal)
    if (!controller.signal.aborted) emit('saved')
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
  <AppModal title="Add an existing catch" :busy="busy" @close="emit('close')">
    <p v-if="loading" role="status">Loading catches…</p>
    <form v-else @submit.prevent="save">
      <p class="muted">
        Choose an unassigned catch from this lake. Its date must fall within the trip dates.
      </p>
      <SearchSelect v-model="selected" label="Catch" :options="options" required :disabled="busy" />
      <p v-if="!options.length" role="status">No unassigned catches from this lake.</p>
      <p v-if="error" role="alert" class="error-message">{{ error }}</p>
      <div class="actions">
        <AppButton v-if="error && !catches.length" variant="secondary" @click="load"
          >Retry</AppButton
        ><AppButton variant="secondary" :disabled="busy" @click="emit('close')">Cancel</AppButton
        ><AppButton type="submit" :disabled="busy || !selected">{{
          busy ? 'Adding…' : 'Add to trip'
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
.muted {
  font-size: 13px;
  line-height: 1.6;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: end;
  gap: 10px;
}
</style>
