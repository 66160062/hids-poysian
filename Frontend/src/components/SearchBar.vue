<template>
  <div class="row items-center q-gutter-x-sm">
    <q-input outlined dense class="col" bg-color="white" :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)" placeholder="ค้นหาประเภทห้อง, ประเภทห้องย่อย">
      <template v-slot:prepend>
        <q-icon name="search" color="grey-6" />
      </template>
    </q-input>

    <q-btn round outline color="grey-4" text-color="grey-7" icon="tune" class="bg-white" @click="$emit('filter')" />
  </div>
</template>

<script setup lang="ts">
defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});
defineEmits(['update:modelValue', 'filter']);
</script>

<style scoped>
:deep(.q-field__control) {
  border-radius: 8px;
}
</style>
