<template>
  <q-page class="bg-grey-1">
    <!-- Header -->
    <div class="header-bar bg-white row items-center justify-between q-px-md q-py-sm">
      <q-icon
        name="arrow_back_ios_new"
        color="primary"
        size="24px"
        class="cursor-pointer job-back-icon"
        @click="goBack"
      />
      <div class="text-weight-bold job-detail-title">
        {{ t('adminJobs.inspection.detailTitle') }}
      </div>
      <q-btn flat no-caps :label="t('adminJobs.inspection.edit')" color="primary" @click="onEdit" />
    </div>

    <!-- Loading State: แสดงผ่าน $q.loading แบบเต็มจอ (ดู onMounted) เว้นพื้นที่ไว้กันเลย์เอาต์กระโดด -->
    <div v-if="isLoading" style="min-height: 60vh"></div>

    <div v-else class="detail-content bg-white modern-font q-px-lg q-pb-md">
      <!-- House Image -->
      <div
        class="house-image-wrapper"
        :class="job.projectImage ? 'cursor-pointer' : ''"
        @click="viewProjectImage"
      >
        <q-img
          loading="eager"
          v-if="job.projectImage"
          :src="job.projectImage"
          class="house-img"
          fit="cover"
        />
        <div v-else class="house-img-placeholder row items-center justify-center bg-grey-2">
          <q-icon name="home" size="64px" color="grey-4" />
        </div>
      </div>

      <!-- Project Name & Status -->
      <div class="row items-center justify-between no-wrap q-mb-xs q-mt-sm">
        <div class="text-primary text-weight-bold ellipsis" style="font-size: 20px">
          {{ job.projectName }}
        </div>
        <q-badge
          :color="getRoundStatusColor(job.status)"
          text-color="dark"
          style="border-radius: 99px; font-weight: 500; font-size: 10px; padding: 4px 10px"
        >
          {{ job.status }}
        </q-badge>
      </div>

      <div class="text-grey-6 q-mb-md" style="font-size: 10px; font-weight: 300; line-height: 1.4">
        {{ job.address }}
      </div>

      <!-- Type & Area & Map -->
      <div class="row items-center justify-between no-wrap q-mb-sm">
        <div class="column q-gutter-y-sm">
          <div class="row items-center q-gutter-x-sm">
            <q-icon name="home" color="primary" size="18px" />
            <span class="text-dark" style="font-size: 12px; font-weight: 500">
              : {{ job.houseType }}
            </span>
          </div>
          <div class="row items-center q-gutter-x-sm">
            <q-icon name="open_in_full" color="primary" size="18px" />
            <span class="text-dark" style="font-size: 12px; font-weight: 500">
              : {{ job.area }} {{ t('adminJobs.inspection.sqm') }}
            </span>
          </div>
          <div
            v-if="job.appointmentDate && job.appointmentDate !== '-'"
            class="row items-center q-gutter-x-sm"
          >
            <q-icon name="calendar_today" color="primary" size="18px" />
            <span class="text-dark" style="font-size: 12px; font-weight: 500">
              : {{ job.appointmentDate }}
            </span>
          </div>
        </div>
        <q-btn round outline color="primary" icon="location_on" size="md" @click="openGoogleMaps" />
      </div>

      <q-separator color="primary" style="opacity: 0.5; height: 1px" class="q-my-md" />

      <!-- Customer Contact -->
      <div class="row items-center justify-between no-wrap q-mb-sm">
        <div class="column q-gutter-y-sm">
          <div class="row items-center q-gutter-x-sm text-grey-6">
            <q-icon name="person" size="14px" />
            <span class="text-caption">{{ t('adminJobs.inspection.customerLabel') }}</span>
          </div>
          <div class="text-primary text-weight-bold" style="font-size: 14px">
            {{ job.customerName }}
          </div>
          <div class="row items-center q-gutter-x-sm">
            <q-icon name="phone_in_talk" color="primary" size="18px" />
            <span class="text-dark" style="font-size: 12px; font-weight: 500">
              : {{ job.customerPhone }}
            </span>
          </div>
          <div class="row items-center q-gutter-x-sm">
            <q-icon name="mail_outline" color="primary" size="18px" />
            <span class="text-dark" style="font-size: 12px; font-weight: 500">
              : {{ job.customerEmail }}
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
          :href="`tel:${job.customerPhone}`"
          :disable="!job.customerPhone || job.customerPhone === '-'"
        />
      </div>

      <q-separator color="primary" style="opacity: 0.5; height: 1px" class="q-my-md" />

      <!-- Coordinator Contact -->
      <div class="column q-gutter-y-sm q-mb-sm">
        <div class="row items-center q-gutter-x-sm text-grey-6">
          <q-icon name="contacts" size="14px" />
          <span class="text-caption">{{ t('adminJobs.inspection.coordinatorLabel') }}</span>
        </div>
        <div class="text-primary text-weight-bold" style="font-size: 14px">
          {{ job.coordName }}
        </div>
        <div class="row items-center q-gutter-x-sm">
          <q-icon name="phone_in_talk" color="primary" size="18px" />
          <span class="text-dark" style="font-size: 12px; font-weight: 500">
            : {{ job.coordPhone }}
          </span>
        </div>
        <div class="row items-center q-gutter-x-sm">
          <q-icon name="mail_outline" color="primary" size="18px" />
          <span class="text-dark" style="font-size: 12px; font-weight: 500">
            : {{ job.coordEmail }}
          </span>
        </div>
        <div class="row items-center q-gutter-x-sm">
          <q-icon name="chat" color="primary" size="18px" />
          <span class="text-dark" style="font-size: 12px; font-weight: 500">
            : {{ t('adminJobs.inspection.lineIdPrefix') }} {{ job.coordLine }}
          </span>
        </div>
      </div>

      <q-separator color="primary" style="opacity: 0.5; height: 1px" class="q-my-md" />

      <!-- Share Links Card -->
      <q-card flat bordered class="q-mb-md report-card">
        <q-card-section>
          <div class="row items-center q-mb-md">
            <q-icon name="share" color="primary" size="22px" class="q-mr-sm" />
            <div class="text-subtitle2 text-weight-bold">
              {{ t('adminJobs.inspection.shareLinksTitle') }}
            </div>
          </div>

          <div class="q-mb-md">
            <div class="text-caption text-grey-7 q-mb-xs">
              {{ t('adminJobs.inspection.forCustomerLabel') }}
            </div>
            <div class="row items-stretch no-wrap share-link-row">
              <q-input
                :model-value="customerShareUrl"
                readonly
                dense
                outlined
                class="col share-link-input"
                bg-color="white"
              />
              <q-btn
                unelevated
                color="primary"
                icon="content_copy"
                :label="t('adminJobs.inspection.copyLink')"
                no-caps
                class="share-copy-btn"
                :loading="isCopyingCustomer"
                @click="copyShareLink('customer')"
              />
            </div>
            <div v-if="customerLinkExpiresAt" class="text-caption text-grey-5 q-mt-xs">
              {{ t('adminJobs.inspection.customerLinkExpiryNote') }}
            </div>
          </div>

          <div>
            <div class="row items-center justify-between q-mb-xs">
              <div class="text-caption text-grey-7">
                {{ t('adminJobs.inspection.forContractorLabel') }}
              </div>
              <q-chip
                dense
                size="sm"
                :color="contractorShareEnabled ? 'green-2' : 'grey-3'"
                text-color="dark"
              >
                {{
                  contractorShareEnabled
                    ? t('adminJobs.inspection.enabled')
                    : t('adminJobs.inspection.disabled')
                }}
              </q-chip>
            </div>
            <div class="row items-stretch no-wrap share-link-row">
              <q-input
                :model-value="contractorShareUrl"
                readonly
                dense
                outlined
                class="col share-link-input"
                bg-color="white"
                :placeholder="
                  contractorShareEnabled ? '' : t('adminJobs.inspection.contractorLinkPlaceholder')
                "
              />
              <q-btn
                unelevated
                color="primary"
                icon="content_copy"
                :label="t('adminJobs.inspection.copyLink')"
                no-caps
                class="share-copy-btn"
                :loading="isCopyingContractor"
                @click="copyShareLink('contractor')"
              />
            </div>
            <div class="row items-center justify-between q-mt-xs">
              <div class="text-caption text-grey-5">
                {{ t('adminJobs.inspection.contractorLinkNote') }}
              </div>
              <q-btn
                v-if="contractorShareEnabled"
                flat
                dense
                color="negative"
                icon="link_off"
                :label="t('adminJobs.inspection.revokeLink')"
                no-caps
                class="revoke-link-btn"
                :loading="isRevokingContractor"
                @click="confirmRevokeContractorLink"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Contractor Progress Section -->
      <div v-if="inspectionRounds.length > 0 && job.status === 'เสร็จสิ้น'" class="q-mb-lg">
        <div class="row items-center justify-between q-mb-sm">
          <div class="text-subtitle2 text-weight-bold">
            {{ t('adminJobs.inspection.contractorProgressTitle') }}
          </div>
          <div
            class="text-caption text-weight-bold"
            :class="job.contractorProgress >= 50 ? 'text-positive' : 'text-orange'"
          >
            {{ Math.round(job.contractorProgress) }}%
          </div>
        </div>
        <q-linear-progress
          rounded
          size="10px"
          :value="job.contractorProgress / 100"
          :color="job.contractorProgress >= 50 ? 'positive' : 'orange'"
          class="q-mb-xs"
        />
        <div class="text-caption text-grey-6 text-right">
          {{
            job.contractorProgress >= 50
              ? t('adminJobs.inspection.readyForRound2')
              : t('adminJobs.inspection.waitFor50Percent')
          }}
        </div>
      </div>

      <!-- รอบการตรวจ Section -->
      <div class="text-subtitle2 text-weight-bold q-mb-sm">
        {{ t('adminJobs.inspection.roundsTitle') }}
      </div>
      <div v-if="inspectionRounds.length === 0" class="column items-center q-py-xl report-card">
        <q-icon name="playlist_add_check_circle" size="56px" color="grey-4" class="q-mb-md" />
        <div class="text-body2 text-grey-6 text-center">
          {{ t('adminJobs.inspection.noRoundsYet') }}<br />
          {{ t('adminJobs.inspection.startFirstRoundHint') }}
        </div>
        <q-btn
          unelevated
          color="primary"
          icon="add_circle"
          :label="t('adminJobs.inspection.createNewRound')"
          class="q-mt-lg create-round-btn"
          no-caps
          @click="onCreateRound"
        />
      </div>

      <template v-else>
        <div class="column q-gutter-y-md">
          <q-card
            v-for="round in inspectionRounds"
            :id="`round-card-${round.id}`"
            :key="round.id"
            flat
            bordered
            class="q-pa-md round-card"
          >
            <div class="row items-start justify-between no-wrap q-mb-xs">
              <div>
                <div class="row items-center">
                  <div class="text-weight-bold" style="font-size: 14px; color: #333">
                    {{ t('adminJobs.inspection.roundNumberLabel', { number: round.roundNumber }) }}
                  </div>
                  <q-chip
                    dense
                    :color="getRoundStatusColor(round.status)"
                    text-color="dark"
                    class="text-caption q-my-none q-mr-none q-ml-md"
                  >
                    {{ round.status }}
                  </q-chip>
                </div>
                <div class="text-grey-7 q-mt-xs" style="font-size: 11px">
                  {{ t('adminJobs.inspection.datePrefix') }} {{ round.date }}
                </div>
                <div
                  v-if="round.inspectors && round.inspectors.length"
                  class="text-grey-7"
                  style="font-size: 11px"
                >
                  {{ t('adminJobs.inspection.inspectorsPrefix') }} {{ round.inspectors.join(', ') }}
                </div>
              </div>

              <q-btn
                unelevated
                color="positive"
                icon="verified"
                :label="
                  round.statusKey === 'APPROVED'
                    ? t('adminJobs.inspection.approved')
                    : t('adminJobs.inspection.approve')
                "
                no-caps
                dense
                class="q-px-md"
                style="border-radius: 8px"
                :disable="round.statusKey !== 'SUBMITTED'"
                :loading="isApprovingRound && selectedRound?.id === round.id"
                @click="onApproveRound(round)"
              />
            </div>

            <q-btn
              color="primary"
              class="full-width q-mb-sm action-btn"
              no-caps
              align="between"
              @click="goToRoundDefects(round)"
            >
              <span class="text-weight-bold q-ml-sm">
                {{ t('adminJobs.inspection.viewDefectData') }}
              </span>
              <q-icon name="chevron_right" size="24px" />
            </q-btn>

            <q-btn
              color="primary"
              class="full-width q-mb-sm action-btn"
              no-caps
              align="between"
              @click="goToSummaryReport(round)"
            >
              <span class="text-weight-bold q-ml-sm">
                {{ t('adminJobs.inspection.viewSummaryReport') }}
              </span>
              <q-icon name="chevron_right" size="24px" />
            </q-btn>

            <q-btn
              color="primary"
              class="full-width action-btn"
              no-caps
              align="between"
              :disable="!round.summaryCompletedAt || isGeneratingPdf"
              @click="handleViewReport(round)"
            >
              <span class="text-weight-bold q-ml-sm">
                {{ t('adminJobs.inspection.viewReportPdf') }}
              </span>
              <q-icon name="visibility" size="24px" />
            </q-btn>
          </q-card>
        </div>
        <div class="q-mt-md">
          <div :class="{ 'cursor-not-allowed': isLatestRoundNotCompleted }">
            <q-btn
              unelevated
              color="primary"
              icon="add_circle"
              :label="t('adminJobs.inspection.createNewRound')"
              class="full-width create-round-btn"
              no-caps
              :disable="isLatestRoundNotCompleted"
              :style="isLatestRoundNotCompleted ? 'pointer-events: none;' : ''"
              @click="onCreateRound"
            />
            <q-tooltip
              v-if="isLatestRoundNotCompleted"
              class="bg-red text-white"
              anchor="top middle"
              self="bottom middle"
            >
              {{ t('adminJobs.inspection.closeRoundFirst') }}
            </q-tooltip>
          </div>
        </div>
      </template>

      <!-- Bottom spacing -->
      <div style="height: 32px" />
    </div>

    <!-- Image Viewer Dialog -->
    <q-dialog v-model="showImageDialog" maximized transition-show="fade" transition-hide="fade">
      <q-card class="bg-black text-white column">
        <q-toolbar class="bg-transparent absolute-top z-top">
          <q-space />
          <q-btn dense flat round icon="close" v-close-popup size="lg" color="white" />
        </q-toolbar>
        <q-card-section class="col flex flex-center q-pa-none">
          <q-img
            loading="eager"
            :src="currentImageUrl"
            fit="contain"
            class="full-height full-width"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Create New Round Dialog -->
    <q-dialog v-model="showCreateRoundDialog" transition-show="scale" transition-hide="scale">
      <q-card class="create-round-card q-pa-lg">
        <!-- Dialog Header -->
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6 text-weight-bold text-dark-blue">
            {{ t('adminJobs.inspection.createNewRound') }}
          </div>
          <q-btn icon="close" flat round dense v-close-popup class="text-grey-6 close-dialog-btn" />
        </div>

        <div class="row q-col-gutter-md q-mb-md">
          <!-- Inspection Date Field -->
          <div class="col-12 col-sm-6">
            <div class="text-caption text-grey-7 text-weight-bold q-mb-xs field-label">
              {{ t('adminJobs.inspection.scheduledDateLabel') }}
            </div>
            <q-input
              borderless
              dense
              readonly
              :model-value="scheduledDate ? formatDateDisplay(scheduledDate) : ''"
              placeholder="mm/dd/yyyy"
              class="custom-input cursor-pointer"
              @click="showDatePicker = true"
            >
              <template v-slot:prepend>
                <q-icon name="calendar_month" color="primary" size="20px" class="q-ml-sm" />
              </template>
              <q-popup-proxy
                v-model="showDatePicker"
                transition-show="scale"
                transition-hide="scale"
              >
                <q-date
                  v-model="scheduledDate"
                  mask="YYYY-MM-DD"
                  :options="dateOptions"
                  @update:model-value="showDatePicker = false"
                />
              </q-popup-proxy>
            </q-input>
          </div>

          <!-- Time Field -->
          <div class="col-12 col-sm-6">
            <div class="text-caption text-grey-7 text-weight-bold q-mb-xs field-label">
              {{ t('adminJobs.inspection.timeSlotLabel') }}
            </div>
            <q-btn-toggle
              v-model="timeInput"
              spread
              no-caps
              rounded
              unelevated
              toggle-color="primary"
              color="white"
              text-color="grey-8"
              style="border: 1px solid #e0e0e0"
              :options="[
                { label: t('adminJobs.inspection.morningSlot'), value: '09:00:00' },
                { label: t('adminJobs.inspection.afternoonSlot'), value: '13:00:00' },
              ]"
            />
          </div>
        </div>

        <!-- Select Team vs Individuals Toggle -->
        <div class="q-mb-md">
          <div class="text-caption text-grey-7 text-weight-bold q-mb-xs field-label">
            {{ t('adminJobs.inspection.assignmentModeLabel') }}
          </div>
          <q-btn-toggle
            v-model="assignmentMode"
            spread
            no-caps
            rounded
            unelevated
            toggle-color="primary"
            color="white"
            text-color="grey-8"
            :options="[
              { label: t('adminJobs.inspection.assignToTeam'), value: 'team' },
              { label: t('adminJobs.inspection.assignToIndividual'), value: 'individual' },
            ]"
            class="q-mb-md border-grey"
            style="border: 1px solid #e0e0e0"
          />
        </div>

        <!-- Select Team -->
        <div v-if="assignmentMode === 'team'" class="q-mb-lg">
          <div class="text-caption text-grey-7 text-weight-bold q-mb-xs field-label">
            {{ t('adminJobs.inspection.selectTeamLabel') }}
          </div>
          <q-select
            borderless
            dense
            v-model="selectedTeam"
            :options="teamStore.teamOptions"
            :placeholder="t('adminJobs.inspection.searchTeamPlaceholder')"
            class="custom-select"
            popup-content-class="custom-dropdown-popup"
            emit-value
            map-options
          >
            <template v-slot:prepend>
              <q-icon name="groups" color="grey-6" size="20px" class="q-ml-sm" />
            </template>
          </q-select>
        </div>

        <!-- Build Inspection Team Field (Always show for additional inspectors, or primary if individual mode) -->
        <div class="q-mb-lg">
          <div class="text-caption text-grey-7 text-weight-bold q-mb-xs field-label">
            {{
              assignmentMode === 'team'
                ? t('adminJobs.inspection.additionalInspectorsLabel')
                : t('adminJobs.inspection.selectIndividualInspectorsLabel')
            }}
          </div>
          <q-select
            borderless
            dense
            multiple
            use-chips
            use-input
            v-model="selectedInspectors"
            :options="filteredInspectorOptions"
            :placeholder="t('adminJobs.inspection.searchInspectorsPlaceholder')"
            class="custom-select"
            @filter="filterInspectors"
            popup-content-class="custom-dropdown-popup"
          >
            <template v-slot:prepend>
              <q-icon name="person_search" color="grey-6" size="20px" class="q-ml-sm" />
            </template>
          </q-select>
          <div class="text-caption text-grey-5 q-mt-xs q-pl-sm font-sub">
            {{ t('adminJobs.inspection.startTypingHint') }}
          </div>
        </div>

        <!-- Dialog Actions -->
        <q-card-actions class="row q-col-gutter-x-md q-px-none q-pb-none q-mt-lg">
          <div class="col-6">
            <q-btn
              outline
              :label="t('adminJobs.inspection.cancel')"
              class="full-width cancel-btn"
              no-caps
              v-close-popup
            />
          </div>
          <div class="col-6">
            <q-btn
              unelevated
              :label="t('adminJobs.inspection.createRoundSubmit')"
              class="full-width submit-btn"
              no-caps
              :loading="isSubmittingRound"
              @click="submitCreateRound"
            />
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- PDF Report View Dialog -->
    <q-dialog
      v-model="showReportDialog"
      maximized
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card class="bg-grey-3 column">
        <q-toolbar class="bg-white text-dark shadow-2 z-top">
          <q-btn flat round dense icon="close" v-close-popup />
          <q-toolbar-title class="text-weight-bold" style="font-size: 16px">
            {{ t('adminJobs.inspection.reportPreviewTitle') }}
          </q-toolbar-title>
          <q-btn
            unelevated
            color="primary"
            icon="download"
            :label="t('adminJobs.inspection.downloadPdf')"
            @click="pdfReportRef?.exportPdf()"
          />
        </q-toolbar>

        <q-card-section class="col q-pa-none" style="overflow-y: auto; overflow-x: hidden">
          <DefectReport
            v-if="pdfDataLoaded && pdfRound"
            ref="pdfReportRef"
            :round="pdfRound"
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
import { computed, ref, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { api } from 'src/boot/axios';
import { useUserStore } from '../stores/useUser';
import { useTeamStore } from '../stores/useTeam';
import type { Defect, InspectionSummaryItem, InspectionRound } from 'src/models';
import DefectReport from '../components/DefectReport.vue';

const { t, locale } = useI18n();
const API_BASE_URL = import.meta.env.VITE_API_URL as string;

const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};

interface AddressEntity {
  houseNumber?: string;
  floor?: string;
  soi?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
}

interface JobApiResponse {
  jobId: number;
  projectName: string;
  usableArea: number;
  housePlanUrl?: string;
  projectImageUrl?: string;
  customer?: { fullName?: string; phoneNumber?: string; email?: string; lineId?: string };
  contractor?: { fullName?: string; phoneNumber?: string; email?: string; companyName?: string };
  houseType?: { name?: string };
  address?: AddressEntity;
  createdAt?: string;
  status?: string;
  contractorProgress?: number;
  isReadyForRound2?: boolean;
  rounds?: {
    roundId: number;
    teamMembers?: {
      team?: { team_Id?: number };
    }[];
  }[];
}

interface RoundApiResponse {
  roundId: number;
  roundNumber: number;
  scheduledDate: string;
  status: string;
  teamMember?: {
    inspector?: { fullName?: string };
  };
  teamMembers?: {
    inspector?: { fullName?: string };
    team?: { team_name?: string };
  }[];
  summaryCompletedAt?: string | null;
}

interface RoundView {
  id: number;
  roundNumber: number;
  date: string;
  status: string;
  statusKey: string;
  inspectors?: string[];
  summaryCompletedAt?: string | null | undefined;
}

interface ShareLinkResponse {
  token: string;
  url: string;
  role: string;
  expires_at: number | null;
  admin_controlled?: boolean;
  contractor_share_enabled?: boolean;
}

interface ContractorShareStatusResponse {
  contractor_share_enabled: boolean;
  token: string | null;
}

type ShareLinkRole = 'customer' | 'contractor';

type AdminDefect = Defect & {
  inspector?: { id?: number; fullName?: string };
  round?: { roundId?: number };
};

interface TeamMemberChip {
  id: number;
  fullName: string;
}

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const userStore = useUserStore();

const jobId = computed(() => Number(route.params.id));

const isLatestRoundNotCompleted = computed(() => {
  if (!inspectionRounds.value.length) return false;
  const latestRound = inspectionRounds.value[inspectionRounds.value.length - 1];
  if (!latestRound) return false;
  return latestRound?.statusKey !== 'APPROVED' && latestRound?.statusKey !== 'CANCELLED';
});
const isLoading = ref(true);
const isSubmittingRound = ref(false);
const isApprovingRound = ref(false);
const jobData = ref<JobApiResponse | null>(null);
const jobTeamMembers = ref<TeamMemberChip[]>([]);
const selectedRound = ref<RoundView | null>(null);

const showReportDialog = ref(false);
const pdfDataLoaded = ref(false);
const pdfDefects = ref<AdminDefect[]>([]);
const pdfSummaryItems = ref<InspectionSummaryItem[]>([]);
const pdfReportRef = ref<InstanceType<typeof DefectReport> | null>(null);
const isGeneratingPdf = ref(false);
const pdfRound = ref<InspectionRound | null>(null);

const customerShareUrl = ref('');
const contractorShareUrl = ref('');
const customerLinkExpiresAt = ref<number | null>(null);
const contractorShareEnabled = ref(false);
const isCopyingCustomer = ref(false);
const isCopyingContractor = ref(false);
const isRevokingContractor = ref(false);

function buildShareUrl(role: ShareLinkRole, token: string) {
  const base = window.location.origin.replace(/\/$/, '');
  const path = role === 'customer' ? `/view/prj-${jobId.value}` : `/fix/prj-${jobId.value}-con`;
  return `${base}/#${path}?token=${encodeURIComponent(token)}`;
}

async function fetchShareLink(role: ShareLinkRole): Promise<ShareLinkResponse> {
  const { data } = await api.get<ShareLinkResponse>('/auth/generate-link', {
    params: { project_id: jobId.value, role },
  });
  return data;
}

async function fetchContractorShareStatus() {
  const { data } = await api.get<ContractorShareStatusResponse>(
    `/inspection-jobs/${jobId.value}/contractor-share`,
  );
  contractorShareEnabled.value = data.contractor_share_enabled;
  contractorShareUrl.value =
    data.contractor_share_enabled && data.token ? buildShareUrl('contractor', data.token) : '';
}

async function loadShareLinks() {
  try {
    const customerLink = await fetchShareLink('customer');
    customerShareUrl.value = buildShareUrl('customer', customerLink.token);
    customerLinkExpiresAt.value = customerLink.expires_at;
    await fetchContractorShareStatus();
  } catch (error) {
    console.error('Failed to load share links:', error);
  }
}

async function copyShareLink(role: ShareLinkRole) {
  const loadingRef = role === 'customer' ? isCopyingCustomer : isCopyingContractor;
  loadingRef.value = true;

  try {
    const link = await fetchShareLink(role);
    const url = buildShareUrl(role, link.token);

    if (role === 'customer') {
      customerShareUrl.value = url;
      customerLinkExpiresAt.value = link.expires_at;
    } else {
      contractorShareUrl.value = url;
      contractorShareEnabled.value = link.contractor_share_enabled ?? true;
    }

    await navigator.clipboard.writeText(url);

    $q.notify({
      message:
        role === 'customer'
          ? t('adminJobs.inspection.copyLinkCustomerSuccess')
          : t('adminJobs.inspection.copyLinkContractorSuccess'),
      color: 'positive',
      icon: 'content_copy',
      position: 'top',
    });
  } catch (error) {
    console.error('Failed to copy share link:', error);
    $q.notify({
      message: t('adminJobs.inspection.copyLinkFailed'),
      color: 'negative',
      icon: 'error',
      position: 'top',
    });
  } finally {
    loadingRef.value = false;
  }
}

function confirmRevokeContractorLink() {
  $q.dialog({
    title: t('adminJobs.inspection.revokeContractorLinkTitle'),
    message: t('adminJobs.inspection.revokeContractorLinkMessage'),
    ok: { label: t('adminJobs.inspection.revokeLink'), color: 'negative' },
    cancel: { label: t('adminJobs.inspection.cancel'), flat: true, color: 'grey-7' },
    persistent: true,
  }).onOk(() => {
    void revokeContractorLink();
  });
}

async function revokeContractorLink() {
  isRevokingContractor.value = true;
  try {
    await api.patch(`/inspection-jobs/${jobId.value}/contractor-share/revoke`);
    contractorShareEnabled.value = false;
    contractorShareUrl.value = '';

    $q.notify({
      message: t('adminJobs.inspection.revokeContractorLinkSuccess'),
      color: 'positive',
      icon: 'link_off',
      position: 'top',
    });
  } catch (error) {
    console.error('Failed to revoke contractor link:', error);
    $q.notify({
      message: t('adminJobs.inspection.revokeContractorLinkFailed'),
      color: 'negative',
      icon: 'error',
      position: 'top',
    });
  } finally {
    isRevokingContractor.value = false;
  }
}

// Grouping and Pagination State

const formatRoundDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  const formattedDate = date.toLocaleDateString(locale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  });

  const hour = date.getHours();
  if (hour === 9) {
    return `${formattedDate} (${t('adminJobs.inspection.morningRoundSuffix')})`;
  } else if (hour === 13) {
    return `${formattedDate} (${t('adminJobs.inspection.afternoonRoundSuffix')})`;
  }

  return formattedDate;
};

const mapRoundStatus = (status: string) => {
  switch (status) {
    case 'COMPLETED':
    case 'APPROVED':
      return 'เสร็จสิ้น';
    case 'SUBMITTED':
      return 'รออนุมัติ';
    case 'SCHEDULED':
    default:
      return 'กำลังดำเนินการ';
  }
};

const mapRoundToView = (round: RoundApiResponse) => {
  let inspectors: string[] = [];

  if (round.teamMembers && round.teamMembers.length > 0) {
    inspectors = round.teamMembers.map((member) => {
      if (member.team?.team_name) {
        return `[${t('adminJobs.inspection.teamTag')}] ${member.team.team_name}`;
      } else if (member.inspector?.fullName) {
        return member.inspector.fullName;
      }
      return t('adminJobs.inspection.nameNotSpecified');
    });
  } else if (round.teamMember?.inspector?.fullName) {
    // Fallback for old data structure if any
    inspectors = [round.teamMember.inspector.fullName];
  } else if (jobTeamMembers.value.length > 0) {
    inspectors = jobTeamMembers.value.map((m) => m.fullName);
  } else {
    inspectors = [t('adminJobs.inspection.notSpecified')];
  }

  return {
    id: round.roundId,
    roundNumber: round.roundNumber,
    date: formatRoundDate(round.scheduledDate),
    status: mapRoundStatus(round.status),
    statusKey: round.status,
    inspectors,
    summaryCompletedAt: round.summaryCompletedAt,
  };
};

async function fetchJobDetails() {
  const { data } = await api.get<JobApiResponse>(`/inspection-jobs/${jobId.value}`);
  jobData.value = data;
}

async function fetchTeamMembers() {
  const { data } = await api.get<TeamMemberChip[]>(`/assignments/job/${jobId.value}`);
  jobTeamMembers.value = data;
}

async function fetchRounds() {
  const { data } = await api.get<RoundApiResponse[]>(`/daily-reports/${jobId.value}/rounds`);
  return data;
}

function applyRounds(rounds: RoundApiResponse[]) {
  inspectionRounds.value = rounds.map(mapRoundToView);
}

async function loadPageData() {
  isLoading.value = true;
  try {
    await Promise.all([
      fetchJobDetails(),
      fetchTeamMembers(),
      teamStore.fetchTeams(), // ดึงข้อมูลทีม
    ]);
    const rounds = await fetchRounds();
    applyRounds(rounds);

    // สองอย่างนี้ไม่ได้ใช้ตอน render การ์ดรอบตรวจ (users = ตัวเลือกผู้ตรวจใน dialog สร้างรอบ,
    // share links = การ์ดด้านล่าง) ปล่อยโหลดเบื้องหลังเพื่อไม่ให้ค้าง spinner ตอนกดย้อนกลับเข้าหน้านี้
    if (userStore.users.length === 0) {
      void userStore.fetchUsers().catch((err) => {
        console.warn('Failed to fetch users for inspector picker:', err);
      });
    }
    void loadShareLinks();
  } catch (error) {
    console.error('Failed to load job detail:', error);
    $q.notify({
      message: t('adminJobs.inspection.loadJobDataFailed'),
      color: 'negative',
      icon: 'error',
      position: 'top',
    });
  } finally {
    isLoading.value = false;
  }
}

// เข้ามาจากการแจ้งเตือน "รออนุมัติ" (มี roundId ใน query) — เลื่อนไปที่การ์ดของรอบนั้นให้เลย
async function scrollToNotifiedRound() {
  const targetRoundId = Number(route.query.roundId);
  if (!targetRoundId) return;

  await nextTick();
  document
    .getElementById(`round-card-${targetRoundId}`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

onMounted(() => {
  $q.loading.show();
  void loadPageData().finally(() => {
    $q.loading.hide();
    void scrollToNotifiedRound();
  });
});

const job = computed(() => {
  const data = jobData.value;
  if (!data) {
    return {
      projectName: '-',
      houseType: '-',
      area: '-',
      appointmentDate: '-',
      address: '-',
      customerName: '-',
      customerPhone: '-',
      customerEmail: '-',
      coordName: '-',
      coordPhone: '-',
      coordEmail: '-',
      coordLine: '-',
      housePlanImage: null as string | null,
      projectImage: null as string | null,
      status: '-',
      statusKey: '',
      contractorProgress: 0,
      isReadyForRound2: false,
    };
  }

  const formatAddressStr = (addr?: AddressEntity) => {
    if (!addr) return '-';

    const parts = [];
    if (addr.houseNumber) parts.push(`เลขที่ ${addr.houseNumber}`);
    if (addr.floor && addr.floor !== '-' && addr.floor !== '') parts.push(`ชั้น ${addr.floor}`);
    if (addr.soi && addr.soi !== '-' && addr.soi !== '') parts.push(`ซอย ${addr.soi}`);
    if (addr.subDistrict) parts.push(`ต.${addr.subDistrict}`);
    if (addr.district) parts.push(`อ.${addr.district}`);
    if (addr.province) parts.push(`จ.${addr.province}`);
    if (addr.postalCode) parts.push(`${addr.postalCode}`);

    return parts.length > 0 ? parts.join(' ') : '-';
  };

  const latestRound = inspectionRounds.value[inspectionRounds.value.length - 1];

  return {
    projectName: data.projectName || '-',
    houseType: data.houseType?.name || '-',
    area: data.usableArea?.toString() || '-',
    appointmentDate:
      latestRound?.date ||
      (data.createdAt ? new Date(data.createdAt).toLocaleDateString(locale.value) : '-'),
    address: formatAddressStr(data.address),
    customerName: data.customer?.fullName || '-',
    customerPhone: data.customer?.phoneNumber || '-',
    customerEmail: data.customer?.email || '-',
    coordName: data.contractor?.fullName || '-',
    coordPhone: data.contractor?.phoneNumber || '-',
    coordEmail: data.contractor?.email || '-',
    coordLine: data.contractor?.companyName || '-',
    housePlanImage: getImageUrl(data.housePlanUrl),
    projectImage: getImageUrl(data.projectImageUrl),
    status: latestRound?.status || data.status || '-',
    statusKey: (latestRound?.status || data.status) === 'Active' ? 'in_progress' : 'waiting',
    contractorProgress: data.contractorProgress || 0,
    isReadyForRound2: data.isReadyForRound2 || false,
  };
});

// Reactive inspection rounds
const inspectionRounds = ref<RoundView[]>([]);

const goBack = async () => {
  await router.push('/admin/work');
};

const goToSummaryReport = (round: { id: number } | null | undefined) => {
  if (!round?.id) return;
  void router.push(`/admin/report/${round.id}`);
};

// ใช้หน้าตรวจชุดเดียวกับ inspector แต่คนละ route tree (ดู useInspectionRoutes)
// แอดมินยังเพิ่ม/ลบ/แก้ defect ได้จนกว่าจะกดอนุมัติ — inspector หมดสิทธิ์ตั้งแต่ยื่นอนุมัติ
const goToRoundDefects = (round: RoundView) => {
  void router.push(`/admin/inspection/${round.id}`);
};

const onApproveRound = (round: RoundView) => {
  selectedRound.value = round;
  confirmApproveRound();
};

async function handleViewReport(round: RoundView) {
  if (!round.summaryCompletedAt) {
    $q.notify({ type: 'warning', message: t('adminJobs.inspection.summarizeReportFirst') });
    return;
  }
  isGeneratingPdf.value = true;
  $q.loading.show();
  try {
    const [roundRes, defectsRes, summaryRes] = await Promise.all([
      api.get(`/inspection-rounds/${round.id}`),
      api.get(`/defects/round/${round.id}`),
      api.get(`/inspection-summary-items/round/${round.id}`),
    ]);
    pdfRound.value = roundRes.data;
    pdfDefects.value = defectsRes.data;
    pdfSummaryItems.value = summaryRes.data;
    pdfDataLoaded.value = true;
    showReportDialog.value = true;
  } catch (error) {
    console.error('Error generating report:', error);
    $q.notify({ color: 'negative', message: t('adminJobs.inspection.fetchReportDataFailed') });
  } finally {
    $q.loading.hide();
    isGeneratingPdf.value = false;
  }
}

const onEdit = async () => {
  await router.push(`/admin/work/create?editId=${jobId.value}`);
};

const openGoogleMaps = () => {
  if (!jobData.value) return;
  const projectName = jobData.value.projectName || '';
  const addr = jobData.value.address;

  const addressParts = [
    projectName,
    addr?.houseNumber ? `เลขที่ ${addr.houseNumber}` : '',
    addr?.floor && addr.floor !== '-' ? `ชั้น ${addr.floor}` : '',
    addr?.soi && addr.soi !== '-' ? `ซอย ${addr.soi}` : '',
    addr?.subDistrict ? `ต.${addr.subDistrict}` : '',
    addr?.district ? `อ.${addr.district}` : '',
    addr?.province ? `จ.${addr.province}` : '',
    addr?.postalCode || '',
  ];

  const searchQuery = addressParts.filter(Boolean).join(' ');

  if (searchQuery.trim() && (projectName || addr?.province)) {
    const encodedQuery = encodeURIComponent(searchQuery);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
    window.open(mapsUrl, '_blank');
  } else {
    $q.notify({
      message: t('adminJobs.inspection.noAddressForMapSearch'),
      color: 'warning',
      position: 'top',
      icon: 'warning',
    });
  }
};

const showImageDialog = ref(false);
const currentImageUrl = ref('');

const viewProjectImage = () => {
  if (job.value.projectImage) {
    currentImageUrl.value = job.value.projectImage;
    showImageDialog.value = true;
  }
};

function confirmApproveRound() {
  if (!selectedRound.value) return;

  $q.dialog({
    title: t('adminJobs.inspection.confirmApproveTitle'),
    message: t('adminJobs.inspection.confirmApproveMessage', {
      number: selectedRound.value.roundNumber,
    }),
    ok: { label: t('adminJobs.inspection.approve'), color: 'positive' },
    cancel: { label: t('adminJobs.inspection.cancel'), flat: true, color: 'grey-7' },
    persistent: true,
  }).onOk(() => {
    void approveSelectedRound();
  });
}

async function approveSelectedRound() {
  if (!selectedRound.value) return;

  isApprovingRound.value = true;
  try {
    await api.patch(`/inspection-rounds/${selectedRound.value.id}/approve`);
    const rounds = await fetchRounds();
    applyRounds(rounds);
    await fetchJobDetails(); // Fetch job details to update job status
    const updatedRound = inspectionRounds.value.find(
      (round) => round.id === selectedRound.value?.id,
    );
    selectedRound.value = updatedRound ?? null;

    $q.notify({
      message: t('adminJobs.inspection.approveRoundSuccess'),
      color: 'positive',
      icon: 'verified',
      position: 'top',
    });
  } catch (error) {
    console.error('Failed to approve round:', error);
    $q.notify({
      message: t('adminJobs.inspection.approveRoundFailed'),
      color: 'negative',
      icon: 'error',
      position: 'top',
    });
  } finally {
    isApprovingRound.value = false;
  }
}

// Dialog form state
const showCreateRoundDialog = ref(false);
const scheduledDate = ref('');
const showDatePicker = ref(false);
const timeInput = ref('09:00:00');

const dateOptions = (dateStr: string) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}/${month}/${day}`;
  return dateStr >= todayStr;
};
const assignmentMode = ref<'team' | 'individual'>('team');
const selectedTeam = ref<number | null>(null);
const selectedInspectors = ref<{ label: string; value: number }[]>([]);

const teamStore = useTeamStore();

// Predefined inspector options list
const inspectorOptions = computed(() => {
  const storeInspectors = userStore.users
    .filter((u) => u.role === 'inspector' || String(u.role).toLowerCase() === 'inspector')
    .map((u) => ({
      label: u.fullName,
      value: u.id,
    }));

  if (storeInspectors.length > 0) {
    return storeInspectors;
  }

  const assignedInspectors = jobTeamMembers.value.map((m) => ({
    label: m.fullName,
    value: m.id,
  }));

  return assignedInspectors;
});

const filteredInspectorOptions = ref<{ label: string; value: number }[]>([]);

const filterInspectors = (val: string, update: (callback: () => void) => void) => {
  update(() => {
    const needle = val.toLowerCase().trim();
    if (!needle) {
      filteredInspectorOptions.value = inspectorOptions.value;
    } else {
      filteredInspectorOptions.value = inspectorOptions.value.filter(
        (v) => v.label.toLowerCase().indexOf(needle) > -1,
      );
    }
  });
};

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  const [datePart = '', timePart = ''] = dateStr.split(' ');
  if (!datePart) return dateStr;
  const parts = datePart.replace(/\//g, '-').split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${month}/${day}/${year}` + (timePart ? ` ${timePart}` : '');
};

const onCreateRound = () => {
  if (job.value.status === 'เสร็จสิ้น' && job.value.contractorProgress < 50) {
    $q.dialog({
      title: t('adminJobs.inspection.confirmCreateRoundTitle'),
      message: t('adminJobs.inspection.confirmCreateRoundMessage', {
        percent: Math.round(job.value.contractorProgress),
      }),
      cancel: { label: t('adminJobs.inspection.cancel'), flat: true, color: 'grey-7' },
      ok: { label: t('adminJobs.inspection.confirmCreate'), color: 'primary' },
      persistent: true,
    }).onOk(() => {
      openCreateRoundDialog();
    });
  } else {
    openCreateRoundDialog();
  }
};

const openCreateRoundDialog = () => {
  scheduledDate.value = '';
  timeInput.value = '09:00:00';
  selectedInspectors.value = [];

  // Try to pre-fill from latest round if it exists
  const latestRoundRaw = jobData.value?.rounds?.sort(
    (a: { roundId: number }, b: { roundId: number }) => b.roundId - a.roundId,
  )[0];
  if (latestRoundRaw && latestRoundRaw.teamMembers && latestRoundRaw.teamMembers.length > 0) {
    const teamMember = latestRoundRaw.teamMembers[0];
    if (teamMember && teamMember.team && teamMember.team.team_Id) {
      assignmentMode.value = 'team';
      selectedTeam.value = teamMember.team.team_Id;
    } else {
      assignmentMode.value = 'individual';
      selectedTeam.value = null;
    }
  } else {
    assignmentMode.value = 'team';
    selectedTeam.value = null;
  }

  showCreateRoundDialog.value = true;
};

const submitCreateRound = async () => {
  if (!scheduledDate.value) {
    $q.notify({
      message: t('adminJobs.inspection.selectDateRequired'),
      color: 'warning',
      icon: 'warning',
      position: 'top',
    });
    return;
  }

  if (
    assignmentMode.value === 'team' &&
    !selectedTeam.value &&
    selectedInspectors.value.length === 0
  ) {
    $q.notify({
      message: t('adminJobs.inspection.selectTeamOrInspectorRequired'),
      color: 'warning',
      icon: 'warning',
      position: 'top',
    });
    return;
  }

  if (assignmentMode.value === 'individual' && selectedInspectors.value.length === 0) {
    $q.notify({
      message: t('adminJobs.inspection.selectInspectorRequired'),
      color: 'warning',
      icon: 'warning',
      position: 'top',
    });
    return;
  }

  isSubmittingRound.value = true;
  try {
    // 1. สร้างรอบการตรวจ โดยอิงจากโหมด
    interface RoundPayload {
      scheduledDate: string;
      status: string;
      teamId?: number;
      inspectorId?: number;
    }

    const roundPayload: RoundPayload = {
      scheduledDate: timeInput.value
        ? `${scheduledDate.value} ${timeInput.value}`
        : scheduledDate.value,
      status: 'SCHEDULED',
    };

    if (assignmentMode.value === 'team' && selectedTeam.value) {
      roundPayload.teamId = selectedTeam.value;
    } else if (selectedInspectors.value.length > 0) {
      // ถ้าไม่มีทีมให้เอาคนแรกเป็นตัวแทนสร้างรอบ
      const firstInspector = selectedInspectors.value[0];
      if (firstInspector) {
        roundPayload.inspectorId = firstInspector.value;
      }
    }

    const { data: createdRound } = await api.post(
      `/daily-reports/${jobId.value}/rounds`,
      roundPayload,
    );

    // 2. สำหรับคนที่เหลือ ให้ยิงเข้า /assignments พร้อม roundId ของรอบที่เพิ่งสร้าง
    // เพื่อผูกสิทธิ์เฉพาะรอบนี้ ไม่ปลดล็อกทั้ง job
    let extraInspectors = selectedInspectors.value;
    if (
      assignmentMode.value === 'individual' ||
      (!selectedTeam.value && assignmentMode.value === 'team')
    ) {
      // ตัดคนแรกออก เพราะถูกส่งไปสร้างรอบแล้ว
      extraInspectors = selectedInspectors.value.slice(1);
    }

    for (const inspector of extraInspectors) {
      await api.post('/assignments', {
        jobId: jobId.value,
        inspectorId: inspector.value,
        roundId: createdRound.roundId,
      });
    }

    await fetchTeamMembers();
    const rounds = await fetchRounds();
    applyRounds(rounds);
    await fetchJobDetails();

    const latestRound = inspectionRounds.value[inspectionRounds.value.length - 1];
    $q.notify({
      message: t('adminJobs.inspection.createRoundSuccess', {
        number: latestRound?.roundNumber ?? '',
      }),
      color: 'positive',
      icon: 'check_circle',
      position: 'top',
    });

    showCreateRoundDialog.value = false;
  } catch (error) {
    console.error('Failed to create round:', error);
    $q.notify({
      message: t('adminJobs.inspection.createRoundFailed'),
      color: 'negative',
      icon: 'error',
      position: 'top',
    });
  } finally {
    isSubmittingRound.value = false;
  }
};

function getRoundStatusColor(status: string) {
  switch (status) {
    case 'กำลังดำเนินการ':
      return 'orange-2';
    case 'รออนุมัติ':
      return 'blue-2';
    case 'เสร็จสิ้น':
      return 'green-2';
    default:
      return 'grey-3';
  }
}
</script>

<style scoped>
.header-bar {
  position: sticky;
  top: 0;
  z-index: 100;
}

.job-back-icon {
  position: relative;
  z-index: 2;
}

.job-detail-title {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  pointer-events: none;
  font-size: 21px;
  letter-spacing: 0.01em;
}

.detail-content {
  max-width: 800px;
  min-height: 100vh;
  margin: 0 auto;
  box-sizing: border-box;
}

@media (max-width: 1023px) {
  .detail-content {
    max-width: 430px;
  }
}

.review-dialog-content {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  overflow-y: auto;
}

.review-panel {
  min-height: 280px;
}

.modern-font {
  font-family:
    'Inter',
    'Noto Sans Thai',
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
}

.report-card {
  border-radius: 8px;
  border-color: #e0e0e0;
}

.round-card {
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

.house-image-wrapper {
  width: 100%;
  height: 250px;
  margin-top: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.house-img {
  width: 100%;
  height: 250px;
  object-fit: cover;
}

.house-img-placeholder {
  width: 100%;
  height: 250px;
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

.create-round-btn {
  border-radius: 50px;
  height: 48px;
  font-size: 15px;
}

.revoke-link-btn {
  font-size: 12px;
  font-weight: 600;
}

.share-link-row {
  gap: 10px;
}

.share-copy-btn {
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  padding: 0 14px;
  flex-shrink: 0;
}

.share-link-input :deep(.q-field__control) {
  border-radius: 10px;
}

.share-link-input :deep(input) {
  font-size: 12px;
  color: #475569;
}

/* Create Round Dialog styling matching the mockup precisely */
.create-round-card {
  border-radius: 24px !important;
  max-width: 420px;
  width: 100%;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.text-dark-blue {
  color: #1e293b;
  font-family: 'Outfit', 'Inter', sans-serif;
  font-size: 20px;
  font-weight: 700;
}

.close-dialog-btn {
  font-size: 11px;
}

.field-label {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #475569;
  letter-spacing: 0.2px;
}

.font-sub {
  font-size: 11px;
  color: #64748b;
}

/* Custom Outlined Inputs with rounded edges and grey background */
.custom-input,
.custom-select {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background-color: #f8fafc;
  padding: 2px 8px;
  transition: all 0.2s ease-in-out;
}

.custom-input:hover,
.custom-select:hover {
  border-color: #cbd5e1;
}

.custom-input.q-field--focused,
.custom-select.q-field--focused {
  border-color: #3b82f6;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

/* Customize Chips */
.custom-select :deep(.q-chip) {
  background: #e2e8f0;
  color: #1e293b;
  font-weight: 500;
  border-radius: 6px;
}

/* Custom Buttons matching screenshot */
.cancel-btn {
  border: 1px solid #e2e8f0 !important;
  color: #475569 !important;
  border-radius: 50px !important;
  font-weight: 600;
  height: 48px;
  font-size: 14px;
}

.cancel-btn:hover {
  background-color: #f8fafc !important;
  border-color: #cbd5e1 !important;
}

.submit-btn {
  background: #2563eb !important; /* Vibrant primary blue from the mockup */
  color: white !important;
  border-radius: 50px !important;
  font-weight: 600;
  height: 48px;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.submit-btn:hover {
  background: #1d4ed8 !important;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
}

/* Style the dropdown menu items */
.custom-dropdown-popup {
  border-radius: 12px !important;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid #e2e8f0;
}
</style>
