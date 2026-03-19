<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-white text-dark">
      <q-toolbar>
        <div class="row items-center cursor-pointer" @click="$router.push('/admin')">
          <q-icon
            v-if="route.meta.icon"
            :name="route.meta.icon as string"
            color="primary"
            size="24px"
            class="q-mr-xs"
          />
          <q-toolbar-title class="text-weight-bold">{{ currentTitle }}</q-toolbar-title>
        </div>
        <q-space />
        <div class="row items-center">
          <q-btn flat round icon="notifications_none" color="dark" aria-label="Notifications" />
          <q-avatar size="34px" class="bg-primary text-white q-ml-sm">A</q-avatar>
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="bg-white">
      <div class="admin-footer-tabs">
        <q-tabs
          dense
          align="justify"
          class="bg-white text-grey-7"
          active-color="primary"
          indicator-color="transparent"
          style="min-height: 56px"
          content-class="admin-tabs-content"
        >
          <q-route-tab
            v-for="item in menuList"
            :key="item.name"
            :name="item.name"
            :icon="item.icon"
            :label="item.label"
            :to="item.link"
            class="admin-menu-tab"
            no-caps
          />
        </q-tabs>
      </div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const currentTitle = computed(() => (route.meta.title as string) || 'Admin');
const menuList = [
  { name: 'dashboard', label: 'หน้าหลัก', icon: 'home', link: '/admin' },
  { name: 'work', label: 'งาน', icon: 'business_center', link: '/admin/work' },
  { name: 'calendar', label: 'ตารางงาน', icon: 'calendar_today', link: '/admin/calendar' },
  { name: 'users', label: 'จัดการผู้ใช้', icon: 'group', link: '/admin/users' },
  { name: 'menu', label: 'หมวดหมู่งาน', icon: 'category', link: '/admin/menu' },
  { name: 'report', label: 'รายงาน', icon: 'bar_chart', link: '/admin/report' },
  { name: 'settings', label: 'ตั้งค่า', icon: 'settings', link: '/admin/settings' },
];
</script>

<style scoped>
.admin-footer-tabs {
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch; /* Enable smooth touch scroll on iOS */
  scrollbar-width: none; /* Hide scrollbar Firefox */
}

.admin-footer-tabs::-webkit-scrollbar {
  display: none; /* Hide scrollbar Chrome/Safari/Edge */
}

.admin-tabs-content {
  display: flex;
  gap: 8px;
  min-width: max-content;
  padding: 8px 12px;
}

.admin-menu-tab {
  min-width: 85px;
  font-size: 0.75rem;
  padding: 8px 8px;
  border-radius: 12px;
  margin: 4px 0;
  transition: all 0.3s ease;
}

/* Highlight background when active */
:deep(.q-tab--active) {
  background: rgba(var(--q-primary-rgb, 25, 118, 210), 0.1);
  color: var(--q-primary) !important;
}

:deep(.q-tab__content) {
  min-height: 48px;
  width: 100%;
}

:deep(.q-tab__label) {
  text-align: center;
  white-space: pre-line;
  line-height: 1.2;
}
</style>
