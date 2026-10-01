<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'

defineOptions({ inheritAttrs: false })
defineProps({ text: { type: String, required: true } })
const id = useId()
const trigger = ref(null)
const tooltip = ref(null)
const open = ref(false)
const position = ref({ left: '0px', top: '0px' })
let closeTimer
function cancelClose() {
  clearTimeout(closeTimer)
}
function close() {
  cancelClose()
  open.value = false
}
function scheduleClose() {
  cancelClose()
  closeTimer = setTimeout(close, 150)
}
async function show() {
  cancelClose()
  open.value = true
  await nextTick()
  if (!trigger.value || !tooltip.value || !open.value) return
  const anchor = trigger.value.getBoundingClientRect()
  const bubble = tooltip.value.getBoundingClientRect()
  const left = Math.max(
    8,
    Math.min(anchor.left + (anchor.width - bubble.width) / 2, window.innerWidth - bubble.width - 8),
  )
  const above = anchor.top - bubble.height - 8
  const top =
    above >= 8
      ? above
      : Math.max(8, Math.min(anchor.bottom + 8, window.innerHeight - bubble.height - 8))
  position.value = { left: `${left}px`, top: `${top}px` }
}
function outside(event) {
  if (!trigger.value?.contains(event.target) && !tooltip.value?.contains(event.target)) close()
}
function escape(event) {
  if (event.key === 'Escape') close()
}
onMounted(() => {
  document.addEventListener('pointerdown', outside)
  document.addEventListener('keydown', escape)
  window.addEventListener('resize', close)
  window.addEventListener('scroll', close, true)
})
onBeforeUnmount(() => {
  cancelClose()
  document.removeEventListener('pointerdown', outside)
  document.removeEventListener('keydown', escape)
  window.removeEventListener('resize', close)
  window.removeEventListener('scroll', close, true)
})
</script>

<template>
  <button
    v-bind="$attrs"
    ref="trigger"
    type="button"
    class="tooltip-trigger"
    :aria-describedby="open ? id : undefined"
    @mouseenter="show"
    @mouseleave="scheduleClose"
    @focus="show"
    @blur="close"
    @click="show"
  >
    <slot />
  </button>
  <Teleport to="body">
    <div
      v-if="open"
      :id="id"
      ref="tooltip"
      role="tooltip"
      class="tooltip-bubble"
      :style="position"
      @mouseenter="cancelClose"
      @mouseleave="scheduleClose"
    >
      {{ text }}
    </div>
  </Teleport>
</template>

<style scoped>
.tooltip-trigger {
  display: block;
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.tooltip-trigger:focus-visible {
  outline: 2px solid #2678cc;
  outline-offset: -2px;
  border-radius: 4px;
}
.tooltip-bubble {
  position: fixed;
  z-index: 2000;
  max-width: min(320px, calc(100vw - 16px));
  padding: 10px 14px;
  border-radius: 8px;
  background: #122c4d;
  color: #fff;
  box-shadow: 0 4px 16px #122c4d33;
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
</style>
