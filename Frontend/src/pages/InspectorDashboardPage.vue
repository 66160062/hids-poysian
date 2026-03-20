<template>
  <q-page class="bg-grey-1">
    <!-- Header -->
    <div class="bg-white q-pa-md">
      <div class="text-h6 text-weight-bold text-center">ข้อมูลการตรวจบ้าน</div>
    </div>

    <!-- Calendar Strip -->
    <div class="bg-white q-pa-md q-mb-sm">
      <div class="row justify-between items-center q-mb-sm">
        <span class="text-weight-bold">ตารางงานสัปดาห์นี้</span>
        <span class="text-blue text-caption">ดูตารางงานทั้งหมด</span>
      </div>
      <div class="row no-wrap scroll q-gutter-sm">
        <div v-for="day in weekDays" :key="day.date" class="col-auto">
          <q-btn
            flat
            dense
            :class="day.isActive ? 'bg-blue text-white rounded-borders' : 'text-grey'"
            style="min-width: 48px; border-radius: 12px"
          >
            <div class="column items-center q-pa-xs">
              <span class="text-caption">{{ day.label }}</span>
              <span class="text-h6 text-weight-bold">{{ day.date }}</span>
              <q-badge
                v-if="day.hasDot"
                color="blue"
                rounded
                style="width: 6px; height: 6px; padding: 0"
              />
            </div>
          </q-btn>
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div class="bg-white q-pa-md q-mb-sm">
      <div class="row justify-between">
        <span class="text-weight-bold">รายการงานตรวจ</span>
        <span class="text-caption text-grey">วันที่ 24 ก.พ. 2569</span>
      </div>
      <div class="text-caption text-grey">สรุป: ตรวจบ้าน 2 งาน | ตรวจความคืบหน้า (-)</div>
    </div>

    <!-- Morning Slot -->
    <div class="q-px-md q-mb-sm">
      <div class="text-caption text-weight-bold text-grey-7 q-mb-sm">รอบเช้า 9:00-12:00</div>
      <q-card v-for="job in morningJobs" :key="job.id" flat bordered class="q-mb-sm">
        <q-card-section horizontal>
          <q-img :src="job.image" style="width: 100px; height: 100px" class="rounded-borders" />
          <q-card-section class="q-pa-sm col">
            <div class="row justify-between items-start">
              <span class="text-weight-bold">{{ job.name }}</span>
              <q-badge color="orange" class="text-caption">รอเข้าตรวจ</q-badge>
            </div>
            <div class="text-caption text-grey q-mt-xs">{{ job.address }}</div>
            <div class="text-caption text-grey">ประเภทที่อยู่: {{ job.houseType }}</div>
            <div class="row items-center q-mt-xs">
              <q-icon name="person" size="14px" class="text-grey q-mr-xs" />
              <span class="text-caption">{{ job.customerName }}</span>
            </div>
            <div class="row items-center">
              <q-icon name="phone" size="14px" class="text-grey q-mr-xs" />
              <span class="text-caption">{{ job.phone }}</span>
            </div>
            <q-btn
              flat
              dense
              color="blue"
              icon="navigation"
              label="นำทาง"
              class="q-mt-xs"
              size="sm"
            />
          </q-card-section>
          <div class="column justify-center q-pr-sm">
            <q-icon name="chevron_right" color="grey" />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Afternoon Slot -->
    <div class="q-px-md q-mb-sm">
      <div class="text-caption text-weight-bold text-grey-7 q-mb-sm">รอบบ่าย 13:00-16:00</div>
      <q-card v-for="job in afternoonJobs" :key="job.id" flat bordered class="q-mb-sm">
        <q-card-section horizontal>
          <q-img :src="job.image" style="width: 100px; height: 100px" class="rounded-borders" />
          <q-card-section class="q-pa-sm col">
            <div class="row justify-between items-start">
              <span class="text-weight-bold">{{ job.name }}</span>
              <q-badge color="orange" class="text-caption">รอเข้าตรวจ</q-badge>
            </div>
            <div class="text-caption text-grey q-mt-xs">{{ job.address }}</div>
            <div class="text-caption text-grey">ประเภทที่อยู่: {{ job.houseType }}</div>
            <div class="row items-center q-mt-xs">
              <q-icon name="person" size="14px" class="text-grey q-mr-xs" />
              <span class="text-caption">{{ job.customerName }}</span>
            </div>
            <div class="row items-center">
              <q-icon name="phone" size="14px" class="text-grey q-mr-xs" />
              <span class="text-caption">{{ job.phone }}</span>
            </div>
            <q-btn
              flat
              dense
              color="blue"
              icon="navigation"
              label="นำทาง"
              class="q-mt-xs"
              size="sm"
            />
          </q-card-section>
          <div class="column justify-center q-pr-sm">
            <q-icon name="chevron_right" color="grey" />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Bottom Nav -->
    <q-footer class="bg-white">
      <q-tabs active-color="blue" indicator-color="blue" align="justify">
        <q-tab icon="home_repair_service" label="การตรวจบ้าน" />
        <q-tab icon="assignment" label="การตรวจความคืบหน้า" />
      </q-tabs>
    </q-footer>
  </q-page>
</template>

<script setup lang="ts">
const weekDays = [
  { label: 'อาทิ', date: 22, isActive: false, hasDot: false },
  { label: 'จันทร์', date: 23, isActive: false, hasDot: false },
  { label: 'อังคาร', date: 24, isActive: true, hasDot: true },
  { label: 'พุธ', date: 25, isActive: false, hasDot: true },
  { label: 'พฤหัสบดี', date: 26, isActive: false, hasDot: false },
];

const morningJobs = [
  {
    id: 1,
    name: 'บ้านแสนสุข',
    address: 'เลขที่ 50/12 ถ.แนบนางสาว 2 ต.เมือง อ.เมือง จ.20130',
    houseType: 'บ้านเดี่ยว 3 ชั้น',
    customerName: 'นายมิลลาวอง',
    phone: '088-888-8888',
    image: '/project-images/unknown.jpg',
  },
];

const afternoonJobs = [
  {
    id: 2,
    name: 'บ้านใหญ่ชลบุรี',
    address: 'เลขที่ 30/12 ถ.แนบนางสาว 2 ต.เมือง อ.เมือง จ.20130',
    houseType: 'ทาวน์โฮม',
    customerName: 'นายพงศกิน',
    phone: '088-888-8888',
    image: '/project-images/unknown.jpg',
  },
];
</script>
