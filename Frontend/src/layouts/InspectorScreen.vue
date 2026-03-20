<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-white text-black" flat bordered>
      <q-toolbar class="justify-center q-py-md">
        <q-toolbar-title class="text-center text-weight-bold" style="font-size: 24px">
          ข้อมูลการตรวจบ้าน
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
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const activeTab = ref('inspection');

const route = useRoute();
const hideBottomBar = computed(() => route.path.includes('/job/'));

function changeTab(tabName: string, path: string) {
  activeTab.value = tabName;
  void router.push(path);
}
</script>

<style scoped>
/* ปรับแต่งเพื่อให้ Footer ดูสะอาดตาเหมือนในรูป */
.q-footer {
  border-top: 1px solid #e0e0e0;
}
</style>
