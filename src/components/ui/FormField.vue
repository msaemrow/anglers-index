<script setup>
defineOptions({ inheritAttrs: false })

defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  modelValue: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="form-field">
    <label :for="id">{{ label }}</label>
    <input
      :id="id"
      v-bind="$attrs"
      :value="modelValue"
      @input="emit('update:modelValue', $event.target.value)"
    />
  </div>
</template>

<style scoped>
.form-field {
  display: grid;
  gap: 6px;
}
label {
  font-size: 12px;
  font-weight: 600;
}
input {
  width: 100%;
  min-height: 42px;
  padding: 9px 11px;
  border: 1px solid #ced9e6;
  border-radius: var(--radius-control);
  color: var(--text);
  background: var(--surface);
}
</style>
