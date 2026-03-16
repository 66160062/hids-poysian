<template>
  <q-page class="admin-page bg-grey-1">
    <div class="q-px-md q-pt-sm">
      <div class="row items-center justify-between q-mb-sm"></div>

      <div class="row q-col-gutter-sm q-mb-sm">
        <div class="col-6">
          <q-card flat bordered class="stat-box">
            <div class="row items-center q-gutter-sm">
              <q-avatar size="30px" class="bg-blue-3 text-blue">
                <q-icon name="assignment_turned_in" size="16px" />
              </q-avatar>
              <div class="text-caption text-grey-6">รวมโครงการ</div>
            </div>
            <div class="text-h5 text-weight-bold q-mt-xs">{{ dashboard.totalProjects }}</div>
          </q-card>
        </div>
        <div class="col-6">
          <q-card flat bordered class="stat-box">
            <div class="row items-center q-gutter-sm">
              <q-avatar size="30px" class="bg-orange-3 text-orange">
                <q-icon name="work" size="16px" />
              </q-avatar>
              <div class="text-caption text-grey-6">งานกำลังดำเนินการ</div>
            </div>
            <div class="text-h5 text-weight-bold q-mt-xs">{{ dashboard.inProgress }}</div>
          </q-card>
        </div>
      </div>

      <div class="row q-col-gutter-sm q-mb-sm">
        <div class="col-4">
          <q-card flat bordered class="mini-card">
            <div class="label">บ้านเดี่ยว</div>
            <div class="value">{{ dashboard.singleHouse }}</div>
          </q-card>
        </div>
        <div class="col-4">
          <q-card flat bordered class="mini-card">
            <div class="label">ทาวน์เฮาส์</div>
            <div class="value">{{ dashboard.townhouse }}</div>
          </q-card>
        </div>
        <div class="col-4">
          <q-card flat bordered class="mini-card">
            <div class="label">คอนโด</div>
            <div class="value">{{ dashboard.condo }}</div>
          </q-card>
        </div>
      </div>

      <q-card flat bordered class="content-box q-mb-sm">
        <div class="row items-center justify-between q-mb-xs">
          <div class="text-weight-bold">ปฏิทินงาน</div>
          <div class="text-caption">{{ currentMonthName }} {{ currentYear }}</div>
        </div>
        <div class="calendar-grid">
          <div class="day-title" v-for="d in days" :key="d">{{ d }}</div>
          <div
            class="day-cell"
            v-for="(day, index) in calendarDays"
            :key="index"
            :class="{
              'text-grey-4': day === '',
              'today-cell': day !== '' && day === currentDate.getDate(),
              'empty-cell': day === '',
            }"
          >
            <div v-if="day !== ''" class="day-content">
              <span>{{ day }}</span>
              <div
                v-if="taskCountByDay(day) > 0"
                class="dot"
                :title="taskCountByDay(day) + ' งาน'"
              ></div>
            </div>
          </div>
        </div>
        <div class="text-caption text-grey-6 q-mt-xs">
          สรุปงานวันนี้: มีงานเข้าระบบและต้องตรวจสอบ
        </div>
        <div v-if="loading" class="text-caption text-primary q-mt-xs">กำลังโหลดข้อมูล...</div>
        <div v-if="error" class="text-caption text-negative q-mt-xs">{{ error }}</div>
      </q-card>

      <q-card flat bordered class="content-box q-mb-sm">
        <div class="row items-center justify-between q-mb-xs">
          <div class="text-weight-bold"><q-icon name="list" class="q-mr-xs" />งานล่าสุด</div>
          <q-btn dense flat label="ดูทั้งหมด" color="primary" @click="goToWorkList" />
        </div>
        <q-input
          v-model="searchTerm"
          dense
          outlined
          rounded
          placeholder="ค้นหางาน, ที่อยู่, ผู้รับผิดชอบ..."
        />
        <div class="task-list q-mt-sm">
          <div
            v-for="task in visibleTasks"
            :key="task.id"
            class="task-item clickable"
            @click="openTaskDetail(task)"
          >
            <div>
              <div class="task-title">{{ task.title }}</div>
              <div class="task-meta">{{ task.meta }}</div>
            </div>
            <q-chip dense :color="task.color" text-color="white">{{ task.status }}</q-chip>
          </div>
        </div>
        <div class="row items-center justify-between q-mt-sm">
          <q-btn
            dense
            flat
            round
            icon="chevron_left"
            label="ก่อนหน้า"
            :disabled="currentPage === 1"
            @click="currentPage = Math.max(1, currentPage - 1)"
          />
          <div class="text-caption">หน้า {{ currentPage }} / {{ totalPages }}</div>
          <q-btn
            dense
            flat
            round
            icon="chevron_right"
            label="ถัดไป"
            :disabled="currentPage === totalPages"
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
          />
        </div>
      </q-card>

      <div class="text-center text-caption text-grey-5 q-mt-sm">HIDS Admin v1.0</div>

      <q-dialog v-model="showTaskDialog" persistent>
        <q-card style="min-width: 320px; max-width: 90vw">
          <q-card-section class="row items-center justify-between">
            <div class="text-h6">รายละเอียดงาน</div>
            <q-btn dense flat icon="close" @click="showTaskDialog = false" aria-label="Close" />
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="text-subtitle1 q-mb-xs">{{ selectedTask?.title }}</div>
            <div class="text-caption q-mb-xs">{{ selectedTask?.meta }}</div>
            <div class="q-mb-sm">
              สถานะ: <strong>{{ selectedTask?.status }}</strong>
            </div>
            <div class="text-body2 q-mb-xs">
              ข้อมูลเพิ่มเติมเกี่ยวกับงานและการดำเนินการจะอยู่ในหน้านี้
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="ปิด" @click="showTaskDialog = false" />
            <q-btn color="primary" label="ไปที่รายการ" @click="goToWorkList" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
// import { api } from 'boot/axios';

const searchTerm = ref('');
const loading = ref(false);
const error = ref('');

const dashboard = ref({
  totalProjects: 1500,
  inProgress: 12,
  singleHouse: 450,
  townhouse: 380,
  condo: 120,
  monthSummary: 30,
});

const currentDate = ref(new Date());
const days = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const monthNamesThai = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const currentMonthName = computed(() => monthNamesThai[currentDate.value.getMonth()]);
const currentYear = computed(() => currentDate.value.getFullYear());

const daysInCurrentMonth = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  return new Date(year, month + 1, 0).getDate();
});

const firstWeekday = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  return new Date(year, month, 1).getDay();
});

const calendarDays = computed(() => {
  const cells: Array<number | ''> = [];
  for (let i = 0; i < firstWeekday.value; i += 1) {
    cells.push('');
  }
  for (let day = 1; day <= daysInCurrentMonth.value; day += 1) {
    cells.push(day);
  }
  return cells;
});

const tasks = ref([
  {
    id: 1,
    title: 'คอนโดพฤกษ์ภิรมย์',
    meta: 'บารัค โกมุย · วันนี้, 10:00 AM',
    status: 'กำลังดำเนินการ',
    color: 'primary',
    day: new Date().getDate(),
  },
  {
    id: 2,
    title: 'บ้านใหญ่พลังชล',
    meta: 'รัชช์ ชาญ · เมื่อวาน',
    status: 'เสร็จสิ้น',
    color: 'positive',
    day: 3,
  },
  {
    id: 3,
    title: 'บ้านใหม่ชลบุรี',
    meta: 'รัชช์ ชาญ · Jan 24',
    status: 'รอตรวจ',
    color: 'warning',
    day: 8,
  },
  {
    id: 4,
    title: 'แสนสิริ คอนโด',
    meta: 'รัชช์ ชาญ · Jan 22',
    status: 'เสร็จสิ้น',
    color: 'positive',
    day: 12,
  },
  {
    id: 5,
    title: 'โครงการบุญเลิศ',
    meta: 'รัชช์ ชาญ · Jan 20',
    status: 'เสร็จสิ้น',
    color: 'positive',
    day: 20,
  },
  {
    id: 6,
    title: 'บ้านชลลดา',
    meta: 'สมชาย · Jan 18',
    status: 'กำลังดำเนินการ',
    color: 'primary',
    day: 18,
  },
  {
    id: 7,
    title: 'บ้านริมทะเล',
    meta: 'พีระ · Jan 17',
    status: 'รอตรวจ',
    color: 'warning',
    day: 17,
  },
]);

const currentPage = ref(1);
const pageSize = 4;
const totalPages = computed(() => Math.max(1, Math.ceil(tasks.value.length / pageSize)));
const visibleTasks = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return tasks.value.slice(start, start + pageSize);
});

function taskCountByDay(day: number) {
  return tasks.value.filter((task) => task.day === day).length;
}

const selectedTask = ref<null | {
  id: number;
  title: string;
  meta: string;
  status: string;
  color: string;
}>(null);
const showTaskDialog = ref(false);
const router = useRouter();

function openTaskDetail(task: {
  id: number;
  title: string;
  meta: string;
  status: string;
  color: string;
}) {
  selectedTask.value = task;
  showTaskDialog.value = true;
}

let timer: ReturnType<typeof setInterval>; // สร้างตัวแปรเก็บ ref ของ timer

onMounted(() => {
  timer = setInterval(() => {
    currentDate.value = new Date();
  }, 1000 * 60);
});

onUnmounted(() => {
  clearInterval(timer); // เคลียร์ timer เมื่อปิดหน้านี้
});

function goToWorkList() {
  showTaskDialog.value = false;
  void router.push('/admin/work');
}

// async function fetchAdminDashboard() {
//   loading.value = true;
//   error.value = '';

//   try {
//     const res = await api.get('/admin/dashboard');
//     const data = res.data;

//     dashboard.value = {
//       totalProjects: data.totalProjects ?? dashboard.value.totalProjects,
//       inProgress: data.inProgress ?? dashboard.value.inProgress,
//       singleHouse: data.singleHouse ?? dashboard.value.singleHouse,
//       townhouse: data.townhouse ?? dashboard.value.townhouse,
//       condo: data.condo ?? dashboard.value.condo,
//       monthSummary: data.monthSummary ?? dashboard.value.monthSummary,
//     };

//     if (Array.isArray(data.tasks) && data.tasks.length) {
//       tasks.value = data.tasks;
//     }
//   } catch (err) {
//     error.value = 'เกิดข้อผิดพลาดในการโหลดข้อมูล โปรดลองใหม่อีกครั้ง';
//     console.error(err);
//   } finally {
//     loading.value = false;
//   }
// }

// onMounted(() => {
//   void fetchAdminDashboard();
// });
//
</script>

<style scoped>
.admin-page {
  max-width: 480px;
  margin: 0 auto;
}
.stat-box {
  border-radius: 12px;
  background: #fff;
  border-color: #e8e8e8;
  padding: 10px;
}
.mini-card {
  border-radius: 12px;
  background: #fff;
  border-color: #e8e8e8;
  padding: 10px;
}
.label {
  color: #757575;
  font-size: 12px;
}
.value {
  font-size: 20px;
  font-weight: 700;
}
.content-box {
  border-radius: 12px;
  background: #fff;
  border-color: #e8e8e8;
  padding: 12px;
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-top: 8px;
}
.day-title {
  font-size: 10px;
  font-weight: 700;
  color: #616161;
  text-align: center;
}
.day-cell {
  min-height: 36px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #424242;
  font-size: 12px;
  position: relative;
  transition: all 0.2s ease;
}
.day-cell.today-cell {
  background: #e3f2fd;
  border-color: #42a5f5;
  color: #0d47a1;
  font-weight: 700;
}
.day-cell.empty-cell {
  background: transparent;
  border: none;
}
.day-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #1976d2;
}
.task-list {
  margin-top: 8px;
}
.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}
.task-title {
  font-weight: 600;
}
.task-meta {
  font-size: 11px;
  color: #757575;
  margin-top: 2px;
}
.clickable {
  cursor: pointer;
}
.task-item:hover {
  background: #f7f7f7;
}
</style>
