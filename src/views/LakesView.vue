<script setup>
import PageLayout from '@/components/ui/PageLayout.vue'
import StatusMessage from '@/components/ui/StatusMessage.vue'

import { LABELS, EVENTS } from '@/constants'

import PageHeader from '@/components/ui/PageHeader.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Plus } from '@lucide/vue'
import AppNavbar from '@/components/AppNavbar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ContentPanel from '@/components/ui/ContentPanel.vue'
import DataTable from '@/components/ui/DataTable.vue'
import LakeEditor from '@/components/lakes/LakeEditor.vue'
import { useSession } from '@/composables/useSession'
import { getLakes } from '@/api/lakes'

const { user, token, signOut, sessionError } = useSession()
const editor = ref(null)
const notice = ref('')
watch(token, () => {
  editor.value = null
})
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
  { key: 'actions', label: '', sortable: false },
]
function saved(lake) {
  const editing = Boolean(editor.value?.lake)
  lakes.value = editing
    ? lakes.value.map((item) => (String(item.id) === String(lake.id) ? lake : item))
    : [...lakes.value, lake]
  editor.value = null
  clearFilters()
  notice.value = `${lake.name} ${editing ? 'updated' : 'added'}.`
}
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
    } catch (failure) {
      if (!controller.signal.aborted) error.value = failure.message
    } finally {
      if (!controller.signal.aborted) loading.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <AppNavbar :user="user" @[EVENTS.SIGN_OUT]="signOut" />
  <PageLayout id="main-content" class="list-page compact-list" :aria-busy="loading">
    <p v-if="notice" class="save-notice" role="status">{{ notice }}</p>
    <p v-if="sessionError" class="error-message" role="alert">
      {{ sessionError }} <RouterLink to="/dashboard">Go to dashboard</RouterLink>
    </p>
    <PageHeader
      title="Lakes"
      :count-text="
        !loading && !error
          ? `${lakes.length.toLocaleString()} ${lakes.length === 1 ? 'lake' : 'lakes'}`
          : ''
      "
    >
      <AppButton v-if="user?.is_admin" :disabled="loading" @click="editor = { lake: null }"
        ><Plus :size="16" aria-hidden="true" />{{ LABELS.ADD_LAKE }}</AppButton
      >
    </PageHeader>
    <StatusMessage as="div" variant="loading" v-if="loading" class="loading-state" role="status">
      <span class="loading-line" aria-hidden="true" />
      <p>Loading lakes…</p>
      <div class="skeleton-grid" aria-hidden="true">
        <div v-for="i in 3" :key="i" class="skeleton" />
      </div>
    </StatusMessage>
    <ContentPanel v-else-if="error" title="The lake directory couldn’t load"
      ><p role="alert" class="error-message">{{ error }}</p>
      <AppButton @click="attempt++">{{ LABELS.TRY_AGAIN }}</AppButton></ContentPanel
    >
    <ContentPanel
      v-else-if="!lakes.length"
      title="No lakes yet"
      description="Lakes will appear here when added to the directory."
    />
    <ContentPanel v-else title="Lake directory" hide-header>
      <div class="toolbar">
        <label class="search"
          >Search lakes<input
            v-model="search"
            type="search"
            placeholder="Lake, town, county, or state"
        /></label>
        <label
          >State<AppSelect size="compact" v-model="state">
            <option value="">All states</option>
            <option v-for="value in states" :key="value" :value="value">{{ value }}</option>
          </AppSelect></label
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
        <template #cell-actions="{ row }">
          <AppButton
            variant="link"
            :to="{ name: 'lake', params: { id: row.id } }"
            :aria-label="`View ${row.name || 'lake'} details`"
          >
            {{ LABELS.VIEW }}
          </AppButton>
          <AppButton
            variant="link"
            v-if="user?.is_admin"
            :aria-label="`Edit ${row.name || 'lake'}`"
            @click="editor = { lake: row }"
          >
            {{ LABELS.EDIT }}
          </AppButton>
        </template>
      </DataTable>
      <StatusMessage as="div" variant="empty" v-else class="empty-message" role="status">
        <h3>No matching lakes</h3>
        <p>Try another search or clear your filters.</p>
      </StatusMessage>
    </ContentPanel>
    <LakeEditor
      v-if="editor && user?.is_admin"
      :lake="editor.lake"
      :token="token"
      @[EVENTS.CLOSE]="editor = null"
      @[EVENTS.SAVED]="saved"
    />
  </PageLayout>
</template>

<style scoped>
.save-notice {
  color: var(--success-text);
  background: var(--success-background);
  border: 1px solid var(--success-border);
  border-radius: var(--radius-control);
  padding: 14px;
  font-size: 13px;
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
.toolbar input {
  width: 100%;
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-control);
  color: var(--navy);
  background: var(--surface);
  font-size: 13px;
}
.lake-link {
  font-weight: 600;
}
.lake-link:hover {
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
