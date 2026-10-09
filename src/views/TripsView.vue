<script setup>
import PageHeader from '@/components/ui/PageHeader.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppNavbar from '@/components/AppNavbar.vue'
import SignInPanel from '@/components/SignInPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ContentPanel from '@/components/ui/ContentPanel.vue'
import DataTable from '@/components/ui/DataTable.vue'
import TripEditor from '@/components/trips/TripEditor.vue'
import { getTrips } from '@/api/trips'
import { useTripPage } from '@/composables/useTripPage'
import { formatDate } from '@/utils/dateTime'
const {
  user,
  token,
  signingIn,
  signOut,
  data,
  loading,
  error,
  loginError,
  attempt,
  expired,
  handleSignIn,
} = useTripPage(getTrips)
const route = useRoute()
const router = useRouter(),
  editor = ref(false),
  status = ref('all'),
  search = ref('')
watch(token, () => {
  editor.value = false
  status.value = 'all'
  search.value = ''
})
const rows = computed(() =>
  (data.value || [])
    .filter(
      (trip) =>
        (status.value === 'all' || trip.status === status.value) &&
        (!search.value.trim() ||
          [trip.lake?.name, trip.lake?.county, trip.notes].some((value) =>
            value?.toLowerCase().includes(search.value.trim().toLowerCase()),
          )),
    )
    .map((trip) => ({ ...trip, lakeName: trip.lake?.name || 'Unknown lake' })),
)
const columns = [
  { key: 'start_date', label: 'Start date' },
  { key: 'end_date', label: 'End date' },
  { key: 'lakeName', label: 'Lake' },
  { key: 'catch_count', label: 'Catches', numeric: true },
  { key: 'status', label: 'Status' },
  { key: 'day_count', label: 'Days', numeric: true },
  { key: 'actions', label: 'Details', sortable: false },
]
function saved(trip) {
  editor.value = false
  router.push({ name: 'trip', params: { username: user.value.username, id: trip.id } })
}
</script>
<template>
  <a class="skip-link" href="#main-content">Skip to content</a
  ><AppNavbar :user="user" @sign-out="signOut" />
  <main v-if="user" id="main-content" class="list-page trips-page header-page" :aria-busy="loading">
    <PageHeader title="Fishing trips">
      <AppButton @click="editor = true">Add trip</AppButton>
    </PageHeader>
    <p v-if="route.query.deleted === '1'" role="status" class="catch-notice">
      Trip deleted. All catches have been kept.
    </p>
    <p v-if="loading" role="status">Loading fishing trips…</p>
    <ContentPanel v-else-if="error" title="Trips couldn’t load"
      ><p role="alert">{{ error }}</p>
      <AppButton @click="attempt++">Try again</AppButton></ContentPanel
    >
    <ContentPanel
      v-else
      title="Trip log"
      description="Record every outing, including trips with no catches. Trip dates include the entire day."
    >
      <div class="filters">
        <label
          >Search<input
            v-model="search"
            type="search"
            placeholder="Lake, county, or notes" /></label
        ><label
          >Status<AppSelect size="compact" v-model="status">
            <option value="all">All trips</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </AppSelect></label
        >
      </div>
      <DataTable
        v-if="rows.length"
        :rows="rows"
        :columns="columns"
        caption="Your fishing trips"
        initial-sort="start_date"
        initial-direction="desc"
      >
        <template #cell-start_date="{ value }">{{ formatDate(value) }}</template>
        <template #cell-status="{ value }">{{
          value === 'active' ? 'Active' : 'Completed'
        }}</template>
        <template #cell-end_date="{ value }">{{ formatDate(value) }}</template>
        <template #cell-actions="{ row }"
          ><RouterLink :to="{ name: 'trip', params: { username: user.username, id: row.id } }"
            >View trip →</RouterLink
          ></template
        >
      </DataTable>
      <p v-else role="status">
        {{
          data?.length
            ? 'No trips match these filters.'
            : 'No trips yet. Add a trip to start tracking your fishing time.'
        }}
      </p>
    </ContentPanel>
    <TripEditor
      v-if="editor"
      :token="token"
      @close="editor = false"
      @saved="saved"
      @expired="expired"
    />
  </main>
  <main v-else id="main-content" class="sign-in-layout">
    <SignInPanel :busy="signingIn" :error="loginError" @submit="handleSignIn" />
  </main>
</template>
<style scoped>
.trips-page {
  display: grid;
  gap: 22px;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
}
label {
  display: grid;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}
input {
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--navy);
  background: white;
}
a {
  color: var(--blue);
}
</style>
