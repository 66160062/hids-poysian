<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-white text-black">
      <q-toolbar>
        <q-btn flat round dense icon="arrow_back_ios" color="primary" @click="goBack" />
        <q-toolbar-title class="text-center text-weight-bold text-subtitle1">
          {{ roomName }}
        </q-toolbar-title>
        <div style="width: 32px"></div>
      </q-toolbar>
      <q-separator color="grey-3" />
    </q-header>

    <q-page-container>
      <q-page class="q-pa-md bg-white">
        <div class="row justify-end q-mb-md">
          <q-btn
            outline
            rounded
            color="primary"
            icon="filter_list"
            label="ตัวกรอง"
            size="sm"
            class="q-px-md text-weight-bold bg-white"
          />
        </div>

        <!-- Empty -->
        <div v-if="roomDefects.length === 0" class="text-center q-py-xl">
          <q-icon name="check_circle" color="positive" size="48px" />
          <div class="text-body2 text-grey-6 q-mt-sm">ไม่พบรายการ defect ในห้องนี้</div>
        </div>

        <!-- List -->
        <div v-else class="column q-gutter-y-md">
          <DefectDetailCard
            v-for="defect in roomDefects"
            :key="defect.defectId"
            :defect="toCardData(defect)"
          />
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import DefectDetailCard from '../components/DefectDetailCard.vue';
import { useInspectionStore } from 'src/stores/useInspection';
import type { Defect } from 'src/models';

// ── Route ─────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

const roomName = route.query.roomName as string;
const roomId = Number(route.query.roomId);

// ── Store ─────────────────────────────────────────────────────

const store = useInspectionStore();

// ── Filter defects ตาม roomId ─────────────────────────────────
// groupedDefects ที่ตรงกับ roomId นี้ แล้วดึง defects[] ออกมา

const roomDefects = computed<Defect[]>(() => {
  console.log('roomId from query:', roomId);
  console.log(
    'groupedDefects:',
    store.groupedDefects.map((g) => ({
      groupKey: g.groupKey,
      roomId: g.roomId,
      roomName: g.roomName,
      total: g.totalItems,
    })),
  );
  const group = store.groupedDefects.find((g) => g.roomId === roomId);
  return group?.defects ?? [];
});

// ── Map Defect → DefectDetailCard props ──────────────────────

function toCardData(d: Defect) {
  const room = d.template?.room?.roomName ?? '-';
  const subRoom = d.template?.subRoom?.roomName ?? '-';
  const floor = d.template?.floor?.label ?? '-';

  return {
    defectId: d.defectId,
    imageUrl: d.imageUrl,
    locationLabel: `${room}, ${subRoom}, ${floor}`,
    category: d.subCategories[0]?.category?.name ?? '-',
    severity: d.severity,
    tags: d.subCategories.map((s) => s.name),
    status: d.status,
    description: d.description,
  };
}

// ── Navigation ────────────────────────────────────────────────

const goBack = () => router.back();
</script>
