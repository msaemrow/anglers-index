<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Plus, RefreshCw, Trophy, Fish } from '@lucide/vue'
import AppNavbar from '@/components/AppNavbar.vue'
import SignInPanel from '@/components/SignInPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ContentPanel from '@/components/ui/ContentPanel.vue'
import DataTable from '@/components/ui/DataTable.vue'
import { useSession } from '@/composables/useSession'
import { getFishCatches } from '@/api/fishCatch'
import { legacyUrl } from '@/api/legacy'

const { token, user, signingIn, signIn, signOut } = useSession()
const catches = ref([])
const loading = ref(false)
const error = ref('')
const loginError = ref('')
const attempt = ref(0)
const search = ref('')
const eligibleOnly = ref(false)
const columns = [
  { key: 'date', label: 'Date' },
  { key: 'species', label: 'Species' },
  { key: 'lake', label: 'Lake' },
  { key: 'length', label: 'Length (in)', numeric: true },
  { key: 'weight', label: 'Weight (lb)', numeric: true },
  { key: 'actions', label: 'Details', sortable: false },
]
const rows = computed(() => {
  const query = search.value.trim().toLowerCase()
  return catches.value
    .filter(
      (fish) =>
        (!eligibleOnly.value || fish.master_angler) &&
        (!query ||
          [fish.species?.name, fish.lake?.name, fish.lure?.name, fish.date].some((value) =>
            value?.toLowerCase().includes(query),
          )),
    )
    .map((fish) => ({
      id: fish.id,
      date: fish.date,
      species: fish.species?.name || 'Unknown species',
      lake: fish.lake?.name || 'Unknown lake',
      length: fish.length,
      weight: fish.weight,
      eligible: fish.master_angler,
    }))
})
const eligibleCount = computed(() => catches.value.filter((fish) => fish.master_angler).length)
const lakeCount = computed(
  () => new Set(catches.value.map((fish) => fish.lake_id || fish.lake?.name).filter(Boolean)).size,
)
const addCatchUrl = computed(() =>
  legacyUrl(`/${encodeURIComponent(user.value?.username || '')}/fishcatch/new`),
)
function formatDate(value) {
  if (!value) return 'Not recorded'
  const date = new Date(`${value.slice(0, 10)}T12:00:00`)
  return Number.isNaN(date.getTime())
    ? 'Not recorded'
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
function clearFilters() {
  search.value = ''
  eligibleOnly.value = false
}

watch(
  [token, attempt],
  async ([currentToken], _, onCleanup) => {
    catches.value = []
    error.value = ''
    loading.value = false
    if (!currentToken) return
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    loading.value = true
    try {
      const data = await getFishCatches(user.value.user_id, currentToken, controller.signal)
      if (!controller.signal.aborted) catches.value = data
    } catch (failure) {
      if (controller.signal.aborted) return
      if (failure.status === 401) {
        loginError.value = 'Your session has expired. Please sign in again.'
        signOut()
      } else error.value = 'We couldn’t load your catches. Please try again.'
    } finally {
      if (!controller.signal.aborted) loading.value = false
    }
  },
  { immediate: true },
)

async function handleSignIn(credentials) {
  loginError.value = ''
  try {
    await signIn(credentials)
  } catch (failure) {
    if (failure.name !== 'AbortError')
      loginError.value =
        failure.status === 401
          ? 'Incorrect username or password.'
          : 'Unable to sign in. Check your connection and try again.'
  }
}
function handleSignOut() {
  loginError.value = ''
  clearFilters()
  signOut()
}
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <AppNavbar :user="user" @sign-out="handleSignOut" />
  <main v-if="user" id="main-content" class="catches-page" :aria-busy="loading">
    <header class="page-header">
      <div>
        <p class="eyebrow">Your fishing journal</p>
        <h1>All fish catches</h1>
        <p class="muted">Every catch, from your first fish to your personal best.</p>
      </div>
      <div class="page-actions">
        <AppButton variant="secondary" :disabled="loading" @click="attempt++"
          ><RefreshCw :size="15" aria-hidden="true" />Refresh</AppButton
        >
        <AppButton :href="addCatchUrl"><Plus :size="16" aria-hidden="true" />Log a catch</AppButton>
      </div>
    </header>
    <div v-if="loading" class="loading-state" role="status">
      <span class="loading-line" aria-hidden="true" />
      <p>Loading your catches…</p>
      <div class="skeleton-grid" aria-hidden="true">
        <div v-for="i in 3" :key="i" class="skeleton" />
      </div>
    </div>
    <ContentPanel v-else-if="error" title="Your catches couldn’t load"
      ><p role="alert" class="error-message">{{ error }}</p>
      <AppButton @click="attempt++">Try again</AppButton></ContentPanel
    >
    <template v-else>
      <dl class="summary">
        <div>
          <dt>Total catches</dt>
          <dd>{{ catches.length.toLocaleString() }}</dd>
        </div>
        <div>
          <dt>Master Angler eligible</dt>
          <dd>{{ eligibleCount.toLocaleString() }}</dd>
        </div>
        <div>
          <dt>Lakes fished</dt>
          <dd>{{ lakeCount.toLocaleString() }}</dd>
        </div>
      </dl>
      <ContentPanel
        v-if="!catches.length"
        title="Your catch log starts here"
        description="Log your first catch to start tracking your trips, favorite lakes, and personal bests."
        ><Fish class="empty-fish" :size="40" aria-hidden="true" /><AppButton :href="addCatchUrl"
          ><Plus :size="16" aria-hidden="true" />Log your first catch</AppButton
        ></ContentPanel
      >
      <ContentPanel
        v-else
        title="Catch log"
        description="Browse your catches or narrow down your journal."
      >
        <div class="toolbar">
          <label class="search"
            >Search catches<input
              v-model="search"
              type="search"
              placeholder="Species, lake, lure, or date"
          /></label>
          <label class="checkbox"
            ><input v-model="eligibleOnly" type="checkbox" /><Trophy
              :size="16"
              aria-hidden="true"
            />Master Angler eligible only</label
          >
          <AppButton v-if="search || eligibleOnly" variant="secondary" @click="clearFilters"
            >Clear filters</AppButton
          >
        </div>
        <p class="legend"><Trophy :size="14" aria-hidden="true" />Master Angler eligible</p>
        <DataTable
          v-if="rows.length"
          :rows="rows"
          :columns="columns"
          caption="Your fish catches"
          initial-sort="date"
          initial-direction="desc"
        >
          <template #cell-date="{ value }">{{ formatDate(value) }}</template>
          <template #cell-species="{ row }"
            ><RouterLink
              class="catch-link"
              :to="{ name: 'fish-catch', params: { username: user.username, id: row.id } }"
              >{{ row.species }}</RouterLink
            ><Trophy
              v-if="row.eligible"
              class="trophy-icon"
              :size="14"
              role="img"
              aria-label="Master Angler eligible"
          /></template>
          <template #cell-actions="{ row }"
            ><RouterLink
              class="detail-link"
              :to="{ name: 'fish-catch', params: { username: user.username, id: row.id } }"
              :aria-label="`View ${row.species} catch from ${formatDate(row.date)}`"
              >View catch →</RouterLink
            ></template
          >
        </DataTable>
        <div v-else class="empty-message" role="status">
          <h3>No matching catches</h3>
          <p>Try another search or clear your filters to see all catches.</p>
        </div>
      </ContentPanel>
    </template>
  </main>
  <main v-else id="main-content" class="sign-in-layout">
    <SignInPanel :busy="signingIn" :error="loginError" @submit="handleSignIn" />
  </main>
</template>

<style scoped>
.catches-page {
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
.summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}
.summary > div {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px 24px;
}
.summary dt {
  font-size: 12px;
  color: var(--muted);
}
.summary dd {
  font-size: 27px;
  font-weight: 650;
  margin: 9px 0 0;
  color: var(--blue);
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 20px;
  margin-bottom: 20px;
}
.search {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  flex: 1;
  max-width: 420px;
  min-width: min(100%, 240px);
}
.search input {
  width: 100%;
  padding: 11px 13px;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--navy);
  background: white;
  font-size: 13px;
}
.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 41px;
  font-size: 12px;
  color: var(--muted);
}
.checkbox input {
  width: 16px;
  height: 16px;
  accent-color: var(--blue);
}
.legend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--muted);
  margin-bottom: 14px;
}
.legend svg,
.trophy-icon {
  color: #a67c26;
}
.trophy-icon {
  margin-left: 8px;
  vertical-align: middle;
}
.catch-link {
  font-weight: 600;
}
.catch-link:hover,
.detail-link:hover {
  text-decoration: underline;
}
.detail-link {
  color: #577394;
  font-size: 12px;
}
.empty-fish {
  display: block;
  color: #7e95ae;
  margin-bottom: 20px;
}
.empty-message p {
  margin-top: 8px;
}
@media (max-width: 650px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .summary {
    gap: 10px;
  }
  .summary > div {
    padding: 16px 12px;
  }
  .summary dt {
    font-size: 11px;
  }
  .summary dd {
    font-size: 22px;
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
