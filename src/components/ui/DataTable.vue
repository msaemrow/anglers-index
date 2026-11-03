<script setup>
import { LABELS } from '@/constants'

import AppSelect from '@/components/ui/AppSelect.vue'
import DataCardList from './DataCardList.vue'
import { computed, ref, watch } from 'vue'
import { ArrowUp, ArrowDown, ArrowUpDown } from '@lucide/vue'
import AppButton from './AppButton.vue'

const props = defineProps({
  rows: { type: Array, required: true },
  columns: { type: Array, required: true },
  caption: { type: String, required: true },
  mobileRowTo: { type: Function, default: undefined },
  mobileTitleKey: { type: String, default: '' },
  initialSort: { type: String, default: '' },
  initialDirection: { type: String, default: 'asc' },
})
const sortKey = ref(props.initialSort)
const direction = ref(props.initialDirection)
const page = ref(1)
const pageSize = ref(15)
const sorted = computed(() => {
  const column = props.columns.find((column) => column.key === sortKey.value)
  if (!column) return props.rows
  return [...props.rows].sort((a, b) => {
    const left = a[column.key]
    const right = b[column.key]
    const missing = (value) => value === null || value === undefined || value === ''
    if (missing(left)) return missing(right) ? 0 : 1
    if (missing(right)) return -1
    const comparison = column.numeric
      ? Number(left) - Number(right)
      : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' })
    return direction.value === 'asc' ? comparison : -comparison
  })
})
const pageCount = computed(() => Math.max(1, Math.ceil(sorted.value.length / pageSize.value)))
const visibleRows = computed(() =>
  sorted.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value),
)
watch([() => props.rows, pageSize, sortKey, direction], () => {
  page.value = 1
})
function setMobileSort(value) {
  const separator = value.lastIndexOf(':')
  sortKey.value = value.slice(0, separator)
  direction.value = value.slice(separator + 1)
}
function sort(column) {
  if (sortKey.value === column.key) direction.value = direction.value === 'asc' ? 'desc' : 'asc'
  else {
    sortKey.value = column.key
    direction.value = column.numeric ? 'desc' : 'asc'
  }
}
</script>

<template>
  <div class="table-controls">
    <slot name="filters" />
    <div v-if="mobileTitleKey && rows.length" class="mobile-sort">
      <AppSelect
        :model-value="`${sortKey}:${direction}`"
        size="compact"
        :aria-label="`Sort ${caption}`"
        @update:model-value="setMobileSort"
      >
        <template
          v-for="column in columns.filter((column) => column.sortable !== false)"
          :key="column.key"
        >
          <option :value="`${column.key}:asc`">{{ column.label }} ↑</option>
          <option :value="`${column.key}:desc`">{{ column.label }} ↓</option>
        </template>
      </AppSelect>
    </div>
  </div>
  <div v-if="mobileTitleKey && rows.length" class="mobile-cards">
    <DataCardList
      :rows="visibleRows"
      :columns="columns"
      :title-key="mobileTitleKey"
      :row-to="mobileRowTo"
      :caption="caption"
    >
      <template v-for="(_, name) in $slots" #[name]="slotProps"
        ><slot :name="name" v-bind="slotProps"
      /></template>
    </DataCardList>
  </div>
  <div
    v-if="rows.length"
    class="table-scroll"
    :class="{ 'desktop-table': mobileTitleKey }"
    role="region"
    :aria-label="caption"
    tabindex="0"
  >
    <table>
      <caption class="sr-only">
        {{
          caption
        }}
      </caption>
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :class="{ 'hide-on-mobile': column.hideOnMobile }"
            scope="col"
            :aria-sort="
              column.sortable === false
                ? undefined
                : sortKey === column.key
                  ? direction === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
            "
          >
            <span v-if="column.sortable === false">{{ column.label }}</span>
            <button v-else type="button" @click="sort(column)">
              {{ column.label }}
              <component
                :is="
                  sortKey === column.key ? (direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
                "
                :size="13"
                aria-hidden="true"
              />
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in visibleRows" :key="row.id">
          <td
            v-for="column in columns"
            :key="column.key"
            :class="{ 'hide-on-mobile': column.hideOnMobile }"
          >
            <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">{{
              row[column.key] ?? '—'
            }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-if="rows.length" class="pagination" :class="{ 'card-pagination': mobileTitleKey }">
    <p role="status">
      {{ rows.length ? (page - 1) * pageSize + 1 : 0 }}–{{
        Math.min(page * pageSize, rows.length)
      }}
      of {{ rows.length }} results
    </p>
    <label
      >Rows per page
      <AppSelect size="compact" v-model="pageSize">
        <option v-for="size in [10, 15, 25, 50, 100]" :key="size" :value="size">{{ size }}</option>
      </AppSelect></label
    >
    <nav aria-label="Table pagination">
      <AppButton variant="secondary" :disabled="page <= 1" @click="page--">{{
        LABELS.PREVIOUS
      }}</AppButton>
      <span>Page {{ page }} of {{ pageCount }}</span>
      <AppButton variant="secondary" :disabled="page >= pageCount" @click="page++">{{
        LABELS.NEXT
      }}</AppButton>
    </nav>
  </div>
</template>

<style scoped>
.mobile-cards {
  display: none;
}
.table-controls {
  display: contents;
}
.mobile-sort {
  display: none;
}
@media (max-width: 800px) {
  .table-controls {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;
    gap: 0 10px;
  }
  .table-controls :deep(.filters-toggle) {
    margin: 0 0 14px;
    grid-column: 1;
  }
  .table-controls :deep(.filters-body) {
    display: block;
    grid-column: 1 / -1;
    order: 2;
  }
  .table-controls :deep(.filters-body:not(.filters-body--open)) {
    display: none;
  }
  .mobile-sort {
    display: flex;
    justify-content: flex-end;
    min-width: 0;
    grid-column: 2;
    margin-bottom: 14px;
  }
  .mobile-sort :deep(select) {
    max-width: 100%;
  }
  .mobile-cards {
    display: block;
  }
  .desktop-table {
    display: none;
  }
  .card-pagination {
    gap: 12px;
  }
  .card-pagination nav {
    width: 100%;
    justify-content: space-between;
    gap: 6px;
  }
  .card-pagination :deep(.button) {
    min-height: 44px;
  }
}
@media (max-width: 650px) {
  .hide-on-mobile {
    display: none;
  }
}
.table-scroll {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: 9px;
}
table {
  border-collapse: collapse;
  width: 100%;
  text-align: left;
  font-size: 13px;
  white-space: nowrap;
}
th {
  background: var(--blue);
  color: var(--surface);
  font-weight: 600;
}
th,
td {
  padding: 15px 18px;
}
th button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  padding: 0;
  color: inherit;
  font-size: inherit;
  font-weight: inherit;
}
tbody tr + tr {
  border-top: 1px solid var(--border);
}
th + th {
  border-left: 1px solid #ffffff26;
}
th button:focus-visible {
  outline-color: var(--surface);
}
tbody tr:nth-child(even) {
  background: var(--surface-hover);
}
tbody tr:hover,
tbody tr:focus-within {
  background: #e1edf7;
}
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--muted);
}
.pagination label,
.pagination nav {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
