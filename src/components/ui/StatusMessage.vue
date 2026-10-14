<script setup>
defineProps({
  as: { type: String, default: 'p' },
  variant: { type: String, default: 'empty' },
})
</script>

<template>
  <component
    :is="as"
    :class="{
      'empty-message': variant === 'empty',
      'loading-state': variant === 'loading',
      'catch-notice': variant === 'success',
    }"
    ><slot
  /></component>
</template>

<style scoped>
.empty-message {
  padding: 25px 18px;
  border-radius: 9px;
  background: var(--surface-subtle);
  color: var(--muted);
  font-size: 13px;
  line-height: 1.7;
}
.loading-state {
  padding: 24px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-panel);
  font-size: 13px;
  color: var(--muted);
}

.catch-notice {
  color: var(--success-text);
  background: var(--success-background);
  border: 1px solid var(--success-border);
  border-radius: var(--radius-control);
  padding: 12px 16px;
  font-size: 13px;
}
</style>
