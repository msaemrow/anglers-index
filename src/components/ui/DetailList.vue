<script setup>
defineProps({ items: { type: Array, required: true } })
</script>

<template>
  <dl class="detail-list">
    <div v-for="item in items" :key="item.label">
      <dt>{{ item.label }}</dt>
      <dd>{{ item.value ?? 'Not recorded' }}</dd>
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
