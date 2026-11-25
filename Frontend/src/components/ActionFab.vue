<template>
  <q-page-sticky position="bottom-right" :offset="[16, 80]">
    <!-- มีแค่คำสั่งเดียว จึงเป็นปุ่มเดียวแตะครั้งเดียว (เดิมต้องกางเมนูก่อนแล้วแตะอีกครั้ง) -->
    <q-btn
      fab
      color="primary"
      icon="add"
      :aria-label="t('components.actionFab.addInspectionItem')"
      @click="emit('add')"
    />
  </q-page-sticky>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const emit = defineEmits(['add']);
</script>
