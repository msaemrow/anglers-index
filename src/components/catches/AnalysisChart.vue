<script setup>
import { computed } from 'vue'
const props = defineProps({
  rows: { type: Array, required: true },
  selected: { type: String, default: null },
  title: { type: String, required: true },
})
defineEmits(['select'])
const max = computed(() => Math.max(1, ...props.rows.map((row) => row.count)))
</script>
<template>
  <p v-if="!rows.length" class="muted">No catches match these filters.</p>
  <figure v-else>
    <figcaption>{{ title }} · reported catches</figcaption>
    <ol>
      <li v-for="row in rows" :key="row.key">
        <button :aria-pressed="selected === row.key" @click="$emit('select', row.key)">
          <span class="label">{{ row.label }}</span>
          <span class="track" aria-hidden="true"
            ><span :style="{ width: `${(row.count / max) * 100}%` }"
          /></span>
          <span class="count"
            >{{ row.count }} {{ row.count === 1 ? 'catch' : 'catches' }} · {{ row.days }} reported
            {{ row.days === 1 ? 'day' : 'days' }}</span
          >
        </button>
      </li>
    </ol>
  </figure>
</template>
<style scoped>
figure {
  margin: 0;
}
figcaption {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 12px;
}
ol {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 6px;
}
button {
  width: 100%;
  display: grid;
  grid-template-columns: 160px 1fr 170px;
  align-items: center;
  gap: 12px;
  text-align: left;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 10px;
  background: transparent;
  color: var(--navy);
}
button:hover,
button[aria-pressed='true'] {
  background: #eef4fa;
  border-color: var(--border);
}
.label,
.count {
  font-size: 12px;
}
.count {
  text-align: right;
}
.track {
  background: #eef2f6;
  height: 16px;
  border-radius: 4px;
  overflow: hidden;
}
.track span {
  display: block;
  height: 100%;
  background: var(--blue);
}
@media (max-width: 650px) {
  button {
    grid-template-columns: 1fr 1fr;
  }
  .track {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}
</style>
