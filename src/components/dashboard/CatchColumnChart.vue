<script setup>
import { computed } from 'vue'
import AppTooltip from '@/components/ui/AppTooltip.vue'
const props = defineProps({
  title: { type: String, required: true },
  dimension: { type: String, required: true },
  rows: { type: Array, required: true },
})
const chartMax = computed(() => Math.max(4, Math.ceil((props.rows[0]?.count || 1) / 4) * 4))
</script>
<template>
  <figure class="chart">
    <figcaption class="sr-only">{{ title }}</figcaption>
    <div class="chart-layout">
      <div class="chart-axis" aria-hidden="true">
        <span v-for="tick in [4, 3, 2, 1, 0]" :key="tick">{{
          ((chartMax * tick) / 4).toLocaleString()
        }}</span>
      </div>
      <div
        class="chart-scroll"
        tabindex="0"
        role="region"
        :aria-label="`Catch count by ${dimension}. Scroll horizontally for more categories.`"
      >
        <ol
          class="bars"
          :style="{ '--columns': rows.length }"
          :aria-label="`Catch count by ${dimension}, most common first`"
        >
          <li v-for="row in rows" :key="row.key">
            <component
              :is="dimension === 'lure' ? AppTooltip : 'div'"
              :text="dimension === 'lure' ? row.tooltip : undefined"
              class="column-content"
              :class="{ 'column-content--interactive': dimension === 'lure' }"
            >
              <span class="bar-track">
                <span class="bar-fill" :style="{ height: `${(row.count / chartMax) * 100}%` }">
                  <strong class="bar-count"
                    >{{ row.count.toLocaleString()
                    }}<span class="sr-only">
                      {{ row.count === 1 ? 'catch' : 'catches' }}</span
                    ></strong
                  >
                </span>
              </span>
              <span class="bar-label">{{ row.label }}</span>
            </component>
          </li>
        </ol>
      </div>
    </div>
  </figure>
</template>
<style scoped>
.chart {
  margin: 0;
}
.chart-layout {
  display: flex;
  gap: 8px;
  padding-top: 24px;
}
.chart-axis {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-shrink: 0;
  height: 200px;
  min-width: 28px;
  text-align: right;
  color: var(--muted);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
.chart-axis span {
  line-height: 0;
}
.chart-scroll {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  padding-top: 24px;
  margin-top: -24px;
  padding-bottom: 8px;
}
.bars {
  display: grid;
  grid-template-columns: repeat(var(--columns), minmax(60px, 1fr));
  min-width: calc(var(--columns) * 60px);
  list-style: none;
  padding: 0;
  margin: 0;
  background: repeating-linear-gradient(
      to top,
      #dfe6ef 0,
      #dfe6ef 1px,
      transparent 1px,
      transparent 50px
    )
    left top / 100% 200px no-repeat;
}
.bars li {
  min-width: 0;
}
.bar-track {
  height: 200px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  border-bottom: 1px solid #9aadc3;
}
.bar-fill {
  position: relative;
  width: 52%;
  max-width: 64px;
  min-height: 2px;
  background: #082f6b;
  border-radius: 5px 5px 0 0;
}
.bar-count {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  color: #082f6b;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.column-content--interactive .bar-label {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
.column-content--interactive:hover .bar-fill,
.column-content--interactive:focus-visible .bar-fill {
  background: #1763a6;
}

.bar-label {
  display: block;
  padding: 12px 4px 0;
  text-align: center;
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: break-word;
  font-weight: 500;
}
.chart {
  min-width: 0;
}
</style>
