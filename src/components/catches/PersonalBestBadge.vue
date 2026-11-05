<script setup>
import { Medal } from '@lucide/vue'
defineProps({ active: { type: Boolean, default: false } })
</script>

<template>
  <span v-if="active" class="personal-best"
    ><Medal :size="16" aria-hidden="true" />Personal best</span
  >
</template>

<style scoped>
.personal-best {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #286342;
  background: #eaf5ee;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
}
</style>
