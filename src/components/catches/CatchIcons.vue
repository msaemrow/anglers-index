<script setup>
import { Medal, Trophy, Clock } from '@lucide/vue'
import { STATUS } from '@/constants'

defineProps({
  personalBest: { type: Boolean, default: false },
  masterAnglerStatus: { type: String, default: '' },
})
</script>

<template>
  <span
    v-if="personalBest || [STATUS.APPROVED, STATUS.PENDING].includes(masterAnglerStatus)"
    class="catch-icons"
  >
    <Trophy
      v-if="masterAnglerStatus === STATUS.APPROVED"
      :size="16"
      class="master"
      role="img"
      aria-label="Approved Master Angler"
    />
    <Clock
      v-else-if="masterAnglerStatus === STATUS.PENDING"
      :size="16"
      class="pending"
      role="img"
      aria-label="Awaiting Master Angler review"
    />
    <Medal v-if="personalBest" :size="16" class="pb" role="img" aria-label="Personal best" />
  </span>
</template>

<style scoped>
.catch-icons {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.master {
  color: #a77815;
}
.pb {
  color: #286342;
}
.pending {
  color: var(--text-accent);
}
</style>
