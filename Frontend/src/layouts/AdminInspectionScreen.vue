<template>
  <q-layout view="lHh Lpr lFf">
    <q-header v-if="!hideHeader" class="bg-white text-dark">
      <q-toolbar class="relative-position">
        <q-icon
          name="arrow_back_ios_new"
          color="primary"
          size="24px"
          class="cursor-pointer q-mr-xs job-back-icon"
          @click="goBack"
        />
        <q-toolbar-title class="text-weight-bold job-detail-title">{{ headerTitle }}</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container class="bg-white">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

// แอดมินใช้หน้าตรวจชุดเดียวกับ inspector แต่ไม่ได้อยู่ใน InspectorScreen จึงไม่มี top bar ให้กดย้อนกลับ
// layout นี้ให้เฉพาะ header + ปุ่มย้อนกลับ ไม่มี bottom nav ของ inspector ติดมาด้วย
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const goBack = () => {
  router.back();
};

// สองหน้านี้มีปุ่มย้อนกลับของตัวเองอยู่แล้ว ถ้าใส่ header ซ้อนจะมีปุ่มย้อนกลับสองอัน
const hideHeader = computed(
  () => route.path.includes('/add-defect') || route.path.includes('/verify-defect'),
);

const headerTitle = computed(() => {
  if (route.path.includes('/room-defect')) {
    return (route.query.roomName as string) || t('nav.inspector.roomDefectFallback');
  }
  if (route.path.includes('/admin/report/')) {
    return t('nav.inspector.headerReport');
  }
  return t('nav.inspector.headerInspection');
});
</script>

<style scoped>
.job-back-icon {
  position: relative;
  z-index: 2;
}

.job-detail-title {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  pointer-events: none;
}
</style>
