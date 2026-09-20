<template>
  <q-page class="admin-dashboard-page bg-grey-1 q-pb-xl">
    <div class="page-content">
      <!-- Error Banner -->
      <q-banner v-if="error" class="text-white bg-negative q-mb-md" rounded dense>
        <template v-slot:avatar>
          <q-icon name="error" color="white" />
        </template>
        {{ error }}
        <template v-slot:action>
          <q-btn flat :label="t('adminWork.main.retry')" @click="fetchDashboardData" />
        </template>
      </q-banner>

      <!-- Header & Branch Filter Control -->
      <div class="row items-center justify-between q-mb-md">
        <div>
          <div class="text-h6 text-weight-bold text-dark">
            {{ t('nav.admin.titleBusinessDashboard') }}
          </div>
          <div class="text-caption text-grey-6">
            {{ t('adminWork.dashboard.businessSubtitle') }}
          </div>
        </div>

        <div style="min-width: 180px; max-width: 240px;">
          <q-select
            v-model="selectedBranchId"
            :options="branchOptions"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            dense
            outlined
            rounded
            class="branch-select"
            bg-color="white"
            @update:model-value="onBranchChange"
          >
            <template v-slot:prepend>
              <q-icon name="business" color="primary" size="18px" />
            </template>
          </q-select>
        </div>
      </div>

      <!-- 1. Executive Summary Metric Cards (4 Cards) -->
      <div class="row q-col-gutter-sm q-mb-md">
        <!-- 1.1 โครงการทั้งหมด -->
        <div class="col-6 col-md-3 card-stagger">
          <q-card flat bordered class="metric-card bg-white shadow-1">
            <q-card-section class="q-pa-sm row items-center no-wrap">
              <q-avatar size="36px" class="bg-blue-1 text-primary q-mr-sm" style="border-radius: 8px;">
                <q-icon name="apartment" size="20px" />
              </q-avatar>
              <div>
                <div class="text-caption text-grey-7">{{ t('adminWork.workList.kpiTotalJobs') }}</div>
                <div class="text-h6 text-weight-bold text-dark">{{ dashboard.totalProjects }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- 1.2 กำลังดำเนินการ -->
        <div class="col-6 col-md-3 card-stagger">
          <q-card flat bordered class="metric-card bg-white shadow-1">
            <q-card-section class="q-pa-sm row items-center no-wrap">
              <q-avatar size="36px" class="bg-indigo-1 text-indigo-9 q-mr-sm" style="border-radius: 8px;">
                <q-icon name="engineering" size="20px" />
              </q-avatar>
              <div>
                <div class="text-caption text-grey-7">{{ t('adminWork.workList.kpiActive') }}</div>
                <div class="text-h6 text-weight-bold text-dark">{{ dashboard.inProgress }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- 1.3 อัตราการปิดงานสำเร็จ -->
        <div class="col-6 col-md-3 card-stagger">
          <q-card flat bordered class="metric-card bg-white shadow-1">
            <q-card-section class="q-pa-sm row items-center no-wrap">
              <q-avatar size="36px" class="bg-green-1 text-positive q-mr-sm" style="border-radius: 8px;">
                <q-icon name="check_circle" size="20px" />
              </q-avatar>
              <div>
                <div class="text-caption text-grey-7">{{ t('adminWork.dashboard.completionRateMetric') }}</div>
                <div class="text-h6 text-weight-bold text-positive">{{ dashboard.overallCompletionRate || 0 }}%</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- 1.4 Defect สะสมทั้งหมด -->
        <div class="col-6 col-md-3 card-stagger">
          <q-card flat bordered class="metric-card bg-white shadow-1">
            <q-card-section class="q-pa-sm row items-center no-wrap">
              <q-avatar size="36px" class="bg-orange-1 text-orange-9 q-mr-sm" style="border-radius: 8px;">
                <q-icon name="warning_amber" size="20px" />
              </q-avatar>
              <div>
                <div class="text-caption text-grey-7">{{ t('adminWork.dashboard.totalDefectsMetric') }}</div>
                <div class="text-h6 text-weight-bold text-dark">{{ dashboard.totalDefects || 0 }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- 2. Row 1: Monthly Trends Bar Chart (7) & Top Defect Categories Donut (5) -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-lg-7 card-stagger">
          <MonthlyTrendChart :trends="monthlyTrends" />
        </div>
        <div class="col-12 col-lg-5 card-stagger">
          <DefectCategoryChart :categories="topDefectCategories" />
        </div>
      </div>

      <!-- 3. Row 2: Defect Resolution Health (7) & Team Workload (5) -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-lg-7 card-stagger">
          <DefectResolutionCard :resolution="overallDefectResolution" />
        </div>
        <div class="col-12 col-lg-5 card-stagger">
          <TeamWorkloadCard :teamWorkloads="teamWorkloads" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { api } from 'src/boot/axios';
import type { AxiosResponse } from 'axios';
import { createIconSpinner } from 'src/composables/useIconSpinner';
import MonthlyTrendChart from 'src/components/dashboard/MonthlyTrendChart.vue';
import DefectCategoryChart from 'src/components/dashboard/DefectCategoryChart.vue';
import DefectResolutionCard from 'src/components/dashboard/DefectResolutionCard.vue';
import TeamWorkloadCard from 'src/components/dashboard/TeamWorkloadCard.vue';
import type {
  MonthlyTrendItem,
  JobDefectCategoryItem,
  JobDefectResolution,
  TeamWorkloadItem,
  BranchOption,
  DashboardStats,
} from 'src/types/dashboard';

const chartSpinner = createIconSpinner('bar_chart');
const $q = useQuasar();
const { t } = useI18n();
const error = ref<string>('');

const dashboard = ref<DashboardStats>({
  totalProjects: 0,
  inProgress: 0,
  singleHouse: 0,
  townhouse: 0,
  condo: 0,
  construction: 0,
  totalDefects: 0,
  overallCompletionRate: 0,
  homeStatusBreakdown: [],
  constructionStatusBreakdown: [],
});

const branches = ref<BranchOption[]>([]);
const monthlyTrends = ref<MonthlyTrendItem[]>([]);
const topDefectCategories = ref<JobDefectCategoryItem[]>([]);
const overallDefectResolution = ref<JobDefectResolution | undefined>(undefined);
const teamWorkloads = ref<TeamWorkloadItem[]>([]);

const selectedBranchId = ref<number | 'all'>(getStoredBranchId());

const branchOptions = computed(() => [
  { label: t('common.branch.all'), value: 'all' as const },
  ...branches.value.map((b) => ({
    label: b.name,
    value: b.id,
  })),
]);

function getStoredBranchId(): number | 'all' {
  const branchId = Number(sessionStorage.getItem('adminSelectedBranchId'));
  return Number.isInteger(branchId) && branchId > 0 ? branchId : 'all';
}

function onBranchChange(): void {
  if (selectedBranchId.value === 'all') {
    sessionStorage.removeItem('adminSelectedBranchId');
  } else {
    sessionStorage.setItem('adminSelectedBranchId', String(selectedBranchId.value));
  }
  void fetchDashboardData();
}

async function fetchDashboardData(): Promise<void> {
  $q.loading.show({
    spinner: chartSpinner,
    spinnerColor: 'primary',
    spinnerSize: 70,
    backgroundColor: 'white',
  });
  error.value = '';

  try {
    const params: { branchId?: number } = {};
    if (selectedBranchId.value !== 'all') {
      params.branchId = selectedBranchId.value;
    }

    const res: AxiosResponse<DashboardStats> = await api.get<DashboardStats>('/admin/dashboard', { params });
    const data: DashboardStats = res.data;

    dashboard.value = {
      totalProjects: data.totalProjects || 0,
      inProgress: data.inProgress || 0,
      singleHouse: data.singleHouse || 0,
      townhouse: data.townhouse || 0,
      condo: data.condo || 0,
      construction: data.construction || 0,
      totalDefects: data.totalDefects || 0,
      overallCompletionRate: data.overallCompletionRate || 0,
      homeStatusBreakdown: data.homeStatusBreakdown || [],
      constructionStatusBreakdown: data.constructionStatusBreakdown || [],
    };

    branches.value = Array.isArray(data.branches) ? data.branches : [];
    monthlyTrends.value = Array.isArray(data.monthlyTrends) ? data.monthlyTrends : [];
    topDefectCategories.value = Array.isArray(data.topDefectCategories) ? data.topDefectCategories : [];
    overallDefectResolution.value = data.overallDefectResolution;
    teamWorkloads.value = Array.isArray(data.teamWorkloads) ? data.teamWorkloads : [];
  } catch (err: unknown) {
    error.value = t('adminWork.main.loadError');
    console.error('fetchDashboardData error:', err);
  } finally {
    $q.loading.hide();
  }
}

onMounted(() => {
  void fetchDashboardData();
});
</script>

<style scoped>
.admin-dashboard-page {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.page-content {
  padding: 20px 16px;
}

@media (min-width: 768px) {
  .page-content {
    padding: 24px 20px;
  }
}

.metric-card {
  border-radius: 14px;
}

.branch-select :deep(.q-field__control) {
  border-radius: 12px;
  height: 38px;
}
</style>
