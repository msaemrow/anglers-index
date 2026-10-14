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
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 39px;
  padding: 9px 13px;
  border: 1px solid transparent;
  border-radius: var(--radius-control);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}
.button--primary {
  color: var(--surface);
  background: var(--blue);
  border-color: var(--blue);
}
.button--primary:hover {
  background: var(--primary-hover);
}
.button--secondary {
  color: var(--blue);
  background: var(--secondary-background);
  border-color: var(--secondary-border);
}
.button--secondary:hover {
  background: var(--secondary-hover);
}

.button:not(:disabled) {
  cursor: pointer;
}
.button--link {
  min-height: 32px;
  padding: 4px 6px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--blue);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.button--link:not(:disabled):hover {
  color: var(--navy);
}
.button--link:focus-visible {
  outline: 2px solid var(--blue);
  outline-offset: 2px;
}
.button--danger {
  background: var(--danger);
  border-color: var(--danger);
  color: var(--surface);
}
.button--danger:not(:disabled):hover {
  background: var(--danger-hover);
  border-color: var(--danger-hover);
}
.button--navy {
  background: #082f6b;
  border-color: #082f6b;
  color: var(--surface);
}
.button--navy:disabled {
  background: #163b68;
  border-color: #163b68;
  color: var(--surface);
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
