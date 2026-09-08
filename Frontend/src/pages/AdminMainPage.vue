<template>
  <q-page class="admin-page bg-grey-1">
    <div class="q-px-md q-pt-md">
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
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-6">
          <q-card flat bordered class="stat-box relative-position overflow-hidden">
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
        <div class="col-6">
          <q-card flat bordered class="stat-box relative-position overflow-hidden">
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
      </div>

      <div class="hide-scrollbar q-mb-md" style="overflow-x: auto; padding-bottom: 4px;">
        <div class="row no-wrap q-gutter-x-sm">
          <q-card flat bordered class="mini-card" style="flex: 1;">
            <div class="row items-center q-mb-xs">
              <div class="dot-indicator bg-blue q-mr-sm"></div>
              <div class="text-grey-7" style="font-size: 13px;">{{ t('adminWork.main.homeInspectionJobs') }}</div>
            </div>
            <div class="text-h5 text-weight-bold text-dark">{{ dashboard.totalProjects - dashboard.construction }}</div>
          </q-card>
          <q-card flat bordered class="mini-card" style="flex: 1;">
            <div class="row items-center q-mb-xs">
              <div class="dot-indicator bg-orange q-mr-sm"></div>
              <div class="text-grey-7" style="font-size: 13px;">{{ t('adminWork.main.constructionJobs') }}</div>
            </div>
            <div class="text-h5 text-weight-bold text-dark">{{ dashboard.construction }}</div>
          </q-card>
        </div>
      </div>

      <q-card flat bordered class="calendar-card q-mb-md">
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
          <div class="day-name" v-for="d in daysEng" :key="d">{{ d }}</div>
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

      <q-card flat bordered class="work-list-card q-mb-md">
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
            class="task-item row items-center q-px-md q-py-sm clickable"
            @click="openTaskDetail(task)"
          >
            <div class="q-mr-md">
              <q-avatar size="48px" :class="task.avatarBgClass" :text-color="task.avatarTextColor">
                <q-icon :name="task.icon" size="24px" />
              </q-avatar>
            </div>

            <div class="col min-w-0">
              <div class="text-weight-bold text-dark ellipsis" style="font-size: 14px;">{{ task.title }}</div>
              <div class="text-grey-6 ellipsis" style="font-size: 12px; margin-top: 2px;">{{ task.inspectionType === 'CONSTRUCTION_INSPECTION' || task.inspectionType === 'ตรวจก่อสร้าง' ? t('adminWork.main.constructionJob') : t('adminWork.main.homeInspectionJob') }}</div>
            </div>

            <div class="q-pl-sm">
              <q-badge
                :class="task.statusBgClass"
                :text-color="task.statusTextColor"
                class="status-badge"
              >
                {{ task.status }}
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

      <div class="text-center text-caption text-grey-5 q-mt-sm">HIDS Admin v1.0</div>

      <q-dialog v-model="showTaskDialog" persistent>
        <q-card style="min-width: 320px; max-width: 90vw">
          <q-card-section class="row items-center justify-between">
            <div class="text-h6">{{ t('adminWork.main.taskDetailTitle') }}</div>
            <q-btn dense flat icon="close" @click="showTaskDialog = false" />
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="text-subtitle1 q-mb-xs">{{ selectedTask?.title }}</div>
            <div class="text-caption q-mb-xs">{{ selectedTask?.meta }}</div>
            <div class="q-mb-sm">
              {{ t('adminWork.main.statusLabel') }} <strong>{{ selectedTask?.status }}</strong>
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

const homeSpinner = createIconSpinner('home');
const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();
const error = ref<string>('');

// ==========================================
// 🎯 Interface สำหรับ Dashboard Stats
// ==========================================
interface DashboardStats {
  totalProjects: number;
  inProgress: number;
  singleHouse: number;
  townhouse: number;
  condo: number;
  construction: number;
}

const dashboard = ref<DashboardStats>({
  totalProjects: 0,
  inProgress: 0,
  singleHouse: 0,
  townhouse: 0,
  condo: 0,
  construction: 0,
});

// ==========================================
// 🎯 ระบบปฏิทิน
// ==========================================
const today = new Date();
const displayMonth = ref(today.getMonth());
const displayYear = ref(today.getFullYear());

const daysEng = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
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
  status: string;
  statusBgClass: string;
  statusTextColor: string;
  icon: string;
  avatarBgClass: string;
  avatarTextColor: string;
  day: number;
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

function openTaskDetail(task: TaskItem) {
  const prefix = task.inspectionType === 'CONSTRUCTION_INSPECTION' || task.inspectionType === 'ตรวจก่อสร้าง' ? 'cons' : 'ins';
  void router.push(`/admin/work/${prefix}/${task.jobId}`);
}

function goToWorkList(): void {
  showTaskDialog.value = false;
  void router.push('/admin/work');
}

// ==========================================
// 🎯 API Integration — ดึงข้อมูล Dashboard จาก Backend
// ==========================================
interface DashboardApiResponse extends DashboardStats {
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
    const res: AxiosResponse<DashboardApiResponse> = await api.get<DashboardApiResponse>('/admin/dashboard', {
      params: { date: dateParam },
    });
    const data: DashboardApiResponse = res.data;

    dashboard.value = {
      totalProjects: data.totalProjects,
      inProgress: data.inProgress,
      singleHouse: data.singleHouse,
      townhouse: data.townhouse,
      condo: data.condo,
      construction: data.construction,
    };

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
  max-width: 480px;
  margin: 0 auto;
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
  min-width: 140px;
}
.dot-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
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
</style>

```
