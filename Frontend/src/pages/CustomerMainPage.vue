<template>
  <q-page class="overview-page bg-white">

    <!-- Header label -->


    <div class="q-px-md q-pb-xl">

      <!-- div class="text-h5 text-weight-bold text-center q-py-md">ภาพรวม</div> -->

      <!-- Download Btn -->
      <q-btn
        color="primary"
        icon="download"
        label="ดาวน์โหลดรายงาน"
        class="full-width q-mb-md download-btn"
        unelevated
        size="md"
      />

      <!-- Project Info Card -->
      <q-card flat bordered class="info-card q-mb-md">
        <q-card-section>
          <div class="section-title q-mb-md">ข้อมูลโครงการ</div>
          <div class="row q-col-gutter-md">
            <div class="col-6" v-for="field in projectFields" :key="field.label">
              <div class="field-label">{{ field.label }}</div>
              <div class="field-value">{{ field.value }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Customer Info Card -->
      <q-card flat bordered class="info-card q-mb-md">
        <q-card-section>
          <div class="section-title q-mb-md">ข้อมูลลูกค้า</div>
          <div class="row q-col-gutter-md">
            <div class="col-6" v-for="field in customerFields" :key="field.label">
              <div class="field-label">{{ field.label }}</div>
              <div class="field-value" :class="field.empty ? 'text-grey-4' : ''">{{ field.value }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      
      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-4">
          <q-card flat bordered class="stat-card text-center">
            <q-card-section class="q-pa-sm">
              <div class="stat-label">จุดบกพร่องทั้งหมด</div>
              <div class="stat-number text-dark">{{ totalDefects }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-4">
          <q-card flat bordered class="stat-card text-center">
            <q-card-section class="q-pa-sm">
              <div class="stat-label">กำลังดำเนินงาน</div>
              <div class="stat-number text-orange">{{ inProgress }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-4">
          <q-card flat bordered class="stat-card text-center">
            <q-card-section class="q-pa-sm">
              <div class="stat-label">แก้ไขผ่าน</div>
              <div class="stat-number text-primary">{{ passed }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Progress Card -->
      <q-card flat bordered class="info-card q-mb-md">
        <q-card-section>
          <div class="row items-center justify-between q-mb-sm">
            <div class="section-title">ความคืบหน้าทั้งหมด</div>
            <div class="text-primary text-h6 text-weight-bold">{{ progressPercent }}%</div>
          </div>
          <q-linear-progress
            :value="progressValue"
            color="primary"
            track-color="grey-3"
            rounded
            size="10px"
            class="q-mb-xs"
          />
          <div class="text-caption text-grey-6">{{ passed }} / {{ totalDefects }} รายการ</div>
        </q-card-section>
      </q-card>

      <!-- Workflow Stepper -->
      <q-card flat bordered class="info-card q-mb-md">
        <q-card-section>
          <div class="workflow-row">
            <template v-for="(step, i) in workflowSteps" :key="i">
              <div class="wf-step">
                <div class="wf-circle" :class="step.status">
                  <q-icon :name="step.icon" size="16px" />
                </div>
                <div class="wf-label">{{ step.label }}</div>
              </div>
              <div v-if="i < workflowSteps.length - 1" class="wf-line" :class="step.status === 'done' ? 'done' : 'grey'" />
            </template>
          </div>
        </q-card-section>
      </q-card>

      <!-- Defect by Type Card -->
      <q-card flat bordered class="info-card q-mb-md">
        <q-card-section>
          <div class="section-title q-mb-md">สัดส่วน Defect ตามประเภทงาน</div>
          <div class="row items-center">
            <!-- SVG Donut (reactive) -->
            <div class="col-auto">
              <svg viewBox="0 0 100 100" width="95" height="95">
                <circle cx="50" cy="50" r="36" fill="none" stroke="#f0f0f0" stroke-width="14" />
                <circle cx="50" cy="50" r="36" fill="none" stroke="#4CAF50" stroke-width="14"
                  :stroke-dasharray="`${passedDash} ${circumference}`"
                  stroke-dashoffset="0"
                  transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="36" fill="none" stroke="#FF9800" stroke-width="14"
                  :stroke-dasharray="`${inProgressDash} ${circumference}`"
                  :stroke-dashoffset="`-${passedDash}`"
                  transform="rotate(-90 50 50)" />
                <text x="50" y="55" text-anchor="middle" font-size="20" font-weight="bold" fill="#333">{{ totalDefects }}</text>
              </svg>
            </div>
            <!-- Legend -->
            <div class="col q-pl-md">
              <div class="row items-center justify-between q-mb-xs">
                <span class="row items-center no-wrap">
                  <q-icon name="circle" color="green" size="12px" class="q-mr-xs" />
                  <span class="text-caption">ผ่านแล้ว</span>
                </span>
                <span class="text-caption text-green text-weight-bold">{{ passed }}</span>
              </div>
              <div class="row items-center justify-between q-mb-xs">
                <span class="row items-center no-wrap">
                  <q-icon name="circle" color="orange" size="12px" class="q-mr-xs" />
                  <span class="text-caption">กำลังแก้ไข</span>
                </span>
                <span class="text-caption text-orange text-weight-bold">{{ inProgress }}</span>
              </div>
              <q-separator class="q-my-xs" />
              <div class="row items-center justify-between">
                <span class="text-caption">รวมทั้งหมด</span>
                <span class="text-caption text-weight-bold">{{ totalDefects }}</span>
              </div>
            </div>
          </div>
          <!-- Job Type Chips -->
          <div class="row q-gutter-xs q-mt-md">
            <q-chip
              v-for="tag in jobTypes" :key="tag.label"
              dense outline color="grey-7" text-color="grey-8"
              class="text-caption"
            >
              {{ tag.label }} {{ tag.count }}
            </q-chip>
          </div>
        </q-card-section>
      </q-card>

      <!-- Latest Updates Card -->
      <q-card flat bordered class="info-card q-mb-xl">
        <q-card-section>
          <div class="section-title q-mb-md">อัพเดตล่าสุด</div>
          <q-list dense>
            <q-item v-for="(item, i) in updates" :key="i" class="q-px-none q-py-sm">
              <q-item-section avatar style="min-width:20px">
                <q-icon name="circle" :color="item.color" size="10px" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body2">{{ item.title }}</q-item-label>
                <q-item-label caption class="text-grey-6">{{ item.sub }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption class="text-grey-5">{{ item.date }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

    </div>

    <!--Tab Bar -->
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

import { useDefectSummary } from 'src/stores/useDefectSummary'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'


// ── Defect summary จาก stores ──────────────────────────────────────────
const {
  totalDefects,
  inProgress,
  passed,
  progressValue,
  progressPercent,
  passedDash,
  inProgressDash,
  circumference,
} = useDefectSummary()

const router    = useRouter()
const route     = useRoute()
const activeTab = computed(() => route.path.split('/').pop())


// Mock Data
const projectFields = [
  { label: 'ชื่อโครงการ TH', value: 'บ้านแสนสุข' },
  { label: 'ชื่อโครงการ EN', value: 'Happy House' },
  { label: 'จังหวัด',         value: 'ชลบุรี' },
  { label: 'เขต/อำเภอ',       value: 'เมือง' },
  { label: 'แขวง/ตำบล',       value: 'แสนสุข' },
  { label: 'รหัสไปรษณีย์',   value: '20130' },
  { label: 'ประเภท',           value: 'บ้านเดี่ยว 2 ชั้น' },
  { label: 'พื้นที่',          value: '250 ตร.ม.' },
]

const customerFields = [
  { label: 'ชื่อลูกค้า',                    value: 'คุณสมชาย รักดี' },
  { label: 'ประเภทที่อยู่',                  value: 'บ้านเดี่ยว' },
  { label: 'เบอร์โทรศัพท์',                 value: '081-234-5678' },
  { label: 'อีเมล',                          value: 'somchai@email.com' },
  { label: 'เลขที่ห้อง/บ้านเลขที่',         value: '88/12' },
  { label: 'ชั้น/ซอย',                       value: 'ซ.นวลจันทร์ 15' },
  { label: 'ผู้ประสานงาน',                   value: '–', empty: true },
  { label: 'เบอร์โทรศัพท์ผู้ประสานงาน',     value: '–', empty: true },
]

const workflowSteps = [
  { icon: 'search',        label: 'ตรวจรอบที่ 1', status: 'done'    },
  { icon: 'description',  label: 'ส่งรายงาน',    status: 'done'    },
  { icon: 'build',        label: 'ซ่อมเสร็จสิ้น', status: 'active'  },
  { icon: 'search',       label: 'ตรวจรอบที่ 2',  status: 'active'  },
  { icon: 'check_circle', label: 'เสร็จสิ้น',     status: 'pending' },
]

const jobTypes = [
  { label: 'งานสี',      count: 38 },
  { label: 'งานไฟฟ้า',   count: 24 },
  { label: 'งานประปา',   count: 19 },
  { label: 'งานประตู',   count: 31 },
  { label: 'โครงสร้าง', count: 20 },
]

const updates = [
  { color: 'green',  title: 'ผู้รับเหมาแก้ไขเพิ่ม 6 รายการแล้ว',  sub: 'งานสี: ห้องนั่งเล่น • ห้องนอนชั้น2',  date: 'วันนี้'   },
  { color: 'orange', title: 'ส่งรายงาน PDF ให้คุณสมชายแล้ว',       sub: 'ครั้งที่ 1 · 132 รายการ',             date: 'เมื่อวาน' },
  { color: 'blue',   title: 'รอวิศวกรเข้าตรวจ',                     sub: 'วันที่ตรวจ : 21 ก.พ. 2569',          date: '15 ก.พ.'  },
]
</script>

<style scoped>
.overview-page {
  max-width: 480px;
  margin: 0 auto;
}

.download-btn {
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
}

.info-card {
  border-radius: 14px !important;
  background: #ffffff !important;
  border-color: #ebebeb !important;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #212121;
}

.field-label {
  font-size: 11px;
  color: #9e9e9e;
  margin-bottom: 2px;
}

.field-value {
  font-size: 14px;
  font-weight: 600;
  color: #212121;
}

.stat-card {
  border-radius: 12px !important;
  background: #ffffff !important;
  border-color: #ebebeb !important;
}

.stat-label {
  font-size: 10px;
  color: #9e9e9e;
  line-height: 1.3;
  margin-bottom: 4px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.1;
}

.workflow-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.wf-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 0 0 auto;
  width: 56px;
  text-align: center;
}

.wf-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.wf-circle.done    { background: #1976D2; color: #fff; }
.wf-circle.active  { background: #1976D2; color: #fff; opacity: 0.75; }
.wf-circle.pending { background: #e0e0e0; color: #bdbdbd; }

.wf-label {
  font-size: 9.5px;
  color: #555;
  line-height: 1.2;
  word-break: keep-all;
}

.wf-line {
  flex: 1;
  height: 2px;
  margin-top: 17px;
  min-width: 6px;
}

.wf-line.done { background: #1976D2; }
.wf-line.grey { background: #e0e0e0; }

.bottom-bar {
  border-top: 1px solid #ebebeb;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
}
</style>