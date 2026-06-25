<template>
  <q-page class="repair-overview bg-grey-1">

    <div class="q-px-md q-pt-md q-pb-xl">

      <!-- Error Banner -->
      <q-banner v-if="error" class="text-white bg-negative q-mb-md" rounded dense>
        {{ error }}
        <template #action>
          <q-btn flat label="ลองใหม่" @click="loadData" />
        </template>
      </q-banner>

      <!-- Search Bar -->
      <q-input
        v-model="search"
        outlined
        dense
        placeholder="ค้นหาประเภทห้อง, ประเภทห้องซ่อม"
        bg-color="white"
        class="q-mb-md search-input"
      >
        <template #prepend><q-icon name="search" color="grey-5" /></template>
        <template #append>
          <q-btn flat round icon="tune" color="grey-6" size="sm" />
        </template>
      </q-input>

      <!-- Summary Stats -->
      <q-card flat bordered class="summary-card q-mb-md">
        <q-card-section class="q-pa-sm">
          <div class="row q-col-gutter-xs">
            <div class="col-4 text-center stat-box">
              <q-icon name="meeting_room" color="grey-6" size="18px" />
              <div class="stat-label">ประเภทห้องทั้งหมด</div>
              <div class="stat-num">{{ stats.totalRoomTypes }}</div>
            </div>
            <div class="col-4 text-center stat-box border-lr">
              <q-icon name="build" color="grey-6" size="18px" />
              <div class="stat-label">ประเภทงานทั้งหมด</div>
              <div class="stat-num">{{ stats.totalJobTypes }}</div>
            </div>
            <div class="col-4 text-center stat-box">
              <q-icon name="list_alt" color="grey-6" size="18px" />
              <div class="stat-label">จำนวนรายการทั้งหมด</div>
              <div class="stat-num">{{ stats.totalItems }}</div>
            </div>
          </div>

          <q-separator class="q-my-sm" />

          <div class="row q-col-gutter-xs">
            <div class="col-6 text-center">
              <div class="row items-center justify-center q-gutter-xs">
                <q-icon name="check_circle" color="green" size="20px" />
                <span class="text-caption text-grey-7">ซ่อมแล้ว</span>
              </div>
              <div class="text-h6 text-green text-weight-bold">{{ stats.passed }}</div>
            </div>
            <div class="col-6 text-center">
              <div class="row items-center justify-center q-gutter-xs">
                <q-icon name="cancel" color="red" size="20px" />
                <span class="text-caption text-grey-7">ยังไม่ซ่อม</span>
              </div>
              <div class="text-h6 text-red text-weight-bold">{{ stats.failed }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Room List -->
      <div
        v-for="room in filteredRooms"
        :key="room.id"
        class="q-mb-sm"
      >
        <q-card flat bordered class="room-card" @click="goToDefectList(room)">
          <q-card-section class="q-pa-md">

            <!-- Room Header -->
            <div class="row items-start justify-between q-mb-sm">
              <div>
                <div class="room-name">{{ room.name }}</div>
                <div class="row items-center q-gutter-xs q-mt-xs">
                  <q-badge
                    v-for="tag in room.tags"
                    :key="tag"
                    :color="tagColor(tag)"
                    :label="tag"
                    outline
                    class="text-caption"
                  />
                  <span class="text-caption text-grey-6">({{ room.count }} รายการ)</span>
                </div>
              </div>
              <q-badge color="primary" outline :label="room.floor" class="floor-badge" />
            </div>

            <!-- Progress Bar -->
            <div class="row items-center q-gutter-sm">
              <div class="col">
                <div class="progress-track">
                  <div
                    class="progress-passed"
                    :style="{ width: `${(room.passed / room.count) * 100}%` }"
                  />
                  <div
                    class="progress-failed"
                    :style="{
                      left: `${(room.passed / room.count) * 100}%`,
                      width: `${(room.failed / room.count) * 100}%`
                    }"
                  />
                </div>
              </div>
              <div class="text-caption text-green text-weight-bold" style="min-width:16px">{{ room.passed }}</div>
              <div class="text-caption text-red text-weight-bold" style="min-width:16px">{{ room.failed }}</div>
            </div>

          </q-card-section>
        </q-card>
      </div>

    </div>

    <!-- View Defects Button -->
    <div class="fixed-bottom q-pa-md bg-transparent">
      <q-btn
        unelevated
        color="primary"
        icon="warning_amber"
        label="View Defects"
        class="full-width view-btn"
        size="md"
        @click="goToAllDefects"
      />
    </div>

  </q-page>
</template>

<script setup lang="ts">

import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useContractorRepair } from 'src/stores/useContractormain'
import { useLinkAccess } from 'src/stores/useLinkAccess'

const route = useRoute()
const { projectId } = useLinkAccess()
const { search, stats, error, filteredRooms, tagColor, fetchRepairData, goToDefectList, goToAllDefects } = useContractorRepair()

function getJobId(): number | null {
  const queryJobId = route.query.jobId
  if (typeof queryJobId === 'string' && queryJobId) return Number(queryJobId)
  return projectId.value
}

async function loadData() {
  const jobId = getJobId()
  if (!jobId) return
  await fetchRepairData(jobId)
}

onMounted(loadData)

</script>

<style scoped>
.repair-overview { max-width: 480px; margin: 0 auto; }

.search-input :deep(.q-field__control) { border-radius: 12px; }

.summary-card {
  border-radius: 14px !important;
  background: #fff !important;
  border-color: #ebebeb !important;
}

.stat-box { padding: 6px 4px; }
.stat-label { font-size: 10px; color: #9e9e9e; margin: 2px 0; line-height: 1.3; }
.stat-num { font-size: 22px; font-weight: 700; color: #212121; }
.border-lr { border-left: 1px solid #eee; border-right: 1px solid #eee; }

.room-card {
  border-radius: 14px !important;
  background: #fff !important;
  border-color: #ebebeb !important;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.room-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }

.room-name { font-size: 15px; font-weight: 700; color: #212121; }
.floor-badge { font-size: 11px; border-radius: 8px; }

.progress-track {
  position: relative;
  height: 8px;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}
.progress-passed {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  background: #4CAF50;
  border-radius: 8px 0 0 8px;
  transition: width 0.4s;
}
.progress-failed {
  position: absolute;
  top: 0; bottom: 0;
  background: #F44336;
  border-radius: 0 8px 8px 0;
  transition: width 0.4s;
}

.view-btn { border-radius: 14px; font-weight: 600; font-size: 15px; }
</style>