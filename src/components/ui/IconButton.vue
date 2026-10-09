<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  to: { type: [String, Object], default: undefined },
  label: { type: String, required: true },
  disabled: Boolean,
})
</script>

<template>
  <component
    :is="to ? RouterLink : 'button'"
    :to="to"
    :type="to ? undefined : 'button'"
    :disabled="to ? undefined : disabled"
    :aria-label="label"
    :title="label"
    class="icon-button"
  >
    <slot />
  </component>
</template>

<style scoped>
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #31556c;
  text-decoration: none;
  vertical-align: middle;
  cursor: pointer;
}
.icon-button:not(:disabled):hover {
  background: #eaf1f5;
  color: #123d58;
}
.icon-button:focus-visible {
  outline: 2px solid #2678cc;
  outline-offset: 2px;
}
.icon-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
