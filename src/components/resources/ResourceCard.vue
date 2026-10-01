<script setup>
import { ExternalLink } from '@lucide/vue'
defineProps({ resource: { type: Object, required: true }, kind: { type: String, required: true } })
</script>
<template>
  <article class="resource-card">
    <p class="eyebrow">{{ kind === 'podcasts' ? 'Podcast' : 'YouTube channel' }}</p>
    <h2>{{ resource.name }}</h2>
    <p v-if="resource.topics" class="topics">{{ resource.topics }}</p>
    <a :href="resource.link" target="_blank" rel="noopener noreferrer"
      >{{ kind === 'podcasts' ? 'Listen / visit' : 'Visit channel'
      }}<ExternalLink :size="14" aria-hidden="true" /><span class="sr-only"
        >{{ resource.name }} (opens in a new tab)</span
      ></a
    >
  </article>
</template>
<style scoped>
.resource-card {
  display: flex;
  flex-direction: column;
  padding: 22px;
  border: 1px solid var(--border);
  border-top: 3px solid var(--blue);
  border-radius: 12px;
  background: white;
  gap: 12px;
}
.eyebrow {
  margin: 0;
}
h2 {
  font-size: 17px;
}
.topics {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.6;
}
a {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 8px;
  margin-top: auto;
  padding-top: 12px;
  color: var(--blue);
  font-size: 13px;
  font-weight: 600;
}
a:hover {
  text-decoration: underline;
}
</style>
