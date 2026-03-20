<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-white text-black">
      <q-toolbar>
        <q-btn flat round dense icon="arrow_back_ios" color="primary" @click="goBack" />
        <q-toolbar-title class="text-center text-weight-bold text-body1">
          การตรวจบ้าน
        </q-toolbar-title>
        <div style="width: 32px"></div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="q-pa-md bg-white" style="padding-bottom: 80px">
        <SearchBar v-model="searchQuery" @filter="onFilterClick" />

        <InspectionSummaryCard class="q-mt-md" :data="summaryData" />

        <div class="q-mt-xl">
          <EmptyState v-if="defectsList.length === 0" message="ไม่พบรายการตรวจ" />

          <div v-else class="column q-gutter-y-md">
            <InspectionItemCard v-for="(item, index) in defectsList" :key="index" :groupedData="item"
              @clickCard="goToRoomDetail" />
          </div>
        </div>

        <ActionFab @add="onAddDefectClick" />
      </q-page>
    </q-page-container>
    <q-footer class="bg-transparent q-px-md q-pb-lg">
      <q-btn color="primary" label="ยืนยันการตรวจ" class="full-width text-weight-bold shadow-3"
        style="border-radius: 8px; height: 48px;" @click="onSubmit" />
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import SearchBar from '../components/SearchBar.vue';
import InspectionSummaryCard from '../components/InspectionSummaryCard.vue';
import EmptyState from '../components/EmptyState.vue';
import InspectionItemCard from '../components/InspectionItemCard.vue';
import ActionFab from '../components/ActionFab.vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const searchQuery = ref('');
const summaryData = ref({
  totalRooms: 1,
  totalJobs: 1,
  totalItems: 1,
  pass: 0,
  fail: 1,
});

const defectsList = ref([
  {
    room_id: 1,
    roomName: 'ห้องนอนใหญ่',
    floor: 1,
    totalItems: 1,
    passCount: 0,
    failCount: 1,
    passPercentage: 0,
    failPercentage: 100,
  },
]);

const goToRoomDetail = async (roomData: { roomName: string; }) => {
  console.log('กดที่ห้อง:', roomData.roomName)
  await router.push({
    path: '/room-defect',
    query: { roomName: roomData.roomName }
  });
};
const goBack = () => {
  console.log('ย้อนกลับไปหน้า Job Details');
};

const onFilterClick = () => {
  console.log('เปิดหน้าต่าง Filter');
};

const onAddDefectClick = async () => {
  await router.push('/add-defect');
};

const onSubmit = () => {
  console.log('บันทึกและยืนยันการตรวจ');
};
</script>
