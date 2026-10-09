<script setup>
import { computed, nextTick, ref, useId, watch } from 'vue'
import { ChevronDown } from '@lucide/vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, required: true },
  label: { type: String, required: true },
  placeholder: { type: String, default: 'Type to search…' },
  required: Boolean,
  disabled: Boolean,
})
const emit = defineEmits(['update:modelValue'])
const id = useId()
const input = ref(null)
const list = ref(null)
const open = ref(false)
const text = ref('')
const query = ref('')
const active = ref(-1)
const selected = computed(() =>
  props.options.find((option) => String(option.value) === String(props.modelValue)),
)
const filtered = computed(() => {
  const words = query.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  return props.options.filter((option) =>
    words.every((word) => option.label.toLocaleLowerCase().includes(word)),
  )
})
watch(
  selected,
  (value) => {
    if (value || !open.value) text.value = value?.label ?? ''
  },
  { immediate: true },
)
watch(filtered, () => {
  active.value = -1
})
watch(
  () => props.disabled,
  (value) => {
    if (value) close()
  },
)
function show() {
  if (props.disabled) return
  if (!open.value) {
    query.value = ''
    active.value = -1
    open.value = true
  }
}
function focus() {
  show()
  input.value?.select()
}
function close() {
  open.value = false
  query.value = ''
  text.value = selected.value?.label ?? ''
  active.value = -1
}
function type(event) {
  text.value = event.target.value
  query.value = text.value
  open.value = true
  emit('update:modelValue', '')
}
function choose(option) {
  emit('update:modelValue', option.value)
  text.value = option.label
  open.value = false
  query.value = ''
  active.value = -1
}
async function keydown(event) {
  if (event.isComposing) return
  if (event.key === 'Escape' && open.value) {
    event.preventDefault()
    event.stopPropagation()
    close()
  } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    show()
    const count = filtered.value.length
    if (!count) return
    active.value =
      event.key === 'ArrowDown'
        ? (active.value + 1) % count
        : active.value <= 0
          ? count - 1
          : active.value - 1
    await nextTick()
    list.value?.children[active.value]?.scrollIntoView({ block: 'nearest' })
  } else if (event.key === 'Enter' && open.value) {
    event.preventDefault()
    const option = filtered.value[active.value >= 0 ? active.value : 0]
    if (option) choose(option)
  } else if (event.key === 'Tab') close()
}
</script>

<template>
  <div class="search-select">
    <label :for="id">{{ label }}</label>
    <div class="control">
      <input
        :id="id"
        ref="input"
        :value="text"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="open"
        :aria-controls="`${id}-options`"
        :aria-activedescendant="open && active >= 0 ? `${id}-option-${active}` : undefined"
        autocomplete="off"
        @focus="focus"
        @click="show"
        @input="type"
        @keydown="keydown"
        @blur="close"
      />
      <ChevronDown :size="15" class="chevron" aria-hidden="true" />
    </div>
    <div v-if="open" class="dropdown">
      <ul :id="`${id}-options`" ref="list" role="listbox" :aria-label="label">
        <li
          v-for="(option, index) in filtered"
          :id="`${id}-option-${index}`"
          :key="option.value"
          role="option"
          :aria-selected="String(option.value) === String(modelValue)"
          :class="{ active: active === index }"
          @pointerdown.prevent
          @click="choose(option)"
          @pointermove="active = index"
        >
          {{ option.label }}
        </li>
      </ul>
      <p v-if="!filtered.length" role="status">No matches. Try another search.</p>
    </div>
  </div>
</template>

<style scoped>
.search-select {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  font-size: 13px;
}
label {
  font-weight: 600;
}
.control {
  position: relative;
}
input {
  width: 100%;
  min-width: 0;
  min-height: 40px;
  padding: 8px 30px 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: white;
  color: var(--navy);
  font: inherit;
  text-overflow: ellipsis;
}
input:disabled {
  background: #e8edf2;
  color: var(--muted);
  border-color: #c5ced7;
  cursor: not-allowed;
  opacity: 1;
  -webkit-text-fill-color: var(--muted);
}
.chevron {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--muted);
}
.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 10;
  background: white;
  border: 1px solid #8ea7be;
  border-radius: 8px;
  box-shadow: 0 6px 18px #192b4326;
  overflow: hidden;
}
ul {
  list-style: none;
  margin: 0;
  padding: 4px;
  max-height: 180px;
  overflow-y: auto;
  overscroll-behavior: contain;
}
li {
  padding: 9px 10px;
  border-radius: 4px;
  cursor: pointer;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
li[aria-selected='true'] {
  font-weight: 600;
  color: var(--blue);
  background: #f0f5fa;
}
li.active {
  background: #dceaf6;
}
.dropdown p {
  padding: 12px;
  color: var(--muted);
  font-size: 12px;
}
</style>
