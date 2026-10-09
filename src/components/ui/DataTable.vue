<script setup>
import AppSelect from '@/components/ui/AppSelect.vue'
import { computed, ref, watch } from 'vue'
import { ArrowUp, ArrowDown, ArrowUpDown } from '@lucide/vue'
import AppButton from './AppButton.vue'

const props = defineProps({
  rows: { type: Array, required: true },
  columns: { type: Array, required: true },
  caption: { type: String, required: true },
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
function sort(column) {
  if (sortKey.value === column.key) direction.value = direction.value === 'asc' ? 'desc' : 'asc'
  else {
    sortKey.value = column.key
    direction.value = column.numeric ? 'desc' : 'asc'
  }
}
</script>

<template>
  <div class="table-scroll" role="region" :aria-label="caption" tabindex="0">
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
  <div class="pagination">
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
      <AppButton variant="secondary" :disabled="page <= 1" @click="page--">Previous</AppButton>
      <span>Page {{ page }} of {{ pageCount }}</span>
      <AppButton variant="secondary" :disabled="page >= pageCount" @click="page++">Next</AppButton>
    </nav>
  </div>
</template>

<style scoped>
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
  color: #fff;
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
  outline-color: #fff;
}
tbody tr:nth-child(even) {
  background: #f0f5fa;
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
