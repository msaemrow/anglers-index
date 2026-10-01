<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Trash2 } from '@lucide/vue'
import AppNavbar from '@/components/AppNavbar.vue'
import SignInPanel from '@/components/SignInPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ContentPanel from '@/components/ui/ContentPanel.vue'
import DataTable from '@/components/ui/DataTable.vue'
import { useSession } from '@/composables/useSession'
import { getTackleBox, setTackleMembership } from '@/api/lures'

const { user, token, signingIn, signIn, signOut } = useSession()
const lures = ref([])
const loading = ref(false)
const error = ref('')
const loginError = ref('')
const actionError = ref('')
const notice = ref('')
const attempt = ref(0)
const pending = ref(new Set())
const search = ref('')
const brand = ref('')
let currentController
const brands = computed(() =>
  [...new Set(lures.value.map((lure) => lure.brand).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  ),
)
const rows = computed(() =>
  lures.value.filter(
    (lure) =>
      (!brand.value || lure.brand === brand.value) &&
      [lure.brand, lure.name, lure.color, lure.size].some((value) =>
        String(value ?? '')
          .toLowerCase()
          .includes(search.value.trim().toLowerCase()),
      ),
  ),
)
const columns = [
  { key: 'brand', label: 'Brand' },
  { key: 'name', label: 'Name' },
  { key: 'color', label: 'Color' },
  { key: 'size', label: 'Size' },
  { key: 'remove', label: 'Remove', sortable: false },
]
function clearFilters() {
  search.value = ''
  brand.value = ''
}
function expired() {
  loginError.value = 'Your session has expired. Please sign in again.'
  signOut()
}
watch(
  [token, attempt],
  async ([currentToken], _, onCleanup) => {
    const controller = new AbortController()
    currentController = controller
    onCleanup(() => controller.abort())
    lures.value = []
    pending.value = new Set()
    error.value = actionError.value = notice.value = ''
    clearFilters()
    loading.value = false
    if (!currentToken || !user.value) return
    loading.value = true
    try {
      const result = await getTackleBox(user.value.user_id, currentToken, controller.signal)
      if (!controller.signal.aborted) lures.value = result
    } catch (failure) {
      if (controller.signal.aborted) return
      if (failure.status === 401) expired()
      else error.value = 'Unable to load your tackle box. Please try again.'
    } finally {
      if (!controller.signal.aborted) loading.value = false
    }
  },
  { immediate: true },
)
async function remove(lure) {
  const key = String(lure.id)
  if (!user.value || pending.value.has(key)) return
  const controller = currentController
  pending.value.add(key)
  actionError.value = notice.value = ''
  try {
    await setTackleMembership(user.value.user_id, lure.id, false, token.value, controller.signal)
    if (controller.signal.aborted) return
    lures.value = lures.value.filter((item) => String(item.id) !== key)
    notice.value = `${lure.name || 'Lure'} removed from your tackle box.`
  } catch (failure) {
    if (controller.signal.aborted) return
    if (failure.status === 401) expired()
    else actionError.value = 'Unable to remove this lure. Please try again.'
  } finally {
    if (!controller.signal.aborted) pending.value.delete(key)
  }
}
async function handleSignIn(credentials) {
  loginError.value = ''
  try {
    await signIn(credentials)
  } catch (failure) {
    if (failure.name !== 'AbortError')
      loginError.value =
        failure.status === 401
          ? 'Incorrect username or password.'
          : 'Unable to sign in. Please try again.'
  }
}
function handleSignOut() {
  loginError.value = ''
  signOut()
}
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <AppNavbar :user="user" @sign-out="handleSignOut" />
  <main v-if="user" id="main-content" class="list-page compact-list" :aria-busy="loading">
    <header class="page-header">
      <div>
        <h1>
          My tackle box
          <span v-if="!loading && !error" class="directory-count">{{
            lures.length.toLocaleString()
          }}</span>
        </h1>
      </div>
      <AppButton :to="{ name: 'lures' }">Browse lure database</AppButton>
    </header>
    <p v-if="notice" class="notice" role="status">{{ notice }}</p>
    <p v-if="actionError" class="error-message" role="alert">{{ actionError }}</p>
    <div v-if="loading" class="loading-state" role="status">
      <span class="loading-line" aria-hidden="true" />
      <p>Loading your tackle box…</p>
    </div>
    <ContentPanel v-else-if="error" title="We couldn’t load your tackle box">
      <p class="error-message" role="alert">{{ error }}</p>
      <AppButton @click="attempt++">Try again</AppButton>
    </ContentPanel>
    <ContentPanel
      v-else-if="!lures.length"
      title="Start building your tackle box"
      description="Find a lure in the database and add it to your collection."
    >
      <AppButton :to="{ name: 'lures' }">Explore lures</AppButton>
    </ContentPanel>
    <ContentPanel v-else :title="`Your lures (${lures.length.toLocaleString()})`" hide-header>
      <div class="filters">
        <label class="search"
          >Search your lures<input
            v-model="search"
            type="search"
            placeholder="Brand, name, color, or size"
        /></label>
        <label
          >Brand<select v-model="brand">
            <option value="">All brands</option>
            <option v-if="brand && !brands.includes(brand)" :value="brand">{{ brand }}</option>
            <option v-for="value in brands" :key="value" :value="value">{{ value }}</option>
          </select></label
        >
        <AppButton v-if="search || brand" variant="secondary" @click="clearFilters"
          >Clear search &amp; brand</AppButton
        >
      </div>
      <DataTable
        v-if="rows.length"
        :rows="rows"
        :columns="columns"
        caption="Tackle box lures"
        initial-sort="brand"
      >
        <template #cell-name="{ row }"
          ><RouterLink :to="{ name: 'lure', params: { id: row.id } }">{{
            row.name || 'Unnamed lure'
          }}</RouterLink></template
        >
        <template #cell-remove="{ row }"
          ><AppButton
            variant="secondary"
            :disabled="pending.has(String(row.id))"
            :aria-label="`Remove ${row.name || 'lure'} from tackle box`"
            @click="remove(row)"
            ><Trash2 :size="15" aria-hidden="true" />{{
              pending.has(String(row.id)) ? 'Removing…' : 'Remove'
            }}</AppButton
          ></template
        >
      </DataTable>
      <div v-else role="status">
        <h3>No matching lures</h3>
        <p>Try another search or clear your filters.</p>
      </div>
    </ContentPanel>
  </main>
  <main v-else id="main-content" class="sign-in-layout">
    <SignInPanel :busy="signingIn" :error="loginError" @submit="handleSignIn" />
  </main>
</template>

<style scoped>
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
  min-width: 150px;
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
}
.notice {
  color: #32634d;
  background: #edf7f0;
  border-radius: 8px;
  padding: 14px;
  font-size: 13px;
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
