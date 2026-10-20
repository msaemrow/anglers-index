<script setup>
import StatusMessage from '@/components/ui/StatusMessage.vue'

import ContentPanel from '@/components/ui/ContentPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import CatchCard from './CatchCard.vue'
import CatchCardRow from './CatchCardRow.vue'

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
    <CatchCardRow v-if="catches.length" :title="title">
      <CatchCard
        v-for="fish in catches"
        :key="fish.id"
        :catch-data="fish"
        :to="{ name: 'fish-catch', params: { username, id: fish.id } }"
      />
    </CatchCardRow>
    <StatusMessage as="p" variant="empty" v-else class="empty-message">{{
      emptyMessage
    }}</StatusMessage>
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
  min-width: 0;
  max-width: 100%;
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
</style>
