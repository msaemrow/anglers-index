<script setup>
import { RouterLink } from 'vue-router'

defineProps({ items: { type: Array, required: true }, compact: Boolean })
</script>

<template>
  <dl class="detail-list" :class="{ 'detail-list--compact': compact }">
    <div v-for="item in items" :key="item.label">
      <dt>{{ item.label }}</dt>
      <dd>
        <RouterLink v-if="item.to" :to="item.to">{{ item.value }}</RouterLink>
        <template v-else>{{ item.value ?? 'Not recorded' }}</template>
      </dd>
    </div>
  </dl>
</template>

<style scoped>
.detail-list > div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 20px;
  padding: 13px 0;
  border-bottom: 1px solid var(--border);
}
.detail-list > div:last-child {
  border-bottom: 0;
}
.detail-list--compact > div {
  padding: 7px 0;
}
dd a {
  color: var(--text-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}
dt {
  color: var(--muted);
  font-size: 12px;
}
dd {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  text-align: right;
  overflow-wrap: anywhere;
  min-width: 0;
}
</style>
