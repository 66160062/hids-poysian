<template>
  <q-page class="defect-page bg-grey-1">

    <!-- Header label -->

    <div class="q-px-md q-pb-xl">

      <!-- Title -->
      <!-- <div class="text-h5 text-weight-bold text-center q-py-md">รายการ Defect</div> -->

      <!-- ===== Summary Stats ===== -->

  <q-card flat bordered class="summary-card q-mb-md">
        <q-card-section class="q-pa-sm">
          <div class="row q-col-gutter-xs">
            <div class="col-4 text-center stat-box">
              <q-icon name="meeting_room" color="grey-6" size="18px" />
              <div class="stat-label">{{ t('customer.defectList.roomCount') }}</div>
              <div class="stat-num">{{ summary.rooms }}</div>
            </div>
            <div class="col-4 text-center stat-box border-lr">
              <q-icon name="build" color="grey-6" size="18px" />
              <div class="stat-label">{{ t('customer.defectList.jobType') }}</div>
              <div class="stat-num">{{ summary.jobTypes }}</div>
            </div>
            <div class="col-4 text-center stat-box">
              <q-icon name="list_alt" color="grey-6" size="18px" />
              <div class="stat-label">{{ t('customer.defectList.totalItems') }}</div>
              <div class="stat-num">{{ summary.total }}</div>
            </div>
          </div>

          <q-separator class="q-my-sm" />

          <div class="row q-col-gutter-xs">
            <div class="col-6 text-center">
              <div class="row items-center justify-center q-gutter-xs">
                <q-icon name="check_circle" color="green" size="20px" />
                <span class="text-caption text-grey-7">{{ t('customer.defectList.passed') }}</span>
              </div>
              <div class="text-h6 text-green text-weight-bold">{{ summary.passed }}</div>
            </div>
            <div class="col-6 text-center">
              <div class="row items-center justify-center q-gutter-xs">
                <q-icon name="cancel" color="red" size="20px" />
                <span class="text-caption text-grey-7">{{ t('customer.defectList.failed') }}</span>
              </div>
              <div class="text-h6 text-red text-weight-bold">{{ summary.failed }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- ===== Filter Button ===== -->
      <div class="row justify-end q-mb-sm">
        <q-btn outline color="grey-7" icon="filter_list" :label="t('customer.defectList.filter')" size="sm" rounded @click="showFilter = true" />
      </div>

      <!-- ===== Defect List ===== -->
      <q-card flat bordered class="info-card">
        <q-card-section class="q-pa-md q-pb-xs">
          <div class="section-title">{{ t('customer.defectList.inspectionList') }}</div>
        </q-card-section>
        <q-list separator>
          <q-item
            v-for="(item, i) in defectItems"
            :key="i"
            class="q-pa-md defect-item"
            clickable
            v-ripple
            @click="router.push(`/customer/defect-detail/${item.defectId}`)"
          >
            <q-item-section avatar class="defect-img-wrap">
              <div class="defect-img-box">
                <q-img :src="item.image" class="defect-img" fit="cover" :ratio="4/3" />
                <div class="img-caption">{{ item.location }}</div>
              </div>
            </q-item-section>
            <q-item-section class="q-pl-sm">
              <div class="row justify-end q-mb-xs">
                <q-badge
                  :color="item.status === 'ไม่ผ่าน' ? 'red-2' : 'green-2'"
                  :text-color="item.status === 'ไม่ผ่าน' ? 'red-8' : 'green-8'"
                  class="status-badge"
                >{{ item.status }}</q-badge>
              </div>
              <div class="field-label">{{ t('customer.defectList.jobType') }}</div>
              <div class="field-value q-mb-xs">{{ item.jobType }}</div>
              <div class="field-label">{{ t('customer.defectList.itemsLabel') }}</div>
              <div class="row q-gutter-xs q-mt-xs">
                <q-chip v-for="tag in item.tags" :key="tag" dense outline color="blue-grey-4" text-color="blue-grey-8" size="sm">{{ tag }}</q-chip>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

    </div>

    <!-- ===== Filter Dialog ===== -->
    <q-dialog v-model="showFilter" position="bottom">
      <q-card style="width: 100%; border-radius: 16px 16px 0 0; max-height: 85vh;">
        <!-- Header -->
        <q-card-section class="row items-center q-pb-none">
          <div class="section-title">{{ t('customer.defectList.filter') }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-scroll-area style="height: calc(85vh - 110px);">
          <q-card-section class="q-pt-sm">

            <div class="filter-label q-mb-xs">{{ t('customer.defectList.roomType') }}</div>
            <FilterChipGroup :options="filterRooms" v-model="selectedRooms" class="q-mb-md" />

            <div class="filter-label q-mb-xs">{{ t('customer.defectList.jobType') }}</div>
            <FilterChipGroup :options="filterJobTypes" v-model="selectedJobTypes" class="q-mb-md" />

            <div class="filter-label q-mb-xs">{{ t('customer.defectList.severityType') }}</div>
            <FilterChipGroup :options="filterSeverities" v-model="selectedSeverities" class="q-mb-md" />

            <div class="filter-label q-mb-xs">{{ t('customer.defectList.status') }}</div>
            <FilterChipGroup :options="filterStatuses" v-model="selectedStatuses" class="q-mb-md" />

          </q-card-section>
        </q-scroll-area>

        <!-- Footer buttons -->
        <q-card-actions class="q-px-md q-pb-md q-pt-sm" style="border-top: 1px solid #ebebeb;">
          <q-btn flat :label="t('customer.defectList.clearAll')" color="red-6" @click="resetFilter" />
          <q-space />
          <q-btn unelevated icon="search" :label="t('customer.defectList.search')" color="primary" rounded @click="applyFilter" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

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
import { useDefectList } from 'src/stores/useDefectlist'
import { useLinkAccess } from 'src/stores/useLinkAccess'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { createIconSpinner } from 'src/composables/useIconSpinner'

const $q = useQuasar()
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
  filterJobTypes,
  filterSeverities,
  filterStatuses,
  selectedRooms,
  selectedJobTypes,
  selectedSeverities,
  selectedStatuses,
  resetFilter,
  applyFilter,
  fetchDefects,
} = useDefectList()

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
.defect-page { max-width: 480px; margin: 0 auto; }
.info-card { border-radius: 14px !important; background: #ffffff !important; border: 1px solid #bdbdbd !important; }
.section-title { font-size: 15px; font-weight: 700; color: #212121; }
.stat-mini-label { font-size: 12px; color: #4d4c4c; line-height: 1.2; }
.stat-mini-value { font-size: 22px; font-weight: 700; line-height: 1.2; color: #212121; }
.field-label { font-size: 11px; color: #9e9e9e; margin-bottom: 2px; }
.field-value { font-size: 14px; font-weight: 600; color: #212121; }
.defect-item { align-items: flex-start; }
.defect-img-wrap { min-width: unset !important; width: 130px; flex-shrink: 0; }
.defect-img-box { position: relative; width: 130px; border-radius: 8px; overflow: hidden; }
.defect-img { width: 130px; border-radius: 8px; }
.img-caption { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.45); color: #fff; font-size: 9px; padding: 3px 6px; text-align: center; }
.status-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 20px; }
.filter-label { font-size: 12px; font-weight: 600; color: #555; margin-bottom: 4px; }
.stat-box { padding: 6px 4px; }
.stat-label { font-size: 10px; color: #9e9e9e; margin: 2px 0; line-height: 1.3; }
.stat-num { font-size: 22px; font-weight: 700; color: #212121; }
.border-lr { border-left: 1px solid #eee; border-right: 1px solid #eee; }
</style>
