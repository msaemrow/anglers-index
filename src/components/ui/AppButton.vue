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
