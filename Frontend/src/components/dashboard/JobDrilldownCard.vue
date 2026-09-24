<template>
  <q-card flat bordered class="job-drilldown-card bg-white shadow-1">
    <div class="q-pa-md">
      <!-- Header with Job Selector -->
      <div class="row items-center justify-between q-mb-md">
        <div class="row items-center">
          <q-avatar size="32px" class="bg-primary text-white q-mr-sm" style="border-radius: 8px;">
            <q-icon name="analytics" size="20px" />
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
        <div style="min-width: 220px; max-width: 320px;">
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
            :placeholder="t('adminWork.workList.searchPlaceholder')"
          >
            <template v-slot:prepend>
              <q-icon name="home_work" size="18px" color="primary" />
            </template>
          </q-select>
        </div>
      </div>

      <!-- No Jobs in this branch Empty State -->
      <div v-if="!currentJob" class="text-center text-grey-5 q-pa-xl">
        <q-icon name="domain_disabled" size="48px" class="q-mb-sm text-grey-4" />
        <div class="text-weight-bold text-dark" style="font-size: 15px;">
          {{ t('adminWork.dashboard.noJobInBranch') }}
        </div>
        <div class="text-caption text-grey-6">
          {{ t('adminWork.dashboard.noJobInBranchSubtitle') }}
        </div>
      </div>

      <!-- Job Content When Selected -->
      <div v-else>
        <!-- 1. Top Meta Banner & House Health Score -->
        <div class="job-meta-banner q-pa-sm q-mb-md bg-grey-1 row items-center justify-between" style="border-radius: 12px;">
          <div class="row items-center q-gutter-x-sm q-gutter-y-xs wrap">
            <span class="text-weight-bold text-dark" style="font-size: 14px;">
              {{ currentJob.title }}
            </span>
            <q-badge color="white" text-color="grey-9" class="q-px-sm q-py-xs shadow-1 text-caption">
              <q-icon name="person" size="13px" class="q-mr-xs text-primary" />
              {{ currentJob.customerName }}
            </q-badge>
            <q-badge v-if="currentJob.inspectorName" color="white" text-color="indigo-9" class="q-px-sm q-py-xs shadow-1 text-caption">
              <q-icon name="badge" size="13px" class="q-mr-xs text-indigo-7" />
              {{ t('adminWork.dashboard.inspectorLabel') }} {{ currentJob.inspectorName }}
            </q-badge>
            <q-badge v-if="currentJob.contractorName" color="white" text-color="orange-9" class="q-px-sm q-py-xs shadow-1 text-caption">
              <q-icon name="handyman" size="13px" class="q-mr-xs text-warning" />
              {{ currentJob.contractorName }}
            </q-badge>
            <q-badge v-if="currentJob.roundNumber" color="indigo-1" text-color="primary" class="q-px-sm q-py-xs text-caption text-weight-bold">
              {{ t('adminWork.dashboard.roundBadge', { round: currentJob.roundNumber }) }}
            </q-badge>
          </div>

          <div class="row items-center q-gutter-x-sm q-mt-xs q-mt-md-none">
            <!-- House Health Score Badge (Sales Pitch) -->
            <div
              class="health-score-badge row items-center q-px-sm q-py-xs"
              :class="healthScoreClass"
            >
              <q-icon :name="healthScoreIcon" size="16px" class="q-mr-xs" />
              <span v-if="hasCompletionScore" class="text-caption text-weight-bold">
                {{ t('adminWork.dashboard.houseHealthScore') }}: {{ currentJob?.completionScore }}% ({{ healthScoreStatusLabel }})
              </span>
              <span v-else class="text-caption text-weight-bold">
                {{ t('adminWork.dashboard.houseHealthScore') }}: {{ t('adminWork.dashboard.pendingSummaryScore') }}
              </span>
            </div>

            <q-btn
              flat
              dense
              no-caps
              color="primary"
              icon-right="arrow_forward"
              size="sm"
              class="q-px-sm"
              :label="t('adminWork.main.taskDetailTitle')"
              @click="navigateToJob(currentJob.jobId, currentJob.inspectionType)"
            />
          </div>
        </div>

        <!-- 2. Content 3 Columns (Defects Categories + Severity Shield + Contractor Progress) -->
        <div v-if="currentJob.resolution.total > 0" class="row q-col-gutter-md">
          <!-- Col 1: หมวดหมู่ Defect ที่พบบ่อยของงานนี้ -->
          <div class="col-12 col-lg-5">
            <div class="sub-card q-pa-sm bg-grey-1 full-height" style="border-radius: 12px;">
              <div class="row items-center justify-between q-mb-sm">
                <span class="text-caption text-weight-bold text-grey-9">
                  {{ t('adminWork.dashboard.topCategoriesInJob') }}
                </span>
                <span class="text-caption text-grey-6" style="font-size: 11px;">
                  {{ currentJob.resolution.total }} {{ t('adminWork.dashboard.pointsUnit') }}
                </span>
              </div>

              <div class="row items-center no-wrap">
                <!-- Donut Chart -->
                <div class="donut-chart-wrapper relative-position q-mr-sm">
                  <svg viewBox="0 0 100 100" class="donut-svg">
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#e2e8f0"
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
                      :stroke-dasharray="`${seg.length} ${circumference - seg.length}`"
                      :stroke-dashoffset="seg.offset"
                      class="donut-segment"
                    />
                  </svg>
                  <div class="donut-center-text">
                    <div class="text-weight-bolder text-dark" style="font-size: 15px; line-height: 1;">
                      {{ currentJob.resolution.total }}
                    </div>
                    <div class="text-caption text-grey-6" style="font-size: 9px;">{{ t('adminWork.dashboard.pointsUnit') }}</div>
                  </div>
                </div>

                <!-- Categories list -->
                <div class="col category-legend-list q-gutter-y-xs">
                  <div
                    v-for="cat in currentJob.defectCategories.slice(0, 4)"
                    :key="cat.categoryId"
                    class="row items-center justify-between no-wrap q-py-none"
                  >
                    <div class="row items-center ellipsis" style="max-width: 70%;">
                      <span class="cat-dot q-mr-xs" :style="{ backgroundColor: cat.color || '#3B82F6' }"></span>
                      <span class="text-caption text-grey-8 ellipsis" style="font-size: 11px;">
                        {{ pickLocalized(cat.categoryName, cat.categoryNameEn) }}
                      </span>
                    </div>
                    <span class="text-caption text-weight-bold text-dark" style="font-size: 11px;">
                      {{ cat.count }} ({{ cat.percentage }}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Col 2: ระดับความรุนแรงและจุดเสี่ยง (Severity Breakdown) -->
          <div class="col-12 col-sm-6 col-lg-3">
            <div class="sub-card q-pa-sm bg-grey-1 full-height column justify-between" style="border-radius: 12px;">
              <div>
                <div class="text-caption text-weight-bold text-grey-9 q-mb-xs">
                  {{ t('adminWork.dashboard.safetyShield') }}
                </div>
                <div class="text-caption text-grey-6 q-mb-sm" style="font-size: 11px;">
                  คัดกรองจุดเสี่ยงความปลอดภัย
                </div>
              </div>

              <div class="row q-col-gutter-xs">
                <!-- Major Box -->
                <div class="col-6">
                  <div class="severity-pill bg-red-1 text-center q-pa-xs" style="border-radius: 8px;">
                    <div class="row items-center justify-center text-negative text-caption text-weight-bold">
                      <q-icon name="warning" size="14px" class="q-mr-xs" />
                      {{ t('adminWork.dashboard.majorDefects') }}
                    </div>
                    <div class="text-h6 text-weight-bolder text-negative" style="line-height: 1.1;">
                      {{ currentJob.majorCount || 0 }}
                    </div>
                    <div class="text-caption text-grey-6" style="font-size: 10px;">
                      {{ majorPct }}% ของงานนี้
                    </div>
                  </div>
                </div>

                <!-- Minor Box -->
                <div class="col-6">
                  <div class="severity-pill bg-blue-1 text-center q-pa-xs" style="border-radius: 8px;">
                    <div class="row items-center justify-center text-primary text-caption text-weight-bold">
                      <q-icon name="info" size="14px" class="q-mr-xs" />
                      {{ t('adminWork.dashboard.minorDefects') }}
                    </div>
                    <div class="text-h6 text-weight-bolder text-primary" style="line-height: 1.1;">
                      {{ currentJob.minorCount || 0 }}
                    </div>
                    <div class="text-caption text-grey-6" style="font-size: 10px;">
                      {{ minorPct }}% ของงานนี้
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Col 3: ความคืบหน้าการแก้ไขของช่าง (Contractor Resolution Progress) -->
          <div class="col-12 col-sm-6 col-lg-4">
            <div class="sub-card q-pa-sm bg-grey-1 full-height column justify-between" style="border-radius: 12px;">
              <div>
                <div class="row items-center justify-between q-mb-xs">
                  <span class="text-caption text-weight-bold text-grey-9">
                    {{ t('adminWork.dashboard.resolutionProgress') }}
                  </span>
                  <span class="text-caption text-weight-bold text-positive">
                    {{ t('adminWork.dashboard.resolvedRate', { pct: currentJob.resolution.completionRate }) }}
                  </span>
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
              </div>

              <!-- Legend Metrics -->
              <div class="row q-col-gutter-xs text-caption">
                <div class="col-4 text-center">
                  <div class="text-weight-bolder text-positive">{{ currentJob.resolution.verified }}</div>
                  <div class="text-grey-6" style="font-size: 10px;">{{ t('adminWork.dashboard.legendVerified', { pct: verifiedPct }) }}</div>
                </div>
                <div class="col-4 text-center">
                  <div class="text-weight-bolder text-primary">{{ currentJob.resolution.repaired }}</div>
                  <div class="text-grey-6" style="font-size: 10px;">{{ t('adminWork.dashboard.legendRepaired', { pct: repairedPct }) }}</div>
                </div>
                <div class="col-4 text-center">
                  <div class="text-weight-bolder text-orange-9">{{ currentJob.resolution.pending }}</div>
                  <div class="text-grey-6" style="font-size: 10px;">{{ t('adminWork.dashboard.legendPending', { pct: pendingPct }) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State When Zero Defects -->
        <div v-else class="text-center text-grey-6 q-pa-lg">
          <q-icon name="verified" size="40px" color="positive" class="q-mb-xs" />
          <div class="text-weight-bold text-dark">{{ t('adminWork.dashboard.noDefectsInJob') }}</div>
          <div class="text-caption text-grey-6">{{ t('adminWork.dashboard.noDefectsInJobSubtitle') }}</div>
        </div>
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
  jobDrilldowns?: JobDrilldownItem[] | undefined;
}>();

const router = useRouter();
const { t } = useI18n();
const { pickLocalized } = useLocalizedField();

const selectedJobId = ref<number | null>(null);

const jobList = computed(() => props.jobDrilldowns || []);

// Options for dropdown
const jobOptions = computed(() => {
  return jobList.value.map((job) => ({
    label: `${job.title} (${job.customerName})`,
    value: job.jobId,
  }));
});

// Auto-select first job if not selected, or reset to null if branch has no jobs
watch(
  jobList,
  (newJobs) => {
    if (!newJobs || newJobs.length === 0) {
      selectedJobId.value = null;
    } else if (
      selectedJobId.value === null ||
      !newJobs.some((j) => j.jobId === selectedJobId.value)
    ) {
      selectedJobId.value = newJobs[0]!.jobId;
    }
  },
  { immediate: true },
);

const currentJob = computed(() => {
  if (!jobList.value.length) return null;
  return (
    jobList.value.find((j) => j.jobId === selectedJobId.value) ??
    jobList.value[0] ??
    null
  );
});

const circumference = 2 * Math.PI * 38; // ~238.76

// Calculate Donut Segments
const donutSegments = computed(() => {
  if (!currentJob.value || !currentJob.value.defectCategories.length) return [];
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
  return Math.round(
    (currentJob.value.resolution.verified / currentJob.value.resolution.total) * 100,
  );
});

const repairedPct = computed(() => {
  if (!currentJob.value || !currentJob.value.resolution.total) return 0;
  return Math.round(
    (currentJob.value.resolution.repaired / currentJob.value.resolution.total) * 100,
  );
});

const pendingPct = computed(() => {
  if (!currentJob.value || !currentJob.value.resolution.total) return 0;
  return Math.max(0, 100 - verifiedPct.value - repairedPct.value);
});

const totalMajorMinor = computed(() => {
  if (!currentJob.value) return 0;
  return (currentJob.value.majorCount || 0) + (currentJob.value.minorCount || 0) || 1;
});

const majorPct = computed(() => {
  if (!currentJob.value) return 0;
  return Math.round(((currentJob.value.majorCount || 0) / totalMajorMinor.value) * 100);
});

const minorPct = computed(() => {
  if (!currentJob.value) return 0;
  return Math.round(((currentJob.value.minorCount || 0) / totalMajorMinor.value) * 100);
});

const hasCompletionScore = computed(() => {
  return currentJob.value?.completionScore != null;
});

const healthScoreClass = computed(() => {
  if (!hasCompletionScore.value) return 'bg-grey-2 text-grey-7';
  const score = currentJob.value!.completionScore!;
  if (score >= 85) return 'bg-green-1 text-positive';
  if (score >= 70) return 'bg-orange-1 text-orange-9';
  return 'bg-red-1 text-negative';
});

const healthScoreIcon = computed(() => {
  if (!hasCompletionScore.value) return 'hourglass_empty';
  const score = currentJob.value!.completionScore!;
  if (score >= 85) return 'verified_user';
  if (score >= 70) return 'gpp_maybe';
  return 'warning';
});

const healthScoreStatusLabel = computed(() => {
  if (!hasCompletionScore.value) return t('adminWork.dashboard.pendingSummaryScore');
  const score = currentJob.value!.completionScore!;
  if (score >= 85) return t('adminWork.dashboard.readyToTransfer');
  if (score >= 70) return t('adminWork.dashboard.moderateStatus');
  return t('adminWork.dashboard.needAction');
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

.health-score-badge {
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.donut-chart-wrapper {
  width: 90px;
  height: 90px;
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
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.stacked-progress-bar {
  height: 8px;
  border-radius: 4px;
  background-color: #e2e8f0;
  overflow: hidden;
  display: flex;
}

.progress-seg {
  height: 100%;
  transition: width 0.4s ease;
}

.seg-verified {
  background-color: #10b981;
}

.seg-repaired {
  background-color: #3b82f6;
}

.seg-pending {
  background-color: #f59e0b;
}
</style>
