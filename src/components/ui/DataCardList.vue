<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  rowTo: { type: Function, default: undefined },
  rows: { type: Array, required: true },
  rowClass: { type: Function, default: undefined },
  columns: { type: Array, required: true },
  titleKey: { type: String, required: true },
  caption: { type: String, required: true },
})
const fields = computed(() =>
  props.columns.filter((column) => column.key !== props.titleKey && column.key !== 'actions'),
)
</script>

<template>
  <ul class="data-cards" :aria-label="caption">
    <li v-for="row in rows" :key="row.id" class="data-card" :class="rowClass?.(row)">
      <RouterLink
        v-if="rowTo?.(row)"
        :to="rowTo(row)"
        class="card-link"
        :aria-label="`View ${row[titleKey] || 'item'} details`"
      />
      <h3 class="card-title">
        <slot :name="`cell-${titleKey}`" :row="row" :value="row[titleKey]">
          {{ row[titleKey] || 'Unnamed item' }}
        </slot>
      </h3>
      <dl class="card-fields">
        <div v-for="column in fields" :key="column.key" class="card-field">
          <dt>{{ column.label }}</dt>
          <dd>
            <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
              {{ row[column.key] ?? '—' }}
            </slot>
          </dd>
        </div>
      </dl>
      <div v-if="$slots['cell-actions']" class="card-actions">
        <slot name="cell-actions" :row="row" />
      </div>
    </li>
  </ul>
</template>

<style scoped>
.data-cards {
  display: grid;
  gap: 14px;
  padding: 0;
  margin: 0;
  list-style: none;
}
.data-card {
  position: relative;
  isolation: isolate;
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--surface);
  overflow-wrap: anywhere;
}
.card-link {
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
}
.card-link:focus-visible {
  outline: 3px solid var(--blue);
  outline-offset: 2px;
}
.data-card:has(.card-link):hover {
  border-color: var(--blue);
}
.data-card :deep(a:not(.card-link)),
.data-card :deep(button),
.data-card :deep(input),
.data-card :deep(select) {
  position: relative;
  z-index: 2;
}
.card-title {
  margin: 0;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  border-radius: 9px 9px 0 0;
  background: var(--surface-hover);
  font-size: 15px;
  line-height: 1.5;
}
.card-fields {
  margin: 0;
  padding: 2px 16px;
}
.card-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr);
  align-items: center;
  gap: 12px;
  min-height: 38px;
  padding: 5px 0;
  font-size: 13px;
}
.card-field + .card-field {
  border-top: 1px solid var(--border);
}
dt {
  color: var(--muted);
}
dd {
  margin: 0;
  min-width: 0;
  color: var(--navy);
}
.card-actions {
  padding: 4px 10px;
  border-top: 1px solid var(--border);
}
.card-actions :deep(.card-view-action) {
  display: none;
}
.card-actions:has(.card-view-action):not(:has(button, a:not(.card-view-action))) {
  display: none;
}
.card-actions :deep(.actions) {
  gap: 6px;
}
.card-actions :deep(.button) {
  min-height: 44px;
  padding: 10px;
}
.card-fields :deep(.button) {
  min-height: 44px;
}
</style>
