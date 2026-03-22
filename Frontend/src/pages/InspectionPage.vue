<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-white text-black">
      <q-toolbar>
        <q-btn flat round dense icon="arrow_back_ios" color="primary" @click="goBack" />
        <q-toolbar-title class="text-center text-weight-bold text-body1">
          การตรวจบ้าน
        </q-toolbar-title>
        <div style="width: 32px" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="q-pa-md bg-white" style="padding-bottom: 80px">
        <!-- Search + Filter -->
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

        <!-- Group by chips -->
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

        <!-- Summary -->
        <InspectionSummaryCard class="q-mt-md" :data="store.summaryData" />

        <div class="q-mt-lg">
          <!-- Loading -->
          <div v-if="store.isLoadingDefects" class="column q-gutter-y-md">
            <q-skeleton
              v-for="n in 3"
              :key="n"
              type="rect"
              height="80px"
              style="border-radius: 8px"
            />
          </div>

          <!-- Error -->
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

          <!-- Empty -->
          <EmptyState v-else-if="store.groupedDefects.length === 0" message="ไม่พบรายการตรวจ" />

          <!-- List -->
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
        label="ยืนยันการตรวจ"
        class="full-width text-weight-bold shadow-3"
        style="border-radius: 8px; height: 48px"
        :loading="isSubmitting"
        @click="onSubmit"
      />
    </q-footer>

    <!-- Filter Bottom Sheet -->
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

import SearchBar from '../components/SearchBar.vue';
import InspectionSummaryCard from '../components/InspectionSummaryCard.vue';
import EmptyState from '../components/EmptyState.vue';
import InspectionItemCard from '../components/InspectionItemCard.vue';
import ActionFab from '../components/ActionFab.vue';
import FilterBottomSheet from '../components/FilterBottomSheet.vue';
import { useInspectionStore } from 'src/stores/useInspection';
import { api } from 'src/boot/axios';

// ── Route ─────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();
const roundId = route.params.roundId as string;

// ── Store ─────────────────────────────────────────────────────

const store = useInspectionStore();

// ── UI state ──────────────────────────────────────────────────

const showFilter = ref(false);
const isSubmitting = ref(false);

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

const goToRoomDetail = async (roomData: { room_id: number; roomName: string }) => {
  await router.push({
    name: 'roomDefect',
    params: { roundId },
    query: { roomName: roomData.roomName, roomId: roomData.room_id },
  });
};

const goBack = () => router.back();

const onAddDefectClick = () => {
  void router.push({ name: 'addDefect', params: { roundId } });
};

// ── Submit ────────────────────────────────────────────────────

const onSubmit = async () => {
  isSubmitting.value = true;
  try {
    await api.patch(`/inspection-rounds/${roundId}/submit`);
    await router.push({ name: 'inspectionComplete', params: { roundId } });
  } finally {
    isSubmitting.value = false;
  }
};
</script>
