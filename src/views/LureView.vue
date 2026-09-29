<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { ArrowLeft, Copy, Pencil } from '@lucide/vue'
import AppNavbar from '@/components/AppNavbar.vue'
import SignInPanel from '@/components/SignInPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ContentPanel from '@/components/ui/ContentPanel.vue'
import DetailList from '@/components/ui/DetailList.vue'
import LureEditor from '@/components/lures/LureEditor.vue'
import TackleButton from '@/components/lures/TackleButton.vue'
import { useLurePage } from '@/composables/useLurePage'
const route = useRoute()
const {
  user,
  token,
  signingIn,
  lure,
  loading,
  error,
  missing,
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
} = useLurePage(computed(() => route.params.id))
const details = computed(() =>
  ['brand', 'name', 'color', 'size'].map((field) => ({
    label: field[0].toUpperCase() + field.slice(1),
    value: lure.value?.[field] || 'Not recorded',
  })),
)
</script>
<template>
  <a class="skip-link" href="#main-content">Skip to content</a
  ><AppNavbar :user="user" @sign-out="handleSignOut" />
  <main v-if="user" id="main-content" class="lure-page" :aria-busy="loading">
    <RouterLink to="/lure/all" class="back-link"
      ><ArrowLeft :size="16" aria-hidden="true" />All lures</RouterLink
    >
    <div v-if="loading" class="loading-state" role="status">
      <span class="loading-line" aria-hidden="true" />
      <p>Loading lure details…</p>
    </div>
    <ContentPanel
      v-else-if="missing"
      title="Lure not found"
      description="This lure may have been removed or the link may be incorrect."
    />
    <ContentPanel v-else-if="error" title="This lure couldn’t load"
      ><p class="error-message" role="alert">{{ error }}</p>
      <AppButton @click="attempt++">Try again</AppButton></ContentPanel
    >
    <template v-else-if="lure">
      <header class="page-header">
        <div>
          <p class="eyebrow">{{ lure.brand || 'Lure collection' }}</p>
          <h1>{{ lure.name || 'Unnamed lure' }}</h1>
          <p class="muted">{{ [lure.color, lure.size].filter(Boolean).join(' · ') }}</p>
        </div>
      </header>
      <p v-if="notice" class="notice" role="status">{{ notice }}</p>
      <p v-if="actionError" class="error-message" role="alert">{{ actionError }}</p>
      <div class="detail-grid">
        <ContentPanel title="Lure details"><DetailList :items="details" /></ContentPanel
        ><ContentPanel title="Your tackle box" description="Keep track of the lures you fish with.">
          <p v-if="tackleError" class="error-message" role="alert">
            {{ tackleError }} <AppButton variant="secondary" @click="attempt++">Refresh</AppButton>
          </p>
          <div class="actions">
            <TackleButton
              :included="tackleIds.has(String(lure.id))"
              :busy="pending.has(String(lure.id))"
              :disabled="!tackleReady"
              :name="lure.name"
              @click="toggle(lure)"
            /><AppButton variant="secondary" @click="editor = { lure, editing: false }"
              ><Copy :size="15" aria-hidden="true" />Create similar</AppButton
            ><AppButton
              v-if="user.is_admin"
              variant="secondary"
              @click="editor = { lure, editing: true }"
              ><Pencil :size="15" aria-hidden="true" />Edit lure</AppButton
            >
          </div>
        </ContentPanel>
      </div> </template
    ><LureEditor
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
.lure-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px clamp(20px, 4vw, 48px) 48px;
  display: flex;
  flex-direction: column;
  gap: 26px;
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  font-size: 12px;
  font-weight: 600;
  color: #577394;
}
.back-link:hover {
  text-decoration: underline;
}
h1 {
  overflow-wrap: anywhere;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.notice {
  color: #32634d;
  background: #edf7f0;
  padding: 14px;
  border-radius: 8px;
  font-size: 13px;
}
@media (max-width: 700px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
