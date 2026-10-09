<script setup>
import AppSelect from '@/components/ui/AppSelect.vue'
import { ref, watch } from 'vue'
import { Plus } from '@lucide/vue'
import AppNavbar from '@/components/AppNavbar.vue'
import SignInPanel from '@/components/SignInPanel.vue'
import ProfileSidebar from '@/components/dashboard/ProfileSidebar.vue'
import CatchSection from '@/components/dashboard/CatchSection.vue'
import CatchChart from '@/components/dashboard/CatchChart.vue'
import AdminReviews from '@/components/dashboard/AdminReviews.vue'
import ContentPanel from '@/components/ui/ContentPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import FishCatchModal from '@/components/catches/FishCatchModal.vue'
import { useSession } from '@/composables/useSession'
import { getDashboard } from '@/api/dashboard'

const { token, user, signingIn, signIn, signOut } = useSession()
const data = ref(null)
const loading = ref(false)
const error = ref('')
const loginError = ref('')
const attempt = ref(0)
const catchModal = ref(false)
const catchNotice = ref('')
const catchFilter = ref('all')
watch(token, () => {
  catchModal.value = false
  catchNotice.value = ''
})
function catchSaved(item) {
  catchModal.value = false
  catchNotice.value = item.weather_warning ? `Catch saved. ${item.weather_warning}` : 'Catch saved.'
  attempt.value++
}
function catchExpired() {
  loginError.value = 'Your session has expired. Please sign in again.'
  signOut()
}

watch(
  [token, attempt],
  async ([currentToken], _, onCleanup) => {
    data.value = null
    error.value = ''
    loading.value = false
    if (!currentToken) return
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    loading.value = true
    try {
      const response = await getDashboard(currentToken, controller.signal)
      if (!controller.signal.aborted) data.value = response
    } catch (failure) {
      if (controller.signal.aborted) return
      if (failure.status === 401) {
        loginError.value = 'Your session has expired. Please sign in again.'
        signOut()
      } else error.value = 'We couldn’t load your dashboard. Please try again.'
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
  signOut()
}
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <AppNavbar :user="user" @sign-out="handleSignOut" />
  <div v-if="user" class="dashboard-layout">
    <ProfileSidebar :user="user" :stats="data?.stats" @add-catch="catchModal = true" />
    <main id="main-content" class="dashboard" :aria-busy="loading">
      <p v-if="catchNotice" role="status" class="catch-notice">{{ catchNotice }}</p>
      <h1 class="sr-only">Dashboard</h1>
      <div v-if="loading" role="status" class="loading-state">
        <span class="loading-line" aria-hidden="true" />
        <p>Loading your fishing journal…</p>
        <div class="skeleton-grid" aria-hidden="true">
          <div v-for="i in 3" :key="i" class="skeleton" />
        </div>
      </div>
      <ContentPanel v-else-if="error" title="Your dashboard couldn’t load"
        ><p role="alert" class="error-message">{{ error }}</p>
        <AppButton @click="attempt++">Try again</AppButton></ContentPanel
      >
      <template v-else-if="data">
        <ContentPanel
          v-if="data.stats.totalCatches === 0"
          title="Your fishing journal starts with one catch"
          description="Log a catch to start tracking your fishing trips, favorite lakes, and personal bests."
          ><AppButton @click="catchModal = true"
            ><Plus :size="16" aria-hidden="true" />Log your first catch</AppButton
          ></ContentPanel
        >
        <CatchSection
          v-if="data.stats.totalCatches > 0"
          title="Recent catches"
          :catches="
            catchFilter === 'all'
              ? data.recentCatches
              : catchFilter === 'eligible'
                ? data.recentEligible
                : data.recentMasterAngler
          "
          :username="user.username"
          :view-all-to="{
            name: 'fish-catches',
            params: { username: user.username },
            query:
              catchFilter === 'all'
                ? {}
                : { award: catchFilter === 'eligible' ? 'eligible' : 'approved' },
          }"
          :empty-message="
            catchFilter === 'all'
              ? 'No recent catches to display.'
              : catchFilter === 'eligible'
                ? 'No eligible catches awaiting review.'
                : 'No approved Master Angler catches yet.'
          "
        >
          <template #filters>
            <label class="catch-filter">
              <span class="sr-only">Show catches</span>
              <AppSelect size="compact" v-model="catchFilter">
                <option value="all">All catches</option>
                <option value="eligible">Eligible · awaiting review</option>
                <option value="master">Approved Master Angler catches</option>
              </AppSelect>
            </label>
          </template>
        </CatchSection>
        <CatchChart :user-id="user.user_id" :token="token" @expired="catchExpired" />
        <AdminReviews
          v-if="user.is_admin"
          :token="token"
          @expired="catchExpired"
          :username="user.username"
        />
      </template>
      <FishCatchModal
        v-if="catchModal"
        :user="user"
        :token="token"
        @close="catchModal = false"
        @saved="catchSaved"
        @expired="catchExpired"
      />
    </main>
  </div>
  <main v-else id="main-content" class="sign-in-layout">
    <SignInPanel :busy="signingIn" :error="loginError" @submit="handleSignIn" />
  </main>
</template>

<style scoped>
.catch-filter {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
</style>
