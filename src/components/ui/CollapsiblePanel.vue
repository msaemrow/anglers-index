<script setup>
import { useId } from 'vue'
import { Plus, Minus } from '@lucide/vue'
import ContentPanel from './ContentPanel.vue'
const props = defineProps({
  title: { type: String, required: true },
  expanded: { type: Boolean, default: true },
})
const emit = defineEmits(['toggle'])
const bodyId = useId()
</script>
<template>
  <ContentPanel :title="title" hide-header :class="{ 'is-collapsed': !expanded }">
    <header class="panel__header collapse-header">
      <h2>
        <button
          type="button"
          class="collapse-toggle"
          :aria-expanded="expanded"
          :aria-controls="bodyId"
          :aria-label="`${expanded ? 'Collapse' : 'Expand'} ${props.title}`"
          @click="emit('toggle')"
        >
          <span>{{ title }}</span>
          <Minus v-if="expanded" :size="18" aria-hidden="true" /><Plus
            v-else
            :size="18"
            aria-hidden="true"
          />
        </button>
      </h2>
    </header>
    <div :id="bodyId" v-show="expanded"><slot /></div>
  </ContentPanel>
</template>
<style scoped>
.collapse-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
h2 {
  width: 100%;
  font-size: 16px;
}
.collapse-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 30px;
  text-align: left;
  font: inherit;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--navy);
}
.collapse-toggle:hover {
  color: var(--blue);
}
.is-collapsed .collapse-header {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: 0;
}
</style>
