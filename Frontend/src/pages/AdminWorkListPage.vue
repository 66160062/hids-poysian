<template>
  <q-page class="admin-work-page bg-grey-1">
    <div class="page-content relative-position">
      <!-- Loading Indicator -->
      <q-inner-loading :showing="loading" style="z-index: 100">
        <IconBounceSpinner icon="business_center" size="64px" color="primary" />
      </q-inner-loading>

      <!-- Error Banner -->
      <q-banner v-if="error" class="text-white bg-negative q-mb-md" rounded dense>
        <template v-slot:avatar>
          <q-icon name="error" color="white" />
        </template>
        {{ error }}
        <template v-slot:action>
          <q-btn flat :label="t('adminWork.workList.retry')" @click="fetchWorkList" />
        </template>
      </q-banner>

      <div class="row q-mb-sm q-gutter-x-sm no-wrap">
        <q-input
          v-model="searchTerm"
          dense
          borderless
          rounded
          :placeholder="t('adminWork.workList.searchPlaceholder')"
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

      <!-- Segmented Control Toggle for Job Type -->
      <div class="row q-mb-none bg-white shadow-1 q-pa-xs segmented-wrap" style="border-radius: 12px;">
        <div
          class="segmented-slider-pos"
          :style="{ transform: selectedJobType === 'งานก่อสร้าง' ? 'translateX(100%)' : 'translateX(0)' }"
        >
          <div
            class="segmented-slider"
            :class="selectedJobType === 'งานก่อสร้าง' ? 'bg-orange' : 'bg-primary'"
          />
        </div>
        <q-btn
          class="col segmented-tab-btn"
          flat
          :text-color="selectedJobType === 'ตรวจบ้าน' ? 'white' : 'grey-7'"
          no-caps
          style="border-radius: 10px; font-weight: 600"
          @click="selectedJobType = 'ตรวจบ้าน'"
        >
          <div class="row items-center q-gutter-x-sm no-wrap">
            <q-icon name="search" size="18px" />
            <span>{{ t('adminWork.workList.homeInspectionTab') }}</span>
            <q-badge v-if="selectedJobType !== 'ตรวจบ้าน'" color="grey-3" text-color="grey-8" rounded>{{ defectJobCount }}</q-badge>
          </div>
        </q-btn>
        <q-btn
          class="col segmented-tab-btn"
          flat
          :text-color="selectedJobType === 'งานก่อสร้าง' ? 'white' : 'grey-7'"
          no-caps
          style="border-radius: 10px; font-weight: 600"
          @click="selectedJobType = 'งานก่อสร้าง'"
        >
          <div class="row items-center q-gutter-x-sm no-wrap">
            <q-icon name="construction" size="18px" />
            <span>{{ t('adminWork.workList.constructionTab') }}</span>
            <q-badge v-if="selectedJobType !== 'งานก่อสร้าง'" color="grey-3" text-color="grey-8" rounded>{{ constructJobCount }}</q-badge>
          </div>
        </q-btn>
      </div>

      <!-- Filter Bottom Sheet Dialog -->
      <q-dialog
        v-model="showFilterDialog"
        position="bottom"
        transition-show="sheet-in"
        transition-hide="sheet-out"
      >
        <q-card
          style="width: 100%; max-width: 600px; border-radius: 28px 28px 0 0"
          class="q-pa-lg filter-sheet"
        >
          <div class="sheet-handle" />
          <div class="row items-center justify-between q-mb-lg">
            <div class="text-h6 text-weight-bold text-dark">{{ t('adminWork.workList.filterTitle') }}</div>
            <div class="row items-center">
              <q-btn
                v-if="activeFilterCount > 0"
                flat
                dense
                color="negative"
                :label="t('adminWork.workList.clear')"
                class="q-mr-sm"
                @click="clearFilters"
              />
              <q-btn flat round dense icon="close" color="grey-6" v-close-popup />
            </div>
          </div>

          <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">{{ t('adminWork.workList.statusLabel') }}</div>
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

          <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">{{ t('common.branch.label') }}</div>
          <q-select
            v-model="selectedBranchId"
            :options="branchOptions"
            emit-value
            map-options
            dense
            outlined
            rounded
            class="q-mb-md filter-select"
            behavior="dialog"
          />

          <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">
            {{ t('adminWork.workList.houseTypeLabel') }}
          </div>
          <q-select
            v-model="selectedType"
            :options="typeOptions"
            emit-value
            map-options
            dense
            outlined
            rounded
            class="q-mb-md filter-select"
            behavior="dialog"
          />

          <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">
            {{ t('adminWork.workList.sortLabel') }}
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
            :label="t('adminWork.workList.done')"
            class="full-width text-weight-bold"
            style="height: 48px; font-size: 16px"
            v-close-popup
          />
        </q-card>
      </q-dialog>

      <!-- Active Filters Chips -->
      <div v-if="activeFilterCount > 0" class="row items-center q-gutter-x-sm q-mt-sm q-mb-none">
        <span class="text-caption text-grey-7 q-mr-xs q-pl-xs">{{ t('adminWork.workList.filteringLabel') }}</span>
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
          {{ selectedTypeLabel }}
        </q-chip>
        <q-chip
          v-if="selectedBranchId !== null"
          removable
          @remove="selectedBranchId = null"
          color="blue-1"
          text-color="primary"
          dense
          class="text-weight-medium"
        >
          {{ branchOptions.find((branch) => branch.value === selectedBranchId)?.label }}
        </q-chip>
      </div>

      <div class="work-list-wrapper q-pt-md">
        <div v-if="tasks.length === 0" class="text-center text-grey-6 q-pa-xl">
          {{ t('adminWork.workList.noResults') }}
        </div>

        <div v-else class="work-list">
          <q-card
            v-for="task in tasks"
            :key="task.id"
            flat
            bordered
            tabindex="0"
            role="button"
            class="work-card cursor-pointer"
            v-ripple
            @click="viewDetail(task)"
            @keyup.enter="viewDetail(task)"
          >
            <q-card-section class="q-pa-md">
              <div class="row justify-between items-center q-mb-sm">
                <div
                  class="text-weight-bold text-dark ellipsis"
                  style="font-size: 17px; max-width: 50%"
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
                    class="menu-trigger-btn"
                    style="margin-right: -8px"
                    @click.stop
                  >
                    <q-menu
                      auto-close
                      anchor="bottom right"
                      self="top right"
                      class="action-menu"
                      transition-show="jump-down"
                      transition-hide="jump-up"
                    >
                      <q-list class="action-menu-list">
                        <q-item clickable v-ripple class="action-menu-item" @click="editWork(task)">
                          <q-item-section avatar class="action-menu-avatar">
                            <div class="icon-chip icon-chip--primary">
                              <q-icon name="edit" size="18px" />
                            </div>
                          </q-item-section>
                          <q-item-section class="text-weight-medium">{{ t('adminWork.workList.editJob') }}</q-item-section>
                        </q-item>
                        <q-item clickable v-ripple class="action-menu-item action-menu-item--danger" @click="onDeleteClick(task)">
                          <q-item-section avatar class="action-menu-avatar">
                            <div class="icon-chip icon-chip--danger">
                              <q-icon name="delete" size="18px" />
                            </div>
                          </q-item-section>
                          <q-item-section class="text-weight-medium text-negative"
                            >{{ t('adminWork.workList.deleteJob') }}</q-item-section
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
                  <q-icon name="apartment" size="14px" class="q-mr-xs" /> {{ task.type || t('adminWork.workList.condo') }}
                </q-badge>
                <q-badge color="grey-2" text-color="grey-8" class="tag-badge">
                  <q-icon name="square_foot" size="14px" class="q-mr-xs" />
                  {{ task.area || '0' }} {{ t('adminWork.workList.sqm') }}
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
        :color="selectedJobType === 'ตรวจบ้าน' ? 'primary' : 'orange'"
        class="shadow-4 custom-fab"
        transition-show="jump-up"
        transition-hide="jump-down"
      >
        <q-fab-action
          color="orange-8"
          text-color="white"
          icon="construction"
          :label="t('adminWork.workList.constructionFab')"
          class="text-weight-bold custom-fab-action"
          @click="addNewWork('construction')"
        />
        <q-fab-action
          color="blue-8"
          text-color="white"
          icon="search"
          :label="t('adminWork.workList.homeInspectionFab')"
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
import { useI18n } from 'vue-i18n';
import { useWorkListStore } from '../stores/useWorkList';
import { useHouseTypeStore } from '../stores/useHouseType';
import { useBranchStore } from 'src/stores/useBranch';
import IconBounceSpinner from 'src/components/IconBounceSpinner.vue';
import ConfirmActionDialog from 'src/components/ConfirmActionDialog.vue';
import { createIconSpinner } from 'src/composables/useIconSpinner';
import { useLocalizedField } from 'src/composables/useLocalizedField';

const workSpinner = createIconSpinner('business_center');
const homeInspectionSpinner = createIconSpinner('search');
const constructionSpinner = createIconSpinner('construction');

const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();
const workStore = useWorkListStore();
const houseTypeStore = useHouseTypeStore();
const { pickLocalized } = useLocalizedField();
const branchStore = useBranchStore();

const loading = ref<boolean>(false);
const error = ref<string>('');

// ตัวแปรสำหรับค้นหาและกรอง
const searchTerm = ref('');
const activeFilter = ref('all');
const selectedType = ref('ทั้งหมด'); // ตัวเลือกประเภทบ้าน (เก็บเป็นชื่อไทยดิบ — หา nameEn จาก houseTypeStore ตอนแสดงผล)
const selectedJobType = ref('ตรวจบ้าน'); // ตัวเลือกประเภทงาน
const sortOrder = ref('desc'); // desc = ล่าสุด -> เก่า, asc = เก่า -> ล่าสุด

// ตัวเลือกใน Dropdown
const typeOptions = computed(() => {
  return [
    { label: t('adminWork.workList.allFilter'), value: 'ทั้งหมด' },
    ...houseTypeStore.houseTypes.map((ht) => ({
      label: pickLocalized(ht.name, ht.nameEn),
      value: ht.name,
    })),
  ];
});
const sortOptions = computed(() => [
  { label: t('adminWork.workList.sortDescLabel'), value: 'desc' },
  { label: t('adminWork.workList.sortAscLabel'), value: 'asc' },
]);

// selectedType เก็บเป็นชื่อไทยดิบ (ดู typeOptions ด้านบน) ต้อง lookup nameEn จาก houseTypeStore เอง
const selectedTypeLabel = computed(() => {
  const match = houseTypeStore.houseTypes.find((ht) => ht.name === selectedType.value);
  return pickLocalized(selectedType.value, match?.nameEn);
});
const branchOptions = computed(() => [
  { label: t('common.branch.all'), value: null },
  ...branchStore.branches.map((branch) => ({
    label: branch.branchName || t('common.branch.fallbackName', { id: branch.branchId }),
    value: branch.branchId,
  })),
]);

const showFilterDialog = ref(false);

const activeFilterCount = computed(() => {
  let count = 0;
  if (selectedType.value !== 'ทั้งหมด') count++;
  if (activeFilter.value !== 'all') count++;
  if (selectedBranchId.value !== null) count++;
  return count;
});

// backend statusMeta.label is fixed Thai text (see inspection-jobs.service.ts
// getStatusMetadata) — map the known status keys to translated labels instead
// of displaying it directly; unknown/future keys fall back to the backend label.
const statusLabelKeys: Record<string, string> = {
  Draft: 'adminWork.workList.statusDraft',
  Active: 'adminWork.workList.statusActive',
  Pending: 'adminWork.workList.statusPending',
  Completed: 'adminWork.workList.statusCompleted',
  Locked: 'adminWork.workList.statusLocked',
  Cancelled: 'adminWork.workList.statusCancelled',
};

function translatedStatusLabel(key: string, fallback: string): string {
  const i18nKey = statusLabelKeys[key];
  return i18nKey ? t(i18nKey) : fallback;
}

// backend sends filled dark badges (bg-blue-8/white, etc.) — override with the
// pastel bg + saturated text style used by AdminTeamCard/AdminUserCard so status
// badges look consistent across the admin pages.
const statusBadgeStyles: Record<string, { bgClass: string; textColor: string }> = {
  Draft: { bgClass: 'bg-grey-3', textColor: 'grey-8' },
  Active: { bgClass: 'bg-blue-1', textColor: 'blue-9' },
  Pending: { bgClass: 'bg-orange-1', textColor: 'orange-8' },
  Completed: { bgClass: 'bg-green-1', textColor: 'green-9' },
  Locked: { bgClass: 'bg-deep-orange-1', textColor: 'deep-orange-9' },
  Cancelled: { bgClass: 'bg-red-1', textColor: 'red-9' },
};

function clearFilters() {
  selectedType.value = 'ทั้งหมด';
  activeFilter.value = 'all';
  sortOrder.value = 'desc';
  selectedBranchId.value = null;
}

const defectJobCount = computed(() => workStore.absoluteJobCounts.defect);
const constructJobCount = computed(() => workStore.absoluteJobCounts.construction);

const currentPage = ref(1);
const selectedBranchId = ref<number | null>(null);

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

  return works.map((work) => {
    // Find matching status config from backend meta
    const meta = workStore.statusMeta.find((m) => m.key === work.status) || {
      label: work.status || t('adminWork.workList.pendingApproval'),
      bgClass: 'bg-grey-1',
      textColor: 'grey-8',
      key: 'others',
    };

    let finalStatusLabel = translatedStatusLabel(meta.key, meta.label);
    const badgeStyle = statusBadgeStyles[meta.key];
    let finalBgClass = badgeStyle?.bgClass ?? meta.bgClass;
    let finalTextColor = badgeStyle?.textColor ?? meta.textColor;

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

      const hasRound2OrMore = sortedRounds.some(
        (r) => (r.roundNumber ?? 0) >= 2
      );

      // ถ้าผู้รับเหมาซ่อมเกิน 80% แล้ว และยังไม่มีการสร้างรอบ 2
      if (work.isReadyForRound2 && !hasRound2OrMore) {
        finalStatusLabel = t('adminWork.workList.waitingRound2');
        finalBgClass = 'bg-orange-1';
        finalTextColor = 'orange-8';
      }
      // ถ้างานเสร็จสิ้นแล้ว (มีการอนุมัติรอบใดๆ เป็นรอบสุดท้าย หรืออนุมัติรอบ 2 ไปแล้ว)
      else if (work.status === 'Completed') {
        const completedRound = sortedRounds.find(
          (r) => r.status === 'APPROVED' || r.status === 'COMPLETED',
        );
        if (completedRound) {
          finalStatusLabel = `${t('adminWork.workList.completed')} ${completedRound.roundNumber ?? ''}`.trim();
        } else {
          finalStatusLabel = `${t('adminWork.workList.completed')} ${sortedRounds[0]?.roundNumber ?? ''}`.trim();
        }
      }
    }

    return {
      id: work.jobId,
      title: pickLocalized(work.projectName, work.projectNameEn) || t('adminWork.workList.untitledProject'),
      status: finalStatusLabel,
      statusBgClass: finalBgClass,
      statusTextColor: finalTextColor,
      statusKey: meta.key,
      inspectionType: work.inspectionType || '',
      type: pickLocalized(work.houseType?.name, work.houseType?.nameEn) || t('adminWork.workList.unspecifiedType'),
      area: work.usableArea || 0,
      team: t('adminWork.workList.unspecifiedTeam'), // Currently backend Work interface doesn't have team
      customer: work.customer?.fullName || t('adminWork.workList.unspecifiedCustomer'),
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
    label: translatedStatusLabel(meta.key, meta.label),
    value: meta.key,
    count: meta.count > 0 ? meta.count : undefined,
  }));

  return [{ label: t('adminWork.workList.allFilter'), value: 'all', count: allCount }, ...dynamicFilters];
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

watch(selectedBranchId, () => {
  currentPage.value = 1;
  void workStore.fetchAbsoluteJobCounts(getBranchParams());
  void fetchWorkList();
});

// สลับแท็บ ตรวจบ้าน/ตรวจก่อสร้าง — โชว์ spinner เต็มจอตามไอคอนของแท็บที่กด ไม่มีข้อความ
watch(selectedJobType, async (jobType) => {
  currentPage.value = 1;
  $q.loading.show({
    spinner: jobType === 'ตรวจบ้าน' ? homeInspectionSpinner : constructionSpinner,
    spinnerColor: 'primary',
    spinnerSize: 70,
    backgroundColor: 'white',
  });
  try {
    await loadWorkListData();
  } finally {
    $q.loading.hide();
  }
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
    component: ConfirmActionDialog,
    componentProps: {
      title: t('adminWork.workList.deleteConfirmTitle'),
      message: t('adminWork.workList.deleteConfirmMessage', { title: task.title }),
      icon: 'delete',
      color: 'negative',
      confirmLabel: t('adminWork.workList.deleteConfirmOk'),
      cancelLabel: t('adminWork.workList.deleteConfirmCancel'),
    },
  }).onOk(() => {
    void (async () => {
      try {
        await workStore.removeJob(task.id);
        $q.notify({ type: 'positive', message: t('adminWork.workList.deleteSuccess') });
        // Trigger refetch
        await workStore.fetchJobs({
          page: currentPage.value,
          limit: 10,
          status: activeFilter.value,
          search: searchTerm.value,
          type: selectedType.value,
          sort: sortOrder.value,
          ...getBranchParams(),
          ...(selectedJobType.value !== 'ทั้งหมด' && { inspectionType: selectedJobType.value }),
        });
      } catch {
        $q.notify({ type: 'negative', message: t('adminWork.workList.deleteError') });
      }
    })();
  });
}

// ==========================================
// 🎯 API Integration — ดึงข้อมูลจาก Backend
// ==========================================
// โหลดข้อมูลจริง แยกออกจาก loading.value เพื่อไม่ให้ตอน mount ครั้งแรก
// ขึ้นซ้อนกับ $q.loading แบบเต็มจอ (ดู onMounted ด้านล่าง)
async function loadWorkListData(): Promise<void> {
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
        ...getBranchParams(),
        ...(selectedJobType.value !== 'ทั้งหมด' && { inspectionType: selectedJobType.value }),
      }),
      houseTypeStore.houseTypes.length === 0 ? houseTypeStore.fetchHouseTypes() : Promise.resolve(),
    ]);
  } catch (err: unknown) {
    error.value = t('adminWork.workList.loadError');
    console.error('fetchWorkList error:', err);
  }
}

// ใช้ตอน filter/search/pagination เปลี่ยน — โชว์ spinner แบบย่อในกรอบตัวเอง
async function fetchWorkList(): Promise<void> {
  loading.value = true;
  try {
    await loadWorkListData();
  } finally {
    loading.value = false;
  }
}

onMounted(async (): Promise<void> => {
  void branchStore.fetchBranches().catch(() => {
    $q.notify({ type: 'negative', message: t('common.branch.loadError') });
  });
  $q.loading.show({
    spinner: workSpinner,
    spinnerColor: 'primary',
    spinnerSize: 70,
    backgroundColor: 'white',
  });
  try {
    await Promise.all([workStore.fetchAbsoluteJobCounts(getBranchParams()), loadWorkListData()]);
  } finally {
    $q.loading.hide();
  }
});

function getBranchParams(): { branchId?: number } {
  return selectedBranchId.value ? { branchId: selectedBranchId.value } : {};
}
</script>

<style scoped>
.admin-work-page {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-sheet: cubic-bezier(0.32, 0.72, 0, 1);
  max-width: 600px;
  margin: 0 auto;
  min-height: 100vh;
}

.page-content {
  padding: 24px 16px 0;
}
@media (min-width: 768px) {
  .page-content {
    padding: 28px 24px 0;
  }
}
@media (min-width: 1024px) {
  .page-content {
    padding: 32px 32px 0;
  }
}

.search-input {
  background-color: #ffffff;
  border: 1px solid #ebebeb;
  border-radius: 24px;
  padding: 2px 16px;
  height: 48px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  transition:
    box-shadow 200ms var(--ease-out),
    border-color 200ms var(--ease-out);
}
.search-input:focus-within {
  border-color: rgba(25, 118, 210, 0.5);
  box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.12);
}

/* ─── Segmented Control: smooth sliding thumb ─────────────────── */
.segmented-wrap {
  position: relative;
}
.segmented-slider-pos {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  transition: transform 300ms cubic-bezier(0.25, 0.1, 0.25, 1);
  will-change: transform;
  z-index: 0;
}
.segmented-slider {
  width: 100%;
  height: 100%;
  border-radius: 10px;
}
.segmented-tab-btn {
  position: relative;
  z-index: 1;
  transition: color 220ms var(--ease-out);
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

.work-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
@media (min-width: 768px) {
  .work-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 1200px) {
  .work-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

.work-card {
  border-radius: 18px;
  border-color: #f0f0f0;
  height: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.03),
    0 2px 6px rgba(0, 0, 0, 0.03);
  transition:
    transform 200ms var(--ease-out),
    box-shadow 200ms var(--ease-out),
    border-color 200ms var(--ease-out);
  animation: card-in 320ms var(--ease-out) both;
}
.work-card:nth-child(1) { animation-delay: 0ms; }
.work-card:nth-child(2) { animation-delay: 40ms; }
.work-card:nth-child(3) { animation-delay: 80ms; }
.work-card:nth-child(4) { animation-delay: 120ms; }
.work-card:nth-child(n + 5) { animation-delay: 150ms; }

@media (hover: hover) and (pointer: fine) {
  .work-card:hover {
    transform: translateY(-2px);
    border-color: #e4e4e4;
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.04),
      0 8px 20px rgba(0, 0, 0, 0.07);
  }
}
.work-card:focus-visible {
  outline: 2px solid var(--q-primary, #1976d2);
  outline-offset: 2px;
}
.work-card :deep(.q-separator) {
  margin-top: auto;
}

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

.status-badge {
  font-weight: 700;
  font-size: 12.5px;
  padding: 6px 14px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  letter-spacing: 0.2px;
  white-space: nowrap;
}

.tag-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 8px;
  font-variant-numeric: tabular-nums;
}

.filter-sheet {
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.12);
}
.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 999px;
  background: #e0e0e0;
  margin: -8px auto 16px;
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

.menu-trigger-btn {
  transition: background-color 0.15s ease;
}

.action-menu-list {
  min-width: 190px;
  padding: 6px;
}
.action-menu-item {
  border-radius: 10px;
  padding: 6px 8px;
  margin-bottom: 2px;
  transition: background-color 0.15s ease;
}
.action-menu-item:last-child {
  margin-bottom: 0;
}
.action-menu-item:hover {
  background-color: #f2f4f7;
}
.action-menu-item--danger:hover {
  background-color: #fdecea;
}
.action-menu-avatar {
  min-width: 0;
  padding-right: 10px;
}
.icon-chip {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-chip--primary {
  color: #1976d2;
}
.icon-chip--danger {
  color: #e53935;
}

@media (min-width: 600px) {
  .admin-work-page {
    max-width: 800px;
  }
}
@media (min-width: 1024px) {
  .admin-work-page {
    max-width: 1100px;
  }
}
@media (min-width: 1440px) {
  .admin-work-page {
    max-width: 1300px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .work-card,
  .search-input,
  .segmented-slider-pos {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>

<style>
.action-menu {
  border-radius: 14px !important;
  box-shadow: 0 10px 28px rgba(17, 24, 39, 0.14) !important;
  overflow: hidden;
}

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
.custom-fab-action .q-icon {
  font-size: 26px !important;
  margin-right: 8px !important;
}
.custom-fab-action .q-btn__content {
  width: 100%;
  justify-content: flex-start;
}
</style>
