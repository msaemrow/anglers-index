<script setup>
import CollapsibleFilters from '@/components/ui/CollapsibleFilters.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import PageLayout from '@/components/ui/PageLayout.vue'
import StatusMessage from '@/components/ui/StatusMessage.vue'

import { STATUS, LABELS, EVENTS } from '@/constants'

import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Plus, Trophy } from '@lucide/vue'
import AppNavbar from '@/components/AppNavbar.vue'
import SignInPanel from '@/components/SignInPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ContentPanel from '@/components/ui/ContentPanel.vue'
import DataTable from '@/components/ui/DataTable.vue'
import SpeciesEditor from '@/components/species/SpeciesEditor.vue'
import { useSession } from '@/composables/useSession'
import { getSpecies } from '@/api/species'

const { user, token, signingIn, signIn, signOut, sessionError: loginError } = useSession()
const species = ref([])
const loading = ref(false)
const error = ref('')
const notice = ref('')
const attempt = ref(0)
const search = ref('')
const catchFilter = ref('caught')
const editor = ref(false)
const caughtCount = computed(() => species.value.filter((item) => item.caught).length)
const rows = computed(() => {
  const query = search.value.trim().toLowerCase()
  return species.value
    .filter(
      (item) =>
        (catchFilter.value === 'all' ||
          (catchFilter.value === 'caught' ? item.caught : !item.caught)) &&
        (!query || item.name?.toLowerCase().includes(query)),
    )
    .map((item) => ({
      ...item,
      bestLength: item.personalBest?.length ?? null,
      bestDate: item.personalBest?.date ?? null,
    }))
})
const columns = [
  { key: 'name', label: 'Species' },
  { key: 'bestLength', label: 'PB (in)', numeric: true },
  { key: 'bestDate', label: 'Date caught' },
  { key: 'master_angler_count', label: 'MA catches', numeric: true },
  { key: 'master_angler_length', label: 'MA length (in)', numeric: true },
]
function clearFilters() {
  search.value = ''
  catchFilter.value = 'caught'
}
function formatDate(value) {
  if (!value) return '—'
  const date = new Date(String(value).slice(0, 10) + 'T00:00:00')
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
watch(token, () => {
  clearFilters()
  notice.value = ''
  editor.value = false
})
watch(
  [token, attempt],
  async ([currentToken], _, onCleanup) => {
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    species.value = []
    error.value = ''
    loading.value = false
    if (!currentToken || !user.value) return
    loading.value = true
    try {
      const data = await getSpecies(user.value.user_id, currentToken, controller.signal)
      if (!controller.signal.aborted) species.value = data
    } catch (failure) {
      if (controller.signal.aborted) return
      error.value = failure.message
    } finally {
      if (!controller.signal.aborted) loading.value = false
    }
  },
  { immediate: true },
)
function saved(item) {
  editor.value = false
  notice.value = `${item.name} added to the species directory.`
  attempt.value++
}
async function handleSignIn(credentials) {
  loginError.value = ''
  try {
    await signIn(credentials)
  } catch (failure) {
    if (failure.name !== 'AbortError') loginError.value = failure.message
  }
}
function handleSignOut() {
  loginError.value = ''
  signOut()
}
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <AppNavbar :user="user" :session-error="loginError" @[EVENTS.SIGN_OUT]="handleSignOut" />
  <PageLayout v-if="user" id="main-content" class="list-page compact-list" :aria-busy="loading">
    <PageHeader :compact="false" class="page-header"
      ><template #heading
        ><div>
          <h1>Species &amp; personal bests</h1>
        </div></template
      >
      <div class="page-actions">
        <AppButton v-if="user.is_admin" @click="editor = true"
          ><Plus :size="16" aria-hidden="true" />{{ LABELS.ADD_SPECIES }}</AppButton
        >
      </div>
    </PageHeader>
    <p v-if="notice" class="notice" role="status">{{ notice }}</p>
    <StatusMessage as="div" variant="loading" v-if="loading" class="loading-state" role="status">
      <span class="loading-line" aria-hidden="true" />
      <p>Loading species and personal bests…</p>
    </StatusMessage>
    <ContentPanel v-else-if="error" title="Species couldn’t load"
      ><p class="error-message" role="alert">{{ error }}</p>
      <AppButton @click="attempt++">{{ LABELS.TRY_AGAIN }}</AppButton></ContentPanel
    >
    <ContentPanel
      v-else-if="!species.length"
      title="No species yet"
      description="Species will appear here when added to the directory."
    />
    <template v-else>
      <div class="summary">
        <p>
          <strong>{{ caughtCount }}</strong> of {{ species.length }} species caught
        </p>
        <p class="legend">
          <Trophy :size="18" aria-hidden="true" />Gold border: Master Angler (MA) · Green border:
          caught
        </p>
      </div>
      <ContentPanel class="species-table" title="Species directory" hide-header>
        <DataTable
          :rows="rows"
          :mobile-row-class="
            (row) =>
              row.master_angler_count > 0
                ? 'species-master'
                : row.caught
                  ? 'species-caught'
                  : 'species-uncaught'
          "
          :columns="columns"
          caption="Species and personal bests"
          :mobile-row-to="
            (row) =>
              row.personalBest?.catchId
                ? {
                    name: 'fish-catch',
                    params: { username: user.username, id: row.personalBest.catchId },
                  }
                : undefined
          "
          mobile-title-key="name"
          initial-sort="name"
        >
          <template #filters>
            <CollapsibleFilters
              :active-count="[search, catchFilter !== 'caught'].filter(Boolean).length"
            >
              <div class="toolbar">
                <label class="search"
                  >Search species<input v-model="search" type="search" placeholder="Species name"
                /></label>
                <label
                  >Show species
                  <select v-model="catchFilter">
                    <option value="caught">Caught species</option>
                    <option value="all">All species</option>
                    <option value="uncaught">Uncaught species</option>
                  </select>
                </label>
                <AppButton
                  v-if="search || catchFilter !== 'caught'"
                  variant="secondary"
                  @click="clearFilters"
                  >Clear filters</AppButton
                >
              </div>
            </CollapsibleFilters>
          </template>
          <template #cell-name="{ row }"
            ><span class="species-name"
              ><Trophy
                v-if="row.master_angler_status === STATUS.APPROVED"
                class="trophy"
                :size="16"
                aria-label="Approved Master Angler"
                role="img"
              />{{ row.name }}</span
            ></template
          >
          <template #cell-bestLength="{ row, value }"
            ><RouterLink
              v-if="row.personalBest?.catchId && value != null"
              class="catch-link"
              :to="{
                name: 'fish-catch',
                params: { username: user.username, id: row.personalBest.catchId },
              }"
              :aria-label="`View your ${row.name} personal best: ${value} inches`"
              >{{ value }}</RouterLink
            ><span v-else>{{ value ?? '—' }}</span></template
          >
          <template #cell-bestDate="{ value }">{{ formatDate(value) }}</template>
        </DataTable>
        <StatusMessage
          as="div"
          variant="empty"
          v-if="!rows.length"
          class="empty-message"
          role="status"
        >
          <h3>No matching species</h3>
          <p>
            {{
              catchFilter === 'caught'
                ? 'No caught species match these filters. Clear the filters to explore the directory.'
                : 'Try another species name or clear your search.'
            }}
          </p>
        </StatusMessage>
      </ContentPanel>
    </template>
    <SpeciesEditor
      v-if="editor && user.is_admin"
      :token="token"
      @[EVENTS.CLOSE]="editor = false"
      @[EVENTS.SAVED]="saved"
    />
  </PageLayout>
  <PageLayout variant="sign-in" v-else id="main-content" class="sign-in-layout">
    <SignInPanel :busy="signingIn" :error="loginError" @[EVENTS.SUBMIT]="handleSignIn" />
  </PageLayout>
</template>
<style scoped>
:deep(.species-table th button) {
  white-space: normal;
  text-align: left;
}
:deep(.species-table th:nth-child(2)),
:deep(.species-table td:nth-child(2)),
:deep(.species-table th:nth-child(5)),
:deep(.species-table td:nth-child(5)) {
  width: 110px;
  max-width: 110px;
  padding-inline: 10px;
  white-space: normal;
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
  border-radius: var(--radius-control);
  color: var(--navy);
  background: var(--surface);
  font-size: 13px;
}
.lake-link {
  font-weight: 600;
}
.detail-link {
  color: var(--text-accent);
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
.summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 20px 24px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  font-size: 14px;
}
.summary strong {
  font-size: 24px;
}
.legend,
.species-name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.legend svg,
.trophy {
  color: #a77815;
}
.toolbar .checkbox {
  flex-direction: row;
  align-items: center;
  min-height: 42px;
}
.checkbox input {
  width: 16px;
  min-height: 16px;
}
.catch-link {
  font-weight: 600;
  text-decoration: underline;
}
.notice {
  color: #32634d;
  background: #edf7f0;
  border-radius: var(--radius-control);
  padding: 14px;
  font-size: 13px;
}
@media (max-width: 800px) {
  :deep(.data-card.species-caught) {
    border: 2px solid #39805a;
  }
  :deep(.data-card.species-master) {
    border: 2px solid #b8860b;
  }
  :deep(.data-card.species-uncaught) {
    border: 2px solid var(--border);
  }
}
</style>
