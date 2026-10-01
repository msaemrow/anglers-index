<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  hideHeader: Boolean,
})
</script>

<template>
  <section class="panel" :aria-label="title">
    <header v-if="!hideHeader" class="panel__header">
      <div>
        <h2>{{ title }}</h2>
        <p v-if="description" class="muted panel__description">{{ description }}</p>
      </div>
      <slot name="action" />
    </header>
    <slot />
  </section>
</template>
