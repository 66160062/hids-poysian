<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-white text-dark">
      <q-toolbar class="no-wrap">
        <div class="row items-center no-wrap col cursor-pointer" style="min-width: 0" @click="$router.push('/admin')">
          <q-icon
            v-if="route.meta.icon"
            :name="route.meta.icon as string"
            color="primary"
            size="24px"
            class="q-mr-xs"
            style="flex-shrink: 0"
          />
          <q-toolbar-title class="text-weight-bold ellipsis">{{ currentTitle }}</q-toolbar-title>
        </div>
        <div class="row items-center no-wrap" style="flex-shrink: 0">
          <LanguageToggle />
          <q-btn
            flat
            round
            icon="notifications_none"
            color="dark"
            :aria-label="t('nav.admin.titleNotifications')"
            @click="$router.push('/admin/notifications')"
          >
  <q-badge v-if="unreadCount > 0" color="red" floating rounded>{{ unreadCount }}</q-badge>
</q-btn>
          <q-avatar
            size="34px"
            class="bg-primary text-white q-ml-sm cursor-pointer"
            @click="$router.push('/admin/profile')"
          >
            <img v-if="currentUser?.imageUrl && !currentUser.imageUrl.includes('unknown.jpg')" :src="getImageUrl(currentUser.imageUrl) ?? ''" />
            <span v-else>{{ currentUser?.fullName?.charAt(0).toUpperCase() || 'A' }}</span>
          </q-avatar>
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="jump" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>

    <q-footer class="bg-white">
      <div ref="tabsRow" class="row no-wrap justify-around q-py-sm relative-position admin-tabs-row">
        <div
          v-for="item in menuList"
          :key="item.name"
          :ref="(el) => setTabRef(item.name, el)"
          class="column items-center cursor-pointer admin-menu-tab"
          :class="isActive(item.link) ? 'text-blue' : 'text-grey-5'"
          @click="handleTabClick(item)"
        >
          <q-icon :name="item.icon" size="32px" />
          <div class="text-caption text-weight-bold tab-label">{{ item.label }}</div>
        </div>

        <div class="bg-blue footer-tab-indicator" :style="indicatorStyle"></div>
      </div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'src/stores/useAuth';
import { api } from 'src/boot/axios';
import LanguageToggle from 'src/components/LanguageToggle.vue';

const { t, locale } = useI18n({ useScope: 'global' });
const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();
const currentUser = computed(() => authStore.currentUser);

const unreadCount = ref(0);
const fetchUnreadCount = async () => {
  try {
    const { data } = await api.get<{ isRead: boolean }[]>('/notifications');
    unreadCount.value = data.filter((n) => !n.isRead).length;
  } catch {
    unreadCount.value = 0;
  }
};
onMounted(fetchUnreadCount);
watch(() => route.path, fetchUnreadCount);

const API_BASE_URL = import.meta.env.VITE_API_URL as string || 'http://localhost:3000';
const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};
const currentTitle = computed(() => {
  void locale.value;
  const key = route.meta.title as string | undefined;
  return key ? t(key) : t('nav.admin.fallback');
});
const menuList = computed(() => {
  void locale.value;
  return [
    { name: 'dashboard', label: t('nav.admin.menuDashboard'), icon: 'home', link: '/admin' },
    { name: 'work', label: t('nav.admin.menuWork'), icon: 'business_center', link: '/admin/work' },
    { name: 'users', label: t('nav.admin.menuUsers'), icon: 'group', link: '/admin/users' },
    { name: 'teams', label: t('nav.admin.menuTeams'), icon: 'groups', link: '/admin/teams' },
    { name: 'master-data', label: t('nav.admin.menuMasterData'), icon: 'dashboard_customize', link: '/admin/master-data' },
    { name: 'business-dashboard', label: t('nav.admin.menuBusinessDashboard'), icon: 'bar_chart', link: '/admin/dashboard' },
  ];
});

function isActive(link: string) {
  if (link === '/admin') return route.path === '/admin';
  return route.path.startsWith(link);
}

const tabRefs = ref<Record<string, HTMLElement | null>>({});
function setTabRef(name: string, el: unknown) {
  tabRefs.value[name] = (el as HTMLElement) ?? null;
}

const tabsRow = ref<HTMLElement | null>(null);
let tabsRowObserver: ResizeObserver | null = null;

const indicatorStyle = ref({ left: '0px', width: '0px' });
function moveIndicatorTo(el: HTMLElement) {
  indicatorStyle.value = { left: `${el.offsetLeft}px`, width: `${el.offsetWidth}px` };
}

function updateIndicator() {
  const activeItem = menuList.value.find((item) => isActive(item.link));
  const el = activeItem ? tabRefs.value[activeItem.name] : null;
  if (!el) return;
  moveIndicatorTo(el);
}

async function handleTabClick(item: { name: string; link: string }) {
  const el = tabRefs.value[item.name];
  if (el) moveIndicatorTo(el);
  await router.push(item.link);
}

onMounted(() => {
  void nextTick(() => {
    updateIndicator();
    if (tabsRow.value) {
      tabsRowObserver = new ResizeObserver(() => updateIndicator());
      tabsRowObserver.observe(tabsRow.value);
    }
  });
  window.addEventListener('resize', updateIndicator);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateIndicator);
  tabsRowObserver?.disconnect();
  tabsRowObserver = null;
});

watch(() => route.path, () => {
  void nextTick(() => requestAnimationFrame(updateIndicator));
});

// เปลี่ยนภาษาแล้วความกว้างของ label เปลี่ยน ต้องคำนวณตำแหน่งขีดใต้ใหม่
watch(locale, () => {
  void nextTick(() => requestAnimationFrame(updateIndicator));
});
</script>

<style scoped>
.admin-tabs-row {
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.admin-tabs-row::-webkit-scrollbar {
  display: none;
}

/* ทุกช่องกว้างเท่ากันไม่ว่า label ยาวแค่ไหน (flex-basis 0 ไม่ใช้ความกว้างเนื้อหา) */
.admin-menu-tab {
  flex: 1 1 0;
  min-width: 0;
  padding: 0 4px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.footer-tab-indicator {
  position: absolute;
  bottom: 6px;
  height: 2px;
  border-radius: 1px;
  transition: left 0.25s ease, width 0.25s ease;
}

.tab-label {
  width: 100%;
  text-align: center;
  line-height: 1.2;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Page Transition Animations */
.jump-enter-active {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease-out;
}
.jump-leave-active {
  transition: transform 0.15s ease-in, opacity 0.15s ease-in;
}
.jump-enter-from {
  transform: translateY(20px);
  opacity: 0;
}
.jump-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>
