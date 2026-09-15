<template>
  <q-page class="admin-page bg-grey-1">
    <div class="page-content column flex-center text-grey-6">
      <!-- TODO: หน้าแดชบอร์ดธุรกิจ — ยังเป็นหน้าเปล่า รอออกแบบและต่อ API -->
      <q-icon name="bar_chart" size="64px" color="grey-4" class="q-mb-md" />
      <div class="text-h6 text-weight-medium">{{ t('nav.admin.titleBusinessDashboard') }}</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style scoped>
.admin-page {
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
}
@media (min-width: 768px) {
  .admin-page {
    max-width: 720px;
  }
}
@media (min-width: 1024px) {
  .admin-page {
    max-width: 1100px;
  }
}
@media (min-width: 1440px) {
  .admin-page {
    max-width: 1280px;
  }
}
.page-content {
  min-height: 60vh;
  padding: 16px;
}
</style>
