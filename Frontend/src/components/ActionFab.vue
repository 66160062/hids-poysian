<template>
  <q-page-sticky position="bottom-right" :offset="[16, 80]">
    <q-fab v-model="isExpanded" color="primary" icon="add" active-icon="close" direction="up">
      <q-fab-action
        color="white"
        text-color="primary"
        icon="add"
        label="เพิ่มรายการตรวจ"
        label-class="text-weight-bold"
        @click="onClickAdd"
      />
    </q-fab>
  </q-page-sticky>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const isExpanded = ref(false);
const emit = defineEmits(['add']);

const onClickAdd = () => {
  emit('add');
  isExpanded.value = false;
};
</script>
