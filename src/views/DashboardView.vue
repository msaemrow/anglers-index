<script setup>
import { computed, ref, watch } from 'vue'
import { RefreshCw, Plus } from '@lucide/vue'
import AppNavbar from '@/components/AppNavbar.vue'
import SignInPanel from '@/components/SignInPanel.vue'
import ProfileSidebar from '@/components/dashboard/ProfileSidebar.vue'
import CatchSection from '@/components/dashboard/CatchSection.vue'
import AdminReviews from '@/components/dashboard/AdminReviews.vue'
import ContentPanel from '@/components/ui/ContentPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useSession } from '@/composables/useSession'
import { getDashboard } from '@/api/dashboard'
import { legacyUrl } from '@/api/legacy'

const { token, user, signingIn, signIn, signOut } = useSession()
const data = ref(null)
const loading = ref(false)
const error = ref('')
const loginError = ref('')
const attempt = ref(0)
const userPath = computed(() => `/${encodeURIComponent(user.value?.username || '')}`)

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
    <ProfileSidebar :user="user" :stats="data?.stats" />
    <main id="main-content" class="dashboard" :aria-busy="loading">
      <header class="page-header">
        <div>
          <p class="eyebrow">Your fishing journal</p>
          <h1>Dashboard</h1>
          <p class="muted">Your latest catches and the ones worth celebrating.</p>
        </div>
        <AppButton variant="secondary" :disabled="loading" @click="attempt++"
          ><RefreshCw :size="15" aria-hidden="true" />Refresh</AppButton
        >
      </header>
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
          ><AppButton :href="legacyUrl(`${userPath}/fishcatch/new`)"
            ><Plus :size="16" aria-hidden="true" />Log your first catch</AppButton
          ></ContentPanel
        >
        <CatchSection
          v-else
          title="Recent catches"
          description="The latest entries in your journal."
          :catches="data.recentCatches"
          :username="user.username"
          :view-all-to="{ name: 'fish-catches', params: { username: user.username } }"
          empty-message="No recent catches to display."
        />
        <CatchSection
          title="Master Angler catches"
          description="The catches that stand out."
          :catches="data.recentMasterAngler"
          :username="user.username"
          :view-all="legacyUrl(`${userPath}/master-angler/all`)"
          empty-message="No Master Angler catches yet. Your next trip could change that."
        />
        <AdminReviews
          v-if="user.is_admin && data.pendingReviews"
          :reviews="data.pendingReviews"
          :username="user.username"
        />
      </template>
    </main>
  </div>
  <main v-else id="main-content" class="sign-in-layout">
    <SignInPanel :busy="signingIn" :error="loginError" @submit="handleSignIn" />
  </main>
</template>
