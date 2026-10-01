<script setup>
import { computed, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Plus, RefreshCw } from '@lucide/vue'
import AppNavbar from '@/components/AppNavbar.vue'
import SignInPanel from '@/components/SignInPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ContentPanel from '@/components/ui/ContentPanel.vue'
import DataTable from '@/components/ui/DataTable.vue'
import LureEditor from '@/components/lures/LureEditor.vue'
import TackleButton from '@/components/lures/TackleButton.vue'
import { useLurePage } from '@/composables/useLurePage'
const {
  user,
  token,
  signingIn,
  lures,
  loading,
  error,
  loginError,
  attempt,
  tackleIds,
  tackleError,
  tackleReady,
  pending,
  notice,
  actionError,
  editor,
  toggle,
  saved,
  expired,
  handleSignIn,
  handleSignOut,
} = useLurePage()
const search = ref('')
const filters = reactive({ brand: '', color: '', size: '' })
const options = computed(() =>
  Object.fromEntries(
    Object.keys(filters).map((field) => [
      field,
      [...new Set(lures.value.map((lure) => lure[field]).filter(Boolean))].sort(),
    ]),
  ),
)
const rows = computed(() =>
  lures.value.filter(
    (lure) =>
      Object.entries(filters).every(([field, value]) => !value || lure[field] === value) &&
      (!search.value.trim() ||
        [lure.name, lure.brand, lure.color, lure.size].some((value) =>
          value?.toLowerCase().includes(search.value.trim().toLowerCase()),
        )),
  ),
)
const hasFilters = computed(() => search.value || Object.values(filters).some(Boolean))
const columns = [
  { key: 'brand', label: 'Brand' },
  { key: 'name', label: 'Lure' },
  { key: 'color', label: 'Color' },
  { key: 'size', label: 'Size' },
  { key: 'tackle', label: 'My tackle box', sortable: false },
  { key: 'actions', label: 'Actions', sortable: false },
]
function clearFilters() {
  search.value = ''
  Object.keys(filters).forEach((key) => {
    filters[key] = ''
  })
}
</script>
<template>
  <a class="skip-link" href="#main-content">Skip to content</a
  ><AppNavbar :user="user" @sign-out="handleSignOut" />
  <main v-if="user" id="main-content" class="list-page compact-list" :aria-busy="loading">
    <header class="page-header">
      <div>
        <h1>
          Lure database
          <span v-if="!loading && !error" class="directory-count">{{
            lures.length.toLocaleString()
          }}</span>
        </h1>
      </div>
      <div class="actions">
        <AppButton variant="secondary" :disabled="loading || pending.size > 0" @click="attempt++"
          ><RefreshCw :size="15" aria-hidden="true" />Refresh</AppButton
        ><AppButton
          :to="{ name: 'tackle-box', params: { username: user.username } }"
          variant="secondary"
          >My tackle box</AppButton
        ><AppButton @click="editor = { lure: null, editing: false }"
          ><Plus :size="16" aria-hidden="true" />Add lure</AppButton
        >
      </div>
    </header>
    <div v-if="loading" class="loading-state" role="status">
      <span class="loading-line" aria-hidden="true" />
      <p>Loading lures…</p>
    </div>
    <ContentPanel v-else-if="error" title="Lures couldn’t load"
      ><p class="error-message" role="alert">{{ error }}</p>
      <AppButton @click="attempt++">Try again</AppButton></ContentPanel
    >
    <template v-else>
      <p v-if="tackleError" class="error-message" role="alert">{{ tackleError }}</p>
      <p v-if="actionError" class="error-message" role="alert">{{ actionError }}</p>
      <p v-if="notice" class="notice" role="status">{{ notice }}</p>
      <ContentPanel
        v-if="!lures.length"
        title="No lures yet"
        description="Add a lure to start building the collection."
      />
      <ContentPanel v-else title="All lures" hide-header>
        <div class="filters">
          <label class="search"
            >Search lures<input
              v-model="search"
              type="search"
              placeholder="Name, brand, color, or size" /></label
          ><label v-for="(_, field) in filters" :key="field"
            >{{ field
            }}<select v-model="filters[field]">
              <option value="">All {{ field === 'size' ? 'sizes' : field + 's' }}</option>
              <option v-for="value in options[field]" :key="value" :value="value">
                {{ value }}
              </option>
            </select></label
          ><AppButton v-if="hasFilters" variant="secondary" @click="clearFilters"
            >Clear filters</AppButton
          >
        </div>
        <DataTable
          v-if="rows.length"
          :rows="rows"
          :columns="columns"
          caption="Lure database"
          initial-sort="brand"
        >
          <template #cell-name="{ row }"
            ><RouterLink class="lure-link" :to="{ name: 'lure', params: { id: row.id } }">{{
              row.name || 'Unnamed lure'
            }}</RouterLink></template
          >
          <template #cell-tackle="{ row }"
            ><TackleButton
              :included="tackleIds.has(String(row.id))"
              :busy="pending.has(String(row.id))"
              :disabled="!tackleReady"
              :name="row.name"
              @click="toggle(row)"
          /></template>
          <template #cell-actions="{ row }"
            ><div class="actions">
              <AppButton variant="secondary" @click="editor = { lure: row, editing: false }"
                >Create similar</AppButton
              ><AppButton
                v-if="user.is_admin"
                variant="secondary"
                @click="editor = { lure: row, editing: true }"
                >Edit</AppButton
              >
            </div></template
          >
        </DataTable>
        <div v-else class="empty-message" role="status">
          <h3>No matching lures</h3>
          <p>Try another search or clear your filters.</p>
        </div>
      </ContentPanel>
    </template>
    <LureEditor
      v-if="editor"
      :lure="editor.lure"
      :editing="editor.editing"
      :token="token"
      @close="editor = null"
      @saved="saved"
      @expired="expired"
    />
  </main>
  <main v-else id="main-content" class="sign-in-layout">
    <SignInPanel :busy="signingIn" :error="loginError" @submit="handleSignIn" />
  </main>
</template>
<style scoped>
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.filters {
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 22px;
}
.filters label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  min-width: 130px;
}
.filters .search {
  flex: 1;
  min-width: min(100%, 230px);
}
.filters input,
.filters select {
  width: 100%;
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--navy);
  background: white;
  font-size: 13px;
  max-width: 100%;
}
.lure-link {
  font-weight: 600;
}
.lure-link:hover {
  text-decoration: underline;
}
.notice {
  color: #32634d;
  background: #edf7f0;
  border-radius: 8px;
  padding: 14px;
  font-size: 13px;
}
.empty-message p {
  margin-top: 8px;
}
@media (max-width: 800px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .filters {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
