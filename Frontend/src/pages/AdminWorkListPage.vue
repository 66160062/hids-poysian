<template>
  <q-page class="admin-work-page bg-grey-1">
    <div class="q-px-md q-pt-lg relative-position">
      <!-- Loading Indicator -->
      <q-inner-loading
        :showing="loading"
        label="กำลังโหลดข้อมูล..."
        color="primary"
        style="z-index: 100"
      />

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

      <div class="row q-mb-sm q-gutter-x-sm no-wrap">
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

        <q-btn
          round
          unelevated
          :color="activeFilterCount > 0 ? 'primary' : 'white'"
          :text-color="activeFilterCount > 0 ? 'white' : 'primary'"
          icon="tune"
          class="shadow-1"
          style="height: 48px; width: 48px; min-height: 48px"
          @click="showFilterDialog = true"
        >
          <q-badge
            v-if="activeFilterCount > 0"
            color="red"
            floating
            rounded
            style="top: 2px; right: 2px"
            >{{ activeFilterCount }}</q-badge
          >
        </q-btn>
      </div>

      <!-- Tabs for Job Type -->
      <q-tabs
        v-model="selectedJobType"
        dense
        class="bg-white text-grey-7 shadow-1 q-mb-lg"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        style="border-radius: 12px"
      >
        <q-tab name="ทั้งหมด">
          <div class="row items-center q-gutter-x-sm no-wrap">
            <q-icon name="format_list_bulleted" size="18px" />
            <span>ทั้งหมด</span>
            <q-badge color="grey-3" text-color="grey-8" rounded>{{ allJobCount }}</q-badge>
          </div>
        </q-tab>
        <q-tab name="ตรวจบ้าน">
          <div class="row items-center q-gutter-x-sm no-wrap">
            <q-icon name="home" size="18px" />
            <span>ตรวจบ้าน</span>
            <q-badge color="blue-1" text-color="blue-8" rounded>{{ defectJobCount }}</q-badge>
          </div>
        </q-tab>
        <q-tab name="งานก่อสร้าง">
          <div class="row items-center q-gutter-x-sm no-wrap">
            <q-icon name="construction" size="18px" />
            <span>ก่อสร้าง</span>
            <q-badge color="orange-1" text-color="orange-8" rounded>{{
              constructJobCount
            }}</q-badge>
          </div>
        </q-tab>
      </q-tabs>

      <!-- Filter Bottom Sheet Dialog -->
      <q-dialog v-model="showFilterDialog" position="bottom">
        <q-card
          style="width: 100%; max-width: 600px; border-radius: 24px 24px 0 0"
          class="q-pa-lg shadow-up-4"
        >
          <div class="row items-center justify-between q-mb-lg">
            <div class="text-h6 text-weight-bold text-dark">ตัวกรอง</div>
            <div class="row items-center">
              <q-btn
                v-if="activeFilterCount > 0"
                flat
                dense
                color="negative"
                label="ล้าง"
                class="q-mr-sm"
                @click="clearFilters"
              />
              <q-btn flat round dense icon="close" color="grey-6" v-close-popup />
            </div>
          </div>

          <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">สถานะงาน</div>
          <q-select
            v-model="activeFilter"
            :options="filters"
            option-value="value"
            option-label="label"
            emit-value
            map-options
            dense
            outlined
            rounded
            class="q-mb-md filter-select"
            behavior="dialog"
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label
                    >{{ scope.opt.label }}
                    <span v-if="scope.opt.count" class="text-grey-6"
                      >({{ scope.opt.count }})</span
                    ></q-item-label
                  >
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">
            ประเภทบ้าน
          </div>
          <q-select
            v-model="selectedType"
            :options="typeOptions"
            dense
            outlined
            rounded
            class="q-mb-md filter-select"
            behavior="dialog"
          />

          <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">
            เรียงลำดับ
          </div>
          <q-select
            v-model="sortOrder"
            :options="sortOptions"
            emit-value
            map-options
            dense
            outlined
            rounded
            class="q-mb-xl filter-select"
            behavior="dialog"
          />

          <q-btn
            unelevated
            rounded
            color="primary"
            label="เสร็จสิ้น"
            class="full-width text-weight-bold"
            style="height: 48px; font-size: 16px"
            v-close-popup
          />
        </q-card>
      </q-dialog>

      <!-- Active Filters Chips -->
      <div v-if="activeFilterCount > 0" class="row items-center q-gutter-x-sm q-mb-sm">
        <span class="text-caption text-grey-7 q-mr-xs q-pl-xs">กำลังกรอง:</span>
        <q-chip
          v-if="activeFilter !== 'all'"
          removable
          @remove="activeFilter = 'all'"
          color="blue-1"
          text-color="primary"
          dense
          class="text-weight-medium"
        >
          {{ filters.find((f) => f.value === activeFilter)?.label || activeFilter }}
        </q-chip>
        <q-chip
          v-if="selectedType !== 'ทั้งหมด'"
          removable
          @remove="selectedType = 'ทั้งหมด'"
          color="blue-1"
          text-color="primary"
          dense
          class="text-weight-medium"
        >
          {{ selectedType }}
        </q-chip>
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
            style="border-radius: 12px"
            v-ripple
            @click="viewDetail(task)"
          >
            <q-card-section class="q-pa-md">
              <div class="row justify-between items-center q-mb-sm">
                <div
                  class="text-weight-bold text-dark ellipsis"
                  style="font-size: 17px; max-width: 65%"
                >
                  {{ task.title }}
                </div>
                <div class="row items-center q-gutter-x-sm">
                  <q-badge
                    class="status-badge"
                    :class="[task.statusBgClass, `text-${task.statusTextColor}`]"
                  >
                    {{ task.status }}
                  </q-badge>
                  <q-btn
                    flat
                    round
                    dense
                    icon="more_vert"
                    color="grey-8"
                    style="margin-right: -8px"
                    @click.stop
                  >
                    <q-menu auto-close anchor="bottom right" self="top right">
                      <q-list style="min-width: 150px">
                        <q-item clickable @click="editWork(task)">
                          <q-item-section avatar style="min-width: 0; padding-right: 8px">
                            <q-icon name="edit" color="primary" size="20px" />
                          </q-item-section>
                          <q-item-section class="text-weight-medium">แก้ไขงาน</q-item-section>
                        </q-item>
                        <q-separator />
                        <q-item clickable @click="onDeleteClick(task)">
                          <q-item-section avatar style="min-width: 0; padding-right: 8px">
                            <q-icon name="delete" color="negative" size="20px" />
                          </q-item-section>
                          <q-item-section class="text-weight-medium text-negative"
                            >ลบงาน</q-item-section
                          >
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                </div>
              </div>

              <div class="row items-center text-grey-7" style="font-size: 13px">
                <q-icon name="person" size="16px" class="q-mr-sm" />
                <span class="ellipsis" style="max-width: 80%">{{ task.customer }}</span>
              </div>
            </q-card-section>

            <q-separator color="grey-2" inset />

            <q-card-actions class="row items-center q-px-md q-py-sm">
              <div class="row q-gutter-x-sm">
                <q-badge color="grey-2" text-color="grey-8" class="tag-badge">
                  <q-icon name="apartment" size="14px" class="q-mr-xs" /> {{ task.type || 'คอนโด' }}
                </q-badge>
                <q-badge color="grey-2" text-color="grey-8" class="tag-badge">
                  <q-icon name="square_foot" size="14px" class="q-mr-xs" />
                  {{ task.area || '0' }} ตร.ม.
                </q-badge>
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

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-fab
        v-model="isFabClicked"
        icon="add"
        active-icon="close"
        direction="up"
        color="primary"
        class="shadow-4 custom-fab"
        transition-show="jump-up"
        transition-hide="jump-down"
      >
        <q-fab-action
          color="orange-8"
          text-color="white"
          icon="construction"
          label="งานก่อสร้าง"
          class="text-weight-bold custom-fab-action"
          @click="addNewWork('construction')"
        />
        <q-fab-action
          color="blue-8"
          text-color="white"
          icon="home"
          label="ตรวจบ้าน"
          class="text-weight-bold custom-fab-action"
          @click="addNewWork('defect')"
        />
      </q-fab>
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useWorkListStore } from '../stores/useWorkList';
import { useHouseTypeStore } from '../stores/useHouseType';

const router = useRouter();
const $q = useQuasar();
const workStore = useWorkListStore();
const houseTypeStore = useHouseTypeStore();

const loading = ref<boolean>(false);
const error = ref<string>('');

// ตัวแปรสำหรับค้นหาและกรอง
const searchTerm = ref('');
const activeFilter = ref('all');
const selectedType = ref('ทั้งหมด'); // ตัวเลือกประเภทบ้าน
const selectedJobType = ref('ทั้งหมด'); // ตัวเลือกประเภทงาน
const sortOrder = ref('desc'); // desc = ล่าสุด -> เก่า, asc = เก่า -> ล่าสุด

// ตัวเลือกใน Dropdown
const typeOptions = computed(() => {
  return ['ทั้งหมด', ...houseTypeStore.houseTypes.map((ht) => ht.name)];
});
const sortOptions = [
  { label: 'ล่าสุด - เก่า', value: 'desc' },
  { label: 'เก่า - ล่าสุด', value: 'asc' },
];

const showFilterDialog = ref(false);

const activeFilterCount = computed(() => {
  let count = 0;
  if (selectedType.value !== 'ทั้งหมด') count++;
  if (activeFilter.value !== 'all') count++;
  return count;
});

function clearFilters() {
  selectedType.value = 'ทั้งหมด';
  activeFilter.value = 'all';
  sortOrder.value = 'desc';
}

const allJobCount = computed(() => workStore.absoluteJobCounts.all);
const defectJobCount = computed(() => workStore.absoluteJobCounts.defect);
const constructJobCount = computed(() => workStore.absoluteJobCounts.construction);

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
  inspectionType: string;
  area: number;
  team: string;
  customer: string;
  date: string;
}

// ==========================================
// 🎯 Mock Data (ปรับวันที่ให้เป็นรูปแบบสากลเพื่อการเรียงลำดับที่แม่นยำ)
// ==========================================
const tasks = computed<TaskItem[]>(() => {
  let works = workStore.works;

  // Local fallback filter in case backend doesn't support inspectionType param yet
  if (selectedJobType.value !== 'ทั้งหมด') {
    works = works.filter((w) => {
      const type = w.inspectionType || '';
      if (selectedJobType.value === 'งานก่อสร้าง') {
        return (
          type === 'CONSTRUCTION_INSPECTION' || type === 'ตรวจก่อสร้าง' || type === 'Construction'
        );
      } else {
        return type === 'DEFECT_INSPECTION' || type === 'ตรวจ Defect' || type === 'Defect';
      }
    });
  }

  return works.map((work) => {
    // Find matching status config from backend meta
    const meta = workStore.statusMeta.find((m) => m.key === work.status) || {
      label: work.status || 'รออนุมัติ',
      bgClass: 'bg-grey-1',
      textColor: 'grey-8',
      key: 'others',
    };

    let finalStatusLabel = meta.label;

    // ค้นหารอบตรวจที่มีสถานะกำลังดำเนินการ (SCHEDULED หรือ Active)
    let latestActiveRoundDate = work.createdAt;
    if (work.rounds && work.rounds.length > 0) {
      // เรียงรอบตรวจตาม id หรือวันที่สร้างจากมากไปน้อยเพื่อเอารอบล่าสุด
      const sortedRounds = [...work.rounds].sort((a, b) => b.roundId - a.roundId);
      const activeRound = sortedRounds.find(
        (r) => r.status === 'SCHEDULED' || r.status === 'Active',
      );
      if (activeRound && activeRound.scheduledDate) {
        latestActiveRoundDate = activeRound.scheduledDate;
      }

      if (work.status === 'Completed') {
        const completedRound = sortedRounds.find(
          (r) => r.status === 'APPROVED' || r.status === 'COMPLETED',
        );
        if (completedRound) {
          finalStatusLabel = `เสร็จสิ้น ${completedRound.roundNumber ?? ''}`.trim();
        } else {
          finalStatusLabel = `เสร็จสิ้น ${sortedRounds[0]?.roundNumber ?? ''}`.trim();
        }
      }
    }

    return {
      id: work.jobId,
      title: work.projectName || 'ไม่ระบุชื่อโครงการ',
      status: finalStatusLabel,
      statusBgClass: meta.bgClass,
      statusTextColor: meta.textColor,
      statusKey: meta.key,
      inspectionType: work.inspectionType || '',
      type: work.houseType?.name || 'ไม่ระบุ',
      area: work.usableArea || 0,
      team: 'ไม่ระบุทีม', // Currently backend Work interface doesn't have team
      customer: work.customer?.fullName || 'ไม่ระบุลูกค้า',
      date: latestActiveRoundDate || new Date().toISOString(),
    };
  });
});

// ==========================================
// ลอจิก Filter & Search & Sort
// ==========================================
const filters = computed(() => {
  const allCount = workStore.statusMeta.reduce((sum, meta) => sum + meta.count, 0);

  const dynamicFilters = workStore.statusMeta.map((meta) => ({
    label: meta.label,
    value: meta.key,
    count: meta.count > 0 ? meta.count : undefined,
  }));

  return [{ label: 'ทั้งหมด', value: 'all', count: allCount }, ...dynamicFilters];
});

let searchTimeout: ReturnType<typeof setTimeout>;
watch(searchTerm, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    void fetchWorkList();
  }, 500);
});

watch([activeFilter, selectedType, selectedJobType, sortOrder], () => {
  currentPage.value = 1;
  void fetchWorkList();
});

async function viewDetail(task: TaskItem): Promise<void> {
  const isConstruction =
    task.inspectionType === 'CONSTRUCTION_INSPECTION' ||
    task.inspectionType === 'ตรวจก่อสร้าง' ||
    task.inspectionType === 'Construction' ||
    task.inspectionType === 'งานก่อสร้าง';

  if (isConstruction) {
    await router.push(`/admin/work/cons/${task.id}`);
  } else {
    await router.push(`/admin/work/ins/${task.id}`);
  }
}

const isFabClicked = ref(false);

function addNewWork(type: 'defect' | 'construction') {
  isFabClicked.value = false;
  void router.push({
    path: '/admin/work/create',
    query: { type },
  });
}

function editWork(task: TaskItem) {
  void router.push(`/admin/work/create?editId=${task.id}`);
}

function onDeleteClick(task: TaskItem) {
  $q.dialog({
    title: 'ยืนยันการลบข้อมูล',
    message: 'คุณแน่ใจหรือไม่ที่จะลบงานนี้? การกระทำนี้ไม่สามารถกู้คืนได้',
    persistent: true,
    ok: { label: 'ลบข้อมูล', color: 'negative', flat: true },
    cancel: { label: 'ยกเลิก', color: 'grey-8', flat: true },
  }).onOk(() => {
    void (async () => {
      try {
        await workStore.removeJob(task.id);
        $q.notify({ type: 'positive', message: 'ลบงานเรียบร้อยแล้ว' });
        // Trigger refetch
        await workStore.fetchJobs({
          page: currentPage.value,
          limit: 10,
          status: activeFilter.value,
          search: searchTerm.value,
          type: selectedType.value,
          sort: sortOrder.value,
          ...(selectedJobType.value !== 'ทั้งหมด' && { inspectionType: selectedJobType.value }),
        });
      } catch {
        $q.notify({ type: 'negative', message: 'เกิดข้อผิดพลาดในการลบงาน' });
      }
    })();
  });
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
        sort: sortOrder.value,
        ...(selectedJobType.value !== 'ทั้งหมด' && { inspectionType: selectedJobType.value }),
      }),
      houseTypeStore.houseTypes.length === 0 ? houseTypeStore.fetchHouseTypes() : Promise.resolve(),
    ]);
  } catch (err: unknown) {
    error.value = 'เกิดข้อผิดพลาดในการโหลดข้อมูล โปรดลองใหม่อีกครั้ง';
    console.error('fetchWorkList error:', err);
  } finally {
    loading.value = false;
  }
}

onMounted((): void => {
  void workStore.fetchAbsoluteJobCounts();
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
  border-radius: 24px;
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
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

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
  font-weight: 700;
  font-size: 12.5px;
  padding: 6px 14px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  letter-spacing: 0.2px;
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

<style>
/* Make jump animations snappier globally for this page's components */
.q-transition--jump-down-enter-active,
.q-transition--jump-down-leave-active,
.q-transition--jump-up-enter-active,
.q-transition--jump-up-leave-active {
  transition-duration: 0.15s !important;
}

/* Fix q-fab pill buttons overflowing the right edge of screen */
.custom-fab .q-fab__actions--up {
  left: auto !important;
  right: 0 !important;
  transform: none !important;
  align-items: flex-end !important;
}

/* Speed up the FAB jump animation */
.q-transition--jump-up-enter-active,
.q-transition--jump-up-leave-active,
.q-transition--jump-down-enter-active,
.q-transition--jump-down-leave-active {
  transition-duration: 0.15s !important;
}

/* Ensure FAB actions are exactly the same size with larger icons */
.custom-fab-action {
  width: 150px !important;
  justify-content: flex-start !important;
  padding-left: 16px !important;
}
.custom-fab-action :deep(.q-icon) {
  font-size: 26px !important;
  margin-right: 8px !important;
}
.custom-fab-action :deep(.q-btn__content) {
  width: 100%;
  justify-content: flex-start;
}
</style>
