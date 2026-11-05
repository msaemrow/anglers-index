<script setup>
import { Medal, Trophy, Clock } from '@lucide/vue'
import { STATUS } from '@/constants'
defineProps({
  personalBest: { type: Boolean, default: false },
  masterAnglerStatus: { type: String, default: '' },
})
</script>

<template>
  <div
    v-if="personalBest || [STATUS.APPROVED, STATUS.PENDING].includes(masterAnglerStatus)"
    class="catch-badges"
  >
    <span v-if="personalBest" class="catch-badge"
      ><Medal :size="16" aria-hidden="true" />Personal best</span
    >
    <span
      v-if="masterAnglerStatus === STATUS.APPROVED"
      class="catch-badge catch-badge--master"
      title="Approved Master Angler catch"
      ><Trophy :size="16" aria-hidden="true" />Master Angler</span
    >
    <span
      v-else-if="masterAnglerStatus === STATUS.PENDING"
      class="catch-badge catch-badge--pending"
      title="Awaiting Master Angler review"
      ><Clock :size="16" aria-hidden="true" />MA pending</span
    >
  </div>
</template>

<style scoped>
.catch-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  align-self: flex-start;
  gap: 6px;
  margin-top: 8px;
}
.catch-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #286342;
  background: #d6ebde;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
}
.catch-badge svg {
  flex-shrink: 0;
}
.catch-badge--master {
  color: #886620;
  background: #fff3d8;
}
.catch-badge--pending {
  color: var(--text-accent);
  background: #edf3fa;
}
</style>
