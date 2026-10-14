<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  hideHeader: Boolean,
})
</script>

<template>
  <section class="panel" :aria-label="title">
    <header v-if="!hideHeader" class="panel__header">
      <div>
        <h2>{{ title }}</h2>
        <p v-if="description" class="muted panel__description">{{ description }}</p>
      </div>
      <slot name="action" />
    </header>
    <slot />
  </section>
</template>

<style scoped>
.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-panel);
  padding: var(--panel-padding);
  min-width: 0;
}
.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 22px;
}
.panel__description {
  font-size: 12px;
  margin-top: 7px;
  line-height: 1.7;
}
@media (max-width: 480px) {
  .panel {
    padding: 18px;
  }
}
</style>
