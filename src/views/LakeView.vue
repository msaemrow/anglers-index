<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft, MapPin, ExternalLink, Pencil } from '@lucide/vue'
import AppNavbar from '@/components/AppNavbar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ContentPanel from '@/components/ui/ContentPanel.vue'
import DetailList from '@/components/ui/DetailList.vue'
import LakeMap from '@/components/maps/LakeMap.vue'
import { useSession } from '@/composables/useSession'
import { getLake, lakeCoordinates } from '@/api/lakes'
import { legacyUrl } from '@/api/legacy'

const route = useRoute()
const { user, signOut } = useSession()
const lake = ref(null)
const loading = ref(true)
const error = ref('')
const missing = ref(false)
const attempt = ref(0)
const coordinates = computed(() => lakeCoordinates(lake.value))
const location = computed(
  () =>
    [lake.value?.nearest_town, lake.value?.state].filter(Boolean).join(', ') ||
    'Location not recorded',
)
const details = computed(() => [
  { label: 'Nearest town', value: lake.value?.nearest_town || 'Not recorded' },
  { label: 'County', value: lake.value?.county || 'Not recorded' },
  { label: 'State', value: lake.value?.state || 'Not recorded' },
  {
    label: 'Latitude',
    value: coordinates.value ? coordinates.value[1].toFixed(5) : 'Not recorded',
  },
  {
    label: 'Longitude',
    value: coordinates.value ? coordinates.value[0].toFixed(5) : 'Not recorded',
  },
])
const mapUrl = computed(() =>
  coordinates.value
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${coordinates.value[1]},${coordinates.value[0]}`)}`
    : null,
)
watch(
  [() => route.params.id, attempt],
  async ([id], _, onCleanup) => {
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    lake.value = null
    loading.value = true
    error.value = ''
    missing.value = false
    try {
      const data = await getLake(id, controller.signal)
      if (!controller.signal.aborted) lake.value = data
    } catch (failure) {
      if (controller.signal.aborted) return
      if (failure.status === 404) missing.value = true
      else error.value = 'We couldn’t load this lake. Please try again.'
    } finally {
      if (!controller.signal.aborted) loading.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <AppNavbar :user="user" @sign-out="signOut" />
  <main id="main-content" class="lake-page" :aria-busy="loading">
    <RouterLink to="/lakes/all" class="back-link"
      ><ArrowLeft :size="16" aria-hidden="true" />All lakes</RouterLink
    >
    <div v-if="loading" class="loading-state" role="status">
      <span class="loading-line" aria-hidden="true" />
      <p>Loading lake details…</p>
      <div class="skeleton-grid" aria-hidden="true">
        <div v-for="i in 3" :key="i" class="skeleton" />
      </div>
    </div>
    <ContentPanel
      v-else-if="missing"
      title="Lake not found"
      description="This lake may have been removed or the link may be incorrect."
    />
    <ContentPanel v-else-if="error" title="This lake couldn’t load"
      ><p class="error-message" role="alert">{{ error }}</p>
      <AppButton @click="attempt++">Try again</AppButton></ContentPanel
    >
    <template v-else-if="lake">
      <header class="page-header">
        <div>
          <p class="eyebrow">Explore the water</p>
          <h1>{{ lake.name || 'Unnamed lake' }}</h1>
          <p class="location"><MapPin :size="16" aria-hidden="true" />{{ location }}</p>
        </div>
        <AppButton
          v-if="user?.is_admin"
          :href="legacyUrl(`/lakes/${lake.id}/edit`)"
          variant="secondary"
          ><Pencil :size="15" aria-hidden="true" />Edit lake</AppButton
        >
      </header>
      <div class="lake-grid">
        <ContentPanel title="Lake details"><DetailList :items="details" /></ContentPanel>
        <ContentPanel
          title="Lake location"
          description="Approximate location based on the saved coordinates. Some locations may mark the nearest town."
        >
          <LakeMap :key="lake.id" :lake="lake" />
          <a v-if="mapUrl" :href="mapUrl" target="_blank" rel="noopener noreferrer" class="map-link"
            >Open location in Google Maps<ExternalLink :size="14" aria-hidden="true" /><span
              class="sr-only"
            >
              (opens in a new tab)</span
            ></a
          >
        </ContentPanel>
      </div>
    </template>
  </main>
</template>

<style scoped>
.lake-page {
  max-width: 1320px;
  margin: 0 auto;
  padding: 30px clamp(20px, 4vw, 48px) 48px;
  display: flex;
  flex-direction: column;
  gap: 26px;
}
.back-link,
.map-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  font-size: 12px;
  font-weight: 600;
  color: #577394;
}
.back-link:hover,
.map-link:hover {
  text-decoration: underline;
}
h1 {
  overflow-wrap: anywhere;
}
.location {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 14px;
  color: var(--muted);
}
.location svg {
  flex-shrink: 0;
}
.lake-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.75fr) minmax(0, 1.5fr);
  align-items: start;
  gap: 24px;
}
.map-link {
  margin-top: 18px;
}
@media (max-width: 800px) {
  .lake-grid {
    grid-template-columns: 1fr;
  }
}
</style>
