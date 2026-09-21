<template>
  <q-card flat bordered class="job-drilldown-card bg-white shadow-1">
    <div class="q-pa-md">
      <!-- Header with Job Selector -->
      <div class="row items-center justify-between q-mb-md">
        <div class="row items-center">
          <q-avatar size="32px" class="bg-indigo-1 text-indigo-9 q-mr-sm" style="border-radius: 8px;">
            <q-icon name="donut_large" size="20px" />
          </q-avatar>
          <div>
            <div class="text-weight-bold text-dark" style="font-size: 15px;">
              {{ t('adminWork.dashboard.drilldownTitle') }}
            </div>
            <div class="text-caption text-grey-6">
              {{ t('adminWork.dashboard.drilldownSubtitle') }}
            </div>
          </div>
        </div>

        <!-- Job Selector Dropdown -->
        <div style="min-width: 200px; max-width: 260px;">
          <q-select
            v-model="selectedJobId"
            :options="jobOptions"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            dense
            outlined
            rounded
            class="job-select"
            bg-color="grey-1"
          >
            <template v-slot:prepend>
              <q-icon name="home_work" size="18px" color="primary" />
            </template>
          </q-select>
        </div>
      </div>

      <!-- Selected Job Info Banner -->
      <div v-if="currentJob" class="selected-job-header row items-center justify-between q-pa-sm q-mb-md bg-grey-1" style="border-radius: 10px;">
        <div class="row items-center q-gutter-x-sm">
          <div class="text-weight-bold text-dark" style="font-size: 13px;">{{ currentJob.title }}</div>
          <q-badge color="grey-3" text-color="grey-9" class="q-px-xs text-caption">
            {{ currentJob.customerName }}
          </q-badge>
          <q-badge v-if="currentJob.contractorName" color="orange-1" text-color="orange-9" class="q-px-xs text-caption">
            <q-icon name="handyman" size="12px" class="q-mr-xs" />
            {{ currentJob.contractorName }}
          </q-badge>
        </div>
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          icon-right="arrow_forward"
          size="sm"
          :label="t('adminWork.main.taskDetailTitle')"
          @click="navigateToJob(currentJob.jobId, currentJob.inspectionType)"
        />
      </div>

      <!-- Content Area -->
      <div v-if="currentJob && currentJob.resolution.total > 0" class="row q-col-gutter-md items-center">
        <!-- 1. Donut Chart & Category Breakdown (col-12 col-md-7) -->
        <div class="col-12 col-md-7">
          <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">
            {{ t('adminWork.dashboard.defectCategoryShare') }}
          </div>
          <div class="row items-center">
            <!-- SVG Donut Chart -->
            <div class="donut-chart-wrapper relative-position q-mr-md">
              <svg viewBox="0 0 100 100" class="donut-svg">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#f1f5f9"
                  stroke-width="16"
                />
                <circle
                  v-for="(seg, i) in donutSegments"
                  :key="i"
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  :stroke="seg.color"
                  stroke-width="16"
                  :stroke-dasharray="`${seg.length} ${100 - seg.length}`"
                  :stroke-dashoffset="seg.offset"
                  class="donut-segment"
                />
              </svg>
              <!-- Center Text -->
              <div class="donut-center-text">
                <div class="text-h6 text-weight-bold text-dark" style="line-height: 1;">
                  {{ currentJob.resolution.total }}
                </div>
                <div class="text-caption text-grey-6" style="font-size: 10px;">{{ t('adminWork.dashboard.pointsUnit') }}</div>
              </div>
            </div>

            <!-- Category Legend List -->
            <div class="col category-legend-list">
              <div
                v-for="cat in currentJob.defectCategories"
                :key="cat.categoryId"
                class="category-item row items-center justify-between q-py-xs"
              >
                <div class="row items-center ellipsis" style="max-width: 70%;">
                  <span class="cat-dot q-mr-xs" :style="{ backgroundColor: cat.color || '#3B82F6' }"></span>
                  <span class="text-caption text-grey-8 ellipsis" style="font-size: 12px;">{{ pickLocalized(cat.categoryName, cat.categoryNameEn) }}</span>
                </div>
                <div class="text-caption text-weight-bold text-dark" style="font-size: 12px;">
                  {{ cat.count }} ({{ cat.percentage }}%)
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Defect Resolution Progress Bar (col-12 col-md-5) -->
        <div class="col-12 col-md-5">
          <div class="resolution-box q-pa-sm bg-grey-1" style="border-radius: 12px;">
            <div class="row items-center justify-between q-mb-xs">
              <span class="text-caption text-weight-bold text-grey-8">{{ t('adminWork.dashboard.resolutionProgress') }}</span>
              <span class="text-caption text-weight-bold text-positive">{{ t('adminWork.dashboard.resolvedRate', { pct: currentJob.resolution.completionRate }) }}</span>
            </div>

            <!-- Stacked Progress Bar -->
            <div class="stacked-progress-bar q-mb-sm">
              <div
                class="progress-seg seg-verified"
                :style="{ width: `${verifiedPct}%` }"
                :title="t('adminWork.dashboard.segVerifiedTitle')"
              />
              <div
                class="progress-seg seg-repaired"
                :style="{ width: `${repairedPct}%` }"
                :title="t('adminWork.dashboard.segRepairedTitle')"
              />
              <div
                class="progress-seg seg-pending"
                :style="{ width: `${pendingPct}%` }"
                :title="t('adminWork.dashboard.segPendingTitle')"
              />
            </div>

            <!-- Resolution Legend Metrics -->
            <div class="row q-col-gutter-xs text-caption">
              <div class="col-4 text-center">
                <div class="text-weight-bold text-positive">{{ currentJob.resolution.verified }}</div>
                <div class="text-grey-6" style="font-size: 10px;">{{ t('adminWork.dashboard.legendVerified', { pct: verifiedPct }) }}</div>
              </div>
              <div class="col-4 text-center">
                <div class="text-weight-bold text-primary">{{ currentJob.resolution.repaired }}</div>
                <div class="text-grey-6" style="font-size: 10px;">{{ t('adminWork.dashboard.legendRepaired', { pct: repairedPct }) }}</div>
              </div>
              <div class="col-4 text-center">
                <div class="text-weight-bold text-orange-9">{{ currentJob.resolution.pending }}</div>
                <div class="text-grey-6" style="font-size: 10px;">{{ t('adminWork.dashboard.legendPending', { pct: pendingPct }) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State if no defects found -->
      <div v-else class="text-center text-grey-5 q-pa-lg">
        <q-icon name="task_alt" size="36px" color="positive" class="q-mb-xs" />
        <div class="text-weight-medium text-dark">{{ t('adminWork.dashboard.noDefectsInJob') }}</div>
        <div class="text-caption text-grey-6">{{ t('adminWork.dashboard.noDefectsInJobSubtitle') }}</div>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { JobDrilldownItem } from 'src/types/dashboard';
import { useLocalizedField } from 'src/composables/useLocalizedField';

const props = defineProps<{
  jobDrilldowns: JobDrilldownItem[];
}>();

const router = useRouter();
const { t } = useI18n();
const { pickLocalized } = useLocalizedField();

const selectedJobId = ref<number | null>(null);

// Options for dropdown
const jobOptions = computed(() => {
  return props.jobDrilldowns.map((job) => ({
    label: `${job.title} (${job.customerName})`,
    value: job.jobId,
  }));
});

// Auto-select first job if not selected
watch(
  () => props.jobDrilldowns,
  (jobs) => {
    if (jobs.length > 0 && (selectedJobId.value === null || !jobs.some((j) => j.jobId === selectedJobId.value))) {
      selectedJobId.value = jobs[0]!.jobId;
    }
  },
  { immediate: true },
);

const currentJob = computed(() => {
  return props.jobDrilldowns.find((j) => j.jobId === selectedJobId.value) ?? props.jobDrilldowns[0] ?? null;
});

// Calculate Donut Segments
const donutSegments = computed(() => {
  if (!currentJob.value || !currentJob.value.defectCategories.length) return [];
  const circumference = 2 * Math.PI * 38; // ~238.76
  const total = currentJob.value.resolution.total || 1;

  let currentOffset = 0;
  return currentJob.value.defectCategories.map((cat) => {
    const fraction = cat.count / total;
    const length = fraction * circumference;
    const offset = -currentOffset;
    currentOffset += length;
    return {
      length,
      offset,
      color: cat.color || '#3B82F6',
    };
  });
});

const verifiedPct = computed(() => {
  if (!currentJob.value || !currentJob.value.resolution.total) return 0;
  return Math.round((currentJob.value.resolution.verified / currentJob.value.resolution.total) * 100);
});

const repairedPct = computed(() => {
  if (!currentJob.value || !currentJob.value.resolution.total) return 0;
  return Math.round((currentJob.value.resolution.repaired / currentJob.value.resolution.total) * 100);
});

const pendingPct = computed(() => {
  if (!currentJob.value || !currentJob.value.resolution.total) return 0;
  return Math.round((currentJob.value.resolution.pending / currentJob.value.resolution.total) * 100);
});

function navigateToJob(jobId: number, inspectionType: string) {
  const isConstruction =
    inspectionType === 'CONSTRUCTION_INSPECTION' ||
    inspectionType === 'ตรวจก่อสร้าง' ||
    inspectionType === 'Construction' ||
    inspectionType === 'งานก่อสร้าง';

  if (isConstruction) {
    void router.push(`/admin/work/cons/${jobId}`);
  } else {
    void router.push(`/admin/work/ins/${jobId}`);
  }
}
</script>

<style scoped>
.job-drilldown-card {
  border-radius: 16px;
}

.job-select :deep(.q-field__control) {
  border-radius: 12px;
  height: 38px;
}

.donut-chart-wrapper {
  width: 110px;
  height: 110px;
  flex-shrink: 0;
}

.donut-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.donut-segment {
  transition: stroke-dasharray 0.5s ease;
}

.donut-center-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.cat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.stacked-progress-bar {
  height: 10px;
  border-radius: 6px;
  background-color: #e2e8f0;
  overflow: hidden;
  display: flex;
}

.progress-seg {
  height: 100%;
  transition: width 0.4s ease;
}

.seg-verified {
  background-color: #22c55e;
}

.seg-repaired {
  background-color: #3b82f6;
}

.seg-pending {
  background-color: #f97316;
}
</style>
