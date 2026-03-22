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
      <div class="bg-white relative-position" style="position: sticky; top: 0; z-index: 100">
        <div class="absolute" style="left: 20px; bottom: 20px; z-index: 10">
          <q-icon
            name="arrow_back_ios_new"
            size="24px"
            color="primary"
            class="cursor-pointer text-weight-bold"
            @click="goBack"
          />
        </div>

        <div class="text-center text-weight-bold q-pt-xl q-pb-md" style="font-size: 24px">
          ข้อมูลการตรวจบ้าน
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

          <q-btn outline color="blue" class="full-width q-py-sm" @click="showReport = true">
            <div class="row full-width justify-between items-center q-px-sm">
              <span class="text-weight-bold">ดูตัวอย่างรายงาน PDF</span>
              <q-icon
                name="chevron_right"
                class="bg-blue text-white rounded-borders q-pa-xs"
                size="18px"
              />
            </div>
          </q-btn>

          <q-btn outline color="blue" class="full-width q-py-sm" @click="exportPdf()">
            <div class="row full-width justify-between items-center q-px-sm">
              <span class="text-weight-bold">ปรินต์ PDF</span>
              <q-icon
                name="chevron_right"
                class="bg-blue text-white rounded-borders q-pa-xs"
                size="18px"
              />
            </div>
          </q-btn>

          <DefectReport
            ref="reportComp"
            :round="jobData"
            :defects="defects"
            :summaryItems="summaryItems"
            style="position: absolute; left: -9999px; top: -9999px"
          />
          <!-- ปุ่ม print reporttttttttt -->
          <!-- <q-btn
            @click="router.push(`/inspection/job/${roundId}/report`)"
            outline
            color="blue"
            class="full-width q-py-sm"
          >
            <div class="row full-width justify-between items-center q-px-sm">
              <span class="text-weight-bold">สรุปรายงาน</span>
              <q-icon
                name="chevron_right"
                class="bg-blue text-white rounded-borders q-pa-xs"
                size="18px"
              />
            </div>
          </q-btn> -->
          <q-btn
            :outline="!hasSummary"
            :color="hasSummary ? 'green' : 'blue'"
            class="full-width q-py-sm"
            style="border-radius: 10px; border-width: 1.5px"
            @click="router.push(`/inspector/job/${roundId}/report`)"
          >
            <div class="row full-width justify-between items-center q-px-sm">
              <span class="text-weight-bold">สรุปรายงาน</span>
              <q-icon
                :name="hasSummary ? 'check_circle' : 'chevron_right'"
                :class="hasSummary ? 'text-white' : 'bg-blue text-white rounded-borders q-pa-xs'"
                size="28px"
              />
            </div>
          </q-btn>

          <q-dialog v-model="showReport" full-width full-height>
            <q-card>
              <q-bar class="bg-primary text-white">
                <div>ตัวอย่างรายงาน Defect</div>
                <q-space />
                <q-btn dense flat icon="close" v-close-popup>
                  <q-tooltip>ปิด</q-tooltip>
                </q-btn>
              </q-bar>

              <q-card-section class="q-pa-none">
                <DefectReport :round="jobData" :defects="defects" :summaryItems="summaryItems" />
              </q-card-section>
            </q-card>
          </q-dialog>
        </q-card>

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
import type { InspectionRound, InspectionSummaryItem } from 'src/models';
import DefectReport from 'src/components/DefectReport.vue';
const apiUrl = import.meta.env.VITE_API_URL;

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const isMobile = computed(() => $q.screen.lt.md);
const loading = ref(true);
const jobData = ref<InspectionRound | null>(null);
const summaryItems = ref<InspectionSummaryItem[] | []>([]);

const roundId = route.params.roundId as string;

function exportPdf() {
  reportComp.value?.exportPdf();
}

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
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
    window.open(mapsUrl, '_blank');
  } else {
    alert('ไม่พบข้อมูลที่อยู่สำหรับนำทาง');
  }
};
const reportComp = ref<InstanceType<typeof DefectReport> | null>(null);
const defects = ref([]);

const showReport = ref(false);

const hasSummary = ref(false);

async function checkSummary() {
  const res = await api.get(`/inspection-summary-items/round/${roundId}`);
  hasSummary.value = res.data.length > 0;
}

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

async function fetchSummaryItems() {
  try {
    const res = await api.get(`/inspection-summary-items/round/${roundId}`);
    summaryItems.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    console.error(e);
    summaryItems.value = [];
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

async function fetchDefects() {
  const res = await api.get(`/defects/round/${roundId}`);
  defects.value = res.data;
}

function startInspection() {
  void router.push(`/inspector/job/${roundId}/inspection`);
}

function goBack() {
  router.back();
}

onMounted(() => {
  void fetchJobDetails();
  void fetchDefects();
  void fetchSummaryItems();
  void checkSummary();
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
