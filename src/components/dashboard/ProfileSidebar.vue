<script setup>
import { computed } from 'vue'
import { Fish, Plus, BookOpen, Waves } from '@lucide/vue'
import AppButton from '@/components/ui/AppButton.vue'

const emit = defineEmits(['add-catch'])
const props = defineProps({
  user: { type: Object, required: true },
  stats: { type: Object, default: null },
})
const name = computed(
  () =>
    [props.user.first_name, props.user.last_name].filter(Boolean).join(' ') || props.user.username,
)
const initials = computed(() =>
  name.value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase(),
)
const userPath = computed(() => `/${encodeURIComponent(props.user.username)}`)
const statsList = computed(() => [
  { label: 'Total catches', value: props.stats?.totalCatches },
  { label: 'Master Angler', value: props.stats?.totalMasterAngler },
  { label: 'Lakes fished', value: props.stats?.lakesFished },
])
</script>

<template>
  <aside class="sidebar" aria-label="Your profile">
    <div class="profile">
      <p class="eyebrow">Angler profile</p>
      <div class="avatar" aria-hidden="true">{{ initials }}</div>
      <h2>{{ name }}</h2>
      <p class="muted profile__username">@{{ user.username }}</p>
    </div>
    <dl class="profile-stats">
      <div v-for="stat in statsList" :key="stat.label">
        <dt>{{ stat.label }}</dt>
        <dd>{{ stat.value == null ? '—' : stat.value.toLocaleString() }}</dd>
      </div>
    </dl>
    <div class="quick-actions">
      <p class="eyebrow">Quick actions</p>
      <AppButton @click="emit('add-catch')"
        ><Plus :size="17" aria-hidden="true" />Add fish catch</AppButton
      >
      <AppButton :to="`${userPath}/fish-mode`" variant="secondary"
        ><Fish :size="17" aria-hidden="true" />Fishing mode</AppButton
      >
      <AppButton :to="'/resources'" variant="secondary"
        ><BookOpen :size="17" aria-hidden="true" />Resources</AppButton
      >
    </div>
    <p class="sidebar__note"><Waves :size="18" aria-hidden="true" />Every catch tells a story.</p>
  </aside>
</template>

<style scoped>
@media (min-width: 801px) {
  .sidebar {
    padding: 20px 18px 16px;
    gap: 18px;
  }
  .profile .eyebrow {
    margin-bottom: 10px;
  }
  .avatar {
    width: 48px;
    height: 48px;
    margin-bottom: 10px;
    border-width: 3px;
    font-size: 18px;
  }
  .profile h2 {
    font-size: 15px;
    line-height: 1.3;
  }
  .profile-stats {
    padding: 12px 0;
    gap: 10px;
  }
  .profile-stats dd {
    font-size: 15px;
  }
  .quick-actions {
    gap: 6px;
  }
  .quick-actions :deep(.button) {
    min-height: 38px;
    padding: 8px 10px;
  }
  .sidebar__note {
    padding-top: 8px;
  }
}
@media (min-width: 801px) and (max-height: 650px) {
  .sidebar {
    gap: 12px;
    padding-top: 14px;
    padding-bottom: 12px;
  }
  .profile .eyebrow {
    margin-bottom: 6px;
  }
  .profile-stats {
    padding: 10px 0;
    gap: 8px;
  }
  .sidebar__note {
    display: none;
  }
}
</style>
