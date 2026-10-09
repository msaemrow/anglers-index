<script setup>
import { RouterLink } from 'vue-router'
defineProps({
  to: { type: [String, Object], default: undefined },
  href: { type: String, default: undefined },
  variant: { type: String, default: 'primary' },
  type: { type: String, default: 'button' },
  disabled: Boolean,
})
</script>

<template>
  <component
    :is="to ? RouterLink : href ? 'a' : 'button'"
    :to="to"
    :href="href"
    :type="to || href ? undefined : type"
    :disabled="to || href ? undefined : disabled"
    class="button"
    :class="`button--${variant}`"
  >
    <slot />
  </component>
</template>

<style scoped>
.button:not(:disabled) {
  cursor: pointer;
}
.button--danger {
  background: #a62936;
  border-color: #a62936;
  color: white;
}
.button--danger:not(:disabled):hover {
  background: #86212c;
  border-color: #86212c;
}
.button--navy {
  background: #082f6b;
  border-color: #082f6b;
  color: #fff;
}
.button--navy:disabled {
  background: #163b68;
  border-color: #163b68;
  color: #fff;
  opacity: 1;
  cursor: not-allowed;
}
@media (hover: hover) {
  .button--navy:not(:disabled):hover {
    background: #064591;
    border-color: #064591;
  }
}
.button--navy:not(:disabled):active {
  background: #05224f;
  border-color: #05224f;
}
.button--navy:focus-visible {
  outline: 3px solid #2678cc;
  outline-offset: 3px;
}
</style>
