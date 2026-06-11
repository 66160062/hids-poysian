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
          <q-btn
  flat
  round
  icon="notifications_none"
  color="dark"
  aria-label="Notifications"
  @click="$router.push('/admin/notifications')"
/>
          <q-avatar
            size="34px"
            class="bg-primary text-white q-ml-sm cursor-pointer"
            @click="$router.push('/admin/profile')"
          >
            A
          </q-avatar>
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="slide-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>

    <q-footer class="bg-white shadow-up-3">
      <div class="admin-footer-tabs">
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
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();
const currentTitle = computed(() => (route.meta.title as string) || 'Admin');
const menuList = [
  { name: 'dashboard', label: 'หน้าหลัก', icon: 'home', link: '/admin' },
  { name: 'work', label: 'งาน', icon: 'business_center', link: '/admin/work' },
  { name: 'users', label: 'จัดการผู้ใช้', icon: 'group', link: '/admin/users' },
  { name: 'report', label: 'รายงาน', icon: 'bar_chart', link: '/admin/report' },
  { name: 'settings', label: 'ตั้งค่า', icon: 'settings', link: '/admin/settings' },
];

function isActive(link: string) {
  if (link === '/admin') return route.path === '/admin';
  return route.path.startsWith(link);
}

async function handleTabClick(link: string) {
  await router.push(link);
}
</script>

<style scoped>
.admin-footer-tabs {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  user-select: none;
  -webkit-overflow-scrolling: touch;
  display: flex;
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
  flex: 1;
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

@media (min-width: 600px) {
  .admin-footer-tabs {
    justify-content: center;
  }
  .admin-tabs-inner {
    min-width: auto;
    width: 100%;
    max-width: 1024px;
    justify-content: space-around;
  }
  .admin-menu-tab {
    flex: 1;
    max-width: 160px;
  }
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

/* Page Transition Animations */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(10px);
  opacity: 0;
}
</style>
