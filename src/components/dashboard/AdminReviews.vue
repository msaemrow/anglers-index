<script setup>
import StatusMessage from '@/components/ui/StatusMessage.vue'

import { LABELS } from '@/constants'

import { ref, watch } from 'vue'
import ContentPanel from '@/components/ui/ContentPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import CatchCard from './CatchCard.vue'
import CatchCardRow from './CatchCardRow.vue'
import { getMasterAnglerReviews } from '@/api/masterAngler'
const props = defineProps({
  token: { type: String, required: true },
  username: { type: String, required: true },
})
const items = ref([])
const error = ref('')
const loading = ref(false)
const attempt = ref(0)
watch(
  [() => props.token, attempt],
  async (_, __, onCleanup) => {
    const current = new AbortController()
    onCleanup(() => current.abort())
    loading.value = true
    error.value = ''
    try {
      const response = await getMasterAnglerReviews(props.token, current.signal)
      if (!current.signal.aborted) {
        items.value = response.items
      }
    } catch (failure) {
      if (current.signal.aborted) return
      error.value = failure.message
    } finally {
      if (!current.signal.aborted) loading.value = false
    }
  },
  { immediate: true },
)
</script>
<template>
  <ContentPanel
    title="Master Angler reviews"
    description="Review catch details and the attached photo before approving an award."
  >
    <div v-if="error">
      <p class="error-message" role="alert">{{ error }}</p>
      <AppButton variant="secondary" :disabled="loading" @click="attempt++">{{
        LABELS.TRY_AGAIN
      }}</AppButton>
    </div>
    <p v-if="loading" role="status">Loading reviews…</p>
    <template v-else-if="!error">
      <CatchCardRow v-if="items.length" title="Master Angler catches awaiting review">
        <CatchCard
          v-for="item in items"
          :key="item.id"
          :catch-data="{ ...item.catch, master_angler_status: item.status }"
          :angler="item.user?.username || `User #${item.user_id}`"
          :link-label="LABELS.REVIEW"
          :to="{ name: 'fish-catch', params: { username: props.username, id: item.catch_id } }"
        />
      </CatchCardRow>
      <StatusMessage as="p" variant="empty" v-else class="empty-message"
        >No catches are waiting for review.</StatusMessage
      >
    </template>
  </ContentPanel>
</template>
