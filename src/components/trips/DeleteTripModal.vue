<script setup>
import { onBeforeUnmount, ref } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { deleteTrip } from '@/api/trips'
import { formatDate } from '@/utils/dateTime'
const props = defineProps({
  trip: { type: Object, required: true },
  token: { type: String, required: true },
})
const emit = defineEmits(['close', 'deleted', 'expired'])
const busy = ref(false),
  error = ref('')
const controller = new AbortController()
onBeforeUnmount(() => controller.abort())
async function remove() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await deleteTrip(props.trip.id, props.token, controller.signal)
    if (!controller.signal.aborted) emit('deleted')
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
  <AppModal title="Delete fishing trip?" :busy="busy" @close="emit('close')">
    <p>
      {{ trip.lake?.name || 'Fishing trip' }} · {{ formatDate(trip.start_date)
      }}<template v-if="trip.end_date !== trip.start_date"
        >–{{ formatDate(trip.end_date) }}</template
      >
    </p>
    <p class="explanation">
      This removes the trip and its links to catches. All catches and their details will be kept.
      Deleting the trip cannot be undone.
    </p>
    <p v-if="error" role="alert" class="error-message">{{ error }}</p>
    <div class="actions">
      <AppButton variant="secondary" :disabled="busy" @click="emit('close')">Cancel</AppButton
      ><AppButton variant="danger" :disabled="busy" @click="remove">{{
        busy ? 'Deleting…' : 'Delete trip'
      }}</AppButton>
    </div>
  </AppModal>
</template>
<style scoped>
p {
  font-size: 13px;
  line-height: 1.6;
}
.explanation {
  margin: 14px 0;
}
.actions {
  display: flex;
  justify-content: end;
  gap: 10px;
  margin-top: 18px;
}
</style>
