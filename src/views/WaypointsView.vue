<script setup>
import { ref } from 'vue'
import AppNavbar from '@/components/AppNavbar.vue'
import CatchLocationExport from '@/components/catches/CatchLocationExport.vue'
import PageLayout from '@/components/ui/PageLayout.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import SignInPanel from '@/components/SignInPanel.vue'
import { useSession } from '@/composables/useSession'
import CatchWaypointMap from '@/components/maps/CatchWaypointMap.vue'

const { user, token, signingIn, signIn, signOut, sessionError } = useSession()
const loginError = ref('')
async function handleSignIn(credentials) {
  loginError.value = ''
  try {
    await signIn(credentials)
  } catch (failure) {
    if (failure.name !== 'AbortError') loginError.value = failure.message
  }
}
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <AppNavbar :user="user" :session-error="sessionError" @sign-out="signOut" />
  <PageLayout v-if="user" id="main-content" class="waypoints-page header-page">
    <CatchWaypointMap :token="token" :username="user.username">
      <template #header="{ filters, disabled }">
        <PageHeader title="Waypoints">
          <CatchLocationExport :token="token" :filters="filters" :disabled="disabled" />
        </PageHeader>
      </template>
    </CatchWaypointMap>
  </PageLayout>
  <PageLayout v-else id="main-content" variant="sign-in">
    <SignInPanel :busy="signingIn" :error="loginError" @submit="handleSignIn" />
  </PageLayout>
</template>

<style scoped>
.waypoints-page {
  gap: 12px;
}
.waypoints-page :deep(.page-header) {
  flex-wrap: nowrap;
}
.waypoints-page :deep(.page-actions) {
  margin-left: auto;
}
</style>
