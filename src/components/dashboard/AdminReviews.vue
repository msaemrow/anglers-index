<script setup>
import ContentPanel from '@/components/ui/ContentPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { legacyUrl } from '@/api/legacy'

defineProps({
  reviews: { type: Object, required: true },
  username: { type: String, required: true },
})
</script>

<template>
  <ContentPanel
    title="Admin tools"
    :description="`${reviews.total} pending Master Angler ${reviews.total === 1 ? 'review' : 'reviews'}`"
  >
    <template #action
      ><AppButton
        :href="legacyUrl(`/${encodeURIComponent(username)}/master-angler/manage`)"
        variant="secondary"
        >View all reviews</AppButton
      ></template
    >
    <div class="admin-actions">
      <AppButton :href="legacyUrl('/admin/users')" variant="secondary">Manage users</AppButton
      ><AppButton :href="legacyUrl('/admin/species')" variant="secondary">Manage species</AppButton>
    </div>
    <ul v-if="reviews.items.length" class="review-list">
      <li v-for="review in reviews.items" :key="review.id">
        <a :href="legacyUrl(`/${encodeURIComponent(username)}/master-angler/${review.catch_id}`)"
          ><span
            >Catch #{{ review.catch_id }}
            <small class="muted">· User #{{ review.user_id }}</small></span
          ><span class="status-badge">Pending review</span></a
        >
      </li>
    </ul>
    <p v-else class="empty-message">You’re all caught up. No submissions are waiting for review.</p>
  </ContentPanel>
</template>
