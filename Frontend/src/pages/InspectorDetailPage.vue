<template>
  <q-page class="bg-grey-1 row justify-center">
    <div class="bg-white relative-position column modern-font detail-card">
      <!-- Loading State: แสดงผ่าน $q.loading แบบเต็มจอ (ดู onMounted) เว้นพื้นที่ไว้กันเลย์เอาต์กระโดด -->
      <div v-if="loading" style="min-height: 60vh"></div>

      <div v-else-if="jobData" class="q-px-lg q-pb-md col column">
        <div class="house-img-frame q-mb-md q-mt-sm">
          <q-img loading="eager" :src="houseImageSrc" fit="cover" class="house-img-bg" />
          <q-img loading="eager" :src="houseImageSrc" fit="contain" class="house-img-fg" />
        </div>

        <div class="row items-center justify-between no-wrap q-mb-xs">
          <div
            class="text-primary text-weight-bold ellipsis"
            style="font-size: 20px"
          >
            {{ t('inspector.detail.projectLabel') }} {{ pickLocalized(jobData.job.projectName, jobData.job.projectNameEn) }}
          </div>
          <div class="row items-center q-gutter-x-sm">
            <q-badge
              v-if="isDefect(jobData.job?.inspectionType)"
              color="primary"
              outline
              :label="t('inspector.detail.badgeInspection')"
              class="q-px-sm q-py-xs type-badge"
            />
            <q-badge
              v-else-if="isConstruction(jobData.job?.inspectionType)"
              color="warning"
              outline
              :label="t('inspector.detail.badgeConstruction')"
              class="q-px-sm q-py-xs type-badge"
            />
            <q-badge class="status-badge" :class="[statusBgClass, `text-${statusTextColor}`]">
              {{ isApproved ? t('inspector.detail.statusApproved') : isSubmitted ? t('inspector.detail.statusSubmitted') : isInspected ? t('inspector.detail.statusInProgress') : t('inspector.detail.statusWaiting') }}
            </q-badge>
          </div>
        </div>

        <div class="row items-center justify-between no-wrap q-mb-sm">
          <div class="column q-gutter-y-sm">
            <div class="row items-center q-gutter-x-sm">
              <q-icon name="place" color="primary" size="18px" />
              <span
                class="text-dark"
                style="font-size: 12px; font-weight: 500"
              >
                : {{ t('inspector.detail.addressHouseNo') }} {{ jobData.job.address?.houseNumber || '-' }} {{ t('inspector.detail.addressRoad') }} {{
                  jobData.job.address?.soi || '-'
                }}
                {{ t('inspector.detail.addressSubDistrict') }} {{ jobData.job.address?.subDistrict || '-' }} {{ t('inspector.detail.addressDistrict') }} {{
                  jobData.job.address?.district || '-'
                }}
                {{ t('inspector.detail.addressProvince') }} {{ jobData.job.address?.province || '-' }} {{ jobData.job.address?.postalCode || '-' }}
              </span>
            </div>
            <div class="row items-center q-gutter-x-sm">
              <q-icon name="home" color="primary" size="18px" />
              <span
                class="text-dark"
                style="font-size: 12px; font-weight: 500"
              >
                : {{ pickLocalized(jobData.job.houseType?.name, jobData.job.houseType?.nameEn) || '-' }}
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

        <div class="row items-center no-wrap q-gutter-md q-mb-sm">
          <div
            v-if="housePlans.length"
            class="plan-thumb relative-position cursor-pointer"
            @click="viewHousePlan"
          >
            <q-img loading="eager" :src="housePlans[0]?.url" class="plan-img" fit="cover" />
          </div>
          <div
            v-else
            class="plan-thumb-empty row items-center justify-center bg-grey-2 rounded-borders"
          >
            <q-icon name="architecture" size="40px" color="grey-4" />
          </div>

          <q-btn
            unelevated
            color="primary"
            :label="t('inspector.detail.viewHousePlan')"
            icon="grid_view"
            class="plan-btn"
            no-caps
            @click="viewHousePlan"
          />
        </div>

        <q-separator color="primary" style="opacity: 0.5; height: 1px" class="q-my-md" />

        <div class="row items-center justify-between no-wrap q-mb-sm">
          <div class="column q-gutter-y-sm">
            <div class="row items-center q-gutter-x-sm text-grey-6">
              <q-icon name="person" size="14px" />
              <span class="text-caption">{{ t('inspector.detail.customerLabel') }}</span>
            </div>
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
                | {{ jobData.job.customer?.phoneNumber2 || '' }}
                | {{ jobData.job.customer?.phoneNumber3 || '' }} 
              </span>
            </div>
            <div class="row items-center q-gutter-x-sm">
              <q-icon name="mail_outline" color="primary" size="18px" />
              <span
                class="text-dark"
                style="font-size: 12px; font-weight: 500"
              >
                : {{ jobData.job.customer?.email || '-' }}
                | {{ jobData.job.customer?.email2 || '' }} 
                | {{ jobData.job.customer?.email3 || '' }}
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

        <div class="column q-gutter-y-sm q-mb-sm">
          <div class="row items-center q-gutter-x-sm text-grey-6">
            <q-icon name="contacts" size="14px" />
            <span class="text-caption">{{ t('inspector.detail.coordinatorLabel') }}</span>
          </div>
          <div class="text-primary text-weight-bold" style="font-size: 14px">
            {{ jobData.job.createdBy?.fullName || t('inspector.detail.coordinatorNameUnknown') }}
          </div>
          <div class="row items-center q-gutter-x-sm">
            <q-icon name="phone_in_talk" color="primary" size="18px" />
            <span class="text-dark" style="font-size: 12px; font-weight: 500">
              : {{ jobData.job.createdBy?.phoneNumber || '-' }}
            </span>
          </div>
          <div class="row items-center q-gutter-x-sm">
            <q-icon name="mail_outline" color="primary" size="18px" />
            <span class="text-dark" style="font-size: 12px; font-weight: 500">
              : {{ jobData.job.createdBy?.email || '-' }}
            </span>
          </div>
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
              :name="isSummaryDone ? 'chevron_right' : 'lock'"
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
          <q-btn
            unelevated
            color="primary"
            icon="download"
            :label="t('inspector.detail.downloadPdf')"
            @click="pdfReportRef?.exportPdf()"
          />
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

    <!-- House Plan Dialog (all plans for this job, read-only) -->
    <PlanPositionDialog
      v-model="showHousePlanDialog"
      :job-id="jobData?.job?.jobId ?? null"
      readonly
    />

    <!-- Edit Job Dialog: ผู้รับเหมา + รูปแปลน + รูปโครงการ เท่านั้น (สิ่งเดียวที่ inspector แก้ไขได้) -->
    <!-- Style อ้างอิงจาก AdminCreateJobPage.vue (header-container/card-rounded/custom-input/upload-box/submit-footer) -->
    <q-dialog v-model="jobEditDialog.isOpen.value" persistent>
      <q-card class="edit-job-card bg-grey-1">
        <div class="header-container bg-white q-px-md q-py-sm row items-center justify-between">
          <div style="width: 40px"></div>
          <div class="text-subtitle1 text-weight-bold">{{ t('inspector.detail.editDialogTitle') }}</div>
          <q-btn flat round dense icon="close" color="grey-7" v-close-popup />
        </div>

        <q-card-section class="edit-form-body q-pa-md q-gutter-y-md">
          <!-- ข้อมูลผู้รับเหมา -->
          <div class="section">
            <div class="row items-center q-mb-sm text-primary">
              <q-icon name="contacts" size="20px" class="q-mr-sm" />
              <div class="text-subtitle2 text-weight-bold">
                {{ t('inspector.detail.editContractorSection') }}
              </div>
            </div>
            <q-card flat bordered class="q-pa-md bg-white card-rounded">
              <div class="column input-group">
                <q-input
                  v-model="editForm.contractorFullName"
                  dense
                  filled
                  clearable
                  :placeholder="t('inspector.detail.editContractorFullName')"
                  class="custom-input"
                />
                <q-input
                  v-model="editForm.contractorPhoneNumber"
                  dense
                  filled
                  clearable
                  mask="###-###-####"
                  :placeholder="t('inspector.detail.editContractorPhone')"
                  class="custom-input"
                />
                <q-input
                  v-model="editForm.contractorEmail"
                  dense
                  filled
                  clearable
                  :placeholder="t('inspector.detail.editContractorEmail')"
                  class="custom-input"
                />
                <q-input
                  v-model="editForm.contractorCompanyName"
                  dense
                  filled
                  clearable
                  :placeholder="t('inspector.detail.editContractorCompany')"
                  class="custom-input"
                />
              </div>
            </q-card>
          </div>

          <!-- รูปภาพแปลนบ้าน (หลายรูป) -->
          <div class="section">
            <div class="row items-center q-mb-sm text-primary">
              <q-icon name="photo_camera" size="20px" class="q-mr-sm" />
              <div class="text-subtitle2 text-weight-bold">
                {{ t('inspector.detail.editHousePlanSection') }}
              </div>
            </div>
            <div class="row q-col-gutter-md">
              <div v-for="(plan, planIdx) in housePlans" :key="plan.planId ?? plan.url" class="col-6 col-sm-4">
                <q-card flat bordered class="upload-box relative-position">
                  <q-img :src="plan.url" class="full-height full-width" fit="cover" />
                  <q-badge v-if="plan.isUploading" color="primary" floating class="row items-center">
                    <q-spinner size="14px" class="q-mr-xs" />{{ t('adminWork.createJob.uploading') }}
                  </q-badge>
                  <q-btn
                    round
                    dense
                    color="negative"
                    icon="close"
                    class="absolute-top-right q-ma-xs shadow-2"
                    size="sm"
                    :disable="plan.isUploading"
                    @click.stop="removeHousePlan(planIdx)"
                  />
                </q-card>
              </div>
              <div class="col-6 col-sm-4">
                <q-card
                  flat
                  bordered
                  class="upload-box flex flex-center cursor-pointer"
                  @click="triggerHousePlanUpload"
                >
                  <div class="column items-center">
                    <q-icon name="add_a_photo" size="32px" color="grey-5" />
                    <div class="text-caption text-grey-6 q-mt-xs">{{ t('inspector.detail.editChooseImage') }}</div>
                  </div>
                </q-card>
              </div>
            </div>
          </div>

          <!-- รูปภาพโครงการ -->
          <div class="section">
            <div class="row items-center q-mb-sm text-primary">
              <q-icon name="photo" size="20px" class="q-mr-sm" />
              <div class="text-subtitle2 text-weight-bold">
                {{ t('inspector.detail.editProjectImageSection') }}
              </div>
            </div>
            <q-card
              flat
              bordered
              class="upload-box flex flex-center cursor-pointer relative-position"
              @click="triggerEditUpload"
            >
              <div v-if="!editForm.projectImagePreview" class="column items-center">
                <q-icon name="add_a_photo" size="32px" color="grey-5" />
                <div class="text-caption text-grey-6 q-mt-xs">{{ t('inspector.detail.editChooseImage') }}</div>
              </div>
              <template v-else>
                <q-img :src="editForm.projectImagePreview" class="full-height full-width" fit="cover" />
                <div class="image-edit-overlay absolute-full flex flex-center">
                  <div class="row items-center q-gutter-x-xs text-white text-weight-bold">
                    <q-icon name="edit" size="20px" />
                    <span>{{ t('inspector.detail.editImageHint') }}</span>
                  </div>
                </div>
              </template>
            </q-card>
          </div>

          <input
            ref="housePlanFileInput"
            type="file"
            accept="image/*"
            multiple
            style="display: none"
            @change="handleHousePlanFilesChange"
          />

          <input
            ref="editFileInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleEditFileChange"
          />
        </q-card-section>

        <div class="submit-footer row q-gutter-sm">
          <q-btn
            flat
            no-caps
            color="grey-7"
            class="col cancel-btn"
            :label="t('inspector.detail.cancel')"
            v-close-popup
          />
          <q-btn
            unelevated
            no-caps
            color="primary"
            class="col text-weight-bold submit-btn"
            :label="t('inspector.detail.editSave')"
            :loading="isSavingJobEdit"
            @click="saveJobEdit"
          />
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { api } from 'src/boot/axios';
import type { InspectionRound, Defect, InspectionSummaryItem, HousePlan } from 'src/models';
import DefectReport from 'src/components/DefectReport.vue';
import PlanPositionDialog from 'src/components/PlanPositionDialog.vue';
import { createIconSpinner } from 'src/composables/useIconSpinner';
import { useLocalizedField } from 'src/composables/useLocalizedField';
import { buildGoogleMapsUrl, parseCoordinate } from 'src/composables/useMapLocation';
import { defaultPlanNames } from 'src/composables/useDefaultPlanName';
import { useInspectorJobEditDialog } from 'src/composables/useInspectorJobEditDialog';
import { useContractorStore } from 'src/stores/useContractor';
import { useWorkListStore } from 'src/stores/useWorkList';

const jobDetailSpinner = createIconSpinner('search');
const pdfSpinner = createIconSpinner('picture_as_pdf');

const apiUrl = import.meta.env.VITE_API_URL;
const $q = useQuasar();
const { t, locale } = useI18n();
const { pickLocalized } = useLocalizedField();
const route = useRoute();
const router = useRouter();

const loading = ref(true);

const getImageUrl = (url?: string) => {
  if (!url) return '';
  return url.startsWith('http') || url.startsWith('blob:') ? url : `${apiUrl}${url}`;
};

const isDefect = (type?: string) => type === 'DEFECT_INSPECTION' || type === 'Defect' || type === 'ตรวจ Defect';
const isConstruction = (type?: string) => type === 'CONSTRUCTION_INSPECTION' || type === 'Construction' || type === 'ตรวจก่อสร้าง';

// แก้ไขได้แค่ ผู้รับเหมา + รูปแปลน + รูปโครงการ เพราะ inspector ไม่มีสิทธิ์แก้ข้อมูลอื่นของงาน
// (ปุ่มเปิด dialog นี้อยู่บน nav bar ซึ่งเป็นคนละ component — ดู useInspectorJobEditDialog)
const jobEditDialog = useInspectorJobEditDialog();
const contractorStore = useContractorStore();
const workListStore = useWorkListStore();

interface JobEditForm {
  contractorFullName: string;
  contractorPhoneNumber: string;
  contractorEmail: string;
  contractorCompanyName: string;
  projectImagePreview: string | null;
  projectImageFile: File | null;
}

const editForm = ref<JobEditForm>({
  contractorFullName: '',
  contractorPhoneNumber: '',
  contractorEmail: '',
  contractorCompanyName: '',
  projectImagePreview: null,
  projectImageFile: null,
});
const editFileInput = ref<HTMLInputElement | null>(null);
const isSavingJobEdit = ref(false);

// ─── House plan photos (multi-image, backed by house_plans) ───────────────
interface HousePlanItem {
  planId?: number;
  url: string;
  isUploading?: boolean;
}
const housePlans = ref<HousePlanItem[]>([]);
const housePlanFileInput = ref<HTMLInputElement | null>(null);

async function loadHousePlans() {
  const jobId = jobData.value?.job?.jobId;
  if (!jobId) return;
  try {
    const { data } = await api.get<HousePlan[]>(`/inspection-jobs/${jobId}/house-plans`);
    housePlans.value = data.map((p) => ({ planId: p.planId, url: getImageUrl(p.imageUrl) || p.imageUrl }));
  } catch (error) {
    console.error('Failed to load house plans', error);
  }
}

function triggerHousePlanUpload() {
  housePlanFileInput.value?.click();
}

async function handleHousePlanFilesChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files ? Array.from(target.files) : [];
  target.value = '';
  const jobId = jobData.value?.job?.jobId;
  if (!files.length || !jobId) return;

  for (const file of files) {
    const { th: name, en: nameEn } = defaultPlanNames(housePlans.value.length + 1);
    const item: HousePlanItem = { url: URL.createObjectURL(file), isUploading: true };
    housePlans.value.push(item);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('nameEn', nameEn);
      formData.append('orderIndex', String(housePlans.value.length));
      const { data } = await api.post<HousePlan>(`/inspection-jobs/${jobId}/house-plans`, formData);
      item.planId = data.planId;
      item.url = getImageUrl(data.imageUrl) || item.url;
    } catch (error) {
      console.error('Failed to upload house plan', error);
      housePlans.value.splice(housePlans.value.indexOf(item), 1);
      $q.notify({ message: t('inspector.detail.editSaveFailed'), color: 'negative', position: 'top' });
    } finally {
      item.isUploading = false;
    }
  }
}

async function removeHousePlan(index: number) {
  const plan = housePlans.value[index];
  if (!plan) return;
  if (plan.planId) {
    try {
      await api.delete(`/house-plans/${plan.planId}`);
    } catch (error) {
      console.error('Failed to delete house plan', error);
      $q.notify({ message: t('inspector.detail.editSaveFailed'), color: 'negative', position: 'top' });
      return;
    }
  }
  housePlans.value.splice(index, 1);
}

function resetEditForm() {
  const job = jobData.value?.job;
  editForm.value = {
    contractorFullName: job?.contractor?.fullName || '',
    contractorPhoneNumber: job?.contractor?.phoneNumber || '',
    contractorEmail: job?.contractor?.email || '',
    contractorCompanyName: job?.contractor?.companyName || '',
    projectImagePreview: getImageUrl(job?.projectImageUrl) || null,
    projectImageFile: null,
  };
}

watch(
  () => jobEditDialog.isOpen.value,
  (open) => {
    if (open) {
      resetEditForm();
      void loadHousePlans();
    }
  },
);

function triggerEditUpload() {
  editFileInput.value?.click();
}

function handleEditFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  editForm.value.projectImageFile = file;
  editForm.value.projectImagePreview = URL.createObjectURL(file);
  (event.target as HTMLInputElement).value = '';
}

async function saveJobEdit() {
  const job = jobData.value?.job;
  if (!job) return;

  const hasAnyContractorField =
    editForm.value.contractorFullName ||
    editForm.value.contractorPhoneNumber ||
    editForm.value.contractorEmail ||
    editForm.value.contractorCompanyName;
  if (hasAnyContractorField && (!editForm.value.contractorFullName || !editForm.value.contractorPhoneNumber)) {
    $q.notify({
      color: 'warning',
      icon: 'warning',
      message: t('inspector.detail.editContractorNameAndPhoneRequired'),
      position: 'top',
    });
    return;
  }

  isSavingJobEdit.value = true;
  try {
    let finalContractorId = job.contractor?.contractorId || null;
    if (editForm.value.contractorFullName && editForm.value.contractorPhoneNumber) {
      const payload = {
        fullName: editForm.value.contractorFullName,
        phoneNumber: editForm.value.contractorPhoneNumber,
        email: editForm.value.contractorEmail,
        companyName: editForm.value.contractorCompanyName,
      };
      if (finalContractorId) {
        await contractorStore.updateContractor(finalContractorId, payload);
      } else {
        const newContractor = await contractorStore.createContractor(payload);
        finalContractorId = newContractor.contractorId;
      }
    }

    const formData = new FormData();
    if (finalContractorId) formData.append('contractorId', String(finalContractorId));
    if (editForm.value.projectImageFile) formData.append('projectImageUrl', editForm.value.projectImageFile);

    await workListStore.updateJob(job.jobId, formData);
    await fetchJobDetails();

    $q.notify({
      color: 'positive',
      icon: 'check_circle',
      message: t('inspector.detail.editSaveSuccess'),
      position: 'top',
    });
    jobEditDialog.isOpen.value = false;
  } catch (error) {
    console.error('Failed to save job edit:', error);
    $q.notify({
      color: 'negative',
      icon: 'error',
      message: t('inspector.detail.editSaveFailed'),
      position: 'top',
    });
  } finally {
    isSavingJobEdit.value = false;
  }
}

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

const houseImageSrc = computed(
  () =>
    (jobData.value?.job?.projectImageUrl && getImageUrl(jobData.value.job.projectImageUrl)) ||
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600',
);

// House Plan Dialog State
const showHousePlanDialog = ref(false);

function viewHousePlan() {
  showHousePlanDialog.value = true;
}

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

// สีป้ายสถานะให้ตรงกับการ์ดงานในหน้า "งาน" ของ admin (statusBadgeStyles ใน AdminWorkListPage.vue)
const statusBgClass = computed(() => {
  if (isApproved.value) return 'bg-green-1';
  if (isSubmitted.value) return 'bg-orange-1';
  if (isInspected.value) return 'bg-blue-1';
  return 'bg-grey-3';
});
const statusTextColor = computed(() => {
  if (isApproved.value) return 'green-9';
  if (isSubmitted.value) return 'orange-8';
  if (isInspected.value) return 'blue-9';
  return 'grey-8';
});

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

  // ถ้า admin ปักหมุดไว้ ให้ไปที่พิกัดนั้นตรงๆ
  const pinned = parseCoordinate(job.locationCoordinate);
  if (pinned) {
    window.open(buildGoogleMapsUrl(pinned), '_blank');
    return;
  }

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

function getBangkokHour(dateStr: string): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  const timeStr = d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Bangkok' });
  const hour = parseInt(timeStr.split(':')[0] || '', 10);
  return isNaN(hour) ? d.getHours() : hour;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const dateLabel = date.toLocaleDateString(locale.value, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const isMorning = getBangkokHour(dateStr) < 12;
  const period = isMorning
    ? t('inspector.detail.morningPeriod')
    : t('inspector.detail.afternoonPeriod');
  const timeRange = isMorning ? '09:00-12:00' : '13:00-16:00';
  return `${dateLabel} (${timeRange} ${period})`;
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
    void loadHousePlans();
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

.detail-card {
  width: 100%;
  max-width: 480px;
  min-height: 100vh;
  box-sizing: border-box;
}
@media (min-width: 768px) {
  .detail-card {
    max-width: 720px;
  }
}
@media (min-width: 1024px) {
  .detail-card {
    max-width: 1100px;
  }
}
@media (min-width: 1440px) {
  .detail-card {
    max-width: 1280px;
  }
}

.status-badge {
  font-weight: 700;
  font-size: 12.5px;
  padding: 6px 14px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  letter-spacing: 0.2px;
  white-space: nowrap;
}

.type-badge {
  font-weight: 700;
  font-size: 12.5px;
  border-radius: 24px;
}

.report-card {
  border-radius: 8px;
  border-color: #e0e0e0;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 4px 10px rgba(0, 0, 0, 0.04);
}

.house-img-frame {
  position: relative;
  height: 250px;
  border-radius: 12px;
  overflow: hidden;
}
.house-img-bg {
  position: absolute;
  inset: 0;
  filter: blur(20px) brightness(0.65) saturate(1.15);
  transform: scale(1.15);
}
.house-img-fg {
  position: absolute;
  inset: 0;
}
.house-img-fg :deep(.q-img__image) {
  background-color: transparent;
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
  border-radius: 12px;
  padding: 0 18px;
  height: 44px;
  font-weight: 600;
  letter-spacing: 0.1px;
}

/* ─── Edit Job Dialog: style คัดลอกมาจาก AdminCreateJobPage.vue ให้หน้าตาคล้ายกันที่สุด ─── */
.edit-job-card {
  width: 500px;
  max-width: 92vw;
  max-height: 85vh;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
@media (min-width: 768px) {
  .edit-job-card {
    width: 640px;
  }
}
@media (min-width: 1024px) {
  .edit-job-card {
    width: 760px;
  }
}

.edit-form-body {
  overflow-y: auto;
}

.card-rounded {
  border-radius: 16px;
  border-color: #f0f0f0;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.custom-input :deep(.q-field__control) {
  border-radius: 12px;
  background-color: #f8fafc;
}
.custom-input :deep(.q-field__control:before) {
  border-bottom: none;
}

.upload-box {
  background-color: #fcfdfe;
  border: 2px dashed #e2e8f0;
  border-radius: 16px;
  aspect-ratio: 16/9;
  min-height: 140px;
  max-height: 220px;
  transition: all 0.2s ease;
}
.upload-box:hover {
  border-color: var(--q-primary);
  background-color: #f0f7ff;
}

.image-edit-overlay {
  background: rgba(0, 0, 0, 0.45);
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.2s ease;
}
@media (hover: hover) and (pointer: fine) {
  .upload-box:hover .image-edit-overlay {
    opacity: 1;
  }
}
@media (hover: none) {
  .image-edit-overlay {
    opacity: 1;
    background: rgba(0, 0, 0, 0.35);
  }
}

.submit-footer {
  padding: 16px;
  background-color: white;
}

.submit-btn {
  background: #1976d2 !important;
  border-radius: 30px !important;
  height: 54px;
  font-size: 1.05rem;
  box-shadow: 0 4px 15px rgba(25, 118, 210, 0.3) !important;
  transition: all 0.3s ease;
}
.submit-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2) !important;
}
.submit-btn:disabled,
.submit-btn[disabled] {
  background: #bdbdbd !important;
  box-shadow: none !important;
}

.cancel-btn {
  border-radius: 30px !important;
  height: 54px;
  font-size: 1.05rem;
}
</style>
