<template>
  <q-card flat bordered class="defect-resolution-card bg-white shadow-1">
    <div class="q-pa-md">
      <!-- Card Header -->
      <div class="row items-center justify-between q-mb-md">
        <div class="row items-center">
          <q-avatar size="32px" class="bg-green-1 text-positive q-mr-sm" style="border-radius: 8px;">
            <q-icon name="published_with_changes" size="20px" />
          </q-avatar>
          <div>
            <div class="text-weight-bold text-dark" style="font-size: 15px;">
              {{ t('adminWork.dashboard.defectResolutionTitle') }}
            </div>
            <div class="text-caption text-grey-6">
              {{ t('adminWork.dashboard.defectResolutionSubtitle') }}
            </div>
          </div>
        </div>

        <div class="text-right">
          <div class="text-h6 text-weight-bold text-positive" style="line-height: 1.1;">
            {{ resolution?.completionRate || 0 }}%
          </div>
          <div class="text-caption text-grey-6" style="font-size: 11px;">
            {{ t('adminWork.dashboard.completionRateMetric') }}
          </div>
        </div>
      </div>

      <!-- Resolution Progress Bar -->
      <div class="resolution-bar-container q-mb-md">
        <div class="resolution-bar">
          <div
            class="bar-segment verified"
            :style="{ width: `${verifiedPct}%` }"
            :title="`${t('adminWork.dashboard.verified')}: ${resolution?.verified || 0}`"
          ></div>
          <div
            class="bar-segment repaired"
            :style="{ width: `${repairedPct}%` }"
            :title="`${t('adminWork.dashboard.repaired')}: ${resolution?.repaired || 0}`"
          ></div>
          <div
            class="bar-segment pending"
            :style="{ width: `${pendingPct}%` }"
            :title="`${t('adminWork.dashboard.pending')}: ${resolution?.pending || 0}`"
          ></div>
        </div>
      </div>

      <!-- 3 Status Breakdown Badges -->
      <div class="row q-col-gutter-sm">
        <!-- 1. ตรวจผ่านแล้ว (Verified) -->
        <div class="col-4">
          <div class="stat-pill bg-green-1">
            <div class="row items-center q-gutter-x-xs q-mb-xs">
              <span class="status-indicator bg-positive"></span>
              <span class="text-caption text-weight-bold text-positive">{{ t('adminWork.dashboard.verified') }}</span>
            </div>
            <div class="text-h6 text-weight-bold text-dark">{{ resolution?.verified || 0 }}</div>
            <div class="text-caption text-grey-6" style="font-size: 10px;">{{ verifiedPct }}% ของทั้งหมด</div>
          </div>
        </div>

        <!-- 2. แก้ไขแล้ว รอตรวจ (Repaired) -->
        <div class="col-4">
          <div class="stat-pill bg-blue-1">
            <div class="row items-center q-gutter-x-xs q-mb-xs">
              <span class="status-indicator bg-primary"></span>
              <span class="text-caption text-weight-bold text-primary">{{ t('adminWork.dashboard.repaired') }}</span>
            </div>
            <div class="text-h6 text-weight-bold text-dark">{{ resolution?.repaired || 0 }}</div>
            <div class="text-caption text-grey-6" style="font-size: 10px;">{{ repairedPct }}% ของทั้งหมด</div>
          </div>
        </div>

        <!-- 3. รอดำเนินการ (Pending) -->
        <div class="col-4">
          <div class="stat-pill bg-orange-1">
            <div class="row items-center q-gutter-x-xs q-mb-xs">
              <span class="status-indicator bg-warning"></span>
              <span class="text-caption text-weight-bold text-orange-9">{{ t('adminWork.dashboard.pending') }}</span>
            </div>
            <div class="text-h6 text-weight-bold text-dark">{{ resolution?.pending || 0 }}</div>
            <div class="text-caption text-grey-6" style="font-size: 10px;">{{ pendingPct }}% ของทั้งหมด</div>
          </div>
        </div>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { JobDefectResolution } from 'src/types/dashboard';

const props = defineProps<{
  resolution?: JobDefectResolution | undefined;
}>();

const { t } = useI18n();

const total = computed(() => props.resolution?.total || 0);

const verifiedPct = computed(() => {
  if (!total.value) return 0;
  return Math.round(((props.resolution?.verified || 0) / total.value) * 100);
});

const repairedPct = computed(() => {
  if (!total.value) return 0;
  return Math.round(((props.resolution?.repaired || 0) / total.value) * 100);
});

const pendingPct = computed(() => {
  if (!total.value) return 0;
  return Math.max(0, 100 - verifiedPct.value - repairedPct.value);
});
</script>

<style scoped>
.defect-resolution-card {
  border-radius: 16px;
  min-height: 270px;
}

.resolution-bar-container {
  width: 100%;
}

.resolution-bar {
  display: flex;
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
  background-color: #f1f5f9;
}

.bar-segment {
  height: 100%;
  transition: width 0.4s ease;
}

.bar-segment.verified {
  background-color: #10b981;
}

.bar-segment.repaired {
  background-color: #3b82f6;
}

.bar-segment.pending {
  background-color: #f59e0b;
}

.stat-pill {
  border-radius: 10px;
  padding: 8px 10px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.status-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}
</style>
