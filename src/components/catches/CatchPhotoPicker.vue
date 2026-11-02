<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { isHeicPhoto, validateCatchPhoto } from '@/api/fishCatch'
const model = defineModel({ default: null })
defineProps({ disabled: Boolean })
const preview = ref('')
const error = ref('')
const input = ref(null)
watch(
  model,
  (file) => {
    if (preview.value) URL.revokeObjectURL(preview.value)
    preview.value = file && !isHeicPhoto(file) ? URL.createObjectURL(file) : ''
    if (!file && input.value) input.value.value = ''
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  if (preview.value) URL.revokeObjectURL(preview.value)
})
function select(event) {
  error.value = ''
  const file = event.target.files?.[0]
  if (!file) {
    model.value = null
    return
  }
  try {
    validateCatchPhoto(file)
    model.value = file
  } catch (failure) {
    error.value = failure.message
    model.value = null
    event.target.value = ''
  }
}
</script>
<template>
  <div class="photo-picker">
    <label
      >Catch photo<input
        ref="input"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        :disabled="disabled"
        @change="select"
    /></label>
    <p>JPEG, PNG, WebP, or HEIC, up to 10 MB. Required for Master Angler eligibility.</p>
    <p v-if="model && isHeicPhoto(model)">{{ model.name }} — preview available after saving.</p>
    <img v-if="preview" :src="preview" alt="Selected catch photo preview" />
    <p v-if="error" role="alert" class="error-message">{{ error }}</p>
  </div>
</template>
<style scoped>
.photo-picker {
  display: grid;
  gap: 8px;
}
label {
  display: grid;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}
input {
  max-width: 100%;
  font: inherit;
  color: var(--muted);
}
input::file-selector-button {
  min-height: 39px;
  margin-right: 12px;
  padding: 9px 13px;
  border: 1px solid var(--secondary-border);
  border-radius: var(--radius-control);
  background: var(--secondary-background);
  color: var(--blue);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  cursor: pointer;
}
input:not(:disabled)::file-selector-button:hover {
  background: var(--secondary-hover);
}
input:focus-visible {
  outline: 2px solid var(--blue);
  outline-offset: 3px;
  border-radius: var(--radius-control);
}
input:disabled {
  opacity: 0.6;
}
input:disabled::file-selector-button {
  cursor: not-allowed;
}
p {
  font-size: 12px;
  color: var(--muted);
  margin: 0;
}
img {
  max-width: 100%;
  max-height: 220px;
  object-fit: contain;
  border-radius: var(--radius-control);
}
</style>
