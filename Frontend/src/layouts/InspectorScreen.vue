<template>
  <q-layout view="lHh Lpr lFf">
    <q-header v-if="!hideHeader" class="bg-white text-black" flat bordered>
      <q-toolbar class="justify-center q-py-md relative-position">
        <div
          v-if="route.path.includes('/inspector/job/')"
          class="absolute-left q-ml-md flex flex-center"
          style="z-index: 10"
        >
          <q-icon
            name="arrow_back_ios_new"
            size="24px"
            color="primary"
            class="cursor-pointer text-weight-bold"
            @click="goBack"
          />
        </div>

        <q-toolbar-title class="text-center text-weight-bold" style="font-size: 24px">
          {{ headerTitle }}
        </q-toolbar-title>

        <div class="absolute-right q-mr-md flex flex-center" style="z-index: 10">
          <q-btn
            flat
            round
            icon="notifications_none"
            color="dark"
            aria-label="Notifications"
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
      </q-toolbar>
      <q-separator color="blue" size="2px" class="q-mx-md" />
    </q-header>

    <q-page-container class="bg-white">
      <router-view />
    </q-page-container>

    <q-footer v-if="!hideBottomBar" class="bg-white text-grey-6" bordered>
      <div class="row no-wrap justify-around q-py-sm">
        <div
          class="column items-center cursor-pointer"
          :class="activeTab === 'inspection' ? 'text-blue' : 'text-grey-5'"
          @click="changeTab('inspection', '/inspector/Inspectsdashboard')"
        >
          <q-icon name="engineering" size="32px" />
          <div class="text-caption text-weight-bold">การตรวจบ้าน</div>
          <div
            v-if="activeTab === 'inspection'"
            class="bg-blue q-mt-xs"
            style="height: 4px; width: 100%; border-radius: 2px 2px 0 0"
          ></div>
        </div>

        <div
          class="column items-center cursor-pointer"
          :class="activeTab === 'progress' ? 'text-blue' : 'text-grey-5'"
          @click="changeTab('progress', '/inspector/Consdashboard')"
        >
          <q-icon name="assignment_turned_in" size="32px" />
          <div class="text-caption text-weight-bold">การตรวจก่อสร้าง</div>
          <div
            v-if="activeTab === 'progress'"
            class="bg-blue q-mt-xs"
            style="height: 4px; width: 100%; border-radius: 2px 2px 0 0"
          ></div>
        </div>
      </div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/useAuth';
import { api } from 'src/boot/axios';

const router = useRouter();
const route = useRoute();

const authStore = useAuthStore();
const currentUser = computed(() => authStore.currentUser);

const unreadCount = ref(0);
onMounted(async () => {
  try {
    const { data } = await api.get<{ isRead: boolean }[]>('/notifications');
    unreadCount.value = data.filter((n) => !n.isRead).length;
  } catch {
    unreadCount.value = 0;
  }
});

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

function changeTab(tabName: string, path: string) {
  void router.push(path);
}

const goBack = () => {
  router.back();
};

const headerTitle = computed(() => {
  if (route.path === '/inspector/Inspectsdashboard') {
    return 'การตรวจบ้าน';
  }

  if (route.path.includes('/inspector/job/')) {
    if (route.path.includes('/report')) return 'สรุปรายงาน';
    if (route.path.includes('/room-defect')) {
      return roomName.value;
    }
    if (route.path.includes('/inspection')) return 'ดำเนินการตรวจ';

    return 'รายละเอียด';
  }

  if (route.path === '/inspector/Consdashboard') {
    return 'การตรวจก่อสร้าง';
  }

  return 'ระบบตรวจบ้าน';
});

const roomName = computed(() => (route.query.roomName as string) || 'รายการ Defect');

const hideHeader = computed(() => route.path.includes('/add-defect'));
</script>

<style scoped>
.q-footer {
  border-top: 1px solid #e0e0e0;
}
/* ทำให้ปุ่ม Back และปุ่มแจ้งเตือน/โปรไฟล์อยู่กลางแนวตั้ง */
.absolute-left,
.absolute-right {
  top: 50%;
  transform: translateY(-50%);
}
</style>
