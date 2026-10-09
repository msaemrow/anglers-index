<script setup>
import AppSelect from '@/components/ui/AppSelect.vue'
import { ref, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import { reviewMasterAngler } from '@/api/masterAngler'

const props = defineProps({
  submissionId: { type: Number, required: true },
  token: { type: String, required: true },
  reasons: { type: Array, required: true },
})
const emit = defineEmits(['reviewed', 'expired', 'refresh'])
const reason = ref('')
const busy = ref(false)
const error = ref('')
const stale = ref(false)
let controller
watch(
  [() => props.token, () => props.submissionId],
  (_, __, onCleanup) => {
    controller = new AbortController()
    const current = controller
    onCleanup(() => current.abort())
    reason.value = ''
    busy.value = false
    error.value = ''
    stale.value = false
  },
  { immediate: true },
)
async function decide(status) {
  if (busy.value || stale.value || (status === 'denied' && !reason.value)) return
  const current = controller
  busy.value = true
  error.value = ''
  try {
    const review = await reviewMasterAngler(
      props.submissionId,
      status,
      reason.value,
      props.token,
      current.signal,
    )
    if (!current.signal.aborted) emit('reviewed', review)
  } catch (failure) {
    if (current.signal.aborted) return
    if (failure.status === 401) emit('expired')
    else {
      error.value = failure.message
      stale.value = failure.status === 409 || failure.status === 404 || failure.status === 403
    }
  } finally {
    if (!current.signal.aborted) busy.value = false
  }
}
</script>

<template>
  <section class="review-controls" aria-label="Admin Master Angler review" :aria-busy="busy">
    <p class="review-title">Review Master Angler catch</p>
    <label>
      Denial reason
      <AppSelect size="regular" v-model="reason" :disabled="busy || stale">
        <option value="">Select a reason</option>
        <option v-for="item in reasons" :key="item">{{ item }}</option>
      </AppSelect>
    </label>
    <div class="review-actions">
      <AppButton variant="navy" :disabled="busy || stale" @click="decide('approved')"
        >Approve</AppButton
      >
      <AppButton variant="secondary" :disabled="busy || stale || !reason" @click="decide('denied')"
        >Deny</AppButton
      >
    </div>
    <p v-if="error" class="error-message" role="alert">{{ error }}</p>
    <AppButton v-if="stale" variant="secondary" @click="emit('refresh')">Try again</AppButton>
  </section>
</template>

<style scoped>
.review-controls {
  display: grid;
  gap: 10px;
  margin-left: auto;
  width: min(360px, 100%);
}
.review-title {
  font-size: 13px;
  font-weight: 600;
}
label {
  display: grid;
  gap: 6px;
  font-size: 12px;
}
.review-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
@media (max-width: 650px) {
  .review-controls {
    width: 100%;
  }
  .review-actions :deep(.button) {
    flex: 1;
  }
}
</style>
