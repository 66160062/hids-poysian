<template>
  <q-page class="admin-work-page bg-grey-1">
    <div class="q-px-md q-pt-lg">
      <!-- Loading Indicator -->
      <q-inner-loading :showing="loading" label="กำลังโหลดข้อมูล..." style="z-index: 100" />

      <!-- Error Banner -->
      <q-banner v-if="error" class="text-white bg-negative q-mb-md" rounded dense>
        <template v-slot:avatar>
          <q-icon name="error" color="white" />
        </template>
        {{ error }}
        <template v-slot:action>
          <q-btn flat label="ลองใหม่" @click="fetchWorkList" />
        </template>
      </q-banner>

      <div class="row q-mb-sm">
        <q-input
          v-model="searchTerm"
          dense
          borderless
          rounded
          placeholder="ค้นหาโครงการ, ผู้ตรวจสอบ..."
          class="col search-input"
        >
          <template v-slot:prepend>
            <q-icon name="search" color="grey-6" />
          </template>
        </q-input>
      </div>

      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-6">
          <q-select
            v-model="selectedType"
            :options="typeOptions"
            dense
            outlined
            rounded
            bg-color="white"
            class="filter-select"
            behavior="menu"
          >
            <template v-slot:prepend>
              <q-icon name="home_work" size="18px" color="grey-6" />
            </template>
          </q-select>
        </div>

        <div class="col-6">
          <q-select
            v-model="sortOrder"
            :options="sortOptions"
            emit-value
            map-options
            dense
            outlined
            rounded
            bg-color="white"
            class="filter-select"
            behavior="menu"
          >
            <template v-slot:prepend>
              <q-icon name="sort" size="18px" color="grey-6" />
            </template>
          </q-select>
        </div>
      </div>

      <div class="filter-container q-mb-md">
        <div class="filter-scroll-wrapper no-wrap scroll-x hide-scrollbar row q-gutter-x-sm q-px-none">
          <q-btn
            v-for="filter in filters"
            :key="filter.label"
            unelevated
            rounded
            :class="activeFilter === filter.value ? 'bg-primary text-white' : 'bg-white text-grey-8'"
            class="filter-chip"
            style="border: 1px solid #f0f0f0;"
            no-caps
            @click="activeFilter = filter.value"
          >
            <div class="row no-wrap items-center">
              <span :class="activeFilter === filter.value ? 'text-weight-medium' : ''">{{ filter.label }}</span>
              <q-badge
                v-if="filter.count !== undefined"
                :class="activeFilter === filter.value ? 'bg-white text-primary' : 'bg-grey-2 text-grey-8'"
                class="q-ml-sm count-badge"
              >
                {{ filter.count }}
              </q-badge>
            </div>
          </q-btn>
        </div>
      </div>

      <div class="work-list-wrapper">
        <div v-if="filteredTasks.length === 0" class="text-center text-grey-6 q-pa-xl">
          ไม่พบข้อมูลที่ค้นหา
        </div>

        <div v-else class="work-list q-gutter-y-md q-pb-xl">
          <q-card
            v-for="task in filteredTasks"
            :key="task.id"
            flat
            bordered
            class="work-card"
          >
            <q-card-section class="q-pa-md">
              <div class="row justify-between items-start q-mb-sm">
                <div class="text-weight-bold text-dark ellipsis" style="font-size: 16px; max-width: 65%;">
                  {{ task.title }}
                </div>
                <q-badge
                  class="status-badge"
                  :class="[task.statusBgClass, `text-${task.statusTextColor}`]"
                >
                  {{ task.status }}
                </q-badge>
              </div>

              <div class="row q-gutter-x-sm q-mb-md">
                <q-badge color="indigo-1" text-color="grey-8" class="tag-badge">
                  {{ task.type || 'คอนโด' }}
                </q-badge>
                <q-badge color="indigo-1" text-color="grey-8" class="tag-badge">
                  {{ task.area || '0' }} ตร.ม.
                </q-badge>
              </div>

              <div class="row items-center q-mb-sm text-grey-7" style="font-size: 14px;">
                <q-icon name="person_search" size="20px" class="q-mr-sm" />
                <span class="q-mr-xs text-weight-medium">ผู้ตรวจสอบ:</span>
                <span class="text-dark text-weight-medium" style="font-size: 15px;">{{ task.team || 'ไม่ระบุทีม' }}</span>
              </div>
            </q-card-section>

            <q-separator color="grey-2" inset />

            <q-card-actions class="row justify-between items-center q-px-md q-py-sm">
              <div class="row items-center text-grey-6" style="font-size: 13px;">
                <q-icon name="calendar_today" size="16px" class="q-mr-sm" />
                {{ formatDate(task.date) }}
              </div>
              <div class="row q-gutter-x-sm">
                <q-btn flat round dense icon="visibility" color="grey-8" class="bg-grey-2 action-btn" @click="viewDetail(task)" />
                <q-btn flat round dense icon="edit" color="grey-8" class="bg-grey-2 action-btn" @click="editWork(task)" />
              </div>
            </q-card-actions>
          </q-card>
        </div>
      </div>
    </div>

    <q-page-sticky position="bottom-right" :offset="[18, 18]" style="z-index: 9999">
      <q-btn fab icon="add" color="primary" @click="addNewWork" />
    </q-page-sticky>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from 'src/boot/axios';
import type { AxiosResponse } from 'axios';

const router = useRouter();
const loading = ref<boolean>(false);
const error = ref<string>('');

// ตัวแปรสำหรับค้นหาและกรอง
const searchTerm = ref('');
const activeFilter = ref('all');
const selectedType = ref('ทั้งหมด'); // ตัวเลือกประเภทงาน
const sortOrder = ref('desc');       // desc = ล่าสุด -> เก่า, asc = เก่า -> ล่าสุด

// ตัวเลือกใน Dropdown
const typeOptions = ['ทั้งหมด', 'คอนโด', 'บ้านเดี่ยว', 'ทาวน์เฮาส์'];
const sortOptions = [
  { label: 'ล่าสุด - เก่า', value: 'desc' },
  { label: 'เก่า - ล่าสุด', value: 'asc' }
];

// ==========================================
// 🎯 Interface สำหรับข้อมูล TaskItem
// ==========================================
interface TaskItem {
  id: number;
  title: string;
  status: string;
  statusBgClass: string;
  statusTextColor: string;
  statusKey: string;
  type: string;
  area: number;
  team: string;
  customer: string;
  date: string;
}

const tasks = ref<TaskItem[]>([]);

// ==========================================
// ฟังก์ชันจัดการวันที่ให้แสดงผลสวยงาม (DD/MM/YYYY)
// ==========================================
function formatDate(dateStr?: string) {
  if (!dateStr) return 'ไม่ระบุวันที่';
  try {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

// ==========================================
// ลอจิก Filter & Search & Sort
// ==========================================
const filters = computed(() => {
  const counts = {
    all: tasks.value.length,
    in_progress: tasks.value.filter((t) => t.statusKey === 'in_progress').length,
    waiting: tasks.value.filter((t) => t.statusKey === 'waiting').length,
    others: tasks.value.filter((t) => t.statusKey === 'others').length,
  };

  return [
    { label: 'ทั้งหมด', value: 'all', count: counts.all },
    { label: 'กำลังดำเนินการ', value: 'in_progress', count: counts.in_progress },
    { label: 'รออนุมัติ', value: 'waiting', count: counts.waiting },
    { label: 'เสร็จสิ้น', value: 'others', count: counts.others > 0 ? counts.others : undefined },
  ];
});

const filteredTasks = computed(() => {
  let result = [...tasks.value];

  // 1. กรองตามปุ่มสถานะ
  if (activeFilter.value !== 'all') {
    result = result.filter((t) => t.statusKey === activeFilter.value);
  }

  // 2. กรองตามประเภทบ้าน (Dropdown)
  if (selectedType.value !== 'ทั้งหมด') {
    result = result.filter((t) => t.type === selectedType.value);
  }

  // 3. กรองตามช่องค้นหา
 if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(term) ||
        (t.team && t.team.toLowerCase().includes(term)) ||
        (t.customer && t.customer.toLowerCase().includes(term))
    );
  }

  // 4. เรียงลำดับตามวันที่ (Dropdown)
  result.sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();

    if (sortOrder.value === 'desc') {
      return dateB - dateA; // ล่าสุด ไป เก่าสุด
    } else {
      return dateA - dateB; // เก่าสุด ไป ล่าสุด
    }
  });

  return result;
});

async function viewDetail(task: TaskItem): Promise<void> {
  await router.push(`/admin/work/${task.id}`);
}

async function editWork(task: TaskItem): Promise<void> {
  await router.push(`/admin/work/create?editId=${task.id}`);
}

async function addNewWork(): Promise<void> {
  await router.push('/admin/work/create');
}

// ==========================================
// 🎯 API Integration — ดึงข้อมูลจาก Backend
// ==========================================
async function fetchWorkList(): Promise<void> {
  loading.value = true;
  error.value = '';
  
  try {
    const res: AxiosResponse<TaskItem[]> = await api.get<TaskItem[]>('/admin/jobs');
    if (Array.isArray(res.data)) {
      tasks.value = res.data;
    }
  } catch (err: unknown) {
    error.value = 'เกิดข้อผิดพลาดในการโหลดข้อมูล โปรดลองใหม่อีกครั้ง';
    console.error('fetchWorkList error:', err);
  } finally {
    loading.value = false;
  }
}

onMounted((): void => {
  void fetchWorkList();
});
</script>

<style scoped>
.admin-work-page {
  max-width: 600px;
  margin: 0 auto;
  min-height: 100vh;
}

.search-input {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  padding: 2px 16px;
  height: 48px;
}

/* ปรับแต่ง Dropdown */
.filter-select :deep(.q-field__control) {
  height: 42px;
  min-height: 42px;
  border: 1px solid #e0e0e0;
}
.filter-select :deep(.q-field__control:before),
.filter-select :deep(.q-field__control:after) {
  border: none !important; /* ซ่อนเส้นขอบ default ของ Quasar */
}

.filter-container {
  overflow: hidden;
  margin-left: -16px;
  margin-right: -16px;
  width: calc(100% + 32px);
}
.filter-scroll-wrapper {
  padding: 4px 16px;
  overflow-x: auto;
  display: flex;
}
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.filter-chip {
  min-width: fit-content;
  white-space: nowrap;
  height: 38px;
  padding: 0 16px;
  font-size: 13px;
  transition: all 0.2s ease;
}
.count-badge {
  font-weight: 600;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
}

.work-card {
  border-radius: 16px;
  border-color: #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.status-badge {
  font-weight: 600;
  font-size: 11px;
  padding: 6px 12px;
  border-radius: 20px;
}

.tag-badge {
  font-weight: 500;
  font-size: 12px;
  padding: 6px 14px;
  border-radius: 20px;
}

.action-btn {
  width: 36px;
  height: 36px;
}

@media (min-width: 600px) {
  .admin-work-page {
    max-width: 800px;
  }
}
</style>

```
