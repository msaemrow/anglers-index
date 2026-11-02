<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { currentPosition, isCurrentCatch } from '@/utils/geolocation'

const props = defineProps({
  modelValue: { type: Object, default: null },
  defaultEnabled: Boolean,
  datetime: { type: String, default: '' },
  disabled: Boolean,
})
const emit = defineEmits(['update:modelValue'])
const enabled = ref(!!props.modelValue)
const message = ref('')
const locating = ref(false)
const touched = ref(false)
const backdated = computed(() => !isCurrentCatch(props.datetime))
let controller
function cancel() {
  controller?.abort()
  controller = null
  locating.value = false
}
onBeforeUnmount(cancel)
async function locate() {
  if (props.disabled || backdated.value) return
  cancel()
  const current = new AbortController()
  controller = current
  locating.value = true
  message.value = ''
  try {
    const location = await currentPosition({ signal: current.signal })
    if (!current.signal.aborted) emit('update:modelValue', location)
  } catch {
    if (!current.signal.aborted)
      message.value = 'Location unavailable. You can still save this catch.'
  } finally {
    if (controller === current) {
      locating.value = false
      controller = null
    }
  }
}
function toggle() {
  touched.value = true
  cancel()
  message.value = ''
  if (!enabled.value) emit('update:modelValue', null)
  else locate()
}
watch(
  () => props.defaultEnabled,
  (value) => {
    if (touched.value) return
    enabled.value = value
    if (value) locate()
  },
  { immediate: true },
)
watch(
  () => props.datetime,
  () => {
    cancel()
    message.value = ''
    emit('update:modelValue', null)
    if (enabled.value) locate()
  },
)
watch(
  () => props.disabled,
  (value) => {
    if (value) cancel()
  },
)
</script>

<template>
  <section class="location-input" aria-label="Catch location">
    <label class="location-checkbox">
      <input v-model="enabled" type="checkbox" :disabled="disabled" @change="toggle" />
      Save location for this catch
    </label>
    <p v-if="enabled" class="hint" role="status">
      <template v-if="backdated"
        >For older catches, add the location from catch details after saving.</template
      >
      <template v-else-if="locating">Getting location…</template>
      <template v-else-if="message">{{ message }}</template>
      <template v-else-if="modelValue">Location captured.</template>
      <template v-else>Location not available. You can still save this catch.</template>
    </p>
  </section>
</template>

<style scoped>
.location-input {
  margin: 16px 0;
}
.location-checkbox {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
}
.hint {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
  margin: 8px 0;
}
</style>
