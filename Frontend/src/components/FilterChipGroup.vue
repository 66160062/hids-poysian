<template>
  <div class="row q-gutter-sm">
    <q-btn
      v-for="option in options"
      :key="option"
      unelevated
      rounded
      no-caps
      :color="modelValue.includes(option) ? 'primary' : 'grey-2'"
      :text-color="modelValue.includes(option) ? 'white' : 'grey-8'"
      class="filter-chip-btn"
      @click="toggle(option)"
    >
      <span class="text-weight-medium q-px-sm">{{ option }}</span>
    </q-btn>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  options:    string[]
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const toggle = (val: string) => {
  const current = [...props.modelValue]
  const idx     = current.indexOf(val)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else {
    current.push(val)
  }
  emit('update:modelValue', current)
}
</script>

<style scoped>
.filter-chip-btn {
  min-width: fit-content;
  border: 1px solid #e0e0e0;
}
</style>