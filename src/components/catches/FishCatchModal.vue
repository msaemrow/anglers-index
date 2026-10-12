<script setup>
import { EVENTS } from '@/constants'
import { ref } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import FishCatchForm from './FishCatchForm.vue'
defineProps({
  user: { type: Object, required: true },
  token: { type: String, required: true },
  initialValues: { type: Object, default: () => ({}) },
  choices: { type: Object, default: null },
})
const emit = defineEmits([EVENTS.CLOSE, EVENTS.SAVED])
const busy = ref(false)
</script>
<template>
  <AppModal title="Log a catch" compact :busy="busy" @[EVENTS.CLOSE]="emit(EVENTS.CLOSE)">
    <FishCatchForm
      :initial-values="initialValues"
      :choices="choices"
      :user="user"
      :token="token"
      @[EVENTS.BUSY]="busy = $event"
      @[EVENTS.CLOSE]="emit(EVENTS.CLOSE)"
      @[EVENTS.SAVED]="emit(EVENTS.SAVED, $event)"
    />
  </AppModal>
</template>
