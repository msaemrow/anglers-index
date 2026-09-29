<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { X } from '@lucide/vue'
const props = defineProps({ title: { type: String, required: true }, busy: Boolean })
const emit = defineEmits(['close'])
const dialog = ref(null)
let previousFocus
function close() {
  if (!props.busy) emit('close')
}
onMounted(() => {
  previousFocus = document.activeElement
  dialog.value.showModal()
})
onBeforeUnmount(() => {
  dialog.value?.close()
  previousFocus?.focus()
})
</script>

<template>
  <Teleport to="body">
    <dialog ref="dialog" aria-labelledby="modal-title" @cancel.prevent="close">
      <header>
        <h2 id="modal-title">{{ title }}</h2>
        <button type="button" aria-label="Close dialog" :disabled="busy" @click="close">
          <X :size="20" />
        </button>
      </header>
      <slot />
    </dialog>
  </Teleport>
</template>

<style scoped>
dialog {
  width: min(520px, calc(100% - 32px));
  max-height: calc(100dvh - 48px);
  margin: auto;
  padding: 26px;
  border: 1px solid var(--border);
  border-radius: 14px;
  color: var(--navy);
  overflow-y: auto;
}
dialog::backdrop {
  background: #192b4370;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}
header button {
  display: grid;
  place-items: center;
  border: 0;
  background: #f1f5fa;
  color: var(--navy);
  border-radius: 6px;
  padding: 7px;
}
</style>
