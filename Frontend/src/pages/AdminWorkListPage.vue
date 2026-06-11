<template>
  <q-page class="admin-work-page bg-grey-1">
    <div class="q-px-md q-pt-lg relative-position">
      <!-- Loading Indicator -->
      <q-inner-loading :showing="loading" label="กำลังโหลดข้อมูล..." color="primary" style="z-index: 100" />

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
        <div v-if="tasks.length === 0" class="text-center text-grey-6 q-pa-xl">
          ไม่พบข้อมูลที่ค้นหา
        </div>

        <div v-else class="work-list q-gutter-y-md">
          <q-card
            v-for="task in tasks"
            :key="task.id"
            flat
            bordered
            class="work-card cursor-pointer"
            v-ripple
            @click="viewDetail(task)"
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

            </q-card-section>

            <q-separator color="grey-2" inset />

            <q-card-actions class="row justify-between items-center q-px-md q-py-sm">
              <div class="row items-center text-grey-6" style="font-size: 13px;">
                <q-icon name="calendar_today" size="16px" class="q-mr-sm" />
                {{ formatDate(task.date) }}
              </div>
              <div class="row q-gutter-x-sm">
                <q-btn flat round dense icon="edit" color="grey-8" class="bg-grey-2 action-btn" @click.stop="editWork(task)" />
              </div>
            </q-card-actions>
          </q-card>
        </div>

        <!-- Pagination -->
        <div class="row justify-center q-mt-lg q-pb-xl" v-if="workStore.meta.totalPages > 1">
          <q-pagination
            v-model="currentPage"
            :max="workStore.meta.totalPages"
            :max-pages="5"
            boundary-numbers
            direction-links
            color="primary"
            @update:model-value="fetchWorkList"
          />
        </div>
      </div>
    </div>

    <q-page-sticky position="bottom-right" :offset="[18, 18]" style="z-index: 9999">
      <q-btn fab icon="add" color="primary" @click="addNewWork" :class="{'fab-clicked': isFabClicked, 'fab-animate': !isFabClicked}" />
    </q-page-sticky>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useWorkListStore } from '../stores/useWorkList';
import { useHouseTypeStore } from '../stores/useHouseType';

const router = useRouter();
const workStore = useWorkListStore();
const houseTypeStore = useHouseTypeStore();

const loading = ref<boolean>(false);
const error = ref<string>('');

// ตัวแปรสำหรับค้นหาและกรอง
const searchTerm = ref('');
const activeFilter = ref('all');
const selectedType = ref('ทั้งหมด'); // ตัวเลือกประเภทงาน
const sortOrder = ref('desc');       // desc = ล่าสุด -> เก่า, asc = เก่า -> ล่าสุด

// ตัวเลือกใน Dropdown
const typeOptions = computed(() => {
  return ['ทั้งหมด', ...houseTypeStore.houseTypes.map(ht => ht.name)];
});
const sortOptions = [
  { label: 'ล่าสุด - เก่า', value: 'desc' },
  { label: 'เก่า - ล่าสุด', value: 'asc' }
];

const currentPage = ref(1);

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

// ==========================================
// 🎯 Mock Data (ปรับวันที่ให้เป็นรูปแบบสากลเพื่อการเรียงลำดับที่แม่นยำ)
// ==========================================
const tasks = computed<TaskItem[]>(() => {
  return workStore.works.map(work => {
    // Find matching status config from backend meta
    const meta = workStore.statusMeta.find(m => m.key === work.status) || {
      label: work.status || 'รออนุมัติ',
      bgClass: 'bg-grey-1',
      textColor: 'grey-8',
      key: 'others'
    };

    return {
      id: work.jobId,
      title: work.projectName || 'ไม่ระบุชื่อโครงการ',
      status: meta.label,
      statusBgClass: meta.bgClass,
      statusTextColor: meta.textColor,
      statusKey: meta.key,
      type: work.houseType?.name || 'ไม่ระบุ',
      area: work.usableArea || 0,
      team: 'ไม่ระบุทีม', // Currently backend Work interface doesn't have team
      customer: work.customer?.fullName || 'ไม่ระบุลูกค้า',
      date: work.createdAt || new Date().toISOString()
    };
  });
});

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
  const allCount = workStore.statusMeta.reduce((sum, meta) => sum + meta.count, 0);
  
  const dynamicFilters = workStore.statusMeta.map(meta => ({
    label: meta.label,
    value: meta.key,
    count: meta.count > 0 ? meta.count : undefined,
  }));

  return [
    { label: 'ทั้งหมด', value: 'all', count: allCount },
    ...dynamicFilters
  ];
});

let searchTimeout: ReturnType<typeof setTimeout>;
watch(searchTerm, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    void fetchWorkList();
  }, 500);
});

watch([activeFilter, selectedType, sortOrder], () => {
  currentPage.value = 1;
  void fetchWorkList();
});

async function viewDetail(task: TaskItem): Promise<void> {
  await router.push(`/admin/work/${task.id}`);
}

async function editWork(task: TaskItem): Promise<void> {
  await router.push(`/admin/work/create?editId=${task.id}`);
}

const isFabClicked = ref(false);

function addNewWork(): void {
  isFabClicked.value = true;
  setTimeout(() => {
    void router.push('/admin/work/create');
    // Reset state slightly after routing so it's clean when user comes back
    setTimeout(() => { isFabClicked.value = false; }, 300);
  }, 300);
}

// ==========================================
// 🎯 API Integration — ดึงข้อมูลจาก Backend
// ==========================================
async function fetchWorkList(): Promise<void> {
  loading.value = true;
  error.value = '';
  
  try {
    await Promise.all([
      workStore.fetchJobs({
        page: currentPage.value,
        limit: 10,
        status: activeFilter.value,
        search: searchTerm.value,
        type: selectedType.value,
        sort: sortOrder.value
      }),
      houseTypeStore.houseTypes.length === 0 ? houseTypeStore.fetchHouseTypes() : Promise.resolve()
    ]);
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
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 6px;
}

/* ─── FAB Animation ────────────────────────────────────────── */
.fab-animate {
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.fab-animate:hover {
  transform: scale(1.1) rotate(90deg);
}

.fab-animate:active {
  transform: scale(0.95);
}

.fab-clicked {
  animation: pulse-once 0.3s ease-out forwards;
}

@keyframes pulse-once {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.8);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 20px rgba(25, 118, 210, 0);
  }
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
