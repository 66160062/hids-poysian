<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const router = useRouter();
const isMobile = computed(() => $q.screen.lt.md);

const goBack = () => {
  router.back();
};
</script>

<template>
  <q-page class="bg-grey-3 row justify-center">
    <div
      class="bg-white relative-position column"
      :style="{
        width: '100%',
        maxWidth: isMobile ? '430px' : '800px',
        minHeight: '100vh',
        paddingBottom: '90px',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
      }"
    >
      <div
        class="row items-center justify-between q-pt-xl q-pb-md q-px-md relative-position"
        style="margin-top: 20px;"
      >
        <div style="width: 40px; z-index: 1">
          <q-icon
            name="arrow_back_ios_new"
            size="24px"
            color="primary"
            class="cursor-pointer text-weight-bold"
            @click="goBack"
          />
        </div>

        <div
          class="absolute-center text-weight-bold text-dark"
          style="font-size: 24px; margin-top: 20px;;"
        >
          รายละเอียด
        </div>

        <div style="width: 40px;"></div>
      </div>

      <div class="q-px-lg q-pb-xl col column">
        <q-img
          src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600"
          style="border-radius: 8px; height: 180px"
          fit="cover"
          class="q-mb-md q-mt-sm"
        />

        <div class="row items-center justify-between no-wrap q-mb-xs">
          <div
            class="text-primary text-weight-bold ellipsis"
            style="font-family: 'Inter', sans-serif; font-size: 20px"
          >
            บ้านแสนสุข
          </div>
          <q-badge
            color="warning"
            text-color="black"
            style="
              border-radius: 99px;
              font-family: 'Inter', sans-serif;
              font-weight: 500;
              font-size: 10px;
              padding: 4px 10px;
            "
          >
            รอเข้าตรวจ
          </q-badge>
        </div>

        <div
          class="text-grey-6 q-mb-md"
          style="font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 300"
        >
          เลขที่ 50/12 ถ.บางแสนสาย 2 ต.แสนสุข อ.เมือง จ.ชลบุรี 20130
        </div>

        <div class="row items-center justify-between no-wrap q-mb-sm">
          <div class="column q-gutter-y-sm">
            <div class="row items-center q-gutter-x-sm">
              <q-icon name="o_home" color="primary" size="18px" />
              <span
                class="text-dark"
                style="font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500"
                >: บ้านเดี่ยว 3 ชั้น</span
              >
            </div>
            <div class="row items-center q-gutter-x-sm">
              <q-icon name="open_in_full" color="primary" size="18px" />
              <span
                class="text-dark"
                style="font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500"
                >: 250 ตร.ม.</span
              >
            </div>
          </div>
          <q-btn round outline color="primary" icon="map" size="md" />
        </div>

        <q-separator color="primary" style="opacity: 0.5; height: 1px" class="q-my-md" />

        <div class="row items-center justify-between no-wrap q-mb-sm">
          <div class="column q-gutter-y-sm">
            <div
              class="text-primary text-weight-bold"
              style="font-family: 'Inter', sans-serif; font-size: 14px"
            >
              นายบิลลาบอง
            </div>
            <div class="row items-center q-gutter-x-sm">
              <q-icon name="phone_in_talk" color="primary" size="18px" />
              <span
                class="text-dark"
                style="font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500"
                >: 088-888-8888</span
              >
            </div>
            <div class="row items-center q-gutter-x-sm">
              <q-icon name="mail_outline" color="primary" size="18px" />
              <span
                class="text-dark"
                style="font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500"
                >: Binlabong@gmail.com</span
              >
            </div>
          </div>
          <q-btn round outline color="primary" icon="phone_in_talk" size="md" />
        </div>

        <q-separator color="primary" style="opacity: 0.5; height: 1px" class="q-my-md" />

        <q-card flat bordered class="q-pa-md report-card">
          <div class="row items-center justify-between q-mb-xs">
            <div
              style="
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                font-weight: 600;
                color: #333;
              "
            >
              รายงานการตรวจ <span class="text-primary">ครั้งที่ 1</span>
            </div>
            <div class="text-primary" style="font-family: 'Inter', sans-serif; font-size: 11px">
              24 กุมภาพันธ์ 2569
            </div>
          </div>

          <div
            class="text-grey-6 q-mb-md"
            style="font-family: 'Inter', sans-serif; font-size: 10px"
          >
            ผู้ตรวจ: ทีมวิศวกรบ้านใหญ่
          </div>

          <q-btn unelevated color="primary" class="full-width q-mb-sm action-btn" no-caps>
            <div class="row items-center justify-between full-width">
              <span>เริ่มตรวจบ้าน</span>
              <div class="circle-icon bg-white text-primary flex flex-center">
                <q-icon name="chevron_right" size="18px" />
              </div>
            </div>
          </q-btn>

          <q-btn outline color="primary" class="full-width action-btn" no-caps>
            <div class="row items-center justify-between full-width">
              <span>สรุปรายงาน</span>
              <div class="circle-icon outline-circle text-primary flex flex-center">
                <q-icon name="chevron_right" size="18px" />
              </div>
            </div>
          </q-btn>
        </q-card>

        <q-space />

        <q-btn
          unelevated
          class="full-width q-mt-xl disabled-btn"
          label="ส่งอนุมัติการตรวจ"
          no-caps
        />
      </div>
    </div>
  </q-page>
</template>

<style scoped>
/* การ์ดรายงาน */
.report-card {
  border-radius: 8px;
  border-color: #e0e0e0;
}

/* ปุ่มกดในการ์ด */
.action-btn {
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  padding: 8px 16px;
  height: 44px;
}

/* วงกลมที่มีลูกศรชี้ขวา */
.circle-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.outline-circle {
  border: 2px solid #1975d2;
}

/* ปุ่มสีเทาด้านล่างสุด */
.disabled-btn {
  background-color: #dcdcdc !important;
  color: #757575 !important;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 16px;
  padding: 12px 0;
  pointer-events: none; /* ปิดไม่ให้กดได้ จนกว่าจะตรวจเสร็จ (ถ้าอยากให้กดได้ให้ลบบรรทัดนี้ออก) */
}
</style>
