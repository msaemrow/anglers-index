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

watch([() => props.catchId, () => props.photoKey, () => props.token], loadPhoto, {
  immediate: true,
})

async function loadPhoto(_, __, onCleanup) {
  src.value = ''
  error.value = ''
  loading.value = false

  // Older catches may store the default image path instead of an empty key.
  if (!props.photoKey || props.photoKey.includes('stock-fish.jpg')) return

  const controller = new AbortController()
  let photoUrl

  // Cancel outdated requests and release the temporary image URL on change or unmount.
  onCleanup(() => {
    controller.abort()
    if (photoUrl) URL.revokeObjectURL(photoUrl)
  })

  loading.value = true
  try {
    const photo = await getCatchPhoto(props.catchId, props.token, controller.signal)
    if (controller.signal.aborted) return

    photoUrl = URL.createObjectURL(photo)
    src.value = photoUrl
    // Keep the skeleton visible until the image's load event fires.
  } catch (failure) {
    if (controller.signal.aborted) return
    error.value = failure.message
    loading.value = false
  }
}

function handleImageError() {
  if (!src.value) return
  src.value = ''
  loading.value = false
  error.value = 'Unable to load catch photo.'
}
</script>
<template>
  <div class="photo" :aria-busy="loading">
    <div v-if="loading" class="photo-skeleton" role="status" aria-label="Loading photo…" />
    <img
      v-if="src || !loading"
      v-show="!loading"
      :key="src"
      :src="src || '/images/stock-fish.jpg'"
      :alt="src ? alt : 'No catch photo available'"
      @load="loading = false"
      @error="handleImageError"
    />
    <p v-if="error" role="status">{{ error }}</p>
  </div>
</template>
<style scoped>
.photo {
  width: 100%;
}
.photo-skeleton {
  width: 100%;
  aspect-ratio: 4 / 3;
  max-height: 500px;
  background: var(--surface-soft, #e5e7eb);
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  50% {
    opacity: 0.5;
  }
}
@media (prefers-reduced-motion: reduce) {
  .photo-skeleton {
    animation: none;
  }
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
