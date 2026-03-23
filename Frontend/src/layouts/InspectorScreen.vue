<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-white text-black" flat bordered>
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
          @click="changeTab('inspection', '/inspector/dashboard')"
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
          @click="changeTab('progress', '/inspector/progress')"
        >
          <q-icon name="assignment_turned_in" size="32px" />
          <div class="text-caption text-weight-bold">การตรวจความคืบหน้า</div>
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
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();

// ใช้ระบุว่า Tab ไหนกำลัง Active อยู่ (กรณีโหลดหน้าใหม่)
const activeTab = computed(() => {
  if (route.path.includes('/dashboard')) return 'inspection';
  if (route.path.includes('/progress')) return 'progress';
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
  if (route.path === '/inspector/dashboard') {
    return 'การตรวจบ้าน';
  }
  if (route.path.includes('/inspector/job/')) {
    // สามารถเพิ่มเงื่อนไขแยกย่อยได้ เช่น ถ้าอยู่ในหน้า report
    if (route.path.includes('/report')) return 'สรุปรายงาน';
    if (route.path.includes('/inspection')) return 'ดำเนินการตรวจ';
    return 'รายละเอียด';
  }
  return 'ระบบตรวจบ้าน';
});
</script>

<style scoped>
.q-footer {
  border-top: 1px solid #e0e0e0;
}
/* ทำให้ปุ่ม Back อยู่กลางแนวตั้ง */
.absolute-left {
  top: 50%;
  transform: translateY(-50%);
}
</style>
