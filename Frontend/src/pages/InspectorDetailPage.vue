<template>
  <q-page class="bg-grey-1 row justify-center">
    <div
      class="bg-white relative-position column modern-font detail-card"
      :style="{
        width: '100%',
        maxWidth: isMobile ? '430px' : '800px',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }"
    >
      <!-- Loading State: แสดงผ่าน $q.loading แบบเต็มจอ (ดู onMounted) เว้นพื้นที่ไว้กันเลย์เอาต์กระโดด -->
      <div v-if="loading" style="min-height: 60vh"></div>

      <div v-else-if="jobData" class="q-px-lg q-pb-md col column">
        <q-img loading="eager"
          :src="jobData.job.projectImageUrl ? getImageUrl(jobData.job.projectImageUrl) : 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600'"
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
              :label="t('inspector.detail.badgeInspection')"
              class="q-px-sm q-py-xs"
              style="font-size: 10px; font-weight: 500; border-radius: 4px;"
            />
            <q-badge
              v-else-if="isConstruction(jobData.job?.inspectionType)"
              color="warning"
              outline
              :label="t('inspector.detail.badgeConstruction')"
              class="q-px-sm q-py-xs"
              style="font-size: 10px; font-weight: 500; border-radius: 4px;"
            />
            <q-badge
              :color="isApproved ? 'positive' : 'warning'"
              :text-color="isApproved ? 'white' : 'black'"
              style="
                border-radius: 99px;
                font-weight: 500;
                font-size: 10px;
                padding: 4px 10px;
              "
            >
              {{ isApproved ? t('inspector.detail.statusApproved') : isSubmitted ? t('inspector.detail.statusSubmitted') : t('inspector.detail.statusWaiting') }}
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
          {{ t('inspector.detail.addressHouseNo') }} {{ jobData.job.address?.houseNumber || '-' }} {{ t('inspector.detail.addressRoad') }} {{
            jobData.job.address?.soi || '-'
          }}
          {{ t('inspector.detail.addressSubDistrict') }} {{ jobData.job.address?.subDistrict || '-' }} {{ t('inspector.detail.addressDistrict') }} {{
            jobData.job.address?.district || '-'
          }}
          {{ t('inspector.detail.addressProvince') }} {{ jobData.job.address?.province || '-' }} {{ jobData.job.address?.postalCode || '-' }}
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
                {{ jobData.job.address?.floor ? jobData.job.address.floor + ' ' + t('inspector.detail.floorUnit') : '' }}
              </span>
            </div>
            <div class="row items-center q-gutter-x-sm">
              <q-icon name="open_in_full" color="primary" size="18px" />
              <span
                class="text-dark"
                style="font-size: 12px; font-weight: 500"
              >
                : {{ jobData.job.usableArea || '-' }} {{ t('inspector.detail.areaUnit') }}
              </span>
            </div>
          </div>
          <q-btn round outline color="primary" icon="location_on" size="md" @click="openGoogleMaps" />
        </div>

        <q-separator color="primary" style="opacity: 0.5; height: 1px" class="q-my-md" />

        <div class="row items-center justify-between no-wrap q-mb-sm">
          <div class="column q-gutter-y-sm">
            <div
              class="text-primary text-weight-bold"
              style="font-size: 14px"
            >
              {{ jobData.job.customer?.fullName || t('inspector.detail.customerNameUnknown') }}
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
              {{ t('inspector.detail.reportTitle') }}
              <span class="text-primary">{{ t('inspector.detail.roundLabel', { round: jobData.roundNumber || 1 }) }}</span>
            </div>
            <div class="text-primary" style="font-size: 11px">
              {{ formatDate(jobData.scheduledDate) }}
            </div>
          </div>

          <div
            class="text-grey-6 q-mb-md"
            style="font-size: 10px"
          >
            {{ t('inspector.detail.inspectorLabel', { name: jobData.teamMember?.inspector?.team?.teamName || t('inspector.detail.defaultTeamName') }) }}
          </div>

          <q-btn
            :disable="(isSubmitted && !isInspected) || (isInspected && isConstruction(jobData.job?.inspectionType))"
            :outline="!isInspected"
            :color="isInspected ? 'green' : 'blue'"
            class="full-width q-mb-sm action-btn"
            no-caps
            align="between"
            @click="startInspection"
          >
            <span class="text-weight-bold q-ml-sm">{{
              isInspected
                ? (isConstruction(jobData.job?.inspectionType) ? t('inspector.detail.inspectionDoneConstruction') : t('inspector.detail.viewDefectInspection'))
                : (isConstruction(jobData.job?.inspectionType) ? t('inspector.detail.startConstructionInspection') : t('inspector.detail.startHomeInspection'))
            }}</span>
            <q-icon
              :name="isInspected ? 'check_circle' : 'chevron_right'"
              :class="isInspected ? 'text-white' : 'bg-blue text-white rounded-borders'"
              size="24px"
              style="padding: 2px;"
            />
          </q-btn>

          <q-btn
            v-if="!isConstruction(jobData.job?.inspectionType)"
            :disable="isSubmitted && !isSummaryDone"
            :outline="!isSummaryDone"
            :color="isSummaryDone ? 'green' : 'blue'"
            class="full-width q-mb-sm action-btn"
            no-caps
            align="between"
            @click="router.push(`/inspector/job/${roundId}/report`)"
          >
            <span class="text-weight-bold q-ml-sm">{{
              isSummaryDone ? t('inspector.detail.summaryDone') : t('inspector.detail.summarizeReport')
            }}</span>
            <q-icon
              :name="isSummaryDone ? 'check_circle' : 'chevron_right'"
              :class="isSummaryDone ? 'text-white' : 'bg-blue text-white rounded-borders'"
              size="24px"
              style="padding: 2px;"
            />
          </q-btn>

          <q-btn
            v-if="!isConstruction(jobData.job?.inspectionType)"
            :disable="!isSummaryDone || isGeneratingPdf"
            :outline="!isSummaryDone"
            :color="isSummaryDone ? 'primary' : 'grey-5'"
            class="full-width action-btn"
            no-caps
            align="between"
            @click="handleViewReport"
          >
            <span class="text-weight-bold q-ml-sm">{{ t('inspector.detail.viewReport') }}</span>
            <q-icon
              :name="isSummaryDone ? 'visibility' : 'lock'"
              :class="isSummaryDone ? 'text-white' : 'text-grey-5'"
              size="24px"
              style="padding: 2px;"
            />
          </q-btn>
        </q-card>

        <q-btn
          :disable="!canSubmitApproval"
          :class="['full-width', !canSubmitApproval ? 'disabled-btn' : 'shadow-2']"
          :color="isApproved ? 'grey-4' : isSubmitted ? 'grey-5' : canSubmitApproval ? 'primary' : 'grey-4'"
          :label="isApproved ? t('inspector.detail.approvalApproved') : isSubmitted ? t('inspector.detail.approvalSubmitted') : t('inspector.detail.submitApproval')"
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
        {{ t('inspector.detail.notFound') }}
      </div>
    </div>

    <!-- PDF Report View Dialog -->
    <q-dialog v-model="showReportDialog" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="bg-grey-3 column">
        <!-- Dialog Header -->
        <q-toolbar class="bg-white text-dark shadow-2 z-top">
          <q-btn flat round dense icon="close" v-close-popup />
          <q-toolbar-title class="text-weight-bold" style="font-size: 16px;">
            {{ t('inspector.detail.reportPreviewTitle') }}
          </q-toolbar-title>
        </q-toolbar>

        <!-- Dialog Content (PDF View) -->
        <q-card-section class="col q-pa-none" style="overflow-y: auto; overflow-x: hidden;">
          <DefectReport
            v-if="pdfDataLoaded && jobData"
            ref="pdfReportRef"
            :round="jobData"
            :defects="pdfDefects"
            :summaryItems="pdfSummaryItems"
            :check-freshness="true"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { api } from 'src/boot/axios';
import type { InspectionRound, Defect, InspectionSummaryItem } from 'src/models';
import DefectReport from 'src/components/DefectReport.vue';
import { createIconSpinner } from 'src/composables/useIconSpinner';

const jobDetailSpinner = createIconSpinner('home');
const pdfSpinner = createIconSpinner('picture_as_pdf');

const apiUrl = import.meta.env.VITE_API_URL;
const $q = useQuasar();
const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();

const isMobile = computed(() => $q.screen.lt.md);
const loading = ref(true);

const getImageUrl = (url?: string) => {
  if (!url) return '';
  return url.startsWith('http') || url.startsWith('blob:') ? url : `${apiUrl}${url}`;
};

const isDefect = (type?: string) => type === 'DEFECT_INSPECTION' || type === 'Defect' || type === 'ตรวจ Defect';
const isConstruction = (type?: string) => type === 'CONSTRUCTION_INSPECTION' || type === 'Construction' || type === 'ตรวจก่อสร้าง';

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

// PDF Export State
const pdfReportRef = ref<InstanceType<typeof DefectReport> | null>(null);
const isGeneratingPdf = ref(false);
const pdfDataLoaded = ref(false);
const pdfDefects = ref<Defect[]>([]);
const pdfSummaryItems = ref<InspectionSummaryItem[]>([]);

// === Computed Properties สถานะต่างๆ ===
const isInspected = computed(() => !!jobData.value?.inspectedAt);
const isSummaryDone = computed(() => !!jobData.value?.summaryCompletedAt);
const isSubmitted = computed(() => jobData.value?.status === 'SUBMITTED');
const isApproved = computed(() => jobData.value?.status === 'APPROVED');
const canSubmitApproval = computed(() => {
  if (isSubmitted.value || isApproved.value) return false;
  if (!isInspected.value) return false;

  if (isConstruction(jobData.value?.job?.inspectionType)) {
    return true; // Construction only requires inspection to be done
  }

  return isSummaryDone.value; // Defect requires summary to be done
});

// 3. ปรับปรุงระบบเปิด Google Maps
const openGoogleMaps = () => {
  if (!jobData.value?.job) return;
  const job = jobData.value.job;
  const address = job.address;

  const searchQueryParts = [
    job.projectName,
    address?.houseNumber ? `${t('inspector.detail.addressHouseNo')} ${address.houseNumber}` : '',
    address?.soi ? `${t('inspector.detail.addressRoad')}${address.soi}` : '',
    address?.subDistrict ? `${t('inspector.detail.addressSubDistrict')}${address.subDistrict}` : '',
    address?.district ? `${t('inspector.detail.addressDistrict')}${address.district}` : '',
    address?.province ? `${t('inspector.detail.addressProvince')}${address.province}` : '',
    address?.postalCode || '',
  ];

  const searchQuery = searchQueryParts.filter((part) => part).join(' ');

  if (searchQuery.trim()) {
    const encodedQuery = encodeURIComponent(searchQuery);
    // ใช้ Link Maps Official จะรองรับการเปิดแอปมือถือได้ดีกว่าครับ
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
    window.open(mapsUrl, '_blank');
  } else {
    alert(t('inspector.detail.noAddressForNavigation'));
  }
};

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale.value, {
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

const showReportDialog = ref(false);

async function handleViewReport() {
  if (!isSummaryDone.value) {
    $q.notify({ type: 'warning', message: t('inspector.detail.notifyNeedSummary') });
    return;
  }

  isGeneratingPdf.value = true;
  $q.loading.show({
    spinner: pdfSpinner,
    spinnerColor: 'primary',
    spinnerSize: 70,
    backgroundColor: 'white',
  });
  try {
    const [defectsRes, summaryRes] = await Promise.all([
      api.get(`/defects/round/${roundId}`),
      api.get(`/inspection-summary-items/round/${roundId}`)
    ]);
    pdfDefects.value = defectsRes.data;
    pdfSummaryItems.value = summaryRes.data;
    pdfDataLoaded.value = true;
    showReportDialog.value = true; // เปิด Dialog แสงดรายงาน

  } catch (error) {
    console.error('Error generating report:', error);
    $q.notify({ color: 'negative', message: t('inspector.detail.errorFetchReport') });
  } finally {
    $q.loading.hide();
    isGeneratingPdf.value = false;
  }
}

// === Action Functions ===

async function executeSubmit() {
  isSubmitting.value = true;
  $q.loading.show();
  try {
    await api.patch(`/inspection-rounds/${roundId}/submit`);
    await fetchJobDetails(); // รีเฟรชข้อมูล ดึงสถานะใหม่มาแสดง
    $q.notify({ color: 'positive', message: t('inspector.detail.notifySubmitSuccess'), position: 'top' });
  } catch (error) {
    console.error('Submit Error:', error);
    $q.notify({
      color: 'negative',
      message: t('inspector.detail.errorSubmit'),
    });
  } finally {
    isSubmitting.value = false;
    $q.loading.hide();
  }
}

const onSubmit = () => {
  $q.dialog({
    title: t('inspector.detail.confirmSubmitTitle'),
    message: t('inspector.detail.confirmSubmitMessage'),
    ok: {
      label: t('inspector.detail.confirm'),
      color: 'primary',
    },
    cancel: {
      label: t('inspector.detail.cancel'),
      color: 'grey-7',
      flat: true, // ทำให้ปุ่มยกเลิกไม่มีพื้นหลัง ดูเป็นปุ่มรอง
    },
    persistent: true,
  }).onOk(() => {
    void executeSubmit();
  });
};

onMounted(() => {
  $q.loading.show({
    spinner: jobDetailSpinner,
    spinnerColor: 'primary',
    spinnerSize: 70,
    backgroundColor: 'white',
  });
  void fetchJobDetails().finally(() => {
    $q.loading.hide();
  });
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

.plan-thumb {
  width: 100px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.plan-img {
  width: 100%;
  height: 100%;
}

.plan-thumb-empty {
  width: 100px;
  height: 80px;
  border-radius: 12px;
  border: 1.5px dashed #e0e0e0;
}

.plan-btn {
  border-radius: 50px;
  padding: 0 20px;
  height: 40px;
}
</style>
