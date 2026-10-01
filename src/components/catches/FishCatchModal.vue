<script setup>
import { ref } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import FishCatchForm from './FishCatchForm.vue'
defineProps({
  user: { type: Object, required: true },
  token: { type: String, required: true },
  initialValues: { type: Object, default: () => ({}) },
  choices: { type: Object, default: null },
})
const emit = defineEmits(['close', 'saved', 'expired'])
const busy = ref(false)
</script>
<template>
  <AppModal title="Log a catch" compact :busy="busy" @close="emit('close')">
    <FishCatchForm
      :initial-values="initialValues"
      :choices="choices"
      :user="user"
      :token="token"
      @busy="busy = $event"
      @close="emit('close')"
      @saved="emit('saved', $event)"
      @expired="emit('expired')"
    />
  </AppModal>
</template>
