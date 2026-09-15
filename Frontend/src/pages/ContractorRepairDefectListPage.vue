<template>
  <q-page class="defect-list-page bg-grey-1">
    <div class="q-px-md q-pt-md q-pb-xl">
      <!-- Error Banner -->
      <q-banner v-if="error" class="text-white bg-negative q-mb-md" rounded dense>
        {{ error }}
        <template #action>
          <q-btn flat :label="t('contractor.repairDefectList.retry')" @click="loadData" />
        </template>
      </q-banner>

      <!-- Summary Stats -->
      <q-card flat bordered class="summary-card q-mb-md">
        <q-card-section class="q-pa-sm">
          <div class="row q-col-gutter-xs">
            <div class="col-4 text-center stat-box">
              <q-icon name="meeting_room" color="grey-6" size="18px" />
              <div class="stat-label">{{ t('contractor.repairDefectList.rooms') }}</div>
              <div class="stat-num tabular-nums">{{ stats.rooms }}</div>
            </div>
            <div class="col-4 text-center stat-box border-lr">
              <q-icon name="build" color="grey-6" size="18px" />
              <div class="stat-label">{{ t('contractor.repairDefectList.jobTypes') }}</div>
              <div class="stat-num tabular-nums">{{ stats.jobTypes }}</div>
            </div>
            <div class="col-4 text-center stat-box">
              <q-icon name="list_alt" color="grey-6" size="18px" />
              <div class="stat-label">{{ t('contractor.repairDefectList.total') }}</div>
              <div class="stat-num tabular-nums">{{ stats.total }}</div>
            </div>
          </div>

          <q-separator class="q-my-sm" />

          <div class="row q-col-gutter-xs">
            <div class="col-6 text-center">
              <div class="row items-center justify-center q-gutter-xs">
                <q-icon name="check_circle" color="green" size="20px" />
                <span class="text-caption text-grey-7">{{ t('contractor.repairDefectList.repaired') }}</span>
              </div>
              <div class="text-h6 text-green text-weight-bold tabular-nums">{{ stats.passed }}</div>
            </div>
            <div class="col-6 text-center">
              <div class="row items-center justify-center q-gutter-xs">
                <q-icon name="cancel" color="red" size="20px" />
                <span class="text-caption text-grey-7">{{ t('contractor.repairDefectList.notRepaired') }}</span>
              </div>
              <div class="text-h6 text-red text-weight-bold tabular-nums">{{ stats.failed }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Search + Filter Row -->
      <div class="row q-gutter-x-sm no-wrap items-center q-mb-md">
        <q-input
          v-model="searchQuery"
          dense
          borderless
          rounded
          :placeholder="t('contractor.repairDefectList.searchPlaceholder')"
          class="search-input col"
          hide-bottom-space
        >
          <template v-slot:prepend>
            <q-icon name="search" color="grey-7" />
          </template>
          <template v-slot:append v-if="searchQuery">
            <q-icon name="close" @click="searchQuery = ''" class="cursor-pointer" />
          </template>
        </q-input>

        <q-btn
          round
          unelevated
          :color="activeFilterCount > 0 ? 'primary' : 'white'"
          :text-color="activeFilterCount > 0 ? 'white' : 'primary'"
          icon="tune"
          style="height: 48px; width: 48px; min-height: 48px"
          @click="showFilter = true"
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

      <!-- Defect List -->
      <div class="section-title q-mb-sm">{{ t('contractor.repairDefectList.defectListTitle') }}</div>

      <q-card
        v-for="item in paginatedDefects"
        :key="item.id"
        flat
        bordered
        tabindex="0"
        role="button"
        class="defect-card q-mb-sm card-stagger"
        v-ripple
        @click="goToDetail(item)"
        @keyup.enter="goToDetail(item)"
      >
        <div class="row no-wrap">
          <!-- Image -->
          <div class="defect-card-img">
            <q-img :src="item.image" fit="cover" style="height: 100%; width: 100%" />
            <div class="img-caption">{{ item.location }}</div>
          </div>

          <!-- Info -->
          <div class="col defect-card-body">
            <!-- Status Badge -->
              <div class="row justify-end q-mb-xs">
                <q-badge
                  :color="
                    item.status === 'verified'
                      ? 'green-2'
                      : item.status === 'repaired'
                        ? 'blue-2'
                        : item.status === 'pending_repair'
                          ? 'orange-2'
                          : 'red-2'
                  "
                  :text-color="
                    item.status === 'verified'
                      ? 'green-8'
                      : item.status === 'repaired'
                        ? 'blue-8'
                        : item.status === 'pending_repair'
                          ? 'orange-9'
                          : 'red-8'
                  "
                  :label="statusLabel(item.status)"
                  class="status-badge"
                />
              </div>

              <div class="field-label">{{ t('contractor.repairDefectList.jobTypeLabel') }}</div>
              <div class="field-value q-mb-xs">{{ item.jobType }}</div>
              <div class="field-label">{{ t('contractor.repairDefectList.itemsLabel') }}</div>

              <div class="row q-gutter-xs q-mt-xs">
                <q-chip
                  v-for="tag in item.tags"
                  :key="tag"
                  dense
                  color="blue-1"
                  text-color="primary"
                  class="text-weight-bold"
                  size="sm"
                  >{{ tag }}</q-chip
                >
              </div>

              <template v-if="item.description">
                <div class="field-label q-mt-sm">{{ t('contractor.repairDefectList.noteLabel') }}</div>
                <div class="text-body2 text-grey-8">{{ item.description }}</div>
              </template>

              <!-- Plan Position Button -->
              <div v-if="item.planId" class="q-mt-sm">
                <q-btn
                  unelevated
                  dense
                  no-caps
                  size="sm"
                  icon="place"
                  :label="t('components.planPosition.viewButton')"
                  class="plan-position-pill"
                  @click.stop="openPlanPosition(item)"
                />
              </div>
            </div>
          </div>
      </q-card>

      <!-- Pagination -->
      <div class="row justify-center q-mt-md" v-if="totalPages > 1">
        <q-pagination
          v-model="currentPage"
          :max="totalPages"
          color="primary"
          boundary-numbers
          direction-links
          :max-pages="5"
        />
      </div>
    </div>

    <!-- Filter Dialog -->
    <q-dialog
      v-model="showFilter"
      position="bottom"
      transition-show="sheet-in"
      transition-hide="sheet-out"
    >
      <q-card
        style="width: 100%; max-width: 600px; max-height: 85vh; border-radius: 28px 28px 0 0"
        class="q-pa-lg"
      >
        <div class="sheet-handle" />
        <div class="row items-center justify-between q-mb-lg">
          <div class="text-h6 text-weight-bold text-dark">{{ t('contractor.repairDefectList.filter') }}</div>
          <div class="row items-center">
            <q-btn
              v-if="activeFilterCount > 0"
              flat
              dense
              color="negative"
              :label="t('contractor.repairDefectList.clearAll')"
              class="q-mr-sm"
              @click="resetFilter"
            />
            <q-btn flat round dense icon="close" color="grey-6" v-close-popup />
          </div>
        </div>

        <div class="filter-scroll">
          <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">{{ t('contractor.repairDefectList.sortLabel') }}</div>
          <div class="row q-gutter-sm q-mb-lg">
            <q-btn
              unelevated
              rounded
              no-caps
              :color="sortOrder === 'newest' ? 'primary' : 'grey-2'"
              :text-color="sortOrder === 'newest' ? 'white' : 'grey-8'"
              class="sort-toggle-btn"
              @click="sortOrder = sortOrder === 'newest' ? '' : 'newest'"
            >
              <span class="text-weight-medium q-px-sm">{{ t('contractor.repairDefectList.sortNewestFirst') }}</span>
            </q-btn>
            <q-btn
              unelevated
              rounded
              no-caps
              :color="sortOrder === 'oldest' ? 'primary' : 'grey-2'"
              :text-color="sortOrder === 'oldest' ? 'white' : 'grey-8'"
              class="sort-toggle-btn"
              @click="sortOrder = sortOrder === 'oldest' ? '' : 'oldest'"
            >
              <span class="text-weight-medium q-px-sm">{{ t('contractor.repairDefectList.sortOldestFirst') }}</span>
            </q-btn>
          </div>

          <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">{{ t('contractor.repairDefectList.severityLabel') }}</div>
          <FilterChipGroup v-model="selectedSeverities" :options="filterSeverities" class="q-mb-lg"/>

          <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">{{ t('contractor.repairDefectList.statusLabel') }}</div>
          <FilterChipGroup v-model="selectedStatuses" :options="filterStatuses" class="q-mb-lg" />

          <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">{{ t('contractor.repairDefectList.floorFilterLabel') }}</div>
          <FilterChipGroup v-model="selectedFloors" :options="filterFloors" class="q-mb-xl" />

          <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">{{ t('contractor.repairDefectList.planPositionLabel') }}</div>
          <FilterChipGroup v-model="selectedPlanPosition" :options="filterPlanPosition" class="q-mb-xl" />

          <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">{{ t('contractor.repairDefectList.roomTypeLabel') }}</div>
          <FilterChipGroup v-model="selectedRooms" :options="filterRooms" class="q-mb-lg" />

          <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">{{ t('contractor.repairDefectList.jobTypeFilterLabel') }}</div>
          <FilterChipGroup v-model="selectedJobTypes" :options="filterJobTypes" class="q-mb-lg" />
        </div>

        <q-btn
          unelevated
          rounded
          color="primary"
          :label="t('contractor.repairDefectList.search')"
          class="full-width text-weight-bold"
          style="height: 48px; font-size: 16px"
          @click="showFilter = false"
        />
      </q-card>
    </q-dialog>

    <!-- Dialog ดูตำแหน่งในแปลน (Read-only) -->
    <PlanPositionDialog
      v-model="showPlanDialog"
      :job-id="getJobId()"
      :initial-plan-id="activeDefect?.planId ?? null"
      :initial-x="activeDefect?.planX ?? null"
      :initial-y="activeDefect?.planY ?? null"
      :initial-zone="activeDefect?.locationZone ?? null"
      readonly
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia'; // ✅ เพิ่ม
import {
  useContractorRepair,
  type DefectItem,
} from 'src/stores/useContractormain';
import { useLinkAccess } from 'src/stores/useLinkAccess';
import FilterChipGroup from 'src/components/FilterChipGroup.vue';
import PlanPositionDialog from 'src/components/PlanPositionDialog.vue';
import { useQuasar } from 'quasar';
import { createIconSpinner } from 'src/composables/useIconSpinner';

const $q = useQuasar();
const repairListSpinner = createIconSpinner('build');

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { hasLinkAccess, projectId, linkToken } = useLinkAccess();

// Translated status label — mirrors defectStatusLabel() in the store, but locale-aware.
// Kept local to this page since the store's export must stay language-neutral for other consumers.
function statusLabel(status: string): string {
  switch (status) {
    case 'verified':
      return t('contractor.repairDefectList.status.verified');
    case 'repaired':
      return t('contractor.repairDefectList.status.repaired');
    case 'rejected':
      return t('contractor.repairDefectList.status.rejected');
    case 'pending_repair':
    default:
      return t('contractor.repairDefectList.status.pending');
  }
}

const store = useContractorRepair();
const { rooms, allDefectItems, error } = storeToRefs(store); // ✅ storeToRefs สำหรับ state
const { getDefectsByRoom, fetchRepairData } = store; // ✅ function ใช้ตรงๆ

function getJobId(): number | null {
  // ลิงก์ผู้รับเหมาที่ verify แล้วต้องยึด jobId จาก token เสมอ ห้ามให้ query string ทับ
  if (hasLinkAccess.value) return projectId.value;
  const queryJobId = route.query.jobId;
  if (typeof queryJobId === 'string' && queryJobId) return Number(queryJobId);
  return projectId.value;
}

async function loadData() {
  const jobId = getJobId();
  if (!jobId) return;
  await fetchRepairData(jobId, linkToken.value);
}

// โหลดข้อมูลเองถ้ายังไม่มีใน store (เช่น เปิดลิงก์ตรงมาที่หน้านี้ ไม่ได้ผ่านหน้า repair-overview มาก่อน)
onMounted(async () => {
  if (allDefectItems.value.length > 0) return;
  $q.loading.show({
    spinner: repairListSpinner,
    spinnerColor: 'primary',
    spinnerSize: 70,
    backgroundColor: 'white',
  });
  try {
    await loadData();
  } finally {
    $q.loading.hide();
  }
});

const filterRooms = computed(() => [t('contractor.repairDefectList.all'), ...rooms.value.map((r) => r.name)]);
const filterFloors = computed(() => [
  t('contractor.repairDefectList.all'),
  ...Array.from(new Set(rooms.value.map((r) => r.floor).filter((floor) => floor && floor !== '-'))),
]);
const filterJobTypes = computed(() => [
  t('contractor.repairDefectList.all'),
  ...Array.from(new Set(baseItems.value.flatMap((item) => item.categoryNames))),
]);
const filterSeverities = computed(() => [t('contractor.repairDefectList.all'), 'Major', 'Minor']);
const filterStatuses = computed(() => [
  t('contractor.repairDefectList.status.pending'),
  t('contractor.repairDefectList.status.repaired'),
  t('contractor.repairDefectList.status.rejected'),
  t('contractor.repairDefectList.status.verified'),
]);
const filterPlanPosition = computed(() => [
  t('contractor.repairDefectList.hasPlanPosition'),
  t('contractor.repairDefectList.noPlanPosition'),
]);

const showFilter = ref(false);
const searchQuery = ref('');
const selectedRooms = ref<string[]>([]);
const selectedJobTypes = ref<string[]>([]);
const selectedFloors = ref<string[]>([]);
const selectedPlanPosition = ref<string[]>([]);
const selectedSeverities = ref<string[]>([]);
const selectedStatuses = ref<string[]>([]);
const sortOrder = ref<'newest' | 'oldest' | ''>('');

const activeFilterCount = computed(() => {
  let count = 0;
  if (selectedRooms.value.length > 0) count++;
  if (selectedJobTypes.value.length > 0) count++;
  if (selectedFloors.value.length > 0) count++;
  if (selectedPlanPosition.value.length > 0) count++;
  if (selectedSeverities.value.length > 0) count++;
  if (selectedStatuses.value.length > 0) count++;
  if (sortOrder.value) count++;
  return count;
});

const showPlanDialog = ref(false);
const activeDefect = ref<DefectItem | null>(null);

function openPlanPosition(defect: DefectItem) {
  activeDefect.value = defect;
  showPlanDialog.value = true;
}

const roomId = computed(() => {
  const id = Number(route.params.id);
  return isNaN(id) ? null : id;
});

const baseItems = computed((): DefectItem[] =>
  roomId.value ? getDefectsByRoom(roomId.value) : allDefectItems.value,
);

const stats = computed(() => ({
  rooms: roomId.value ? 1 : rooms.value.length,
  jobTypes: [...new Set(baseItems.value.map((d: DefectItem) => d.jobType))].length,
  total: baseItems.value.length,
  passed: baseItems.value.filter((d: DefectItem) => d.status === 'verified' || d.status === 'repaired').length,
  failed: baseItems.value.filter((d: DefectItem) => d.status === 'rejected' || d.status === 'pending_repair').length,
}));

const currentPage = ref(1);
const itemsPerPage = ref(10);



const defectItems = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();

  const filtered = baseItems.value.filter((item: DefectItem) => {
    const matchSearch =
      !q ||
      item.location.toLowerCase().includes(q) ||
      item.jobType.toLowerCase().includes(q) ||
      item.tags.some((tag) => tag.toLowerCase().includes(q));
    const matchRoom =
      selectedRooms.value.length === 0 ||
      selectedRooms.value.includes(t('contractor.repairDefectList.all')) ||
      selectedRooms.value.some((r) => item.location.startsWith(r.split(',')[0] ?? ''));
    const matchJob =
      selectedJobTypes.value.length === 0 ||
      selectedJobTypes.value.includes(t('contractor.repairDefectList.all')) ||
      item.categoryNames.some((name) => selectedJobTypes.value.includes(name));
    const matchFloor =
      selectedFloors.value.length === 0 ||
      selectedFloors.value.includes(t('contractor.repairDefectList.all')) ||
      selectedFloors.value.includes(rooms.value.find((r) => r.id === item.roomId)?.floor ?? '');
    const matchStatus =
      selectedStatuses.value.length === 0 ||
      selectedStatuses.value.includes(statusLabel(item.status));
    const matchPlanPosition =
      selectedPlanPosition.value.length === 0 ||
      (selectedPlanPosition.value.includes(t('contractor.repairDefectList.hasPlanPosition')) && item.planId != null) ||
      (selectedPlanPosition.value.includes(t('contractor.repairDefectList.noPlanPosition')) && item.planId == null);
    return matchSearch && matchRoom && matchJob && matchFloor && matchPlanPosition && matchStatus;
  });

  if (sortOrder.value === 'newest') {
    return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  if (sortOrder.value === 'oldest') {
    return [...filtered].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  return filtered;
});

const totalPages = computed(() => Math.ceil(defectItems.value.length / itemsPerPage.value));

const paginatedDefects = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return defectItems.value.slice(start, end);
});

watch(defectItems, () => {
  currentPage.value = 1;
});

const resetFilter = () => {
  selectedRooms.value = [];
  selectedJobTypes.value = [];
  selectedFloors.value = [];
  selectedPlanPosition.value = [];
  selectedSeverities.value = [];
  selectedStatuses.value = [];
  sortOrder.value = '';
};

const goToDetail = (item: DefectItem) => {
  void router.push(`/contractor/defect-detail/${item.id}`);
};
</script>

<style scoped>
.defect-list-page {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
}
@media (min-width: 768px) {
  .defect-list-page {
    max-width: 720px;
  }
}
@media (min-width: 1024px) {
  .defect-list-page {
    max-width: 1100px;
  }
}
@media (min-width: 1440px) {
  .defect-list-page {
    max-width: 1280px;
  }
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
}

.summary-card {
  border-radius: 14px !important;
  background: #fff !important;
  border-color: #ebebeb !important;
}

.card-stagger {
  animation: card-in 300ms var(--ease-out) both;
}
.card-stagger:nth-child(1) { animation-delay: 0ms; }
.card-stagger:nth-child(2) { animation-delay: 40ms; }
.card-stagger:nth-child(3) { animation-delay: 80ms; }
.card-stagger:nth-child(4) { animation-delay: 120ms; }
.card-stagger:nth-child(n + 5) { animation-delay: 150ms; }
@keyframes card-in {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .card-stagger { animation-duration: 0.01ms !important; }
}

.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 999px;
  background: #e0e0e0;
  margin: -8px auto 16px;
}
.filter-scroll {
  max-height: 50vh;
  overflow-y: auto;
}
.sort-toggle-btn {
  min-width: fit-content;
  border: 1px solid #e0e0e0;
}
.search-input {
  background-color: #ffffff;
  border: 1px solid #ebebeb;
  border-radius: 24px;
  padding: 2px 16px;
  height: 48px;
  transition: border-color 200ms var(--ease-out);
}
.search-input:focus-within {
  border-color: rgba(25, 118, 210, 0.5);
}

.stat-box {
  padding: 6px 4px;
}
.stat-label {
  font-size: 10px;
  color: #9e9e9e;
  margin: 2px 0;
  line-height: 1.3;
}
.stat-num {
  font-size: 22px;
  font-weight: 700;
  color: #212121;
}
.border-lr {
  border-left: 1px solid #eee;
  border-right: 1px solid #eee;
}

.defect-card {
  border-radius: 14px !important;
  background: #fff !important;
  border-color: #ebebeb !important;
  cursor: pointer;
  overflow: hidden;
}
.defect-card:focus-visible {
  outline: 2px solid var(--q-primary, #1976d2);
  outline-offset: 2px;
}
.defect-card-img { position: relative; width: 140px; flex-shrink: 0; align-self: stretch; overflow: hidden; }
.field-label { font-size: 11px; color: #9e9e9e; margin-bottom: 2px; }
.field-value { font-size: 14px; font-weight: 600; color: #212121; }
.img-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
  padding: 4px 8px;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.defect-card-body { padding: 6px 10px 8px; }

.section-title { font-size: 15px; font-weight: 700; color: #212121; }
.status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 20px;
}
.plan-position-pill {
  background: #e3f2fd;
  color: #0d47a1;
  border-radius: 20px;
  font-weight: 700;
  font-size: 12px;
  padding: 4px 12px;
}
</style>

<style>
/* Frosted-glass backdrop + spring-eased bottom sheet for the filter dialog */
.q-dialog__backdrop {
  backdrop-filter: blur(6px) saturate(180%);
  -webkit-backdrop-filter: blur(6px) saturate(180%);
}

.q-transition--sheet-in-enter-active {
  transition: all 320ms cubic-bezier(0.32, 0.72, 0, 1);
}
.q-transition--sheet-in-enter-from {
  transform: translateY(100%);
  opacity: 0.6;
}
.q-transition--sheet-out-leave-active {
  transition: all 200ms cubic-bezier(0.32, 0.72, 0, 1);
}
.q-transition--sheet-out-leave-to {
  transform: translateY(100%);
  opacity: 0.6;
}

@media (prefers-reduced-motion: reduce) {
  .q-transition--sheet-in-enter-active,
  .q-transition--sheet-out-leave-active {
    transition-duration: 0.01ms !important;
  }
}
</style>
