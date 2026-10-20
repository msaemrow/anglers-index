<script setup>
defineProps({ title: { type: String, required: true } })
</script>

<template>
  <div class="catch-grid" tabindex="0" role="region" :aria-label="title">
    <slot />
  </div>
</template>

<style scoped>
.catch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr));
  gap: 13px;
}

@media (max-width: 1300px) {
  .catch-grid {
    display: grid;
    grid-template-columns: none;
    grid-auto-flow: column;
    grid-auto-columns: clamp(200px, 22%, 260px);
    max-width: 100%;
    min-width: 0;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    padding: 4px 4px 12px;
    gap: 14px;
  }
  .catch-grid :deep(.catch-card) {
    scroll-snap-align: start;
  }
}
@media (max-width: 600px) {
  .catch-grid {
    grid-auto-columns: min(260px, 85%);
  }
}
</style>
