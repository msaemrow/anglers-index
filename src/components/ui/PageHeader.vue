<script setup>
defineProps({ title: { type: String, required: true }, countText: { type: String, default: '' } })
</script>
<template>
  <header class="page-header page-header--compact">
    <h1>
      {{ title }}<span v-if="countText" class="directory-count">{{ countText }}</span>
    </h1>
    <div v-if="$slots.default" class="page-actions"><slot /></div>
  </header>
</template>
<style scoped>
.page-header.page-header--compact {
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 16px;
  padding-bottom: 10px;
  margin: 0;
  border-bottom-width: 1px;
}
h1 {
  font-size: 24px;
  letter-spacing: -0.5px;
}
.directory-count {
  display: inline-block;
  margin-left: 8px;
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: normal;
}
.page-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.page-actions :deep(.button) {
  min-height: 34px;
  padding: 6px 10px;
  font-size: 12px;
}
@media (max-width: 650px) {
  h1 {
    font-size: 21px;
  }
}
</style>
