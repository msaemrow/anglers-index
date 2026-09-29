<script setup>
import { computed } from 'vue'
import { Fish, Plus, BookOpen, Waves } from '@lucide/vue'
import AppButton from '@/components/ui/AppButton.vue'
import { legacyUrl } from '@/api/legacy'

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
      <AppButton :href="legacyUrl(`${userPath}/fishcatch/new`)"
        ><Plus :size="17" aria-hidden="true" />Add fish catch</AppButton
      >
      <AppButton :href="legacyUrl(`${userPath}/fish-mode`)" variant="secondary"
        ><Fish :size="17" aria-hidden="true" />Fishing mode</AppButton
      >
      <AppButton :href="legacyUrl('/resources')" variant="secondary"
        ><BookOpen :size="17" aria-hidden="true" />Resources</AppButton
      >
    </div>
    <p class="sidebar__note"><Waves :size="18" aria-hidden="true" />Every catch tells a story.</p>
  </aside>
</template>
