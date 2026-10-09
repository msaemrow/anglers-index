<script setup>
import AppSelect from '@/components/ui/AppSelect.vue'
import { computed, ref, watch } from 'vue'
import ContentPanel from '@/components/ui/ContentPanel.vue'
import CatchColumnChart from './CatchColumnChart.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { getFishCatches } from '@/api/fishCatch'
import { summarizeCatches } from '@/utils/catchSummary'

const props = defineProps({
  userId: { type: [Number, String], required: true },
  token: { type: String, required: true },
})
const emit = defineEmits(['expired'])
const catches = ref([])
const loading = ref(false)
const error = ref('')
const attempt = ref(0)
const selectedDimension = ref('lake')
const charts = computed(() =>
  [
    {
      dimension: selectedDimension.value,
      title: selectedDimension.value === 'lake' ? 'Top lakes' : 'Top species',
    },
    { dimension: 'lure', title: 'Top lures' },
  ].map((chart) => ({
    ...chart,
    rows: summarizeCatches(catches.value, chart.dimension).slice(0, 5),
  })),
)
watch(
  [() => props.token, () => props.userId, attempt],
  async ([token, userId], _, onCleanup) => {
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    catches.value = []
    error.value = ''
    loading.value = true
    try {
      const data = await getFishCatches(userId, token, controller.signal)
      if (!controller.signal.aborted) catches.value = data
    } catch (failure) {
      if (controller.signal.aborted) return
      if (failure.status === 401) emit('expired')
      else error.value = 'We couldn’t load your catch chart. Please try again.'
    } finally {
      if (!controller.signal.aborted) loading.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <section aria-label="Catch breakdown">
    <div :aria-busy="loading" aria-live="polite">
      <p v-if="loading" class="chart-state" role="status">Loading catch data…</p>
      <div v-else-if="error">
        <p class="error-message" role="alert">{{ error }}</p>
        <AppButton variant="secondary" @click="attempt++">Try again</AppButton>
      </div>
      <p v-else-if="!catches.length" class="chart-state">
        Log your first catch to see your most common species, lakes, and lures.
      </p>
      <template v-else>
        <div class="charts-grid">
          <ContentPanel
            v-for="chart in charts"
            :key="chart.dimension"
            :title="chart.title"
            class="chart-card"
          >
            <template v-if="chart.dimension !== 'lure'" #action>
              <label>
                <span class="sr-only">Chart category</span>
                <AppSelect size="compact" v-model="selectedDimension">
                  <option value="lake">Lakes</option>
                  <option value="species">Species</option>
                </AppSelect>
              </label>
            </template>
            <CatchColumnChart
              :title="chart.title"
              :dimension="chart.dimension"
              :rows="chart.rows"
            />
          </ContentPanel>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}
.chart-card {
  min-width: 0;
  padding: 20px 16px;
}
.chart-state {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 24px;
}
@media (max-width: 700px) {
  .charts-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}
</style>
