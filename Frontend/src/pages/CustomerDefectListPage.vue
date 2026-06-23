<template>
  <q-page class="defect-page bg-white">

    <!-- Header label -->

    <div class="q-px-md q-pb-xl">

      <!-- Title -->
      <!-- <div class="text-h5 text-weight-bold text-center q-py-md">รายการ Defect</div> -->

      <!-- ===== Summary Stats ===== -->
<div class="row q-col-gutter-sm q-mb-md">
  <!-- จำนวนห้อง -->
  <div class="col-4">
    <q-card flat bordered class="info-card text-center q-pa-sm bord">
      <div class="stat-mini-label">จำนวนห้อง</div>
      <q-icon name="door_front" size="20px" color="grey-7" />
      <div class="stat-mini-value">{{ summary.rooms }}</div>
    </q-card>
  </div>
  <!-- ประเภทงาน -->
  <div class="col-4">
    <q-card flat bordered class="info-card text-center q-pa-sm">
      <div class="stat-mini-label">ประเภทงาน</div>
      <q-icon name="handyman" size="20px" color="grey-7" />
      <div class="stat-mini-value">{{ summary.jobTypes }}</div>
    </q-card>
  </div>
  <!-- จำนวนรายการ -->
  <div class="col-4">
    <q-card flat bordered class="info-card text-center q-pa-sm">
      <div class="stat-mini-label">จำนวนรายการ</div>
      <q-icon name="list_alt" size="20px" color="grey-7" />
      <div class="stat-mini-value">{{ summary.total }}</div>
    </q-card>
  </div>
  <!-- ผ่าน -->
  <div class="col-6">
    <q-card flat bordered class="info-card text-center q-pa-sm">
      <div class="stat-mini-label">ผ่าน</div>
      <q-icon name="check_circle" size="24px" color="green" />
      <div class="stat-mini-value text-green">{{ summary.passed }}</div>
    </q-card>
  </div>
  <!-- ไม่ผ่าน -->
  <div class="col-6">
    <q-card flat bordered class="info-card text-center q-pa-sm">
      <div class="stat-mini-label">ไม่ผ่าน</div>
      <q-icon name="cancel" size="24px" color="red" />
      <div class="stat-mini-value text-red">{{ summary.failed }}</div>
    </q-card>
  </div>
</div>

      <!-- ===== Filter Button ===== -->
      <div class="row justify-end q-mb-sm">
        <q-btn outline color="grey-7" icon="filter_list" label="ตัวกรอง" size="sm" rounded @click="showFilter = true" />
      </div>

      <!-- ===== Defect List ===== -->
      <q-card flat bordered class="info-card">
        <q-card-section class="q-pa-md q-pb-xs">
          <div class="section-title">รายการตรวจ</div>
        </q-card-section>
        <q-list separator>
          <q-item v-for="(item, i) in defectItems" :key="i" class="q-pa-md defect-item" clickable v-ripple>
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
              <div class="field-label">ประเภทงาน</div>
              <div class="field-value q-mb-xs">{{ item.jobType }}</div>
              <div class="field-label">รายการ</div>
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
          <div class="section-title">ตัวกรอง</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-scroll-area style="height: calc(85vh - 110px);">
          <q-card-section class="q-pt-sm">

            <div class="filter-label q-mb-xs">ประเภทห้อง</div>
            <FilterChipGroup :options="filterRooms" v-model="selectedRooms" class="q-mb-md" />

            <div class="filter-label q-mb-xs">ประเภทงาน</div>
            <FilterChipGroup :options="filterJobTypes" v-model="selectedJobTypes" class="q-mb-md" />

            <div class="filter-label q-mb-xs">ประเภทความรุนแรง</div>
            <FilterChipGroup :options="filterSeverities" v-model="selectedSeverities" class="q-mb-md" />

            <div class="filter-label q-mb-xs">สถานะ</div>
            <FilterChipGroup :options="filterStatuses" v-model="selectedStatuses" class="q-mb-md" />

          </q-card-section>
        </q-scroll-area>

        <!-- Footer buttons -->
        <q-card-actions class="q-px-md q-pb-md q-pt-sm" style="border-top: 1px solid #ebebeb;">
          <q-btn flat label="ล้างทั้งหมด" color="red-6" @click="resetFilter" />
          <q-space />
          <q-btn unelevated icon="search" label="ค้นหา" color="primary" rounded @click="applyFilter" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ===== Bottom Tab Bar ===== -->
    <q-footer class="bg-white bottom-bar">
      <q-tabs :model-value="activeTab"
      @update:model-value="(tab) => router.push(`/app/${tab}`)">
        <q-tab name="overview"  icon="home"        label="ภาพรวม" />
        <q-tab name="defect"    icon="list_alt"    label="รายการ Defect" />
        <q-tab name="report"    icon="description" label="สรุปรายงาน" />
      </q-tabs>
    </q-footer>

  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import FilterChipGroup from 'src/components/FilterChipGroup.vue'
import { useDefectList } from 'src/stores/useDefectlist'
import { useLinkAccess } from 'src/stores/useLinkAccess'
import { useRoute, useRouter } from 'vue-router'

const showFilter = ref(false)

const router    = useRouter()
const route     = useRoute()
const activeTab = computed(() => route.path.split('/').pop())
const { projectId } = useLinkAccess()

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
  const queryJobId = route.query.jobId
  if (typeof queryJobId === 'string' && queryJobId) return Number(queryJobId)
  return projectId.value
}

onMounted(async () => {
  const jobId = getJobId()
  if (!jobId) return
  await fetchDefects(jobId)
})
</script>

<style scoped>
.defect-page { max-width: 480px; margin: 0 auto; }
.info-card { border-radius: 14px !important; background: #ffffff !important; border: 1.5px solid #bdbdbd !important; }
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
.bottom-bar { border-top: 1px solid #ebebeb; box-shadow: 0 -2px 8px rgba(0,0,0,0.06); }
.filter-label { font-size: 12px; font-weight: 600; color: #555; margin-bottom: 4px; }
</style>