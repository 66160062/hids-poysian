<template>
  <div class="column flex-center q-py-xl q-mt-xl text-grey-5">
    <q-icon name="assignment" size="80px" class="q-mb-md opacity-50" />
    <div class="text-h6 text-weight-medium">
      {{ message }}
    </div>
    <div class="text-body2 q-mt-sm">{{ t('components.emptyState.hint') }}</div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps({
  message: {
    type: String,
    default: 'ไม่มีพบรายการตรวจ',
  },
});
</script>

<style scoped>
.opacity-50 {
  opacity: 0.5;
}
</style>
