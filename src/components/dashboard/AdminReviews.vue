<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowUpRight } from '@lucide/vue'
import ContentPanel from '@/components/ui/ContentPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import DataTable from '@/components/ui/DataTable.vue'
import { getMasterAnglerReviews } from '@/api/masterAngler'
const props = defineProps({
  token: { type: String, required: true },
  username: { type: String, required: true },
})
const emit = defineEmits(['expired'])
const items = ref([])
const error = ref('')
const loading = ref(false)
const attempt = ref(0)
const columns = [
  { key: 'angler', label: 'Angler' },
  { key: 'species', label: 'Species' },
  { key: 'length', label: 'Length (in)', numeric: true, hideOnMobile: true },
  { key: 'action', label: '', sortable: false },
]
const rows = computed(() =>
  items.value.map((item) => ({
    ...item,
    angler: item.user?.username || `User #${item.user_id}`,
    species: item.catch?.species?.name,
    length: item.catch?.length,
  })),
)
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
      if (failure.status === 401) emit('expired')
      else error.value = failure.message
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
      <AppButton variant="secondary" :disabled="loading" @click="attempt++">Try again</AppButton>
    </div>
    <p v-if="loading" role="status">Loading reviews…</p>
    <template v-else>
      <DataTable
        v-if="rows.length"
        :rows="rows"
        :columns="columns"
        caption="Master Angler catches awaiting review"
      >
        <template #cell-action="{ row }"
          ><RouterLink
            class="review-link"
            :to="{ name: 'fish-catch', params: { username: props.username, id: row.catch_id } }"
            >Review catch <ArrowUpRight :size="16" aria-hidden="true" /></RouterLink
          ></template
        >
      </DataTable>
      <p v-else class="empty-message">No catches are waiting for review.</p>
    </template>
  </ContentPanel>
</template>

<style scoped>
.review-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #577394;
}
.review-link:hover {
  text-decoration: underline;
}
</style>
