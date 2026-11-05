<script setup>
import CatchBadges from '@/components/catches/CatchBadges.vue'

import { MapPin, ArrowUpRight } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
const props = defineProps({
  catchData: { type: Object, required: true },
  angler: { type: String, default: '' },
  linkLabel: { type: String, default: 'View catch' },
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
    <p v-if="angler" class="catch-card__angler">Angler: {{ angler }}</p>
    <h3>{{ catchData.species?.name || 'Unknown species' }}</h3>
    <CatchBadges
      :personal-best="catchData.personal_best"
      :master-angler-status="catchData.master_angler_status"
    />
    <div class="catch-card__meta">
      <p class="catch-card__lake">
        <MapPin :size="14" aria-hidden="true" />{{ catchData.lake?.name || 'Unknown lake' }}
      </p>
      <time :datetime="catchData.date || undefined"
        >{{ date
        }}<template v-if="catchData.time"> · {{ catchData.time.slice(0, 5) }}</template></time
      >
    </div>
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
    <span class="catch-card__link"
      >{{ linkLabel }} <ArrowUpRight :size="14" aria-hidden="true"
    /></span>
  </RouterLink>
</template>

<style scoped>
.catch-card {
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #fafbfd;
  border: 1px solid #e3e8ef;
  border-radius: 10px;
  transition:
    background 0.15s,
    border-color 0.15s;
}
.catch-card:hover {
  background: var(--surface-hover);
  border-color: #95abc5;
}
.catch-card__angler {
  margin-bottom: 8px;
  color: var(--muted);
  font-size: 12px;
  overflow-wrap: anywhere;
}
.catch-card h3 {
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.catch-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
  margin: 10px 0 22px;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.5;
}
.catch-card__lake {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  margin: 0;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.catch-card__lake svg {
  flex-shrink: 0;
  margin-top: 1px;
}
.catch-card__measurements {
  display: flex;
  gap: 27px;
  margin-top: auto;
}
.catch-card__measurements dt {
  font-size: 9px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #738096;
}
.catch-card__measurements dd {
  margin: 5px 0 0;
  font-size: 15px;
  font-weight: 600;
}
.catch-card__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #e3e8ef;
  margin-top: 18px;
  padding-top: 11px;
  color: var(--text-accent);
  font-size: 10px;
}
@media (prefers-reduced-motion: reduce) {
  .catch-card {
    transition: none;
  }
}
</style>
