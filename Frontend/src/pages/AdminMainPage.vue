<template>
  <q-page class="admin-page bg-grey-1">
    <div class="page-content">
      <!-- Error Banner -->
      <q-banner v-if="error" class="text-white bg-negative q-mb-md" rounded dense>
        <template v-slot:avatar>
          <q-icon name="error" color="white" />
        </template>
        {{ error }}
        <template v-slot:action>
          <q-btn flat :label="t('adminWork.main.retry')" @click="fetchAdminDashboard" />
        </template>
      </q-banner>

      <q-select
        v-model="selectedBranchId"
        :options="branchOptions"
        option-value="value"
        option-label="label"
        emit-value
        map-options
        dense
        outlined
        class="branch-select q-mb-md"
        :label="t('common.branch.label')"
        @update:model-value="onBranchChange"
      >
        <template v-slot:prepend>
          <q-icon name="business" color="primary" />
        </template>
      </q-select>
      <!-- <q-banner v-if="branches.length" rounded class="bg-blue-1 text-primary q-mb-md"> -->
        <!-- <template #avatar><q-icon name="groups" /></template>
        <div class="text-weight-bold">{{ selectedBranchDisplayName }}</div>
        <div class="text-caption">{{ selectedBranchId === 'all' ? 'กำลังแสดงงานของทุกทีมตรวจ' : 'กำลังแสดงงานของทีมตรวจ / Branch นี้' }}</div> -->
      <!-- </q-banner> -->
      <!-- <q-banner v-if="branches.length === 0" rounded class="bg-orange-1 text-orange-9 q-mb-md">
        <template #avatar><q-icon name="info" /></template>
        ยังไม่มี Branch — สร้างทีมตรวจ แล้วระบบจะสร้าง Branch ให้เมื่อมีการเปิดเล่มหรือมอบหมายงาน
      </q-banner> -->
      <!-- <div class="row justify-end q-mb-sm">
        <q-btn flat dense color="primary" icon="groups" label="จัดการทีมตรวจ / Branch" to="/admin/teams" />
      </div> -->

      <div class="row q-col-gutter-md q-mb-md kpi-grid">
        <div class="col-6 col-md-3 card-stagger">
          <q-card
            flat
            bordered
            class="stat-box relative-position overflow-hidden cursor-pointer"
            v-ripple
            tabindex="0"
            role="button"
            @click="openWorkList()"
            @keyup.enter="openWorkList()"
          >
            <div class="bg-blob blob-blue"></div>
            <q-avatar size="36px" class="bg-blue-1 text-blue q-mb-sm" style="border-radius: 8px;">
              <q-icon name="assignment_turned_in" size="20px" />
            </q-avatar>
            <div class="text-h4 text-weight-bold text-dark q-mb-xs">{{ dashboard.totalProjects.toLocaleString() }}</div>
            <div class="text-caption text-grey-6" style="line-height: 1.2;">
              {{ t('adminWork.main.totalProjectsLine1') }}<br>{{ t('adminWork.main.totalProjectsLine2') }}
            </div>
          </q-card>
        </div>
        <div class="col-6 col-md-3 card-stagger">
          <q-card
            flat
            bordered
            class="stat-box relative-position overflow-hidden cursor-pointer"
            v-ripple
            tabindex="0"
            role="button"
            @click="openWorkList({ status: 'Active' })"
            @keyup.enter="openWorkList({ status: 'Active' })"
          >
            <div class="bg-blob blob-orange"></div>
            <div class="absolute-top-right q-pa-sm">
              <div class="orange-dot"></div>
            </div>
            <q-avatar size="36px" class="bg-orange-1 text-orange q-mb-sm" style="border-radius: 8px;">
              <q-icon name="pending_actions" size="20px" />
            </q-avatar>
            <div class="text-h4 text-weight-bold text-dark q-mb-xs">{{ dashboard.inProgress }}</div>
            <div class="text-caption text-grey-6" style="line-height: 1.2;">
              {{ t('adminWork.main.inProgress') }}
            </div>
          </q-card>
        </div>
        <div class="col-6 col-md-3 card-stagger">
          <q-card
            flat
            bordered
            class="mini-card cursor-pointer"
            v-ripple
            tabindex="0"
            role="button"
            @click="openWorkList({ jobType: 'home' })"
            @keyup.enter="openWorkList({ jobType: 'home' })"
          >
            <div class="row items-center q-mb-xs">
              <div class="dot-indicator bg-blue q-mr-sm"></div>
              <div class="text-grey-7" style="font-size: 13px;">{{ t('adminWork.main.homeInspectionJobs') }}</div>
            </div>
            <div class="text-h5 text-weight-bold text-dark">{{ dashboard.totalProjects - dashboard.construction }}</div>
            <div v-if="dashboard.homeStatusBreakdown.length" class="status-breakdown">
              <div v-for="item in dashboard.homeStatusBreakdown" :key="item.statusCode" class="status-row">
                <span class="status-row-dot" :style="{ backgroundColor: statusAccentColor(item.statusCode).text }"></span>
                <span class="status-row-label">{{ jobStatusLabel(item.statusCode) }}</span>
                <span
                  class="status-row-count"
                  :style="{ color: statusAccentColor(item.statusCode).text }"
                >{{ item.count }}</span>
              </div>
            </div>
          </q-card>
        </div>
        <div class="col-6 col-md-3 card-stagger">
          <q-card
            flat
            bordered
            class="mini-card cursor-pointer"
            v-ripple
            tabindex="0"
            role="button"
            @click="openWorkList({ jobType: 'construction' })"
            @keyup.enter="openWorkList({ jobType: 'construction' })"
          >
            <div class="row items-center q-mb-xs">
              <div class="dot-indicator bg-orange q-mr-sm"></div>
              <div class="text-grey-7" style="font-size: 13px;">{{ t('adminWork.main.constructionJobs') }}</div>
            </div>
            <div class="text-h5 text-weight-bold text-dark">{{ dashboard.construction }}</div>
            <div v-if="dashboard.constructionStatusBreakdown.length" class="status-breakdown">
              <div v-for="item in dashboard.constructionStatusBreakdown" :key="item.statusCode" class="status-row">
                <span class="status-row-dot" :style="{ backgroundColor: statusAccentColor(item.statusCode).text }"></span>
                <span class="status-row-label">{{ jobStatusLabel(item.statusCode) }}</span>
                <span
                  class="status-row-count"
                  :style="{ color: statusAccentColor(item.statusCode).text }"
                >{{ item.count }}</span>
              </div>
            </div>
          </q-card>
        </div>
      </div>

      <div class="row q-col-gutter-md q-mb-md content-grid">
      <div class="col-12 col-lg-7 card-stagger card-stagger--delay-5">
      <q-card flat bordered class="calendar-card full-height-card">
        <div class="q-pa-md">
          <div class="row items-center justify-between q-mb-md">
            <div class="text-weight-bold text-h6" style="font-size: 16px;">{{ t('adminWork.main.monthlySchedule') }}</div>
            <q-btn unelevated color="blue-1" text-color="primary" :label="t('adminWork.main.today')" size="sm" class="today-btn" @click="setToday" />
          </div>
          <div class="row items-center justify-between">
            <div class="row items-center text-dark text-weight-bold" style="font-size: 15px;">
              <q-icon name="calendar_today" color="primary" size="20px" class="q-mr-sm" />
              {{ currentMonthName }} {{ displayYear }}
            </div>
            <div class="row q-gutter-x-sm">
              <q-btn outline round color="grey-4" text-color="dark" icon="chevron_left" size="sm" class="nav-btn" @click="prevMonth" />
              <q-btn outline round color="grey-4" text-color="dark" icon="chevron_right" size="sm" class="nav-btn" @click="nextMonth" />
            </div>
          </div>
        </div>

        <div class="calendar-header-grid">
          <div class="day-name" v-for="(d, i) in dayNames" :key="dayKeys[i]">{{ d }}</div>
        </div>

        <div class="calendar-grid-wrapper">
          <div class="calendar-grid-table">
            <div
              v-for="(day, index) in calendarDaysList"
              :key="index"
              class="cal-cell"
              :class="{
                'not-current-month': !day.isCurrentMonth,
                'is-today': isToday(day.date, day.isCurrentMonth)
              }"
            >
              <div class="date-number">{{ day.date }}</div>
              <div
                v-if="day.isCurrentMonth && taskCountByDay(day.date) > 0"
                class="task-count-badge"
              >
                {{ taskCountByDay(day.date) }}
              </div>
            </div>
          </div>
        </div>

        <div class="calendar-footer row items-center justify-between">
          <div class="text-caption text-weight-medium text-grey-8">{{ t('adminWork.main.dailyInspectionTotal') }}</div>
          <div class="row items-center">
            <div class="small-blue-dot q-mr-xs"></div>
            <div class="text-caption text-grey-6">{{ t('adminWork.main.jobCount') }}</div>
          </div>
        </div>
      </q-card>
      </div>

      <div class="col-12 col-lg-5 card-stagger card-stagger--delay-6">
      <q-card flat bordered class="work-list-card full-height-card">
        <div class="row items-center justify-between q-pa-md">
          <div class="row items-center text-weight-bold text-dark" style="font-size: 16px;">
            <q-icon name="playlist_add_check" color="primary" size="24px" class="q-mr-sm" />
            {{ t('adminWork.main.workList') }}
          </div>
          <div
            class="text-primary text-weight-medium cursor-pointer"
            style="font-size: 13px;"
            @click="goToWorkList"
          >
            {{ t('adminWork.main.viewAll') }}
          </div>
        </div>

        <q-separator />



        <div class="task-list-container">
          <div
            v-for="task in visibleTasks"
            :key="task.id"
            class="task-item task-item-stagger row items-center q-px-md q-py-sm clickable"
            @click="openTaskDetail(task)"
          >
            <div class="q-mr-md">
              <q-avatar size="48px" :class="task.avatarBgClass" :text-color="task.avatarTextColor">
                <q-icon :name="task.icon" size="24px" />
              </q-avatar>
            </div>

            <div class="col min-w-0">
              <div class="text-weight-bold text-dark ellipsis" style="font-size: 14px;">{{ task.title }}</div>
              <div v-if="getTaskBranchName(task)" class="text-grey-6 ellipsis" style="font-size: 12px; margin-top: 2px;">
                {{ getTaskBranchName(task) }}
              </div>
              <div class="text-grey-6 ellipsis" style="font-size: 12px; margin-top: 2px;">{{ task.inspectionType === 'CONSTRUCTION_INSPECTION' || task.inspectionType === 'ตรวจก่อสร้าง' ? t('adminWork.main.constructionJob') : t('adminWork.main.homeInspectionJob') }}</div>
            </div>

            <div class="q-pl-sm">
              <q-badge
                :class="task.statusBgClass"
                :text-color="task.statusTextColor"
                class="status-badge"
              >
                {{ jobStatusLabel(task.statusCode, task.roundNumber) }}
              </q-badge>
            </div>
          </div>
        </div>

        <div class="row items-center justify-between q-pa-sm bg-grey-1" style="border-top: 1px solid #f0f0f0;">
          <q-btn
            dense flat round color="grey-7" icon="chevron_left"
            :disabled="currentPage === 1"
            @click="currentPage = Math.max(1, currentPage - 1)"
          />
          <div class="text-caption text-grey-7">{{ t('adminWork.main.pageOf', { current: currentPage, total: totalPages }) }}</div>
          <q-btn
            dense flat round color="grey-7" icon="chevron_right"
            :disabled="currentPage === totalPages"
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
          />
        </div>
      </q-card>
      </div>
      </div>

      <!-- <div class="text-center text-caption text-grey-5 q-mt-sm">HIDS Admin v1.0</div> -->

      <q-dialog v-model="showTaskDialog" persistent>
        <q-card style="min-width: 320px; max-width: 90vw">
          <q-card-section class="row items-center justify-between">
            <div class="text-h6">{{ t('adminWork.main.taskDetailTitle') }}</div>
            <q-btn dense flat icon="close" @click="showTaskDialog = false" />
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="text-subtitle1 q-mb-xs">{{ selectedTask?.title }}</div>
            <div class="text-caption q-mb-xs">{{ formatTaskMeta(selectedTask) }}</div>
            <div v-if="selectedTaskBranchName" class="q-mb-sm">
              {{ t('common.branch.labelWithColon') }} <strong>{{ selectedTaskBranchName }}</strong>
            </div>
            <div class="q-mb-sm">
              {{ t('adminWork.main.statusLabel') }} <strong>{{ jobStatusLabel(selectedTask?.statusCode, selectedTask?.roundNumber) }}</strong>
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat :label="t('adminWork.main.close')" @click="showTaskDialog = false" />
            <q-btn color="primary" :label="t('adminWork.main.goToList')" @click="goToWorkList" />
          </q-card-actions>
        </q-card>
      </q-dialog>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { api } from 'src/boot/axios';
import type { AxiosResponse } from 'axios';
import { createIconSpinner } from 'src/composables/useIconSpinner';
import { useJobStatus, type JobStatusCode } from 'src/composables/useJobStatus';
import type {
  BranchOption,
  DashboardStats,
} from 'src/types/dashboard';

const homeSpinner = createIconSpinner('home');
const router = useRouter();
const $q = useQuasar();
const { t, locale } = useI18n();
const { jobStatusLabel } = useJobStatus();
const error = ref<string>('');

const STATUS_ACCENT_COLORS: Partial<Record<JobStatusCode, { bg: string; text: string }>> = {
  IN_PROGRESS: { bg: '#e3f2fd', text: '#1565c0' },
  PENDING_APPROVAL: { bg: '#fff3e0', text: '#c9660c' },
  COMPLETED: { bg: '#e6f4ea', text: '#1e7e34' },
  CANCELLED: { bg: '#fdecea', text: '#c62828' },
  DRAFT: { bg: '#eeeef0', text: '#5f6368' },
};
const DEFAULT_STATUS_ACCENT_COLOR = { bg: '#eeeef0', text: '#5f6368' };

function statusAccentColor(code: JobStatusCode): { bg: string; text: string } {
  return STATUS_ACCENT_COLORS[code] ?? DEFAULT_STATUS_ACCENT_COLOR;
}

const dashboard = ref<DashboardStats>({
  totalProjects: 0,
  inProgress: 0,
  singleHouse: 0,
  townhouse: 0,
  condo: 0,
  construction: 0,
  homeStatusBreakdown: [],
  constructionStatusBreakdown: [],
});

const branches = ref<BranchOption[]>([]);
const selectedBranchId = ref<number | 'all'>(getStoredBranchId());
const branchOptions = computed(() => [
  { label: t('common.branch.all'), value: 'all' as const },
  ...branches.value.map((branch) => ({
    label: branch.name,
    value: branch.id,
  })),
]);
// const selectedBranchDisplayName = computed(() => {
//   if (selectedBranchId.value === 'all') return '';
//   return branches.value.find((branch) => branch.id === selectedBranchId.value)?.name ?? 'ทีมตรวจที่เลือก';
// });

// ==========================================
// 🎯 ระบบปฏิทิน
// ==========================================
const today = new Date();
const displayMonth = ref(today.getMonth());
const displayYear = ref(today.getFullYear());

// เริ่มสัปดาห์วันจันทร์ ให้ตรงกับ startOffset ใน calendarDaysList
const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const dayNames = computed(() => dayKeys.map((key) => t(`adminWork.main.days.${key}`)));
const monthKeys = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
] as const;

const currentMonthName = computed(() => t(`adminWork.main.months.${monthKeys[displayMonth.value]}`));

const calendarDaysList = computed(() => {
  const year = displayYear.value;
  const month = displayMonth.value;

  const firstDayObj = new Date(year, month, 1).getDay();
  const startOffset = firstDayObj === 0 ? 6 : firstDayObj - 1;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const daysArray = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    daysArray.push({ date: daysInPrevMonth - i, isCurrentMonth: false });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push({ date: i, isCurrentMonth: true });
  }

  const totalCells = daysArray.length > 35 ? 42 : 35;
  let nextDay = 1;
  while (daysArray.length < totalCells) {
    daysArray.push({ date: nextDay++, isCurrentMonth: false });
  }

  return daysArray;
});

const isToday = (date: number, isCurrentMonth: boolean) => {
  const t = new Date();
  return isCurrentMonth &&
         date === t.getDate() &&
         displayMonth.value === t.getMonth() &&
         displayYear.value === t.getFullYear();
};

const prevMonth = (): void => {
  if (displayMonth.value === 0) {
    displayMonth.value = 11;
    displayYear.value--;
  } else {
    displayMonth.value--;
  }
  void fetchAdminDashboard();
};

const nextMonth = (): void => {
  if (displayMonth.value === 11) {
    displayMonth.value = 0;
    displayYear.value++;
  } else {
    displayMonth.value++;
  }
  void fetchAdminDashboard();
};

const setToday = (): void => {
  const t = new Date();
  displayMonth.value = t.getMonth();
  displayYear.value = t.getFullYear();
  void fetchAdminDashboard();
};

// ==========================================
// 🎯 ข้อมูลรายการทำงาน (เพิ่มฟิลด์ team และแก้ meta ให้แสดงชื่อทีม)
// ==========================================
interface TaskItem {
  id: number;
  jobId: number;
  inspectionType: string;
  title: string;
  meta: string;
  referenceDate: string | null;
  status: string;
  statusCode: JobStatusCode;
  roundNumber: number | null;
  statusBgClass: string;
  statusTextColor: string;
  icon: string;
  avatarBgClass: string;
  avatarTextColor: string;
  day: number;
  branchId?: number | null;
  branchName?: string | null;
  team: string;      // <- เพิ่มชื่อทีม
  customer: string;  // <- เพิ่มชื่อลูกค้า
}

const tasks = ref<TaskItem[]>([]);

const currentPage = ref(1);
const pageSize = 5;
const totalPages = computed(() => {
  const pages = Math.ceil(tasks.value.length / pageSize);
  // จำกัดไม่เกิน 3 หน้า
  return Math.min(Math.max(1, pages), 3);
});
const visibleTasks = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return tasks.value.slice(start, start + pageSize);
});

// อาเรย์เก็บวันที่ (1-31) ที่มีงานนัดหมายในเดือนนั้น
const calendarEvents = ref<number[]>([]);

function taskCountByDay(day: number): number {
  return calendarEvents.value.filter((d: number): boolean => d === day).length;
}

const selectedTask = ref<TaskItem | null>(null);
const showTaskDialog = ref(false);
const selectedTaskBranchName = computed(() => getTaskBranchName(selectedTask.value));

function getTaskBranchName(task: TaskItem | null): string {
  return task?.branchName?.trim() ?? '';
}

// backend ส่ง referenceDate (ISO) มาให้จัดรูปแบบตามภาษาที่เลือกเอง — field `meta` เดิมเป็นภาษาไทยตายตัว
function formatTaskMeta(task: TaskItem | null): string {
  if (!task?.referenceDate) return '-';
  const date = new Date(task.referenceDate);
  if (isNaN(date.getTime())) return '-';
  const dateStr = date.toLocaleDateString(locale.value, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  });
  const timeStr = date.toLocaleTimeString(locale.value, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  });
  return `${dateStr} • ${timeStr}`;
}

function openTaskDetail(task: TaskItem) {
  const prefix = task.inspectionType === 'CONSTRUCTION_INSPECTION' || task.inspectionType === 'ตรวจก่อสร้าง' ? 'cons' : 'ins';
  void router.push(`/admin/work/${prefix}/${task.jobId}`);
}

function openWorkList(extra: Record<string, string> = {}): void {
  void router.push({
    path: '/admin/work',
    query: { ...(selectedBranchId.value === 'all' ? {} : { branchId: selectedBranchId.value }), ...extra },
  });
}

function goToWorkList(): void {
  showTaskDialog.value = false;
  void router.push({
    path: '/admin/work',
    query: selectedBranchId.value === 'all' ? {} : { branchId: selectedBranchId.value },
  });
}

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

  void fetchAdminDashboard();
}

// ==========================================
// 🎯 API Integration — ดึงข้อมูล Dashboard จาก Backend
// ==========================================
interface DashboardApiResponse extends DashboardStats {
  branches?: BranchOption[];
  calendarEvents: number[];
  tasks: TaskItem[];
}

async function fetchAdminDashboard(): Promise<void> {
  $q.loading.show({
    spinner: homeSpinner,
    spinnerColor: 'primary',
    spinnerSize: 70,
    backgroundColor: 'white',
  });
  error.value = '';

  try {
    // สร้าง date parameter ตามเดือนที่แสดงบนปฏิทิน
    const dateParam: string = `${displayYear.value}-${String(displayMonth.value + 1).padStart(2, '0')}-01`;
    const params: { date: string; branchId?: number } = { date: dateParam };
    if (selectedBranchId.value !== 'all') {
      params.branchId = selectedBranchId.value;
    }
    const res: AxiosResponse<DashboardApiResponse> = await api.get<DashboardApiResponse>('/admin/dashboard', {
      params,
    });
    const data: DashboardApiResponse = res.data;

    dashboard.value = {
      totalProjects: data.totalProjects,
      inProgress: data.inProgress,
      singleHouse: data.singleHouse,
      townhouse: data.townhouse,
      condo: data.condo,
      construction: data.construction,
      homeStatusBreakdown: Array.isArray(data.homeStatusBreakdown)
        ? data.homeStatusBreakdown
        : [],
      constructionStatusBreakdown: Array.isArray(data.constructionStatusBreakdown)
        ? data.constructionStatusBreakdown
        : [],
    };

    branches.value = Array.isArray(data.branches) ? data.branches : [];

    if (data.calendarEvents && Array.isArray(data.calendarEvents)) {
      calendarEvents.value = data.calendarEvents;
    } else {
      calendarEvents.value = [];
    }

    if (data.tasks && Array.isArray(data.tasks)) {
      tasks.value = data.tasks;
      currentPage.value = 1;
    } else {
      tasks.value = [];
    }
  } catch (err: unknown) {
    error.value = t('adminWork.main.loadError');
    console.error('fetchAdminDashboard error:', err);
  } finally {
    $q.loading.hide();
  }
}

onMounted((): void => {
  void fetchAdminDashboard();
});
</script>

<style scoped>
.admin-page {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
}
@media (min-width: 768px) {
  .admin-page {
    max-width: 720px;
  }
}
@media (min-width: 1024px) {
  .admin-page {
    max-width: 1100px;
  }
}
@media (min-width: 1440px) {
  .admin-page {
    max-width: 1280px;
  }
}
.page-content {
  padding: 16px 16px 24px;
}
@media (min-width: 768px) {
  .page-content {
    padding: 24px 24px 32px;
  }
}
@media (min-width: 1024px) {
  .page-content {
    padding: 28px 32px 40px;
  }
}
.branch-select :deep(.q-field__control) {
  border-radius: 12px;
  background: #fff;
}
@media (min-width: 768px) {
  .branch-select {
    max-width: 320px;
  }
}
.full-height-card {
  height: 100%;
}
.stat-box.cursor-pointer,
.mini-card.cursor-pointer {
  user-select: none;
  -webkit-user-select: none;
  caret-color: transparent;
  -webkit-tap-highlight-color: transparent;
}
.stat-box {
  border-radius: 16px;
  background: #fff;
  border-color: #f0f0f0;
  padding: 16px;
  height: 100%;
}
.bg-blob {
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  bottom: -20px;
  right: -20px;
  opacity: 0.5;
}
.blob-blue { background: #e3f2fd; }
.blob-orange { background: #fff3e0; }
.orange-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ff9800;
}
.mini-card {
  border-radius: 12px;
  background: #fff;
  border-color: #f0f0f0;
  padding: 16px;
  height: 100%;
}
.dot-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.status-breakdown {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed #e8e8e8;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.status-row {
  display: flex;
  align-items: center;
  gap: 7px;
  animation: card-in 260ms var(--ease-out) both;
}
.status-row-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-row-label {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  font-weight: 500;
  color: #33363b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.status-row-count {
  flex-shrink: 0;
  min-width: 24px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.content-box {
  border-radius: 12px;
  background: #fff;
  border-color: #e8e8e8;
  padding: 12px;
}

/* =====================================
   🎯 CSS ปฏิทิน
   ===================================== */
.calendar-card {
  border-radius: 12px;
  background: #fff;
  border-color: #e8e8e8;
  overflow: hidden;
}
.today-btn {
  border-radius: 6px;
  font-weight: 600;
  padding: 4px 12px;
}
.nav-btn {
  width: 28px;
  height: 28px;
  min-height: 28px;
  border-color: #e0e0e0;
}
.calendar-header-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fcfcfc;
}
.day-name {
  font-size: 11px;
  font-weight: 600;
  color: #9e9e9e;
  text-align: center;
  padding: 12px 0;
  letter-spacing: 0.5px;
}
.calendar-grid-wrapper {
  border-bottom: 1px solid #f0f0f0;
}
.calendar-grid-table {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background-color: #f0f0f0;
  gap: 1px;
}
.cal-cell {
  background-color: #fff;
  min-height: 60px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
@media (min-width: 1024px) {
  .cal-cell {
    min-height: 84px;
    padding: 8px;
  }
}
.cal-cell.not-current-month .date-number {
  color: #bdbdbd;
}
.cal-cell.is-today {
  background-color: #eef2ff;
  border: 1px solid #2962ff;
  margin: -1px;
  z-index: 1;
}
.date-number {
  font-size: 12px;
  font-weight: 600;
  color: #212121;
}
.task-count-badge {
  align-self: flex-end;
  background-color: #2962ff;
  color: white;
  font-size: 11px;
  font-weight: bold;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(41, 98, 255, 0.3);
}
.calendar-footer {
  padding: 12px 16px;
  background-color: #fafafa;
}
.small-blue-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #2962ff;
}

/* =====================================
   🎯 CSS รายการทำงาน
   ===================================== */
.work-list-card {
  border-radius: 12px;
  background: #fff;
  border-color: #e8e8e8;
  overflow: hidden;
}
.search-input {
  background-color: #f5f6f8;
  border-radius: 24px;
  padding: 0 16px;
  height: 40px;
  display: flex;
  align-items: center;
}
.task-item {
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
  padding-top: 12px;
  padding-bottom: 12px;
}
.task-item:last-child {
  border-bottom: none;
}
.task-item:hover {
  background: #fafafa;
}
.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 11px;
}
.min-w-0 {
  min-width: 0;
}
.clickable {
  cursor: pointer;
}

/* ─── Stagger fade-in on load ──────────────────────────────────── */
.card-stagger {
  animation: card-in 320ms var(--ease-out) both;
}
.card-stagger:nth-child(1) { animation-delay: 0ms; }
.card-stagger:nth-child(2) { animation-delay: 40ms; }
.card-stagger:nth-child(3) { animation-delay: 80ms; }
.card-stagger:nth-child(4) { animation-delay: 120ms; }
.card-stagger--delay-5 { animation-delay: 160ms; }
.card-stagger--delay-6 { animation-delay: 200ms; }

.task-item-stagger {
  animation: card-in 280ms var(--ease-out) both;
}
.task-item-stagger:nth-child(1) { animation-delay: 0ms; }
.task-item-stagger:nth-child(2) { animation-delay: 30ms; }
.task-item-stagger:nth-child(3) { animation-delay: 60ms; }
.task-item-stagger:nth-child(4) { animation-delay: 90ms; }
.task-item-stagger:nth-child(n + 5) { animation-delay: 120ms; }

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .card-stagger,
  .task-item-stagger,
  .status-row {
    animation-duration: 0.01ms !important;
  }
}
</style>
