<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { getLakes } from '@/api/lakes'
import { exportCatchGpx } from '@/api/catchExport'

const props = defineProps({ token: { type: String, required: true } })
const lakes = ref([])
const lakeId = ref('')
const from = ref('')
const to = ref('')
const details = ref(true)
const busy = ref(false)
const error = ref('')
const notice = ref('')
const lakesError = ref('')
const loadingLakes = ref(false)
const attempt = ref(0)
const invalidRange = computed(() => !!from.value && !!to.value && from.value > to.value)
let exportController
onBeforeUnmount(() => exportController?.abort())
watch(
  [() => props.token, attempt],
  async (_, __, onCleanup) => {
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    exportController?.abort()
    busy.value = false
    error.value = notice.value = lakesError.value = ''
    lakeId.value = ''
    lakes.value = []
    loadingLakes.value = true
    try {
      const data = await getLakes(controller.signal)
      if (!controller.signal.aborted)
        lakes.value = data.slice().sort((a, b) => a.name.localeCompare(b.name))
    } catch (failure) {
      if (!controller.signal.aborted) lakesError.value = failure.message
    } finally {
      if (!controller.signal.aborted) loadingLakes.value = false
    }
  },
  { immediate: true },
)
watch([lakeId, from, to, details], () => {
  error.value = notice.value = ''
})
async function download() {
  if (busy.value || invalidRange.value) return
  const controller = new AbortController()
  exportController = controller
  busy.value = true
  error.value = notice.value = ''
  try {
    const result = await exportCatchGpx(
      { lake_id: lakeId.value, from: from.value, to: to.value, details: details.value },
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
    <div class="filters">
      <label
        >Lake<AppSelect v-model="lakeId" :disabled="busy || loadingLakes"
          ><option value="">All lakes</option>
          <option v-for="lake in lakes" :key="lake.id" :value="lake.id">
            {{ [lake.name, lake.county, lake.state].filter(Boolean).join(' · ') }}
          </option></AppSelect
        ></label
      >
      <label>From<input v-model="from" type="date" :disabled="busy" /></label>
      <label>Through<input v-model="to" type="date" :disabled="busy" /></label>
    </div>
    <p v-if="lakesError" class="hint" role="status">
      Lake choices couldn’t load. You can still export all lakes. {{ lakesError }}
      <AppButton variant="secondary" :disabled="busy" @click="attempt++">Reload lakes</AppButton>
    </p>
    <label class="checkbox"
      ><input v-model="details" type="checkbox" :disabled="busy" />Include catch details (species,
      date, lake, measurements and lure)</label
    >
    <p class="hint">
      Leave dates blank to include all dates. Only your catches with saved coordinates are exported
      as GPX waypoints.
    </p>
    <p v-if="invalidRange" class="error-message" role="status">
      Choose an end date on or after the start date.
    </p>
    <AppButton type="submit" :disabled="busy || invalidRange">{{
      busy ? 'Preparing export…' : 'Download GPX'
    }}</AppButton>
    <p v-if="error" class="error-message" role="alert">{{ error }}</p>
    <p v-if="notice" class="hint" role="status">{{ notice }}</p>
  </form>
</template>

<style scoped>
.export-form {
  display: grid;
  gap: 16px;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.filters label {
  display: grid;
  gap: 5px;
  font-size: 13px;
  min-width: 0;
  flex: 1 1 160px;
}
.filters input {
  min-height: 40px;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-control);
  background: var(--surface);
  color: var(--navy);
  font: inherit;
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
.export-form > .button {
  justify-self: start;
}
@media (max-width: 650px) {
  .filters input {
    font-size: 16px;
  }
}
</style>
