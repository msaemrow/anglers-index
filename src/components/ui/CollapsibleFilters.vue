<script setup>
import { ref, useId } from 'vue'
import { ChevronDown, ChevronUp, SlidersHorizontal } from '@lucide/vue'
import AppButton from './AppButton.vue'

defineProps({
  activeCount: { type: Number, default: 0 },
})

const open = ref(false)
const bodyId = useId()
</script>

<template>
  <div class="collapsible-filters">
    <AppButton
      class="filters-toggle"
      variant="secondary"
      :aria-expanded="open"
      :aria-controls="bodyId"
      @click="open = !open"
    >
      <SlidersHorizontal :size="16" aria-hidden="true" />
      Filters{{ activeCount ? ` (${activeCount})` : '' }}
      <ChevronUp v-if="open" :size="16" aria-hidden="true" />
      <ChevronDown v-else :size="16" aria-hidden="true" />
    </AppButton>
    <div :id="bodyId" class="filters-body" :class="{ 'filters-body--open': open }">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.collapsible-filters,
.filters-body {
  display: contents;
}
.filters-toggle {
  display: none;
}
@media (max-width: 800px) {
  .filters-toggle {
    display: flex;
    width: fit-content;
    margin: 0 0 12px auto;
    align-self: flex-end;
  }
  .filters-body:not(.filters-body--open) {
    display: none;
  }
}
</style>
