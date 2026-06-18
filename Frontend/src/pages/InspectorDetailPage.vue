<template>
  <q-page class="bg-grey-3 row justify-center">
    <div
      class="bg-white relative-position column modern-font"
      :style="{
        width: '100%',
        maxWidth: isMobile ? '430px' : '800px',
        minHeight: '100vh',
        boxSizing: 'border-box',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
      }"
    >
      <div v-if="loading" class="flex flex-center col q-pa-xl">
        <q-spinner color="primary" size="40px" />
      </div>

      <div v-else-if="jobData" class="q-px-lg q-pb-md col column">
        <q-img
          :src="
            jobData.job.projectImageUrl
              ? `${apiUrl}${jobData.job.projectImageUrl}`
              : 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600'
          "
          style="border-radius: 8px; height: 250px; margin-top: 20px"
          fit="cover"
          class="q-mb-md q-mt-sm"
        />

        <div class="row items-center justify-between no-wrap q-mb-xs">
          <div
            class="text-primary text-weight-bold ellipsis"
            style="font-size: 20px"
          >
            {{ jobData.job.projectName }}
          </div>
          <div class="row items-center q-gutter-x-sm">
            <q-badge
              v-if="isDefect(jobData.job?.inspectionType)"
              color="primary"
              outline
              label="การตรวจบ้าน"
              class="q-px-sm q-py-xs"
              style="font-size: 10px; font-weight: 500; border-radius: 4px;"
            />
            <q-badge
              v-else-if="isConstruction(jobData.job?.inspectionType)"
              color="warning"
              outline
              label="การตรวจก่อสร้าง"
              class="q-px-sm q-py-xs"
              style="font-size: 10px; font-weight: 500; border-radius: 4px;"
            />
            <q-badge
              color="warning"
              text-color="black"
              style="
                border-radius: 99px;
                font-weight: 500;
                font-size: 10px;
                padding: 4px 10px;
              "
            >
              {{ isSubmitted ? 'รอการอนุมัติ' : 'รอเข้าตรวจ' }}
            </q-badge>
          </div>
        </div>

        <div
          class="text-grey-6 q-mb-md"
          style="
            font-size: 10px;
            font-weight: 300;
            line-height: 1.4;
          "
        >
          เลขที่ {{ jobData.job.address?.houseNumber || '-' }} ถ.{{
            jobData.job.address?.soi || '-'
          }}
          ต.{{ jobData.job.address?.subDistrict || '-' }} อ.{{
            jobData.job.address?.district || '-'
          }}
          จ.{{ jobData.job.address?.province || '-' }} {{ jobData.job.address?.postalCode || '-' }}
        </div>

        <div class="row items-center justify-between no-wrap q-mb-sm">
          <div class="column q-gutter-y-sm">
            <div class="row items-center q-gutter-x-sm">
              <q-icon name="home" color="primary" size="18px" />
              <span
                class="text-dark"
                style="font-size: 12px; font-weight: 500"
              >
                : {{ jobData.job.houseType?.name || '-' }}
                {{ jobData.job.address?.floor ? jobData.job.address.floor + ' ชั้น' : '' }}
              </span>
            </div>
            <div class="row items-center q-gutter-x-sm">
              <q-icon name="open_in_full" color="primary" size="18px" />
              <span
                class="text-dark"
                style="font-size: 12px; font-weight: 500"
              >
                : {{ jobData.job.usableArea || '-' }} ตร.ม.
              </span>
            </div>
          </div>
          <q-btn round outline color="primary" icon="map" size="md" @click="openGoogleMaps" />
        </div>

        <q-separator color="primary" style="opacity: 0.5; height: 1px" class="q-my-md" />

        <div class="row items-center justify-between no-wrap q-mb-sm">
          <div class="column q-gutter-y-sm">
            <div
              class="text-primary text-weight-bold"
              style="font-size: 14px"
            >
              {{ jobData.job.customer?.fullName || 'ไม่ระบุชื่อลูกค้า' }}
            </div>
            <div class="row items-center q-gutter-x-sm">
              <q-icon name="phone_in_talk" color="primary" size="18px" />
              <span
                class="text-dark"
                style="font-size: 12px; font-weight: 500"
              >
                : {{ jobData.job.customer?.phoneNumber || '-' }}
              </span>
            </div>
            <div class="row items-center q-gutter-x-sm">
              <q-icon name="mail_outline" color="primary" size="18px" />
              <span
                class="text-dark"
                style="font-size: 12px; font-weight: 500"
              >
                : {{ jobData.job.customer?.email || '-' }}
              </span>
            </div>
          </div>
          <q-btn
            round
            outline
            color="primary"
            icon="phone_in_talk"
            size="md"
            tag="a"
            :href="`tel:${jobData?.job?.customer?.phoneNumber}`"
            :disable="!jobData?.job?.customer?.phoneNumber"
          />
        </div>

        <q-separator color="primary" style="opacity: 0.5; height: 1px" class="q-my-md" />

        <q-card flat bordered class="q-pa-md report-card">
          <div class="row items-center justify-between q-mb-xs">
            <div
              style="
                font-size: 14px;
                font-weight: 600;
                color: #333;
              "
            >
              รายงานการตรวจ
              <span class="text-primary">ครั้งที่ {{ jobData.roundNumber || 1 }}</span>
            </div>
            <div class="text-primary" style="font-size: 11px">
              {{ formatDate(jobData.scheduledDate) }}
            </div>
          </div>

          <div
            class="text-grey-6 q-mb-md"
            style="font-size: 10px"
          >
            ผู้ตรวจ: {{ jobData.teamMember?.inspector?.team?.teamName || 'ทีมวิศวกร' }}
          </div>

          <q-btn
            :disable="isSubmitted"
            :outline="!isInspected"
            :color="isInspected ? 'green' : 'blue'"
            class="full-width q-mb-sm action-btn"
            no-caps
            align="between"
            @click="startInspection"
          >
            <span class="text-weight-bold q-ml-sm">{{
              isInspected
                ? (isConstruction(jobData.job?.inspectionType) ? 'ดูข้อมูลการตรวจก่อสร้าง' : 'ดูข้อมูลการตรวจ Defect')
                : (isConstruction(jobData.job?.inspectionType) ? 'เริ่มตรวจก่อสร้าง' : 'เริ่มตรวจบ้าน')
            }}</span>
            <q-icon
              :name="isInspected ? 'check_circle' : 'chevron_right'"
              :class="isInspected ? 'text-white' : 'bg-blue text-white rounded-borders'"
              size="24px"
              style="padding: 2px;"
            />
          </q-btn>

          <q-btn
            :disable="isSubmitted"
            :outline="!isSummaryDone"
            :color="isSummaryDone ? 'green' : 'blue'"
            class="full-width action-btn"
            no-caps
            align="between"
            @click="router.push(`/inspector/job/${roundId}/report`)"
          >
            <span class="text-weight-bold q-ml-sm">{{
              isSummaryDone ? 'สรุปรายงานเรียบร้อย' : 'สรุปรายงาน'
            }}</span>
            <q-icon
              :name="isSummaryDone ? 'check_circle' : 'chevron_right'"
              :class="isSummaryDone ? 'text-white' : 'bg-blue text-white rounded-borders'"
              size="24px"
              style="padding: 2px;"
            />
          </q-btn>
        </q-card>

        <q-btn
          :disable="!canSubmitApproval"
          :class="['full-width', !canSubmitApproval ? 'disabled-btn' : 'shadow-2']"
          :color="isSubmitted ? 'grey-5' : canSubmitApproval ? 'primary' : 'grey-4'"
          :label="isSubmitted ? 'ส่งอนุมัติการตรวจเรียบร้อยแล้ว' : 'ส่งอนุมัติการตรวจ'"
          no-caps
          @click="onSubmit()"
          style="
            font-size: 16px;
            font-weight: 600;
            padding: 14px 0;
            border-radius: 8px;
            margin-top: 24px;
          "
        />
      </div>
      <div v-else class="text-center q-pa-xl col column justify-center text-grey-7">
        ไม่พบข้อมูลงานตรวจนี้
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { api } from 'src/boot/axios';
import type { InspectionRound } from 'src/models';

const apiUrl = import.meta.env.VITE_API_URL;
const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const isMobile = computed(() => $q.screen.lt.md);
const loading = ref(true);

const isDefect = (type?: string) => type === 'Defect' || type === 'ตรวจ Defect';
const isConstruction = (type?: string) => type === 'Construction' || type === 'ตรวจก่อสร้าง';

// 1. แก้อาการ Type Error โดยไม่ต้องพึ่ง any
// (เชื่อม Type แจ้ง TS ว่ามี inspectedAt, summaryCompletedAt และ status เสริมเข้ามา)
const jobData = ref<
  | (InspectionRound & {
      inspectedAt?: string;
      summaryCompletedAt?: string;
      status?: string;
    })
  | null
>(null);

const roundId = route.params.roundId as string;
const isSubmitting = ref(false);

// === Computed Properties สถานะต่างๆ ===
const isInspected = computed(() => !!jobData.value?.inspectedAt);
const isSummaryDone = computed(() => !!jobData.value?.summaryCompletedAt);
const isSubmitted = computed(() => jobData.value?.status === 'SUBMITTED');
const canSubmitApproval = computed(
  () => isInspected.value && isSummaryDone.value && !isSubmitted.value,
);

// 3. ปรับปรุงระบบเปิด Google Maps
const openGoogleMaps = () => {
  if (!jobData.value?.job) return;
  const job = jobData.value.job;
  const address = job.address;

  const searchQueryParts = [
    job.projectName,
    address?.houseNumber ? `เลขที่ ${address.houseNumber}` : '',
    address?.soi ? `ถ.${address.soi}` : '',
    address?.subDistrict ? `ต.${address.subDistrict}` : '',
    address?.district ? `อ.${address.district}` : '',
    address?.province ? `จ.${address.province}` : '',
    address?.postalCode || '',
  ];

  const searchQuery = searchQueryParts.filter((part) => part).join(' ');

  if (searchQuery.trim()) {
    const encodedQuery = encodeURIComponent(searchQuery);
    // ใช้ Link Maps Official จะรองรับการเปิดแอปมือถือได้ดีกว่าครับ
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
    window.open(mapsUrl, '_blank');
  } else {
    alert('ไม่พบข้อมูลที่อยู่สำหรับนำทาง');
  }
};

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function startInspection() {
  if (isConstruction(jobData.value?.job?.inspectionType)) {
    void router.push(`/inspector/job/${roundId}/construction-inspect`);
  } else {
    void router.push(`/inspector/job/${roundId}/inspection`);
  }
}

// === API Calls ===
async function fetchJobDetails() {
  loading.value = true;
  try {
    const res = await api.get(`/inspection-rounds/${roundId}`);
    jobData.value = res.data;
  } catch (error) {
    console.error('Error fetching job details:', error);
  } finally {
    loading.value = false;
  }
}

// === Action Functions ===

async function executeSubmit() {
  isSubmitting.value = true;
  $q.loading.show();
  try {
    await api.patch(`/inspection-rounds/${roundId}/submit`);
    await fetchJobDetails(); // รีเฟรชข้อมูล ดึงสถานะใหม่มาแสดง
    $q.notify({ color: 'positive', message: 'ส่งอนุมัติเรียบร้อยแล้ว', position: 'top' });
  } catch (error) {
    console.error('Submit Error:', error);
    $q.notify({
      color: 'negative',
      message: 'เกิดข้อผิดพลาดในการส่งข้อมูล',
    });
  } finally {
    isSubmitting.value = false;
    $q.loading.hide();
  }
}

const onSubmit = () => {
  $q.dialog({
    title: 'ยืนยันการส่งอนุมัติ',
    message: 'ข้อมูลครบถ้วนพร้อมยืมยันการส่งอนุมัติ ?',
    ok: {
      label: 'ยืนยัน',
      color: 'primary',
    },
    cancel: {
      label: 'ยกเลิก',
      color: 'grey-7',
      flat: true, // ทำให้ปุ่มยกเลิกไม่มีพื้นหลัง ดูเป็นปุ่มรอง
    },
    persistent: true,
  }).onOk(() => {
    void executeSubmit();
  });
};

onMounted(() => {
  void fetchJobDetails();
});
</script>

<style scoped>
.modern-font {
  font-family: 'Inter', 'Noto Sans Thai', -apple-system, BlinkMacSystemFont, sans-serif;
}

.report-card {
  border-radius: 8px;
  border-color: #e0e0e0;
}

.action-btn {
  border-radius: 10px;
  border-width: 1.5px;
  font-weight: 500;
  font-size: 14px;
  padding: 8px 16px;
  height: 44px;
}

.circle-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.outline-circle {
  border: 2px solid #1975d2;
}

.disabled-btn {
  background-color: #dcdcdc !important;
  color: #757575 !important;
}
</style>
