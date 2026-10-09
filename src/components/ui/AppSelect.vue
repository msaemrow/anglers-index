<script setup>
import { ChevronDown } from '@lucide/vue'

defineOptions({ inheritAttrs: false })
defineProps({
  size: {
    type: String,
    default: 'regular',
    validator: (value) => ['compact', 'regular', 'large'].includes(value),
  },
})
const model = defineModel({ type: [String, Number], default: '' })
</script>

<template>
  <span class="app-select" :class="`app-select--${size}`">
    <select v-model="model" v-bind="$attrs">
      <slot />
    </select>
    <ChevronDown :size="15" class="chevron" aria-hidden="true" />
  </span>
</template>

<style scoped>
.app-select {
  position: relative;
  display: inline-grid;
  min-width: 0;
  max-width: 100%;
  vertical-align: middle;
}
.app-select select {
  appearance: none;
  width: 100%;
  min-width: 0;
  min-height: 40px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: white;
  color: var(--navy);
  font: inherit;
  font-size: 14px;
  text-overflow: ellipsis;
  cursor: pointer;
}
.app-select.app-select select {
  padding-right: 32px;
}
.app-select--compact select {
  min-height: 36px;
  padding-top: 6px;
  padding-bottom: 6px;
  font-size: 13px;
}
.app-select--large select {
  min-height: 48px;
  padding-top: 10px;
  padding-bottom: 10px;
  font-size: 16px;
}
.app-select select:disabled {
  background: #e8edf2;
  color: var(--muted);
  border-color: #c5ced7;
  cursor: not-allowed;
  opacity: 1;
  -webkit-text-fill-color: var(--muted);
}
.chevron {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--muted);
}
@media (forced-colors: active) {
  .app-select select {
    appearance: auto;
  }
  .chevron {
    display: none;
  }
}
</style>
