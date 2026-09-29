<script setup>
import { Check, Plus } from '@lucide/vue'
import AppButton from '@/components/ui/AppButton.vue'
defineProps({
  included: Boolean,
  busy: Boolean,
  disabled: Boolean,
  name: { type: String, default: 'lure' },
})
</script>
<template>
  <AppButton
    variant="secondary"
    :disabled="disabled || busy"
    :aria-pressed="included"
    :aria-label="`${included ? 'Remove' : 'Add'} ${name} ${included ? 'from' : 'to'} tackle box`"
    ><component :is="included ? Check : Plus" :size="14" aria-hidden="true" />{{
      busy ? 'Updating…' : included ? 'In tackle box' : 'Add to tackle box'
    }}</AppButton
  >
</template>
