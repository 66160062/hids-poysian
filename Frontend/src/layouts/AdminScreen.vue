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

    <q-footer class="bg-white shadow-up-3">
      <div
        class="admin-footer-tabs"
        ref="footerRef"
        @pointerdown="onDragStart"
        @pointermove="onDragMove"
        @pointerup="onDragEnd"
        @pointercancel="onDragEnd"
      >
        <div class="admin-tabs-inner">
          <template v-for="item in menuList" :key="item.name">
            <div
              class="admin-menu-tab"
              :class="{ 'is-active': isActive(item.link) }"
              @click="handleTabClick(item.link)"
            >
              <q-icon :name="item.icon" size="22px" />
              <div class="tab-label">{{ item.label }}</div>
            </div>
          </template>
        </div>
      </div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
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

// --- Drag Scroll Logic ---
const footerRef = ref<HTMLElement | null>(null);
let isDragging = false;
let dragStartX = 0;
let scrollStartX = 0;
let dragMoved = false;

function onDragStart(e: PointerEvent) {
  if (!footerRef.value) return;
  isDragging = true;
  dragMoved = false;
  dragStartX = e.clientX;
  scrollStartX = footerRef.value.scrollLeft;
  footerRef.value.setPointerCapture(e.pointerId);
}

function onDragMove(e: PointerEvent) {
  if (!isDragging || !footerRef.value) return;
  const dx = e.clientX - dragStartX;
  if (Math.abs(dx) > 5) dragMoved = true;
  footerRef.value.scrollLeft = scrollStartX - dx;
}

function onDragEnd(e: PointerEvent) {
  isDragging = false;
  if (footerRef.value) footerRef.value.releasePointerCapture(e.pointerId);
}

function isActive(link: string) {
  if (link === '/admin') return route.path === '/admin';
  return route.path.startsWith(link);
}

async function handleTabClick(link: string) {
  if (dragMoved) return; // cancel click if was dragging
  await router.push(link);
}
</script>

<style scoped>
.admin-footer-tabs {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  cursor: grab;
  user-select: none;
  -webkit-overflow-scrolling: touch;
}

.admin-footer-tabs:active {
  cursor: grabbing;
}

.admin-footer-tabs::-webkit-scrollbar {
  display: none;
}

.admin-tabs-inner {
  display: flex;
  flex-direction: row;
  gap: 4px;
  padding: 8px 12px;
  min-width: max-content;
}

.admin-menu-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  padding: 6px 8px;
  border-radius: 12px;
  cursor: pointer;
  color: #9e9e9e;
  transition: all 0.2s ease;
  min-height: 54px;
  gap: 2px;
}

.admin-menu-tab:hover {
  background: rgba(0, 0, 0, 0.04);
}

.admin-menu-tab.is-active {
  background: rgba(25, 118, 210, 0.1);
  color: var(--q-primary);
}

.tab-label {
  font-size: 0.72rem;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
}
</style>
