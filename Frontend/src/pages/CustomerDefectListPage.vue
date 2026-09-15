<template>
  <q-page class="defect-page bg-grey-1">

    <!-- Header label -->

    <div class="q-px-md q-pt-md q-pb-xl">

      <!-- Title -->
      <!-- <div class="text-h5 text-weight-bold text-center q-py-md">รายการ Defect</div> -->

      <!-- ===== Summary Stats ===== -->

  <q-card flat bordered class="summary-card q-mb-md">
        <q-card-section class="q-pa-sm">
          <div class="row q-col-gutter-xs">
            <div class="col-4 text-center stat-box">
              <q-icon name="meeting_room" color="grey-6" size="18px" />
              <div class="stat-label">{{ t('customer.defectList.roomCount') }}</div>
              <div class="stat-num tabular-nums">{{ summary.rooms }}</div>
            </div>
            <div class="col-4 text-center stat-box border-lr">
              <q-icon name="build" color="grey-6" size="18px" />
              <div class="stat-label">{{ t('customer.defectList.jobType') }}</div>
              <div class="stat-num tabular-nums">{{ summary.jobTypes }}</div>
            </div>
            <div class="col-4 text-center stat-box">
              <q-icon name="list_alt" color="grey-6" size="18px" />
              <div class="stat-label">{{ t('customer.defectList.totalItems') }}</div>
              <div class="stat-num tabular-nums">{{ summary.total }}</div>
            </div>
          </div>

          <q-separator class="q-my-sm" />

          <div class="row q-col-gutter-xs">
            <div class="col-6 text-center">
              <div class="row items-center justify-center q-gutter-xs">
                <q-icon name="check_circle" color="green" size="20px" />
                <span class="text-caption text-grey-7">{{ t('customer.defectList.passed') }}</span>
              </div>
              <div class="text-h6 text-green text-weight-bold tabular-nums">{{ summary.passed }}</div>
            </div>
            <div class="col-6 text-center">
              <div class="row items-center justify-center q-gutter-xs">
                <q-icon name="cancel" color="red" size="20px" />
                <span class="text-caption text-grey-7">{{ t('customer.defectList.failed') }}</span>
              </div>
              <div class="text-h6 text-red text-weight-bold tabular-nums">{{ summary.failed }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- ===== Search + Filter Row ===== -->
      <div class="row q-gutter-x-sm no-wrap items-center q-mb-md">
        <q-input
          v-model="searchQuery"
          dense
          borderless
          rounded
          :placeholder="t('customer.defectList.searchPlaceholder')"
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

      <!-- ===== Defect List ===== -->
      <div class="section-title q-mb-sm">{{ t('customer.defectList.inspectionList') }}</div>

      <q-card
        v-for="(item, i) in defectItems"
        :key="i"
        flat
        bordered
        tabindex="0"
        role="button"
        class="defect-card q-mb-sm defect-item-stagger"
        v-ripple
        @click="router.push(`/customer/defect-detail/${item.defectId}`)"
        @keyup.enter="router.push(`/customer/defect-detail/${item.defectId}`)"
      >
        <div class="row no-wrap">
          <div class="defect-card-img">
            <q-img :src="item.image" fit="cover" style="height: 100%; width: 100%" />
            <div class="img-caption">{{ item.location }}</div>
          </div>
          <div class="col defect-card-body">
            <div class="row justify-end q-mb-xs">
              <q-badge
                :color="item.isPassed ? 'green-2' : 'red-2'"
                :text-color="item.isPassed ? 'green-8' : 'red-8'"
                class="status-badge"
              >{{ item.status }}</q-badge>
            </div>
            <div class="field-label">{{ t('customer.defectList.jobType') }}</div>
            <div class="field-value q-mb-xs">{{ item.jobType }}</div>
            <div class="field-label">{{ t('customer.defectList.itemsLabel') }}</div>
            <div class="row q-gutter-xs q-mt-xs">
              <q-chip v-for="tag in item.tags" :key="tag" dense color="blue-1" text-color="primary" class="text-weight-bold" size="sm">{{ tag }}</q-chip>
            </div>
            <template v-if="item.description">
              <div class="field-label q-mt-sm">{{ t('customer.defectList.noteLabel') }}</div>
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

    </div>

    <!-- ===== Filter Dialog ===== -->
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
          <div class="text-h6 text-weight-bold text-dark">{{ t('customer.defectList.filter') }}</div>
          <div class="row items-center">
            <q-btn
              v-if="activeFilterCount > 0"
              flat
              dense
              color="negative"
              :label="t('customer.defectList.clearAll')"
              class="q-mr-sm"
              @click="resetFilter"
            />
            <q-btn flat round dense icon="close" color="grey-6" v-close-popup />
          </div>
        </div>

        <div class="filter-scroll">
          <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">{{ t('customer.defectList.sortLabel') }}</div>
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
              <span class="text-weight-medium q-px-sm">{{ t('customer.defectList.sortNewestFirst') }}</span>
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
              <span class="text-weight-medium q-px-sm">{{ t('customer.defectList.sortOldestFirst') }}</span>
            </q-btn>
          </div>

          <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">{{ t('customer.defectList.severityType') }}</div>
          <FilterChipGroup :options="filterSeverities" v-model="selectedSeverities" class="q-mb-lg" />

          <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">{{ t('customer.defectList.status') }}</div>
          <FilterChipGroup :options="filterStatuses" v-model="selectedStatuses" class="q-mb-lg" />

          <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">{{ t('customer.defectList.floorType') }}</div>
          <FilterChipGroup :options="filterFloors" v-model="selectedFloors" class="q-mb-xl" />

          <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">{{ t('customer.defectList.planPositionLabel') }}</div>
          <FilterChipGroup :options="filterPlanPosition" v-model="selectedPlanPosition" class="q-mb-xl" />

          <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">{{ t('customer.defectList.roomType') }}</div>
          <FilterChipGroup :options="filterRooms" v-model="selectedRooms" class="q-mb-lg" />

          <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">{{ t('customer.defectList.jobType') }}</div>
          <FilterChipGroup :options="filterJobTypes" v-model="selectedJobTypes" class="q-mb-lg" />
        </div>

        <q-btn
          unelevated
          rounded
          color="primary"
          :label="t('customer.defectList.search')"
          class="full-width text-weight-bold"
          style="height: 48px; font-size: 16px"
          @click="applyFilter"
          v-close-popup
        />
      </q-card>
    </q-dialog>

    <!-- ===== Dialog ดูตำแหน่งในแปลน (Read-only) ===== -->
    <PlanPositionDialog
      v-model="showPlanDialog"
      :job-id="activeDefect?.jobId ?? getJobId()"
      :initial-plan-id="activeDefect?.planId ?? null"
      :initial-x="activeDefect?.planX ?? null"
      :initial-y="activeDefect?.planY ?? null"
      :initial-zone="activeDefect?.locationZone ?? null"
      readonly
    />

    <!-- ===== Bottom Tab Bar ===== -->
    <q-footer class="bg-white">
      <q-tabs :model-value="activeTab"
      @update:model-value="(tab) => router.push(`/app/${tab}`)">
        <q-tab name="overview"  icon="home"        :label="t('customer.defectList.tabOverview')" />
        <q-tab name="defect"    icon="list_alt"    :label="t('customer.defectList.tabDefectList')" />
        <q-tab name="report"    icon="description" :label="t('customer.defectList.tabReport')" />
      </q-tabs>
    </q-footer>

  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import FilterChipGroup from 'src/components/FilterChipGroup.vue'
import PlanPositionDialog from 'src/components/PlanPositionDialog.vue'
import { useDefectList, type DefectItem } from 'src/stores/useDefectlist'
import { useLinkAccess } from 'src/stores/useLinkAccess'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { createIconSpinner } from 'src/composables/useIconSpinner'

const $q = useQuasar()
const showPlanDialog = ref(false)
const activeDefect = ref<DefectItem | null>(null)

function openPlanPosition(defect: DefectItem) {
  activeDefect.value = defect
  showPlanDialog.value = true
}
const defectSpinner = createIconSpinner('assignment')

const { t } = useI18n()
const showFilter = ref(false)

const router    = useRouter()
const route     = useRoute()
const activeTab = computed(() => route.path.split('/').pop())
const { hasLinkAccess, projectId, linkToken } = useLinkAccess()

const {
  summary,
  defectItems,
  filterRooms,
  filterFloors,
  filterPlanPosition,
  filterJobTypes,
  filterSeverities,
  filterStatuses,
  searchQuery,
  selectedRooms,
  selectedFloors,
  selectedPlanPosition,
  selectedJobTypes,
  selectedSeverities,
  selectedStatuses,
  sortOrder,
  resetFilter,
  applyFilter,
  fetchDefects,
} = useDefectList()

const activeFilterCount = computed(() => {
  let count = 0
  if (selectedRooms.value.length > 0) count++
  if (selectedFloors.value.length > 0) count++
  if (selectedPlanPosition.value.length > 0) count++
  if (selectedJobTypes.value.length > 0) count++
  if (selectedSeverities.value.length > 0) count++
  if (selectedStatuses.value.length > 0) count++
  if (sortOrder.value) count++
  return count
})

function getJobId(): number | null {
  if (hasLinkAccess.value) return projectId.value
  const queryJobId = route.query.jobId
  if (typeof queryJobId === 'string' && queryJobId) return Number(queryJobId)
  return projectId.value
}

onMounted(async () => {
  const jobId = getJobId()
  if (!jobId) return
  $q.loading.show({
    spinner: defectSpinner,
    spinnerColor: 'primary',
    spinnerSize: 70,
    backgroundColor: 'white',
  })
  try {
    await fetchDefects(jobId, linkToken.value)
  } finally {
    $q.loading.hide()
  }
})
</script>

<style scoped>
.defect-page { --ease-out: cubic-bezier(0.23, 1, 0.32, 1); max-width: 480px; margin: 0 auto; width: 100%; }
@media (min-width: 768px) {
  .defect-page { max-width: 720px; }
}
@media (min-width: 1024px) {
  .defect-page { max-width: 1100px; }
}
@media (min-width: 1440px) {
  .defect-page { max-width: 1280px; }
}
.tabular-nums { font-variant-numeric: tabular-nums; }
.summary-card,
.defect-card {
  border-radius: 14px !important;
  background: #ffffff !important;
  border-color: #ebebeb !important;
}
.defect-card { cursor: pointer; overflow: hidden; }
.defect-card:focus-visible {
  outline: 2px solid var(--q-primary, #1976d2);
  outline-offset: 2px;
}
.section-title { font-size: 15px; font-weight: 700; color: #212121; }
.stat-mini-label { font-size: 12px; color: #4d4c4c; line-height: 1.2; }
.stat-mini-value { font-size: 22px; font-weight: 700; line-height: 1.2; color: #212121; }
.field-label { font-size: 11px; color: #9e9e9e; margin-bottom: 2px; }
.field-value { font-size: 14px; font-weight: 600; color: #212121; }
.defect-item-stagger {
  animation: card-in 300ms var(--ease-out) both;
}
.defect-item-stagger:nth-child(1) { animation-delay: 0ms; }
.defect-item-stagger:nth-child(2) { animation-delay: 40ms; }
.defect-item-stagger:nth-child(3) { animation-delay: 80ms; }
.defect-item-stagger:nth-child(4) { animation-delay: 120ms; }
.defect-item-stagger:nth-child(n + 5) { animation-delay: 150ms; }
@keyframes card-in {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .defect-item-stagger { animation-duration: 0.01ms !important; }
}
.defect-card-img { position: relative; width: 140px; flex-shrink: 0; align-self: stretch; overflow: hidden; }
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
.plan-position-pill {
  background: #e3f2fd;
  color: #0d47a1;
  border-radius: 20px;
  font-weight: 700;
  font-size: 12px;
  padding: 4px 12px;
}
.status-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 20px; }
.stat-box { padding: 6px 4px; }
.stat-label { font-size: 10px; color: #9e9e9e; margin: 2px 0; line-height: 1.3; }
.stat-num { font-size: 22px; font-weight: 700; color: #212121; }
.border-lr { border-left: 1px solid #eee; border-right: 1px solid #eee; }

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
