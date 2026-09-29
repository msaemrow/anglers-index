<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Plus, RefreshCw } from '@lucide/vue'
import AppNavbar from '@/components/AppNavbar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ContentPanel from '@/components/ui/ContentPanel.vue'
import DataTable from '@/components/ui/DataTable.vue'
import { useSession } from '@/composables/useSession'
import { getLakes } from '@/api/lakes'
import { legacyUrl } from '@/api/legacy'

const { user, signOut } = useSession()
const lakes = ref([])
const loading = ref(true)
const error = ref('')
const attempt = ref(0)
const search = ref('')
const state = ref('')
const states = computed(() =>
  [...new Set(lakes.value.map((lake) => lake.state).filter(Boolean))].sort(),
)
const rows = computed(() => {
  const query = search.value.trim().toLowerCase()
  return lakes.value.filter(
    (lake) =>
      (!state.value || lake.state === state.value) &&
      (!query ||
        [lake.name, lake.nearest_town, lake.county, lake.state].some((value) =>
          value?.toLowerCase().includes(query),
        )),
  )
})
const columns = [
  { key: 'name', label: 'Lake' },
  { key: 'nearest_town', label: 'Nearest town' },
  { key: 'county', label: 'County' },
  { key: 'state', label: 'State' },
  { key: 'actions', label: 'Details', sortable: false },
]
function clearFilters() {
  search.value = ''
  state.value = ''
}
watch(
  attempt,
  async (_, __, onCleanup) => {
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    loading.value = true
    error.value = ''
    try {
      const data = await getLakes(controller.signal)
      if (!controller.signal.aborted) lakes.value = data
    } catch {
      if (!controller.signal.aborted)
        error.value = 'We couldn’t load the lake directory. Please try again.'
    } finally {
      if (!controller.signal.aborted) loading.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <AppNavbar :user="user" @sign-out="signOut" />
  <main id="main-content" class="lakes-page" :aria-busy="loading">
    <header class="page-header">
      <div>
        <p class="eyebrow">Explore the water</p>
        <h1>Lakes</h1>
        <p class="muted">Find your next fishing spot and explore lake details.</p>
      </div>
      <div class="page-actions">
        <AppButton variant="secondary" :disabled="loading" @click="attempt++"
          ><RefreshCw :size="15" aria-hidden="true" />Refresh</AppButton
        ><AppButton v-if="user?.is_admin" :href="legacyUrl('/lakes/new')"
          ><Plus :size="16" aria-hidden="true" />Add lake</AppButton
        >
      </div>
    </header>
    <div v-if="loading" class="loading-state" role="status">
      <span class="loading-line" aria-hidden="true" />
      <p>Loading lakes…</p>
      <div class="skeleton-grid" aria-hidden="true">
        <div v-for="i in 3" :key="i" class="skeleton" />
      </div>
    </div>
    <ContentPanel v-else-if="error" title="The lake directory couldn’t load"
      ><p role="alert" class="error-message">{{ error }}</p>
      <AppButton @click="attempt++">Try again</AppButton></ContentPanel
    >
    <ContentPanel
      v-else-if="!lakes.length"
      title="No lakes yet"
      description="Lakes will appear here when added to the directory."
    />
    <ContentPanel
      v-else
      title="Lake directory"
      :description="`${lakes.length.toLocaleString()} lakes to explore. Open a lake to see its location and details.`"
    >
      <div class="toolbar">
        <label class="search"
          >Search lakes<input
            v-model="search"
            type="search"
            placeholder="Lake, town, county, or state"
        /></label>
        <label
          >State<select v-model="state">
            <option value="">All states</option>
            <option v-for="value in states" :key="value" :value="value">{{ value }}</option>
          </select></label
        >
        <AppButton v-if="search || state" variant="secondary" @click="clearFilters"
          >Clear filters</AppButton
        >
      </div>
      <DataTable
        v-if="rows.length"
        :rows="rows"
        :columns="columns"
        caption="Lake directory"
        initial-sort="name"
      >
        <template #cell-name="{ row }"
          ><RouterLink class="lake-link" :to="{ name: 'lake', params: { id: row.id } }">{{
            row.name || 'Unnamed lake'
          }}</RouterLink></template
        >
        <template #cell-actions="{ row }"
          ><RouterLink
            class="detail-link"
            :to="{ name: 'lake', params: { id: row.id } }"
            :aria-label="`View ${row.name || 'lake'} details`"
            >View lake →</RouterLink
          ></template
        >
      </DataTable>
      <div v-else class="empty-message" role="status">
        <h3>No matching lakes</h3>
        <p>Try another search or clear your filters.</p>
      </div>
    </ContentPanel>
  </main>
</template>

<style scoped>
.lakes-page {
  max-width: 1440px;
  margin: 0 auto;
  padding: 36px clamp(20px, 4vw, 48px) 48px;
  display: flex;
  flex-direction: column;
  gap: 25px;
}
.page-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 18px;
  margin-bottom: 22px;
}
.toolbar label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
}
.search {
  flex: 1;
  max-width: 440px;
  min-width: min(100%, 240px);
}
.toolbar input,
.toolbar select {
  width: 100%;
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--navy);
  background: white;
  font-size: 13px;
}
.lake-link {
  font-weight: 600;
}
.detail-link {
  color: #577394;
  font-size: 12px;
}
.lake-link:hover,
.detail-link:hover {
  text-decoration: underline;
}
.empty-message p {
  margin-top: 8px;
}
@media (max-width: 650px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .search {
    max-width: none;
  }
}
</style>
