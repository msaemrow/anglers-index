<script setup>
import ContentPanel from '@/components/ui/ContentPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import CatchCard from './CatchCard.vue'

defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  catches: { type: Array, required: true },
  username: { type: String, required: true },
  viewAllTo: { type: [String, Object], default: undefined },
  emptyMessage: { type: String, required: true },
})
</script>

<template>
  <ContentPanel class="catch-section" :title="title" :description="description">
    <template #action>
      <div class="catch-controls">
        <slot name="filters" />
        <AppButton v-if="catches.length" :to="viewAllTo" variant="secondary">View all</AppButton>
      </div>
    </template>
    <div v-if="catches.length" class="catch-grid" tabindex="0" role="region" :aria-label="title">
      <CatchCard
        v-for="fish in catches"
        :key="fish.id"
        :catch-data="fish"
        :to="{ name: 'fish-catch', params: { username, id: fish.id } }"
      />
    </div>
    <p v-else class="empty-message">{{ emptyMessage }}</p>
  </ContentPanel>
</template>

<style scoped>
.catch-section {
  padding-top: 16px;
}
.catch-section :deep(.panel__header) {
  margin-bottom: 12px;
  gap: 10px;
}
.catch-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.catch-controls :deep(.button) {
  min-height: 32px;
  padding: 5px 10px;
  font-size: 12px;
}
@media (pointer: coarse) {
  .catch-controls :deep(.button) {
    min-height: 44px;
  }
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
