<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppNavbar from '@/components/AppNavbar.vue'
import SignInPanel from '@/components/SignInPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ContentPanel from '@/components/ui/ContentPanel.vue'
import DataTable from '@/components/ui/DataTable.vue'
import DeleteTripModal from '@/components/trips/DeleteTripModal.vue'
import AttachCatchModal from '@/components/trips/AttachCatchModal.vue'
import FishCatchModal from '@/components/catches/FishCatchModal.vue'
import { getTrip } from '@/api/trips'
import { localDateTime } from '@/api/fishCatch'
import { useTripPage } from '@/composables/useTripPage'
import { formatDate, formatTime } from '@/utils/dateTime'
const route = useRoute()
const router = useRouter()
const {
  user,
  token,
  signingIn,
  signOut,
  data: trip,
  loading,
  error,
  loginError,
  attempt,
  expired,
  handleSignIn,
} = useTripPage((token, signal) => getTrip(route.params.id, token, signal), [() => route.params.id])
const editor = ref(''),
  notice = ref('')
watch([token, () => route.params.id], () => {
  editor.value = ''
  notice.value = ''
})
const rows = computed(() =>
  (trip.value?.catches || []).map((fish) => ({
    ...fish,
    speciesName: fish.species?.name || 'Unknown species',
  })),
)
const initialCatch = computed(() => {
  const today = localDateTime().slice(0, 10)
  const date =
    today < trip.value.start_date
      ? trip.value.start_date
      : today > trip.value.end_date
        ? trip.value.end_date
        : today
  return {
    trip_id: trip.value.id,
    lake_id: trip.value.lake_id,
    datetime: `${date}T${localDateTime().slice(11)}`,
  }
})
const columns = [
  { key: 'date', label: 'Date' },
  { key: 'time', label: 'Local time' },
  { key: 'speciesName', label: 'Species' },
  { key: 'length', label: 'Length (in)', numeric: true },
  { key: 'weight', label: 'Weight (lb)', numeric: true },
  { key: 'actions', label: 'Details', sortable: false },
]
function deleted() {
  const username = user.value.username
  try {
    const key = `anglers-index.active-trip.${username}`
    if (localStorage.getItem(key) === String(trip.value.id)) localStorage.removeItem(key)
  } catch {
    /* Storage is optional. */
  }
  editor.value = ''
  router.replace({ name: 'trips', params: { username }, query: { deleted: '1' } })
}
function saved(item) {
  editor.value = ''
  notice.value = item?.weather_warning ? `Saved. ${item.weather_warning}` : 'Trip updated.'
  attempt.value++
}
</script>
<template>
  <a class="skip-link" href="#main-content">Skip to content</a
  ><AppNavbar :user="user" @sign-out="signOut" />
  <main v-if="user" id="main-content" class="list-page trip-page" :aria-busy="loading">
    <RouterLink :to="{ name: 'trips', params: { username: user.username } }"
      >← Fishing trips</RouterLink
    >
    <p v-if="notice" role="status" class="catch-notice">{{ notice }}</p>
    <p v-if="loading" role="status">Loading fishing trip…</p>
    <ContentPanel v-else-if="error" title="Trip couldn’t load"
      ><p role="alert">{{ error }}</p>
      <AppButton @click="attempt++">Try again</AppButton></ContentPanel
    >
    <template v-else-if="trip">
      <header class="page-header">
        <div>
          <h1>{{ trip.lake?.name || 'Fishing trip' }}</h1>
          <p class="muted">
            {{ trip.status === 'active' ? 'Active trip' : 'Completed trip' }} ·
            {{ formatDate(trip.start_date) }}
          </p>
        </div>
        <div class="actions">
          <AppButton v-if="trip.status === 'active'" @click="editor = 'catch'"
            >Log a catch</AppButton
          >
          <AppButton variant="danger" @click="editor = 'delete'">Delete trip</AppButton>
        </div>
      </header>
      <ContentPanel title="Trip summary">
        <dl class="summary">
          <div>
            <dt>Lake</dt>
            <dd>
              {{
                [trip.lake?.name, trip.lake?.county, trip.lake?.state].filter(Boolean).join(' · ')
              }}
            </dd>
          </div>
          <div>
            <dt>Start date</dt>
            <dd>{{ formatDate(trip.start_date) }}</dd>
          </div>
          <div>
            <dt>End date</dt>
            <dd>{{ formatDate(trip.end_date) }}</dd>
          </div>
          <div>
            <dt>Catches</dt>
            <dd>{{ trip.catch_count }}</dd>
          </div>
          <div>
            <dt>Days</dt>
            <dd>{{ trip.day_count }}</dd>
          </div>
        </dl>
        <p class="muted">
          Trip dates include the entire day. A completed trip with no catches counts as a zero-catch
          outing.
        </p>
        <p v-if="trip.notes" class="notes">{{ trip.notes }}</p>
        <RouterLink
          v-if="trip.status === 'active'"
          :to="{ name: 'fish-mode', params: { username: user.username }, query: { trip: trip.id } }"
          >Continue in Fish Mode →</RouterLink
        >
      </ContentPanel>
      <ContentPanel :title="`Trip catches (${trip.catch_count})`">
        <template #action
          ><AppButton variant="secondary" @click="editor = 'attach'"
            >Add existing catch</AppButton
          ></template
        >
        <DataTable
          v-if="rows.length"
          :rows="rows"
          :columns="columns"
          caption="Catches on this fishing trip"
          initial-sort="date"
          initial-direction="desc"
          ><template #cell-date="{ value }">{{ formatDate(value) }}</template
          ><template #cell-time="{ value }">{{ formatTime(value) }}</template
          ><template #cell-actions="{ row }"
            ><RouterLink
              :to="{ name: 'fish-catch', params: { username: user.username, id: row.id } }"
              >View catch →</RouterLink
            ></template
          ></DataTable
        >
        <p v-else class="muted">No catches recorded for this trip.</p>
      </ContentPanel>
      <DeleteTripModal
        v-if="editor === 'delete'"
        :trip="trip"
        :token="token"
        @close="editor = ''"
        @deleted="deleted"
        @expired="expired"
      />
      <FishCatchModal
        v-if="editor === 'catch' && trip.status === 'active'"
        :token="token"
        :user="user"
        :initial-values="initialCatch"
        @close="editor = ''"
        @saved="saved"
        @expired="expired"
      />
      <AttachCatchModal
        v-if="editor === 'attach'"
        :token="token"
        :user="user"
        :trip="trip"
        @close="editor = ''"
        @saved="saved"
        @expired="expired"
      />
    </template>
  </main>
  <main v-else id="main-content" class="sign-in-layout">
    <SignInPanel :busy="signingIn" :error="loginError" @submit="handleSignIn" />
  </main>
</template>
<style scoped>
.trip-page {
  display: grid;
  gap: 22px;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}
dt {
  font-size: 12px;
  color: var(--muted);
}
dd {
  margin: 8px 0 0;
  font-weight: 600;
}
.muted {
  font-size: 13px;
  line-height: 1.6;
}
.page-header p {
  margin-top: 8px;
}
.notes {
  white-space: pre-wrap;
  margin: 16px 0;
}
a {
  color: var(--blue);
}
@media (max-width: 650px) {
  .summary {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
