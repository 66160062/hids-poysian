<template>
  <q-page-sticky position="bottom-right" :offset="[16, 80]">
    <q-fab v-model="isExpanded" color="primary" icon="add" active-icon="close" direction="up">
      <q-fab-action
        color="white"
        text-color="primary"
        icon="add"
        :label="t('components.actionFab.addInspectionItem')"
        label-class="text-weight-bold"
        style="transform: translateX(-45px)"
        @click="onClickAdd"
      />
    </q-fab>
  </q-page-sticky>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const isExpanded = ref(false);
const emit = defineEmits(['add']);

const onClickAdd = () => {
  emit('add');
  isExpanded.value = false;
};
</script>
