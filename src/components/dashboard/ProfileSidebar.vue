<script setup>
import { LABELS, EVENTS } from '@/constants'

import { computed } from 'vue'
import { Fish, Plus, BookOpen, Waves } from '@lucide/vue'
import AppButton from '@/components/ui/AppButton.vue'

const emit = defineEmits([EVENTS.ADD_CATCH])
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
      <AppButton @click="emit(EVENTS.ADD_CATCH)"
        ><Plus :size="17" aria-hidden="true" />{{ LABELS.ADD_FISH_CATCH }}</AppButton
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
.sidebar {
  position: sticky;
  top: var(--navbar-height);
  align-self: start;
  height: calc(100dvh - var(--navbar-height));
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 26px;
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 32px 22px 24px;
}
.profile {
  text-align: center;
}
.profile .eyebrow {
  margin-bottom: 20px;
}
.avatar {
  display: grid;
  place-items: center;
  width: 70px;
  height: 70px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: #eaf0f7;
  border: 5px solid #f5f7fa;
  color: #426080;
  font-size: 23px;
  font-weight: 600;
}
.profile h2 {
  font-size: 17px;
  overflow-wrap: anywhere;
}
.profile__username {
  margin-top: 5px;
  font-size: 12px;
  overflow-wrap: anywhere;
}
.profile-stats {
  padding: 20px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  display: grid;
  gap: 16px;
}
.profile-stats > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.profile-stats dt {
  color: var(--muted);
  font-size: 12px;
}
.profile-stats dd {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.quick-actions .eyebrow {
  margin-bottom: 3px;
}
.quick-actions :deep(.button) {
  justify-content: flex-start;
  min-height: 42px;
}
.sidebar__note {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #7f8da0;
  font-size: 10px;
  margin-top: auto;
  padding-top: 28px;
}
@media (max-width: 800px) {
  .sidebar {
    position: static;
    height: auto;
    overflow: visible;
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 24px;
    gap: 22px;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
  .profile-stats {
    align-self: center;
  }
  .quick-actions {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
  .quick-actions .eyebrow {
    grid-column: 1 / -1;
  }
  .quick-actions :deep(.button) {
    justify-content: center;
  }
  .sidebar__note {
    display: none;
  }
}
@media (max-width: 480px) {
  .sidebar {
    padding: 22px 20px;
  }
  .profile h2 {
    font-size: 15px;
  }
  .quick-actions {
    grid-template-columns: 1fr;
  }
  .quick-actions :deep(.button) {
    justify-content: flex-start;
  }
}

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
