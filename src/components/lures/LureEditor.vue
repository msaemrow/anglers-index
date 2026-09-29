<script setup>
import { reactive, ref, onBeforeUnmount } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { saveLure } from '@/api/lures'
const props = defineProps({
  lure: { type: Object, default: null },
  editing: Boolean,
  token: { type: String, required: true },
})
const emit = defineEmits(['close', 'saved', 'expired'])
const fields = ['brand', 'name', 'color', 'size']
const form = reactive({
  ...Object.fromEntries(fields.map((field) => [field, props.lure?.[field] || ''])),
  add_to_tackle_box: true,
})
const busy = ref(false)
const error = ref('')
const controller = new AbortController()
onBeforeUnmount(() => controller.abort())
async function submit() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const lure = await saveLure(
      form,
      props.token,
      props.editing ? props.lure.id : undefined,
      controller.signal,
    )
    if (!controller.signal.aborted)
      emit('saved', { lure, added: !props.editing && form.add_to_tackle_box })
  } catch (failure) {
    if (controller.signal.aborted) return
    if (failure.status === 401) emit('expired')
    else
      error.value =
        failure.status === 400
          ? failure.message
          : failure.status === 403
            ? 'You don’t have permission to edit this lure.'
            : 'Unable to save this lure. Please try again.'
  } finally {
    if (!controller.signal.aborted) busy.value = false
  }
}
</script>

<template>
  <AppModal
    :title="editing ? 'Edit lure' : lure ? 'Create a similar lure' : 'Add a lure'"
    :busy="busy"
    @close="emit('close')"
  >
    <form @submit.prevent="submit">
      <p v-if="lure && !editing" class="hint">
        Change the color, size, or other details to create a new variation.
      </p>
      <label v-for="field in fields" :key="field" class="field"
        >{{ field }}<input v-model="form[field]" :name="field" required :disabled="busy"
      /></label>
      <label v-if="!editing" class="checkbox"
        ><input v-model="form.add_to_tackle_box" type="checkbox" :disabled="busy" />Add to my tackle
        box</label
      >
      <p v-if="error" class="error-message" role="alert">{{ error }}</p>
      <div class="actions">
        <AppButton variant="secondary" :disabled="busy" @click="emit('close')">Cancel</AppButton
        ><AppButton type="submit" :disabled="busy">{{ busy ? 'Saving…' : 'Save lure' }}</AppButton>
      </div>
    </form>
  </AppModal>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
  font-size: 13px;
  font-weight: 600;
  text-transform: capitalize;
}
.field input {
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 7px;
  color: var(--navy);
}
.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin: 20px 0;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}
.hint {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 18px;
}
</style>
