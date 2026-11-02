<script setup>
import { EVENTS } from '@/constants'
import { computed, ref } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import FishCatchForm from './FishCatchForm.vue'
const props = defineProps({
  user: { type: Object, required: true },
  token: { type: String, required: true },
  initialValues: { type: Object, default: () => ({}) },
  choices: { type: Object, default: null },
  quickEntry: { type: Boolean, default: false },
})
const emit = defineEmits([EVENTS.CLOSE, EVENTS.SAVED])
const busy = ref(false)
const title = computed(() => {
  const species = props.quickEntry
    ? props.choices?.species.find(
        (item) => String(item.id) === String(props.initialValues.species_id),
      )
    : null
  return species?.name || 'Log a catch'
})
</script>
<template>
  <AppModal :title="title" compact :busy="busy" @[EVENTS.CLOSE]="emit(EVENTS.CLOSE)">
    <FishCatchForm
      :quick-entry="quickEntry"
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
