<script setup>
import { reactive, ref, onBeforeUnmount } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { addSpecies } from '@/api/species'
const props = defineProps({ token: { type: String, required: true } })
const emit = defineEmits(['close', 'saved', 'expired'])
const form = reactive({ name: '', master_angler_length: '' })
const busy = ref(false)
const error = ref('')
const controller = new AbortController()
onBeforeUnmount(() => controller.abort())
async function submit() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const species = await addSpecies(form, props.token, controller.signal)
    if (!controller.signal.aborted) emit('saved', species)
  } catch (failure) {
    if (controller.signal.aborted) return
    if (failure.status === 401) emit('expired')
    else
      error.value =
        failure.status === 400
          ? failure.message
          : failure.status === 403
            ? 'You don’t have permission to add species.'
            : 'Unable to save this species. Please try again.'
  } finally {
    if (!controller.signal.aborted) busy.value = false
  }
}
</script>
<template>
  <AppModal title="Add species" :busy="busy" @close="emit('close')">
    <form @submit.prevent="submit">
      <label class="field"
        >Species name<input v-model="form.name" name="name" required :disabled="busy"
      /></label>
      <label class="field"
        >Master Angler length (inches)<input
          v-model="form.master_angler_length"
          name="master_angler_length"
          type="number"
          min="0.01"
          step="any"
          required
          :disabled="busy"
      /></label>
      <p v-if="error" class="error-message" role="alert">{{ error }}</p>
      <div class="actions">
        <AppButton variant="secondary" :disabled="busy" @click="emit('close')">Cancel</AppButton
        ><AppButton type="submit" :disabled="busy">{{
          busy ? 'Saving…' : 'Save species'
        }}</AppButton>
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
