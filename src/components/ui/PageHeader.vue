<script setup>
defineProps({
  title: { type: String, default: '' },
  compact: { type: Boolean, default: true },
  countText: { type: String, default: '' },
})
</script>
<template>
  <header class="page-header" :class="{ 'page-header--compact': compact }">
    <slot name="heading"
      ><h1>
        {{ title }}<span v-if="countText" class="directory-count">{{ countText }}</span>
      </h1></slot
    >
    <slot v-if="!compact" />
    <div v-else-if="$slots.default" class="page-actions"><slot /></div>
  </header>
</template>
<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 3px;
}
.page-header :deep(.muted) {
  font-size: 14px;
  margin-top: 10px;
}
@media (max-width: 480px) {
  .page-header {
    align-items: flex-start;
  }
  .page-header > :deep(.button) {
    font-size: 0;
    padding: 10px;
    gap: 0;
  }
  .page-header > :deep(.button svg) {
    width: 18px;
    height: 18px;
  }
}

.page-header.page-header--compact {
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 16px;
  padding-bottom: 10px;
  margin: 0;
  border-bottom-width: 1px;
}
.page-header--compact h1 {
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
.page-header--compact .page-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.page-header--compact .page-actions :deep(.button) {
  min-height: 34px;
  padding: 6px 10px;
  font-size: 12px;
}
@media (max-width: 650px) {
  .page-header--compact h1 {
    font-size: 21px;
  }
}
</style>
