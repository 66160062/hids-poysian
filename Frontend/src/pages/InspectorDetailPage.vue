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
      <div class="bg-white relative-position" style="position: sticky; top: 0; z-index: 100;">
        <div class="absolute" style="left: 20px; bottom: 20px; z-index: 10;">
          <q-icon
            name="arrow_back_ios_new"
            size="24px"
            color="primary"
            class="cursor-pointer text-weight-bold"
            @click="goBack"
          />
        </div>

        <div
          class="text-center text-weight-bold q-pt-md q-pb-md"
          style="font-size: 24px; "
        >
          รายละเอียด
        </div>
        <q-separator color="primary" class="q-mx-lg" style="height: 2px" />
      </div>

      <div v-if="loading" class="flex flex-center col q-pa-xl">
        <q-spinner color="primary" size="40px" />
      </div>

      <div v-else-if="jobData" class="q-px-lg q-pb-xl col column">
        <q-img
          :src="
            jobData.job.projectImageUrl
              ? `http://localhost:3000${jobData.job.projectImageUrl}`
              : 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600'
          "
          style="border-radius: 8px; height: 250px; margin-top: 20px ;"
          fit="cover"
          class="q-mb-md q-mt-sm"
        />

        <div class="row items-center justify-between no-wrap q-mb-xs">
          <div
            class="text-primary text-weight-bold ellipsis"
            style="font-family: 'Inter', sans-serif; font-size: 20px"
          >
            {{ jobData.job.projectName }}
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
          style="
            font-family: 'Inter', sans-serif;
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
                style="font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500"
              >
                : {{ jobData.job.houseType?.name || '-' }}
                {{ jobData.job.address?.floor ? jobData.job.address.floor + ' ชั้น' : '' }}
              </span>
            </div>
            <div class="row items-center q-gutter-x-sm">
              <q-icon name="open_in_full" color="primary" size="18px" />
              <span
                class="text-dark"
                style="font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500"
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
              style="font-family: 'Inter', sans-serif; font-size: 14px"
            >
              {{ jobData.job.customer?.fullName || 'ไม่ระบุชื่อลูกค้า' }}
            </div>
            <div class="row items-center q-gutter-x-sm">
              <q-icon name="phone_in_talk" color="primary" size="18px" />
              <span
                class="text-dark"
                style="font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500"
              >
                : {{ jobData.job.customer?.phoneNumber || '-' }}
              </span>
            </div>
            <div class="row items-center q-gutter-x-sm">
              <q-icon name="mail_outline" color="primary" size="18px" />
              <span
                class="text-dark"
                style="font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500"
              >
                : {{ jobData.job.customer?.email || '-' }}
              </span>
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
              รายงานการตรวจ
              <span class="text-primary">ครั้งที่ {{ jobData.roundNumber || 1 }}</span>
            </div>
            <div class="text-primary" style="font-family: 'Inter', sans-serif; font-size: 11px">
              {{ formatDate(jobData.scheduledDate) }}
            </div>
          </div>

          <div
            class="text-grey-6 q-mb-md"
            style="font-family: 'Inter', sans-serif; font-size: 10px"
          >
            ผู้ตรวจ: {{ jobData.teamMember?.inspector?.team?.teamName || 'ทีมวิศวกร' }}
          </div>

          <q-btn
            unelevated
            color="primary"
            class="full-width q-mb-sm action-btn"
            no-caps
            @click="startInspection"
          >
            <div class="row items-center justify-between full-width">
              <span>เริ่มตรวจบ้าน</span>
              <div class="circle-icon bg-white text-primary flex flex-center">
                <q-icon name="chevron_right" size="18px" />
              </div>
            </div>
          </q-btn>

          <q-btn outline color="primary" class="full-width action-btn" no-caps @click="goToReport">
            <div class="row items-center justify-between full-width">
              <span>สรุปรายงาน</span>
              <div class="circle-icon outline-circle text-primary flex flex-center">
                <q-icon name="chevron_right" size="18px" />
              </div>
            </div>
          </q-btn>
        </q-card>

        <q-space />

        <q-btn disable class="full-width q-mt-xl disabled-btn" label="ส่งอนุมัติการตรวจ" no-caps />
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

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const isMobile = computed(() => $q.screen.lt.md);
const loading = ref(true);
const jobData = ref<InspectionRound | null>(null);

const roundId = route.params.roundId as string;

const goBack = () => {
  router.back();
};
const goToReport = async () => {
  await router.push('/inspection/report');
};
const startInspection = () => {
  void router.push(`/inspector/job/${roundId}/inspection`);
};

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
    address?.postalCode || ''
  ];

  const searchQuery = searchQueryParts.filter(part => part).join(' ');

  if (searchQuery.trim()) {
    const encodedQuery = encodeURIComponent(searchQuery);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
    window.open(mapsUrl, '_blank');
  } else {
    alert('ไม่พบข้อมูลที่อยู่สำหรับนำทาง');
  }
};

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

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

onMounted(() => {
  void fetchJobDetails();
});
</script>

<style scoped>
.report-card {
  border-radius: 8px;
  border-color: #e0e0e0;
}

.action-btn {
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
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
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 16px;
  padding: 12px 0;
  pointer-events: none;
}
</style>
