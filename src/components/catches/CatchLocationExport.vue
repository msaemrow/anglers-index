<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import { exportCatchGpx } from '@/api/catchExport'

const props = defineProps({
  token: { type: String, required: true },
  filters: { type: Object, required: true },
  disabled: Boolean,
})
const details = ref(true)
const busy = ref(false)
const error = ref('')
const notice = ref('')
const invalidRange = computed(
  () => !!props.filters.from && !!props.filters.to && props.filters.from > props.filters.to,
)
let exportController
onBeforeUnmount(() => exportController?.abort())
watch([() => props.token, () => props.filters, details], () => {
  exportController?.abort()
  busy.value = false
  error.value = notice.value = ''
})
async function download() {
  if (busy.value || props.disabled || invalidRange.value) return
  const controller = new AbortController()
  exportController = controller
  busy.value = true
  error.value = notice.value = ''
  try {
    const result = await exportCatchGpx(
      { ...props.filters, details: details.value },
      props.token,
      controller.signal,
    )
    if (controller.signal.aborted) return
    if (result.exported) {
      const url = URL.createObjectURL(result.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = result.filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
    notice.value = result.exported
      ? `Download started: ${result.exported} catch locations exported. ${result.skipped} catches skipped without usable coordinates.`
      : `No locations to export. ${result.skipped} catches matched the filters but had no usable coordinates.`
  } catch (failure) {
    if (!controller.signal.aborted) error.value = failure.message
  } finally {
    if (!controller.signal.aborted) busy.value = false
  }
}
</script>

<template>
  <form class="export-form" @submit.prevent="download">
    <details class="export-options">
      <summary>GPX options</summary>
      <label class="checkbox">
        <input v-model="details" type="checkbox" :disabled="busy" />
        Include catch details in GPX
      </label>
    </details>
    <AppButton type="submit" :disabled="busy || disabled || invalidRange">{{
      busy ? 'Preparing export…' : 'Download GPX'
    }}</AppButton>
    <p v-if="error" class="error-message" role="alert">{{ error }}</p>
    <p v-if="notice" class="hint" role="status">{{ notice }}</p>
  </form>
</template>

<style scoped>
.export-form {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
}
.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}
.hint {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}
.export-options summary {
  cursor: pointer;
  font-size: 12px;
  color: var(--muted);
}
.export-options .checkbox {
  position: absolute;
  z-index: 5;
  top: calc(100% + 8px);
  right: 0;
  width: max-content;
  max-width: min(300px, 80vw);
  padding: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-control);
  box-shadow: 0 3px 12px #192b431a;
}
.export-form > p {
  position: absolute;
  z-index: 5;
  top: calc(100% + 8px);
  right: 0;
  width: min(340px, 80vw);
  padding: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-control);
}
@media (max-width: 480px) {
  .export-form {
    gap: 6px;
  }
  .export-options summary {
    max-width: 50px;
  }
}
</style>
