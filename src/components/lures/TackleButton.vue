<script setup>
import { Check, Plus } from '@lucide/vue'
import IconButton from '@/components/ui/IconButton.vue'
import AppButton from '@/components/ui/AppButton.vue'
defineProps({
  addOnly: Boolean,
  compact: Boolean,
  included: Boolean,
  busy: Boolean,
  disabled: Boolean,
  name: { type: String, default: 'lure' },
})
defineEmits(['click'])
</script>
<template>
  <span
    v-if="addOnly && included"
    class="tackle-status"
    role="img"
    :aria-label="`${name} is in your tackle box`"
    :title="`${name} is in your tackle box`"
  >
    <Check :size="18" aria-hidden="true" />
  </span>
  <IconButton
    v-else-if="compact"
    :disabled="disabled || busy"
    :aria-pressed="included"
    :aria-busy="busy"
    @click="$emit('click', $event)"
    :label="
      busy
        ? 'Updating tackle box…'
        : included
          ? `${name} is in your tackle box. Remove from tackle box`
          : `Add ${name} to tackle box`
    "
  >
    <component :is="included ? Check : Plus" :size="18" aria-hidden="true" />
  </IconButton>
  <AppButton
    v-else
    variant="secondary"
    :disabled="disabled || busy"
    :aria-pressed="included"
    :aria-label="`${included ? 'Remove' : 'Add'} ${name} ${included ? 'from' : 'to'} tackle box`"
    @click="$emit('click', $event)"
    ><component :is="included ? Check : Plus" :size="14" aria-hidden="true" />{{
      busy ? 'Updating…' : included ? 'In tackle box' : 'Add to tackle box'
    }}</AppButton
  >
</template>

<style scoped>
.tackle-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: #28543f;
  vertical-align: middle;
}
</style>
