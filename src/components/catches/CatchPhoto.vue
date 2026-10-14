<script setup>
import { ref, watch } from 'vue'
import { getCatchPhoto } from '@/api/fishCatch'
const props = defineProps({
  catchId: { type: [Number, String], required: true },
  photoKey: String,
  token: { type: String, required: true },
  alt: { type: String, default: 'Catch photo' },
})
const src = ref('')
const loading = ref(false)
const error = ref('')
watch(
  [() => props.catchId, () => props.photoKey, () => props.token],
  async (_, __, onCleanup) => {
    const controller = new AbortController()
    let url
    onCleanup(() => {
      controller.abort()
      if (url) URL.revokeObjectURL(url)
    })
    src.value = ''
    error.value = ''
    loading.value = false
    if (!props.photoKey || props.photoKey.includes('stock-fish.jpg')) return
    if (!/^catches\/[0-9a-f-]{36}\.jpg$/.test(props.photoKey)) {
      error.value = 'Upload a new photo to replace the previous external image.'
      return
    }
    loading.value = true
    try {
      const blob = await getCatchPhoto(props.catchId, props.token, controller.signal)
      if (controller.signal.aborted) return
      url = URL.createObjectURL(blob)
      src.value = url
    } catch (failure) {
      if (!controller.signal.aborted) error.value = failure.message
    } finally {
      if (!controller.signal.aborted) loading.value = false
    }
  },
  { immediate: true },
)
</script>
<template>
  <div class="photo">
    <img :src="src || '/images/stock-fish.jpg'" :alt="src ? alt : 'No catch photo available'" />
    <p v-if="loading" role="status">Loading photo…</p>
    <p v-if="error" role="status">{{ error }}</p>
  </div>
</template>
<style scoped>
.photo {
  width: 100%;
}
img {
  display: block;
  width: 100%;
  max-height: 500px;
  object-fit: contain;
}
p {
  padding: 12px;
  font-size: 13px;
  color: var(--muted);
}
</style>
