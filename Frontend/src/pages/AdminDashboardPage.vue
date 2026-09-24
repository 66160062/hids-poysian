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
            class="branch-select shadow-1"
            bg-color="white"
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
                <div class="text-h6 text-weight-bold text-dark">
                  {{ dashboard.totalProjects }}
                  <span class="text-caption text-grey-6 text-weight-normal">{{ t('adminWork.dashboard.projectsUnit') }}</span>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- 1.2 คิวงานนัดตรวจเดือนนี้ -->
        <div class="col-6 col-md-3 card-stagger">
          <q-card flat bordered class="metric-card bg-white shadow-1">
            <q-card-section class="q-pa-sm row items-center no-wrap">
              <q-avatar size="36px" class="bg-amber-1 text-amber-9 q-mr-sm" style="border-radius: 8px;">
                <q-icon name="event_available" size="20px" />
              </q-avatar>
              <div>
                <div class="text-caption text-grey-7">{{ t('adminWork.dashboard.scheduledThisMonthMetric') }}</div>
                <div class="text-h6 text-weight-bold text-dark">
                  {{ dashboard.scheduledThisMonth || 0 }}
                  <span class="text-caption text-grey-6 text-weight-normal">{{ t('adminWork.dashboard.roundsUnit') }}</span>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- 1.3 รอตรวจอนุมัติเล่ม -->
        <div class="col-6 col-md-3 card-stagger">
          <q-card flat bordered class="metric-card bg-white shadow-1">
            <q-card-section class="q-pa-sm row items-center no-wrap">
              <q-avatar size="36px" class="bg-orange-1 text-orange-9 q-mr-sm" style="border-radius: 8px;">
                <q-icon name="pending_actions" size="20px" />
              </q-avatar>
              <div>
                <div class="text-caption text-grey-7">{{ t('adminWork.dashboard.pendingApprovalMetric') }}</div>
                <div class="text-h6 text-weight-bold text-orange-9">
                  {{ dashboard.pendingApprovalCount || 0 }}
                  <span class="text-caption text-grey-6 text-weight-normal">{{ t('adminWork.dashboard.jobsUnit') }}</span>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- 1.4 ส่งมอบเล่มสำเร็จ -->
        <div class="col-6 col-md-3 card-stagger">
          <q-card flat bordered class="metric-card bg-white shadow-1">
            <q-card-section class="q-pa-sm row items-center no-wrap">
              <q-avatar size="36px" class="bg-green-1 text-positive q-mr-sm" style="border-radius: 8px;">
                <q-icon name="verified" size="20px" />
              </q-avatar>
              <div>
                <div class="text-caption text-grey-7">{{ t('adminWork.dashboard.deliveredProjectsMetric') }}</div>
                <div class="text-h6 text-weight-bold text-positive">
                  {{ dashboard.completedCount || 0 }}
                  <span class="text-caption text-grey-6 text-weight-normal">({{ dashboard.deliverySuccessRate || 0 }}%)</span>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- 2. Row 1: Operational Pipeline & Team Workload -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-lg-7 card-stagger">
          <OperationalPipelineCard :pipeline="operationalPipeline" />
        </div>
        <div class="col-12 col-lg-5 card-stagger">
          <TeamWorkloadCard :team-workloads="teamWorkloads" />
        </div>
      </div>

      <!-- 3. Row 2: Job-Centric Inspection Cockpit / Drilldown -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 card-stagger">
          <JobDrilldownCard :job-drilldowns="jobDrilldowns" />
        </div>
      </div>

      <!-- 4. Row 3: Monthly Trends Business Growth Chart -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 card-stagger">
          <MonthlyTrendChart :trends="monthlyTrends" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { api } from 'src/boot/axios';
import type { AxiosResponse } from 'axios';
import { createIconSpinner } from 'src/composables/useIconSpinner';
import MonthlyTrendChart from 'src/components/dashboard/MonthlyTrendChart.vue';
import TeamWorkloadCard from 'src/components/dashboard/TeamWorkloadCard.vue';
import JobDrilldownCard from 'src/components/dashboard/JobDrilldownCard.vue';
import OperationalPipelineCard from 'src/components/dashboard/OperationalPipelineCard.vue';
import { useBranchStore } from 'src/stores/useBranch';
import type {
  MonthlyTrendItem,
  JobDefectCategoryItem,
  JobDefectResolution,
  TeamWorkloadItem,
  JobDrilldownItem,
  OperationalPipeline,
  BranchOption,
  DashboardStats,
} from 'src/types/dashboard';

const chartSpinner = createIconSpinner('bar_chart');
const $q = useQuasar();
const { t } = useI18n();
const error = ref<string>('');
const branchStore = useBranchStore();

const dashboard = ref<DashboardStats>({
  totalProjects: 0,
  inProgress: 0,
  singleHouse: 0,
  townhouse: 0,
  condo: 0,
  construction: 0,
  totalDefects: 0,
  overallCompletionRate: 0,
  avgCompletionScore: null,
  scheduledThisMonth: 0,
  pendingApprovalCount: 0,
  completedCount: 0,
  deliverySuccessRate: 0,
  homeStatusBreakdown: [],
  constructionStatusBreakdown: [],
});

const branches = ref<BranchOption[]>([]);
const monthlyTrends = ref<MonthlyTrendItem[]>([]);
const topDefectCategories = ref<JobDefectCategoryItem[]>([]);
const overallDefectResolution = ref<JobDefectResolution | undefined>(undefined);
const teamWorkloads = ref<TeamWorkloadItem[]>([]);
const jobDrilldowns = ref<JobDrilldownItem[]>([]);
const operationalPipeline = ref<OperationalPipeline | undefined>(undefined);

const selectedBranchId = computed<number | 'all'>({
  get: () => branchStore.getPageBranch('dashboard'),
  set: (val: number | 'all') => {
    branchStore.setPageBranch('dashboard', val);
  },
});

const branchOptions = computed(() => [
  { label: t('common.branch.all'), value: 'all' as const },
  ...branchStore.branches.map((b) => ({
    label: b.branchName || t('common.branch.fallbackName', { id: b.branchId }),
    value: b.branchId,
  })),
]);

watch(
  () => branchStore.getPageBranch('dashboard'),
  () => {
    void fetchDashboardData();
  },
);

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
      avgCompletionScore: data.avgCompletionScore ?? null,
      scheduledThisMonth: data.scheduledThisMonth || 0,
      pendingApprovalCount: data.pendingApprovalCount || 0,
      completedCount: data.completedCount || 0,
      deliverySuccessRate: data.deliverySuccessRate || 0,
      homeStatusBreakdown: data.homeStatusBreakdown || [],
      constructionStatusBreakdown: data.constructionStatusBreakdown || [],
    };

    branches.value = Array.isArray(data.branches) ? data.branches : [];
    monthlyTrends.value = Array.isArray(data.monthlyTrends) ? data.monthlyTrends : [];
    topDefectCategories.value = Array.isArray(data.topDefectCategories) ? data.topDefectCategories : [];
    overallDefectResolution.value = data.overallDefectResolution;
    teamWorkloads.value = Array.isArray(data.teamWorkloads) ? data.teamWorkloads : [];
    jobDrilldowns.value = Array.isArray(data.jobDrilldowns) ? data.jobDrilldowns : [];
    operationalPipeline.value = data.operationalPipeline;
  } catch (err: unknown) {
    error.value = t('adminWork.main.loadError');
    console.error('fetchDashboardData error:', err);
  } finally {
    $q.loading.hide();
  }
}

onMounted(() => {
  void branchStore.fetchBranches();
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
