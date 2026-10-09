<script setup>
import { MapPin, Trophy, ArrowUpRight, Clock } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
const props = defineProps({
  catchData: { type: Object, required: true },
  to: { type: [String, Object], required: true },
})
const date = computed(() => {
  if (!props.catchData.date) return 'Date not recorded'
  const parsed = new Date(`${props.catchData.date.slice(0, 10)}T12:00:00`)
  return Number.isNaN(parsed.getTime())
    ? 'Date not recorded'
    : parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
})
function measurement(value, unit) {
  return Number(value) > 0 ? `${value} ${unit}` : '—'
}
</script>

<template>
  <RouterLink class="catch-card" :to="to">
    <div class="catch-card__top">
      <time :datetime="catchData.date || undefined">{{ date }}</time
      ><span
        v-if="catchData.master_angler_status === 'approved'"
        class="trophy"
        title="Approved Master Angler catch"
        ><Trophy :size="16" aria-hidden="true" /><span class="sr-only"
          >Approved Master Angler catch</span
        ></span
      >
      <span
        v-else-if="catchData.master_angler_status === 'pending'"
        class="eligible"
        title="Eligible · awaiting review"
      >
        <Clock :size="16" aria-hidden="true" /><span class="sr-only"
          >Eligible · awaiting Master Angler review</span
        >
      </span>
    </div>
    <h3>{{ catchData.species?.name || 'Unknown species' }}</h3>
    <p class="catch-card__lake">
      <MapPin :size="14" aria-hidden="true" />{{ catchData.lake?.name || 'Unknown lake' }}
    </p>
    <dl class="catch-card__measurements">
      <div>
        <dt>Length</dt>
        <dd>{{ measurement(catchData.length, 'in') }}</dd>
      </div>
      <div>
        <dt>Weight</dt>
        <dd>{{ measurement(catchData.weight, 'lb') }}</dd>
      </div>
    </dl>
    <span class="catch-card__link">View catch <ArrowUpRight :size="14" aria-hidden="true" /></span>
  </RouterLink>
</template>

<style scoped>
.eligible {
  color: #577394;
  display: inline-flex;
}
</style>
