<template>
  <div class="row q-gutter-xs">
    <q-chip
      v-for="option in options"
      :key="option"
      clickable
      dense
      :outline="!modelValue.includes(option)"
      :color="modelValue.includes(option) ? 'primary' : 'grey-7'"
      :text-color="modelValue.includes(option) ? 'white' : 'grey-8'"
      @click="toggle(option)"
    >
      {{ option }}
    </q-chip>
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