<template>
  <q-layout view="lHh Lpr lFf">
    <q-header v-if="!hideHeader" class="bg-white text-dark">
      <q-toolbar class="relative-position no-wrap">
        <template v-if="isJobPage">
          <q-icon
            name="arrow_back_ios_new"
            color="primary"
            size="24px"
            class="cursor-pointer q-mr-xs job-back-icon"
            @click="goBack"
          />
          <q-toolbar-title class="text-weight-bold job-detail-title">{{ headerTitle }}</q-toolbar-title>
          <q-btn
            v-if="isJobDetailPage"
            flat
            no-caps
            :label="t('nav.inspector.editJob')"
            color="primary"
            class="job-edit-btn"
            @click="jobEditDialog.isOpen.value = true"
          />
        </template>
        <template v-else>
          <div class="row items-center no-wrap col" style="min-width: 0">
            <q-icon
              v-if="route.meta.icon"
              :name="route.meta.icon as string"
              color="primary"
              size="24px"
              class="q-mr-xs"
              style="flex-shrink: 0"
            />
            <q-toolbar-title class="text-weight-bold ellipsis">{{ headerTitle }}</q-toolbar-title>
          </div>
          <div class="row items-center no-wrap" style="flex-shrink: 0">
            <LanguageToggle />
            <q-btn
              flat
              round
              icon="notifications_none"
              color="dark"
              :aria-label="t('nav.admin.titleNotifications')"
              @click="$router.push('/inspector/notifications')"
            >
              <q-badge v-if="unreadCount > 0" color="red" floating rounded>{{ unreadCount }}</q-badge>
            </q-btn>
            <q-avatar
              size="34px"
              class="bg-primary text-white q-ml-sm cursor-pointer"
              @click="$router.push('/inspector/profile')"
            >
              <img v-if="currentUser?.imageUrl && !currentUser.imageUrl.includes('unknown.jpg')" :src="getImageUrl(currentUser.imageUrl) ?? ''" />
              <span v-else>{{ currentUser?.fullName?.charAt(0).toUpperCase() || 'I' }}</span>
            </q-avatar>
          </div>
        </template>
      </q-toolbar>
    </q-header>

    <q-page-container class="bg-white">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>

    <q-footer v-if="!hideBottomBar" class="bg-white text-grey-6">
      <div ref="tabsRow" class="row no-wrap justify-around q-py-sm relative-position">
        <div
          ref="inspectionTabRef"
          class="column items-center cursor-pointer"
          :class="activeTab === 'inspection' ? 'text-blue' : 'text-grey-5'"
          @click="changeTab('inspection', '/inspector/Inspectsdashboard')"
        >
          <q-icon name="search" size="32px" />
          <div class="text-caption text-weight-bold">{{ t('nav.inspector.footerInspection') }}</div>
        </div>

        <div
          ref="progressTabRef"
          class="column items-center cursor-pointer"
          :class="activeTab === 'progress' ? 'text-blue' : 'text-grey-5'"
          @click="changeTab('progress', '/inspector/Consdashboard')"
        >
          <q-icon name="construction" size="32px" />
          <div class="text-caption text-weight-bold">{{ t('nav.inspector.footerConstruction') }}</div>
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
import { useInspectorJobEditDialog } from 'src/composables/useInspectorJobEditDialog';

const jobEditDialog = useInspectorJobEditDialog();

const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();

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

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';
const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};

// ใช้ระบุว่า Tab ไหนกำลัง Active อยู่ (กรณีโหลดหน้าใหม่)
const activeTab = computed(() => {
  if (route.path.includes('/dashboard')) return 'inspection';
  if (route.path.includes('/progress') || route.path.includes('/Consdashboard')) return 'progress';
  return 'inspection';
});

const hideBottomBar = computed(() => route.path.includes('/job/'));
const isJobPage = computed(() => route.path.includes('/inspector/job/'));
// เฉพาะหน้ารายละเอียดงาน (ไม่ใช่ inspection/room-defect/report ฯลฯ) เท่านั้นที่แก้ไขได้
const isJobDetailPage = computed(() => /^\/inspector\/job\/[^/]+$/.test(route.path));

const inspectionTabRef = ref<HTMLElement | null>(null);
const progressTabRef = ref<HTMLElement | null>(null);
const tabsRow = ref<HTMLElement | null>(null);
let tabsRowObserver: ResizeObserver | null = null;
const indicatorStyle = ref({ left: '0px', width: '0px' });

function updateIndicator() {
  const el = activeTab.value === 'inspection' ? inspectionTabRef.value : progressTabRef.value;
  if (!el) return;
  indicatorStyle.value = { left: `${el.offsetLeft}px`, width: `${el.offsetWidth}px` };
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

watch(activeTab, () => {
  void nextTick(updateIndicator);
});

// เปลี่ยนภาษาแล้วความกว้างของ label เปลี่ยน ต้องคำนวณตำแหน่งขีดใต้ใหม่
watch(locale, () => {
  void nextTick(updateIndicator);
});

function changeTab(tabName: string, path: string) {
  const el = tabName === 'inspection' ? inspectionTabRef.value : progressTabRef.value;
  if (el) indicatorStyle.value = { left: `${el.offsetLeft}px`, width: `${el.offsetWidth}px` };
  void router.push(path);
}

const goBack = () => {
  router.back();
};

const headerTitle = computed(() => {
  if (route.path === '/inspector/Inspectsdashboard') {
    return t('nav.inspector.headerDashboard');
  }

  if (route.path.includes('/inspector/job/')) {
    if (route.path.includes('/report')) return t('nav.inspector.headerReport');
    if (route.path.includes('/room-defect')) {
      return roomName.value;
    }
    if (route.path.includes('/inspection')) return t('nav.inspector.headerInspection');

    return t('nav.inspector.headerDetail');
  }

  if (route.path === '/inspector/Consdashboard') {
    return t('nav.inspector.headerConstruction');
  }

  return t('nav.inspector.headerDefault');
});

const roomName = computed(() => (route.query.roomName as string) || t('nav.inspector.roomDefectFallback'));

const hideHeader = computed(() => route.path.includes('/add-defect'));
</script>

<style scoped>
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}

.footer-tab-indicator {
  position: absolute;
  bottom: 6px;
  height: 2px;
  border-radius: 1px;
  transition: left 0.25s ease, width 0.25s ease;
}

.job-back-icon {
  position: relative;
  z-index: 2;
}

.job-edit-btn {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
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
