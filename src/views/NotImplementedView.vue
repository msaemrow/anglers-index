<script setup>
import { useRoute } from 'vue-router'
import AppNavbar from '@/components/AppNavbar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ContentPanel from '@/components/ui/ContentPanel.vue'
import { useSession } from '@/composables/useSession'

const route = useRoute()
const { user, signOut } = useSession()
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <AppNavbar :user="user" @sign-out="signOut" />
  <main id="main-content" class="list-page">
    <ContentPanel
      title="Route has not been implemented"
      description="This page is still being built."
    >
      <p class="route-path">{{ route.path }}</p>
      <AppButton to="/dashboard" variant="secondary">Back to dashboard</AppButton>
    </ContentPanel>
  </main>
</template>

<style scoped>
.route-path {
  margin-bottom: 24px;
  color: var(--muted);
  overflow-wrap: anywhere;
}
</style>
