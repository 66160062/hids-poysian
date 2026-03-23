<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="q-pa-md bg-white" style="padding-bottom: 80px">
        <SearchBar v-model="store.searchQuery" @filter="showFilter = true">
          <template #filter-btn>
            <q-btn flat round @click="showFilter = true">
              <q-icon name="tune" color="grey-7" size="22px" />
              <q-badge v-if="store.activeFilterCount > 0" color="primary" floating rounded>
                {{ store.activeFilterCount }}
              </q-badge>
            </q-btn>
          </template>
        </SearchBar>

        <div class="row q-mt-sm q-gutter-xs">
          <q-chip
            v-for="opt in GROUP_BY_OPTIONS"
            :key="opt.value"
            :selected="store.filter.groupBy === opt.value"
            :color="store.filter.groupBy === opt.value ? 'primary' : 'grey-3'"
            :text-color="store.filter.groupBy === opt.value ? 'white' : 'grey-8'"
            dense
            clickable
            @click="store.filter.groupBy = opt.value"
          >
            {{ opt.label }}
          </q-chip>
        </div>

        <InspectionSummaryCard class="q-mt-md" :data="store.summaryData" />

        <div class="q-mt-lg">
          <div v-if="store.isLoadingDefects" class="column q-gutter-y-md">
            <q-skeleton
              v-for="n in 3"
              :key="n"
              type="rect"
              height="80px"
              style="border-radius: 8px"
            />
          </div>

          <div v-else-if="store.defectsError" class="text-center q-py-xl">
            <q-icon name="error_outline" color="negative" size="48px" />
            <div class="text-body2 text-grey-6 q-mt-sm">{{ store.defectsError }}</div>
            <q-btn
              flat
              color="primary"
              label="ลองใหม่"
              class="q-mt-sm"
              @click="store.fetchDefects(roundId)"
            />
          </div>

          <EmptyState v-else-if="store.groupedDefects.length === 0" message="ไม่พบรายการตรวจ" />

          <div v-else class="column q-gutter-y-md">
            <InspectionItemCard
              v-for="item in store.groupedDefects"
              :key="item.groupKey"
              :groupedData="item"
              @clickCard="goToRoomDetail"
            />
          </div>
        </div>

        <ActionFab @add="onAddDefectClick" />
      </q-page>
    </q-page-container>

    <q-footer class="bg-transparent q-px-md q-pb-lg">
      <q-btn
        color="primary"
        :label="isAlreadyInspected ? 'ยืนยันการตรวจเสร็จสิ้น' : 'บันทึกการแก้ไขการตรวจ'"
        class="full-width text-weight-bold shadow-3"
        style="border-radius: 8px; height: 48px"
        :loading="isSubmitting"
        @click="confirmInspectionDialog"
      />
    </q-footer>

    <FilterBottomSheet
      v-model="showFilter"
      :current-filter="store.filter"
      :available-floors="store.availableFloors"
      :available-room-types="store.availableRoomTypes"
      :available-severity-levels="store.availableSeverityLevels"
      @apply="store.applyFilter"
      @reset="store.resetFilter"
    />
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar'; // นำเข้า Quasar สำหรับ Dialog และ Notify

import SearchBar from '../components/SearchBar.vue';
import InspectionSummaryCard from '../components/InspectionSummaryCard.vue';
import EmptyState from '../components/EmptyState.vue';
import InspectionItemCard from '../components/InspectionItemCard.vue';
import ActionFab from '../components/ActionFab.vue';
import FilterBottomSheet from '../components/FilterBottomSheet.vue';
import { useInspectionStore } from 'src/stores/useInspection';
import { api } from 'src/boot/axios'; // ปลดคอมเมนต์

// ── Route & Plugins ───────────────────────────────────────────

const route = useRoute();
const router = useRouter();
const $q = useQuasar(); // ใช้สร้าง Dialog
const roundId = route.params.roundId as string;

// ── Store ─────────────────────────────────────────────────────

const store = useInspectionStore();

// ── UI state ──────────────────────────────────────────────────

const showFilter = ref(false);
const isSubmitting = ref(false); // ปลดคอมเมนต์

const GROUP_BY_OPTIONS = [
  { value: 'room_type' as const, label: 'ประเภทห้อง' },
  { value: 'floor' as const, label: 'ชั้น' },
  { value: 'severity' as const, label: 'ความรุนแรง' },
];

// ── Lifecycle ─────────────────────────────────────────────────

onMounted(() => {
  void store.fetchDefects(roundId);
});

// ── Navigation ────────────────────────────────────────────────

const goToRoomDetail = async (roomData: { roomId: number; roomName: string; groupKey: number }) => {
  await router.push({
    name: 'roomDefect',
    params: { roundId },
    query: { roomName: roomData.roomName, groupKey: roomData.groupKey },
  });
};

const onAddDefectClick = () => {
  void router.push({ name: 'addDefect', params: { roundId } });
};

// ── Confirm Inspection (แทนที่ onSubmit เดิม) ───────────────────
async function executeConfirmInspection() {
  isSubmitting.value = true;
  try {
    // ยิงไปเส้น confirm-inspection ตามที่คุณสร้างไว้
    await api.patch(`/inspection-rounds/${roundId}/confirm-inspection`);

    $q.notify({
      color: 'positive',
      position: 'top',
      message: 'ยืนยันการตรวจสำเร็จ',
      icon: 'check_circle',
    });

    // ยืนยันเสร็จ เด้งกลับไปหน้า Detail หลัก
    await router.push(`/inspector/job/${roundId}/`);
  } catch (error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    console.error('Confirm Inspection Error:', axiosError);

    $q.notify({
      color: 'negative',
      position: 'top',
      message: axiosError.response?.data?.message || 'เกิดข้อผิดพลาดในการยืนยันการตรวจ',
    });
  } finally {
    isSubmitting.value = false;
  }
}

// ผูกกับปุ่มในหน้า UI มี Dialog คอนเฟิร์มกันลั่นด้วย
const confirmInspectionDialog = () => {
  $q.dialog({
    title: 'ยืนยันการตรวจ',
    message: 'ยืนยันการตรวจสอบและบันทึก Defect ?',
    ok: {
      label: 'ยืนยัน',
      color: 'primary',
    },
    cancel: {
      label: 'ยกเลิก',
      color: 'grey-7',
      flat: true, // ทำให้ปุ่มยกเลิกไม่มีพื้นหลัง ดูเป็นปุ่มรอง
    },
    persistent: true,
  }).onOk(() => {
    void executeConfirmInspection();
  });
};

const isAlreadyInspected = ref(false);
</script>
