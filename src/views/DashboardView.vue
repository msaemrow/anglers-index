<script setup>
import PageLayout from '@/components/ui/PageLayout.vue'
import StatusMessage from '@/components/ui/StatusMessage.vue'

import { STATUS, LABELS, EVENTS } from '@/constants'

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

const { token, user, signingIn, signIn, signOut, sessionError: loginError } = useSession()
const data = ref(null)
const loading = ref(false)
const error = ref('')
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
      error.value = failure.message
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
  <AppNavbar :user="user" @[EVENTS.SIGN_OUT]="handleSignOut" />
  <div v-if="user" class="dashboard-layout">
    <ProfileSidebar :user="user" :stats="data?.stats" @[EVENTS.ADD_CATCH]="catchModal = true" />
    <main id="main-content" class="dashboard" :aria-busy="loading">
      <StatusMessage
        as="p"
        variant="success"
        v-if="catchNotice"
        role="status"
        class="catch-notice"
        >{{ catchNotice }}</StatusMessage
      >
      <h1 class="sr-only">Dashboard</h1>
      <StatusMessage as="div" variant="loading" v-if="loading" role="status" class="loading-state">
        <span class="loading-line" aria-hidden="true" />
        <p>Loading your fishing journal…</p>
        <div class="skeleton-grid" aria-hidden="true">
          <div v-for="i in 3" :key="i" class="skeleton" />
        </div>
      </StatusMessage>
      <ContentPanel v-else-if="error" title="Your dashboard couldn’t load"
        ><p role="alert" class="error-message">{{ error }}</p>
        <AppButton @click="attempt++">{{ LABELS.TRY_AGAIN }}</AppButton></ContentPanel
      >
      <template v-else-if="data">
        <ContentPanel
          v-if="data.stats.totalCatches === 0"
          title="Your fishing journal starts with one catch"
          description="Log a catch to start tracking your fishing trips, favorite lakes, and personal bests."
          ><AppButton @click="catchModal = true"
            ><Plus :size="16" aria-hidden="true" />{{ LABELS.LOG_FIRST_CATCH }}</AppButton
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
                : { award: catchFilter === 'eligible' ? 'eligible' : STATUS.APPROVED },
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
        <CatchChart :user-id="user.user_id" :token="token" />
        <AdminReviews v-if="user.is_admin" :token="token" :username="user.username" />
      </template>
      <FishCatchModal
        v-if="catchModal"
        :user="user"
        :token="token"
        @[EVENTS.CLOSE]="catchModal = false"
        @[EVENTS.SAVED]="catchSaved"
      />
    </main>
  </div>
  <PageLayout variant="sign-in" v-else id="main-content" class="sign-in-layout">
    <SignInPanel :busy="signingIn" :error="loginError" @[EVENTS.SUBMIT]="handleSignIn" />
  </PageLayout>
</template>

<style scoped>
.dashboard-layout {
  display: grid;
  grid-template-columns: 235px minmax(0, 1fr);
  min-height: calc(100dvh - var(--navbar-height));
}
.dashboard {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 36px clamp(20px, 3vw, 48px) 48px;
  display: flex;
  flex-direction: column;
  gap: var(--page-gap);
  min-width: 0;
}
.loading-line {
  display: block;
  height: 3px;
  border-radius: 4px;
  background: #6687ae;
  margin-bottom: 18px;
}
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 20px;
}
.skeleton {
  height: 180px;
  border-radius: 9px;
  background: linear-gradient(90deg, #f1f4f8, #e7edf4, #f1f4f8);
  background-size: 200% 100%;
  animation: shimmer 1.5s linear infinite;
}
@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}
@media (max-width: 800px) {
  .dashboard-layout {
    grid-template-columns: 1fr;
  }
  .dashboard {
    padding-top: 28px;
  }
}
@media (max-width: 480px) {
  .skeleton-grid {
    grid-template-columns: 1fr;
  }
  .skeleton:not(:first-child) {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
}

.catch-filter {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
</style>
