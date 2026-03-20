<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import PropertyCard from '../components/PropertyCard.vue';

const $q = useQuasar();
const activeTab = ref('inspection');
const currentDayIndex = ref(2);
const days = [
  { name: 'อาทิตย์', date: 22, hasDot: false },
  { name: 'จันทร์', date: 23, hasDot: false },
  { name: 'อังคาร', date: 24, hasDot: true },
  { name: 'พุธ', date: 25, hasDot: true },
  { name: 'พฤหัสบดี', date: 26, hasDot: false },
  { name: 'ศุกร์', date: 27, hasDot: true },
  { name: 'เสาร์', date: 28, hasDot: true },
];

const inspections = {
  morning: [
    {
      id: 1,
      projectName: 'บ้านแสนสุข',
      address: 'เลขที่ 50/12 ถ.บางแสนสาย 2\nต.แสนสุข อ.เมือง จ.ชลบุรี 20130',
      type: 'บ้านเดี่ยว 3 ชั้น',
      customer: 'นายบิลลาบอง',
      phone: '088-888-8888',
      status: 'รอเข้าตรวจ',
      image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=300',
    },
  ],
  afternoon: [
    {
      id: 2,
      projectName: 'บ้านใหญ่ชลบุรี',
      address: 'เลขที่ 50/12 ถ.บางแสนสาย 2\nต.แสนสุข อ.เมือง จ.ชลบุรี 20130',
      type: 'ทาวน์โฮม',
      customer: 'นายพวกกัน',
      phone: '088-888-8888',
      status: 'รอเข้าตรวจ',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300',
    },
  ],
};

const totalInspections = computed(() => inspections.morning.length + inspections.afternoon.length);
const isMobile = computed(() => $q.screen.lt.md);
</script>

<template>
  <q-page class="bg-grey-3 row justify-center">
    <div
      class="bg-white relative-position"
      :style="{
        width: '100%',
        maxWidth: isMobile ? '430px' : '800px',
        minHeight: '100vh',
        paddingBottom: '90px',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
      }"
    >
      <div
        class="text-center text-weight-bold q-pt-xl q-pb-md"
        style="font-size: 24px; margin-top: 20px"
      >
        ข้อมูลการตรวจบ้าน
      </div>

      <q-separator color="primary" class="q-mx-lg" style="height: 2px" />

      <div class="q-pa-lg">
        <div class="row justify-between items-center q-mb-md">
          <div class="text-weight-bold" style="font-size: 16px">ตารางงานสัปดาห์นี้</div>
          <div class="text-primary text-weight-bold" style="font-size: 13px; cursor: pointer">
            ดูตารางงานทั้งหมด
          </div>
        </div>

        <div
          v-if="isMobile"
          class="row no-wrap q-gutter-x-sm hide-scrollbar items-start"
          style="overflow-x: auto; padding: 10px 0"
        >
          <div
            v-for="(day, index) in days"
            :key="index"
            class="column items-center relative-position"
            style="
              min-width: 68px;
              border-radius: 14px;
              padding-top: 14px; /* ดันข้อความลงมาให้หัวเสมอกัน */
            "
            :style="{
              height: currentDayIndex === index ? '100px' : '85px',

              border: index > currentDayIndex ? '1px solid #E0E0E0' : 'none',
            }"
            :class="
              currentDayIndex === index
                ? 'bg-primary text-white shadow-3' /* ปัจจุบัน: สีน้ำเงิน */
                : index < currentDayIndex
                  ? 'bg-grey-4 text-grey-6' /* อดีต: สีเทา */
                  : 'bg-white text-dark' /* อนาคต: สีขาว */
            "
          >
            <div style="font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500">
              {{ day.name }}
            </div>

            <div
              class="text-weight-bold q-mt-xs"
              style="font-family: 'Inter', sans-serif; font-size: 24px; line-height: 1"
            >
              {{ day.date }}
            </div>

            <div
              v-if="day.hasDot"
              class="absolute-bottom"
              style="
                width: 6px;
                height: 6px;
                border-radius: 50%;
                margin-bottom: 14px;
                left: 50%;
                transform: translateX(-50%);
              "
              :class="
                currentDayIndex === index
                  ? 'bg-white'
                  : index < currentDayIndex
                    ? 'bg-grey-5'
                    : 'bg-dark'
              "
            ></div>
          </div>
        </div>

        <div v-else class="row q-cols-7 q-gutter-sm items-start" style="padding: 10px 0">
          <div v-for="(day, index) in days" :key="index" class="col">
            <div
              class="column items-center relative-position"
              style="border-radius: 14px; padding-top: 14px; height: 100px"
              :style="{
                border: index > currentDayIndex ? '1px solid #E0E0E0' : 'none',
              }"
              :class="
                currentDayIndex === index
                  ? 'bg-primary text-white shadow-3'
                  : index < currentDayIndex
                    ? 'bg-grey-4 text-grey-6'
                    : 'bg-white text-dark'
              "
            >
              <div style="font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500">
                {{ day.name }}
              </div>

              <div
                class="text-weight-bold q-mt-xs"
                style="font-family: 'Inter', sans-serif; font-size: 24px; line-height: 1"
              >
                {{ day.date }}
              </div>

              <div
                v-if="day.hasDot"
                class="absolute-bottom"
                style="
                  width: 6px;
                  height: 6px;
                  border-radius: 50%;
                  margin-bottom: 14px;
                  left: 50%;
                  transform: translateX(-50%);
                "
                :class="
                  currentDayIndex === index
                    ? 'bg-white'
                    : index < currentDayIndex
                      ? 'bg-grey-5'
                      : 'bg-dark'
                "
              ></div>
            </div>
          </div>
        </div>
      </div>
      <q-separator color="primary" class="q-mx-lg q-mb-lg" style="height: 2px" />

      <div class="q-px-lg q-mb-md">
        <div class="row justify-between items-end">
          <div class="text-weight-bold" style="font-size: 16px">รายการงานตรวจ</div>
          <div class="text-weight-bold" style="font-size: 15px">วันที่ 24 ก.พ. 2569</div>
        </div>
        <div class="text-grey-6 q-mt-xs" style="font-size: 12px">
          สรุป: ตรวจบ้าน {{ totalInspections }} งาน | ตรวจความคืบหน้า (-)
        </div>
      </div>

      <div class="q-px-lg">
        <div class="text-primary text-weight-bold q-mb-sm" style="font-size: 12px">
          รอบเช้า 9:00-12:00
        </div>
        <PropertyCard v-for="item in inspections.morning" :key="'m' + item.id" :item="item" :isMobile="isMobile" />

        <div class="text-primary text-weight-bold q-mt-lg q-mb-sm" style="font-size: 12px">
          รอบบ่าย 13:00-16:00
        </div>
        <PropertyCard v-for="item in inspections.afternoon" :key="'a' + item.id" :item="item" :isMobile="isMobile" />
      </div>

      <div class="fixed-bottom row justify-center" style="pointer-events: none; z-index: 100">
        <div
          class="bg-white row items-center"
          :style="{
            width: '100%',
            maxWidth: isMobile ? '430px' : '800px',
            height: '75px',
            pointerEvents: 'auto',
            boxShadow: '0 -4px 15px rgba(0, 0, 0, 0.05)',
            borderTop: '1px solid #eee',
          }"
        >
          <div
            @click="activeTab = 'inspection'"
            class="col column items-center justify-center relative-position cursor-pointer h-full"
            style="height: 100%"
          >
            <div
              v-if="activeTab === 'inspection'"
              class="absolute-top bg-primary"
              style="height: 4px; width: 100%"
            ></div>
            <q-icon
              name="engineering"
              size="28px"
              :color="activeTab === 'inspection' ? 'primary' : 'grey-5'"
              class="q-mb-xs"
            />
            <div
              class="text-weight-bold"
              :class="activeTab === 'inspection' ? 'text-primary' : 'text-grey-5'"
              style="font-size: 12px"
            >
              การตรวจบ้าน
            </div>
          </div>

          <div
            @click="activeTab = 'progress'"
            class="col column items-center justify-center relative-position cursor-pointer h-full"
            style="height: 100%"
          >
            <div
              v-if="activeTab === 'progress'"
              class="absolute-top bg-primary"
              style="height: 4px; width: 100%"
            ></div>
            <q-icon
              name="assignment_turned_in"
              size="28px"
              :color="activeTab === 'progress' ? 'primary' : 'grey-5'"
              class="q-mb-xs"
            />
            <div
              class="text-weight-bold"
              :class="activeTab === 'progress' ? 'text-primary' : 'text-grey-5'"
              style="font-size: 12px"
            >
              การตรวจความคืบหน้า
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
