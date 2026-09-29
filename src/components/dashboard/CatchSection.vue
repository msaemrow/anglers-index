<script setup>
import ContentPanel from '@/components/ui/ContentPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import CatchCard from './CatchCard.vue'

defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  catches: { type: Array, required: true },
  username: { type: String, required: true },
  viewAll: { type: String, default: undefined },
  viewAllTo: { type: [String, Object], default: undefined },
  emptyMessage: { type: String, required: true },
})
</script>

<template>
  <ContentPanel :title="title" :description="description">
    <template #action
      ><AppButton v-if="catches.length" :href="viewAll" :to="viewAllTo" variant="secondary"
        >View all</AppButton
      ></template
    >
    <div v-if="catches.length" class="catch-grid">
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
