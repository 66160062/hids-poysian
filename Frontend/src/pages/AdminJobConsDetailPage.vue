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
      <div class="text-weight-bold job-detail-title">{{ t('adminJobs.construction.detailTitle') }}</div>
      <q-btn flat no-caps :label="t('adminJobs.construction.edit')" color="primary" @click="onEdit" />
    </div>

    <div class="detail-content">
      <!-- Project Card -->
      <q-card flat bordered class="q-mb-md card-round overflow-hidden">
        <!-- House Image -->
        <div
          class="house-image-wrapper"
          :class="job.projectImage ? 'cursor-pointer' : ''"
          @click="viewProjectImage"
        >
          <q-img loading="eager" v-if="job.projectImage" :src="job.projectImage" class="house-img" fit="cover" />
          <div v-else class="house-img-placeholder row items-center justify-center bg-grey-2">
            <q-icon name="home" size="64px" color="grey-4" />
          </div>
        </div>

        <q-card-section class="q-pt-md">
          <!-- Project Name & Map button -->
          <div class="row items-start justify-between">
            <div class="col">
              <div class="text-h6 text-primary text-weight-bold">{{ pickLocalized(job.projectName, job.projectNameEn) }}</div>
              <div class="text-caption text-grey-7 q-mt-xs">{{ job.address }}</div>
            </div>
            <q-btn round flat icon="map" color="primary" class="map-btn" @click="openGoogleMaps" />
          </div>

          <!-- Type & Area -->
          <div class="q-mt-sm column q-gutter-y-xs">
            <div class="row items-center">
              <q-icon name="home_work" size="18px" color="primary" class="q-mr-sm" />
              <span class="text-body2 text-grey-8">{{ job.houseType }}</span>
            </div>
            <div class="row items-center">
              <q-icon name="straighten" size="18px" color="primary" class="q-mr-sm" />
              <span class="text-body2 text-grey-8">{{ job.area }} {{ t('adminJobs.construction.sqm') }}</span>
            </div>
            <div v-if="job.appointmentDate" class="row items-center">
              <q-icon name="calendar_today" size="18px" color="primary" class="q-mr-sm" />
              <span class="text-body2 text-grey-8">{{ job.appointmentDate }}</span>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Customer & Coordinator Card (2-column) -->
      <q-card flat bordered class="q-mb-md card-round">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <!-- ลูกค้า -->
            <div class="col-6">
              <div class="row items-center q-mb-xs text-grey-6">
                <q-icon name="person" size="16px" class="q-mr-xs" />
                <span class="text-caption">{{ t('adminJobs.construction.customerLabel') }}</span>
              </div>
              <div class="text-weight-bold text-body2">{{ job.customerName }}</div>
              <div class="text-caption text-primary q-mt-xs">
                <q-icon name="phone" size="13px" class="q-mr-xs" />
                {{ job.customerPhone }}<template v-if="job.customerPhone2"> | {{ job.customerPhone2 }}</template><template v-if="job.customerPhone3"> | {{ job.customerPhone3 }}</template>
              </div>
              <div class="text-caption text-grey-7 q-mt-xs">
                {{ t('adminJobs.construction.emailPrefix') }} {{ job.customerEmail }}<template v-if="job.customerEmail2"> | {{ job.customerEmail2 }}</template><template v-if="job.customerEmail3"> | {{ job.customerEmail3 }}</template>
              </div>
            </div>

            <!-- ผู้ประสานงาน -->
            <div class="col-6">
              <div class="row items-center q-mb-xs text-grey-6">
                <q-icon name="contacts" size="16px" class="q-mr-xs" />
                <span class="text-caption">{{ t('adminJobs.construction.coordinatorLabel') }}</span>
              </div>
              <div class="text-weight-bold text-body2">{{ job.coordName }}</div>
              <div class="text-caption text-primary q-mt-xs">
                <q-icon name="phone" size="13px" class="q-mr-xs" />
                {{ job.coordPhone }}
              </div>
              <div class="text-caption text-grey-7 q-mt-xs">{{ t('adminJobs.construction.emailPrefix') }} {{ job.coordEmail }}</div>
              <div class="text-caption text-grey-7 q-mt-xs">{{ t('adminJobs.construction.lineIdPrefix') }} {{ job.coordLine }}</div>
            </div>
          </div>

          <q-separator class="q-my-md" />

          <!-- House Plan -->
          <div class="row items-center justify-between">
            <div
              v-if="job.housePlanImage"
              class="plan-thumb relative-position cursor-pointer"
              @click="viewPlan"
            >
              <q-img loading="eager" :src="job.housePlanImage" class="plan-img" fit="cover" />
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
              :label="t('adminJobs.construction.viewPlan')"
              icon="grid_view"
              class="plan-btn"
              no-caps
              @click="viewPlan"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- รอบการตรวจ Section -->
      <div class="text-subtitle2 text-weight-bold q-mb-sm">{{ t('adminJobs.construction.roundsTitle') }}</div>
      <div v-if="inspectionRounds.length === 0" class="column items-center q-py-xl bg-white card-round" style="border: 1px solid #e0e0e0;">
        <q-icon name="playlist_add_check_circle" size="56px" color="grey-4" class="q-mb-md" />
        <div class="text-body2 text-grey-6 text-center">
          {{ t('adminJobs.construction.noRoundsYet') }}<br />
          {{ t('adminJobs.construction.startFirstRoundHint') }}
        </div>
        <q-btn
          unelevated
          color="primary"
          icon="add_circle"
          :label="t('adminJobs.construction.createNewRound')"
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
            class="q-pa-md round-card card-round"
          >
            <!-- Card Top Bar -->
            <div class="row items-start justify-between no-wrap q-mb-xs">
              <div>
                <div class="row items-center">
                  <div class="text-weight-bold" style="font-size: 14px; color: #333">
                    {{ t('adminJobs.construction.roundNumberLabel', { number: round.roundNumber }) }}
                  </div>
                  <q-chip
                    dense
                    :color="getRoundStatusColor(round.status)"
                    text-color="dark"
                    class="text-caption text-weight-bold q-px-sm q-ml-md"
                    style="min-height: 24px;"
                  >
                    {{ jobStatusLabel(round.status) }}
                  </q-chip>
                </div>
                <div class="text-grey-7 q-mt-xs" style="font-size: 11px">
                  {{ t('adminJobs.construction.datePrefix') }} {{ round.date }}
                </div>
                <div
                  v-if="round.inspectors && round.inspectors.length"
                  class="text-grey-7"
                  style="font-size: 11px"
                >
                  {{ t('adminJobs.construction.inspectorsPrefix') }} {{ round.inspectors.join(', ') }}
                </div>
              </div>

              <q-btn
                unelevated
                color="positive"
                icon="task_alt"
                :label="approveButtonLabel(round)"
                no-caps
                no-wrap
                dense
                class="q-px-sm"
                style="border-radius: 8px; height: 36px; white-space: nowrap; flex-shrink: 0; min-width: max-content;"
                :disable="round.statusKey !== 'SUBMITTED'"
                :loading="isApprovingRound && selectedRound?.id === round.id"
                @click="onApproveRound(round)"
              />
            </div>

            <!-- Action Button 1: ไปจัดการฟอร์มตรวจเหมือน inspector -->
            <q-btn
              color="primary"
              class="full-width q-mb-sm action-btn"
              no-caps
              align="between"
              style="border-radius: 10px; height: 44px;"
              @click="goToConstructionInspect(round)"
            >
              <span class="text-weight-bold q-ml-sm">
                {{ t('adminJobs.construction.viewInspectionForm') }}
              </span>
              <q-icon name="chevron_right" size="24px" />
            </q-btn>

            <!-- Action Button 2: ดูรายงาน PDF -->
            <q-btn
              color="primary"
              class="full-width action-btn"
              no-caps
              align="between"
              style="border-radius: 10px; height: 44px;"
              :disable="round.statusKey === 'SCHEDULED' || round.statusKey === 'DRAFT'"
              @click="handleViewReport(round)"
            >
              <span class="text-weight-bold q-ml-sm">
                {{ t('adminJobs.construction.viewReportPdf') }}
              </span>
              <q-icon name="chevron_right" size="24px" />
            </q-btn>
          </q-card>
        </div>

        <div class="q-mt-md">
          <div :class="{ 'cursor-not-allowed': isLatestRoundNotCompleted }">
            <q-btn
              unelevated
              color="primary"
              icon="add_circle"
              :label="t('adminJobs.construction.createNewRound')"
              class="full-width create-round-btn"
              no-caps
              :disable="isLatestRoundNotCompleted"
              :style="isLatestRoundNotCompleted ? 'pointer-events: none;' : ''"
              @click="onCreateRound"
            />
            <q-tooltip v-if="isLatestRoundNotCompleted" class="bg-red text-white" anchor="top middle" self="bottom middle">
              {{ t('adminJobs.construction.closeRoundFirst') }}
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
          <q-img loading="eager" :src="currentImageUrl" fit="contain" class="full-height full-width" />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- House Plan Viewer (ปุ่ม "ดูแปลน") -->
    <PlanPositionDialog v-model="showHousePlanDialog" :job-id="jobId" readonly />

    <!-- Create New Round Dialog -->
    <q-dialog v-model="showCreateRoundDialog" transition-show="scale" transition-hide="scale">
      <q-card class="create-round-card q-pa-lg">
        <!-- Dialog Header -->
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6 text-weight-bold text-dark-blue">{{ t('adminJobs.construction.createNewRound') }}</div>
          <q-btn icon="close" flat round dense v-close-popup class="text-grey-6 close-dialog-btn" />
        </div>

        <div class="row q-col-gutter-md q-mb-md">
          <!-- Inspection Date Field -->
          <div class="col-12 col-sm-6">
            <div class="text-caption text-grey-7 text-weight-bold q-mb-xs field-label">{{ t('adminJobs.construction.scheduledDateLabel') }}</div>
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
              <q-popup-proxy v-model="showDatePicker" transition-show="scale" transition-hide="scale">
                <q-date v-model="scheduledDate" mask="YYYY-MM-DD" :options="dateOptions" @update:model-value="showDatePicker = false" />
              </q-popup-proxy>
            </q-input>
          </div>

          <!-- Time Field -->
          <div class="col-12 col-sm-6">
            <div class="text-caption text-grey-7 text-weight-bold q-mb-xs field-label">{{ t('adminJobs.construction.timeSlotLabel') }}</div>
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
              class="custom-toggle"
              :options="[
                { label: t('adminJobs.construction.morningSlot'), value: '09:00:00' },
                { label: t('adminJobs.construction.afternoonSlot'), value: '13:00:00' },
              ]"
            />
          </div>
        </div>

        <!-- Assignment Mode Toggle -->
        <div class="q-mb-sm">
          <div class="text-caption text-grey-7 text-weight-bold q-mb-xs field-label">{{ t('adminJobs.construction.assignmentModeLabel') }}</div>
          <q-btn-toggle
            v-model="assignmentMode"
            spread
            no-caps
            rounded
            unelevated
            toggle-color="primary"
            color="white"
            text-color="grey-8"
            style="border: 1px solid #e0e0e0"
            class="custom-toggle"
            :options="[
              { label: t('adminJobs.construction.assignToTeam'), value: 'team' },
              { label: t('adminJobs.construction.assignToIndividual'), value: 'individual' },
            ]"
          />
        </div>

        <!-- Mode: Team Selection -->
        <div v-if="assignmentMode === 'team'" class="q-mb-md">
          <div class="text-caption text-grey-7 text-weight-bold q-mb-xs field-label">{{ t('adminJobs.construction.selectTeamLabel') }}</div>
          <q-select
            v-model="selectedTeam"
            :options="branchTeamOptions"
            emit-value
            map-options
            borderless
            dense
            :placeholder="t('adminJobs.construction.searchTeamPlaceholder')"
            class="custom-select"
            popup-content-class="custom-dropdown-popup"
          >
            <template v-slot:prepend>
              <q-icon name="group" color="primary" size="20px" class="q-ml-sm" />
            </template>
          </q-select>

          <!-- Additional Inspectors (Optional) -->
          <div class="text-caption text-grey-7 text-weight-bold q-mt-md q-mb-xs field-label">{{ t('adminJobs.construction.additionalInspectorsLabel') }}</div>
          <q-select
            v-model="selectedInspectors"
            :options="filteredInspectorOptions"
            use-input
            use-chips
            multiple
            borderless
            dense
            :placeholder="t('adminJobs.construction.searchInspectorsPlaceholder')"
            class="custom-select"
            popup-content-class="custom-dropdown-popup"
            @filter="filterInspectors"
          >
            <template v-slot:prepend>
              <q-icon name="person_add" color="primary" size="20px" class="q-ml-sm" />
            </template>
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey font-sub">{{ t('adminJobs.construction.startTypingHint') }}</q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <!-- Mode: Individual Selection -->
        <div v-else class="q-mb-md">
          <div class="text-caption text-grey-7 text-weight-bold q-mb-xs field-label">{{ t('adminJobs.construction.selectIndividualInspectorsLabel') }}</div>
          <q-select
            v-model="selectedInspectors"
            :options="filteredInspectorOptions"
            use-input
            use-chips
            multiple
            borderless
            dense
            :placeholder="t('adminJobs.construction.searchInspectorsPlaceholder')"
            class="custom-select"
            popup-content-class="custom-dropdown-popup"
            @filter="filterInspectors"
          >
            <template v-slot:prepend>
              <q-icon name="person" color="primary" size="20px" class="q-ml-sm" />
            </template>
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey font-sub">{{ t('adminJobs.construction.startTypingHint') }}</q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <q-card-actions align="center" class="q-pt-sm q-px-none row q-col-gutter-sm">
          <div class="col-6">
            <q-btn
              outline
              :label="t('adminJobs.construction.cancel')"
              class="full-width cancel-btn"
              no-caps
              v-close-popup
            />
          </div>
          <div class="col-6">
            <q-btn
              unelevated
              :label="t('adminJobs.construction.createRoundSubmit')"
              class="full-width submit-btn"
              no-caps
              :loading="isSubmittingRound"
              @click="submitCreateRound"
            />
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Construction Report Dialog (PDF Full View) -->
    <q-dialog v-model="showReportDialog" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="bg-grey-1 column no-wrap full-height">
        <q-toolbar class="bg-white shadow-1">
          <q-btn flat round dense icon="close" v-close-popup />
          <q-toolbar-title class="text-subtitle1 text-weight-bold">
            {{ t('adminJobs.construction.dailyConstructionReportTitle', { number: selectedRound?.roundNumber ?? '-' }) }}
          </q-toolbar-title>

          <q-btn
            unelevated
            color="primary"
            icon="download"
            :label="t('adminJobs.construction.downloadPdf')"
            no-caps
            class="q-mr-sm"
            @click="constructionPdfRef?.printPdf()"
          />
        </q-toolbar>

        <q-card-section class="col q-pa-md" style="overflow-y: auto;">
          <ConstructionReportPdf ref="constructionPdfRef" v-if="selectedConstructionReport" :report="selectedConstructionReport" />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { api } from 'src/boot/axios';
import { useUserStore } from '../stores/useUser';
import { useTeamStore } from '../stores/useTeam';
import { useConstructionDailyReportStore } from 'src/stores/useConstructionDailyReport';
import type { ExtendedConstructionReport } from 'src/stores/useConstructionDailyReport';
import ConstructionReportPdf from 'src/components/ConstructionReportPdf.vue';
import type { HousePlan } from 'src/models';
import PlanPositionDialog from '../components/PlanPositionDialog.vue';
import { createIconSpinner } from 'src/composables/useIconSpinner';
import { useLocalizedField } from 'src/composables/useLocalizedField';
import { buildGoogleMapsUrl, parseCoordinate } from 'src/composables/useMapLocation';
import { useJobStatus, roundStatusCode, jobStatusCode } from 'src/composables/useJobStatus';

const pdfSpinner = createIconSpinner('picture_as_pdf');
const detailSpinner = createIconSpinner('construction');

const { t, locale } = useI18n();
const { jobStatusLabel } = useJobStatus();
const { pickLocalized } = useLocalizedField();
const constructionPdfRef = ref<InstanceType<typeof ConstructionReportPdf> | null>(null);

const getRoundStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return 'green-2';
    case 'PENDING_APPROVAL':
      return 'orange-2';
    case 'CANCELLED':
      return 'red-2';
    case 'IN_PROGRESS':
    default:
      return 'blue-2';
  }
};

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
  branchId?: number | null;
  projectName: string;
  projectNameEn?: string | null;
  usableArea: number;
  projectImageUrl?: string;
  locationCoordinate?: string | null;
  customer?: {
    fullName?: string;
    phoneNumber?: string;
    phoneNumber2?: string;
    phoneNumber3?: string;
    email?: string;
    email2?: string;
    email3?: string;
    lineId?: string;
  };
  contractor?: { fullName?: string; phoneNumber?: string; email?: string; companyName?: string };
  createdBy?: { fullName?: string; phoneNumber?: string; email?: string; lineId?: string } | null;
  houseType?: { name?: string; nameEn?: string | null };
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

interface TeamMemberChip {
  id: number;
  fullName: string;
}

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const userStore = useUserStore();
const reportStore = useConstructionDailyReportStore();

const jobId = computed(() => Number(route.params.id));

const showReportDialog = ref(false);
const selectedConstructionReport = ref<ExtendedConstructionReport | null>(null);
const isLoadingReport = ref(false);

const isLatestRoundNotCompleted = computed(() => {
  if (!inspectionRounds.value.length) return false;
  const latestRound = inspectionRounds.value[inspectionRounds.value.length - 1];
  if (!latestRound) return false;
  return latestRound?.statusKey !== 'APPROVED' && latestRound?.statusKey !== 'CANCELLED';
});

const isSubmittingRound = ref(false);
const isApprovingRound = ref(false);
const jobData = ref<JobApiResponse | null>(null);
const jobTeamMembers = ref<TeamMemberChip[]>([]);
const selectedRound = ref<RoundView | null>(null);


const approveButtonLabel = (round: RoundView) =>
  round.statusKey === 'APPROVED'
    ? t('adminJobs.construction.approved')
    : t('adminJobs.construction.approve');

const onApproveRound = (round: RoundView) => {
  selectedRound.value = round;
  confirmApproveRound();
};

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
    return `${formattedDate} 09:00-12:00 (${t('adminJobs.construction.morningRoundSuffix')})`;
  } else if (hour === 13) {
    return `${formattedDate} 13:00-16:00 (${t('adminJobs.construction.afternoonRoundSuffix')})`;
  }

  return formattedDate;
};

const mapRoundToView = (round: RoundApiResponse): RoundView => {
  let inspectors: string[] = [];

  if (round.teamMembers && round.teamMembers.length > 0) {
    inspectors = round.teamMembers.map(member => {
      if (member.team?.team_name) {
        return `[${t('adminJobs.construction.teamTag')}] ${member.team.team_name}`;
      } else if (member.inspector?.fullName) {
        return member.inspector.fullName;
      }
      return t('adminJobs.construction.nameNotSpecified');
    });
  } else if (round.teamMember?.inspector?.fullName) {
    inspectors = [round.teamMember.inspector.fullName];
  } else if (jobTeamMembers.value.length > 0) {
    inspectors = jobTeamMembers.value.map((m) => m.fullName);
  } else {
    inspectors = [t('adminJobs.construction.notSpecified')];
  }

  return {
    id: round.roundId,
    roundNumber: round.roundNumber,
    date: formatRoundDate(round.scheduledDate),
    status: roundStatusCode(round.status),
    statusKey: round.status,
    inspectors,
    summaryCompletedAt: round.summaryCompletedAt ?? null,
  };
};

async function fetchJobDetails() {
  const { data } = await api.get<JobApiResponse>(`/inspection-jobs/${jobId.value}`);
  jobData.value = data;
}

const housePlans = ref<HousePlan[]>([]);

async function fetchHousePlans() {
  try {
    const { data } = await api.get<HousePlan[]>(`/inspection-jobs/${jobId.value}/house-plans`);
    housePlans.value = data;
  } catch (error) {
    console.error('Failed to fetch house plans', error);
  }
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
  $q.loading.show({
    spinner: detailSpinner,
    spinnerColor: 'primary',
    spinnerSize: 70,
    backgroundColor: 'white',
  });
  try {
    await Promise.all([
      fetchJobDetails(),
      fetchTeamMembers(),
      fetchHousePlans(),
      teamStore.fetchAllTeams(),
    ]);
    const rounds = await fetchRounds();
    applyRounds(rounds);
    await userStore.fetchUsers().catch((err) => {
      console.warn('Failed to fetch users for inspector picker:', err);
    });
  } catch (error) {
    console.error('Failed to load job detail:', error);
    $q.notify({
      message: t('adminJobs.construction.loadJobDataFailed'),
      color: 'negative',
      icon: 'error',
      position: 'top',
    });
  } finally {
    $q.loading.hide();
  }
}

onMounted(() => {
  void loadPageData();
});

const job = computed(() => {
  const data = jobData.value;
  if (!data) {
    return {
      projectName: '-',
      projectNameEn: '',
      houseType: '-',
      area: '-',
      appointmentDate: '-',
      address: '-',
      customerName: '-',
      customerPhone: '-',
      customerPhone2: '',
      customerPhone3: '',
      customerEmail: '-',
      customerEmail2: '',
      customerEmail3: '',
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
    if (addr.houseNumber) parts.push(t('common.address.houseNumber', { value: addr.houseNumber }));
    if (addr.floor && addr.floor !== '-' && addr.floor !== '') parts.push(t('common.address.floor', { value: addr.floor }));
    if (addr.soi && addr.soi !== '-' && addr.soi !== '') parts.push(t('common.address.soi', { value: addr.soi }));
    if (addr.subDistrict) parts.push(t('common.address.subDistrict', { value: addr.subDistrict }));
    if (addr.district) parts.push(t('common.address.district', { value: addr.district }));
    if (addr.province) parts.push(t('common.address.province', { value: addr.province }));
    if (addr.postalCode) parts.push(`${addr.postalCode}`);

    return parts.length > 0 ? parts.join(' ') : '-';
  };

  const latestRound = inspectionRounds.value[inspectionRounds.value.length - 1];

  return {
    projectName: data.projectName || '-',
    projectNameEn: data.projectNameEn || '',
    houseType: pickLocalized(data.houseType?.name, data.houseType?.nameEn) || '-',
    area: data.usableArea?.toString() || '-',
    appointmentDate: latestRound?.date || (data.createdAt ? new Date(data.createdAt).toLocaleDateString(locale.value) : '-'),
    address: formatAddressStr(data.address),
    customerName: data.customer?.fullName || '-',
    customerPhone: data.customer?.phoneNumber || '-',
    customerPhone2: data.customer?.phoneNumber2 || '',
    customerPhone3: data.customer?.phoneNumber3 || '',
    customerEmail: data.customer?.email || '-',
    customerEmail2: data.customer?.email2 || '',
    customerEmail3: data.customer?.email3 || '',
    coordName: data.contractor?.fullName || data.contractor?.companyName || '-',
    coordPhone: data.contractor?.phoneNumber || '-',
    coordEmail: data.contractor?.email || '-',
    coordLine: data.contractor?.companyName || '-',
    housePlanImage: housePlans.value[0] ? getImageUrl(housePlans.value[0].imageUrl) : null,
    projectImage: getImageUrl(data.projectImageUrl),
    status: latestRound?.status || jobStatusCode(data.status) || data.status || '-',
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

const goToConstructionInspect = (round: { id: number } | null | undefined) => {
  if (!round?.id) return;
  void router.push(`/admin/construction-inspect/${round.id}`);
};

const onEdit = async () => {
  await router.push(`/admin/work/create?editId=${jobId.value}`);
};

const openGoogleMaps = () => {
  if (!jobData.value) return;

  const pinned = parseCoordinate(jobData.value.locationCoordinate);
  if (pinned) {
    window.open(buildGoogleMapsUrl(pinned), '_blank');
    return;
  }

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
      message: t('adminJobs.construction.noAddressForMapSearch'),
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

async function handleViewReport(round: RoundView) {
  isLoadingReport.value = true;
  selectedRound.value = round;
  $q.loading.show({
    spinner: pdfSpinner,
    spinnerColor: 'primary',
    spinnerSize: 70,
    backgroundColor: 'white',
  });
  try {
    const reportData = await reportStore.fetchReportByRound(round.id);
    if (reportData) {
      selectedConstructionReport.value = {
        ...reportData,
        round: {
          roundNumber: round.roundNumber,
          job: jobData.value,
        },
        contractorName:
          jobData.value?.contractor?.fullName ||
          jobData.value?.contractor?.companyName ||
          '-',
        reporterName: round.inspectors?.join(', ') || '-',
      };
      showReportDialog.value = true;
    } else {
      $q.notify({
        message: t('adminJobs.construction.noConstructionReportFound'),
        color: 'warning',
        icon: 'warning',
        position: 'top',
      });
    }
  } catch (err) {
    console.error(err);
    $q.notify({
      message: t('adminJobs.construction.loadReportFailed'),
      color: 'negative',
      icon: 'error',
      position: 'top',
    });
  } finally {
    $q.loading.hide();
    isLoadingReport.value = false;
  }
}

const showHousePlanDialog = ref(false);

const viewPlan = () => {
  if (housePlans.value.length) {
    showHousePlanDialog.value = true;
  } else {
    $q.notify({
      message: t('adminJobs.construction.noHousePlanImage'),
      color: 'warning',
      icon: 'warning',
      position: 'top',
    });
  }
};

function confirmApproveRound() {
  if (!selectedRound.value) return;

  $q.dialog({
    title: t('adminJobs.construction.confirmApproveTitle'),
    message: t('adminJobs.construction.confirmApproveMessage', {
      number: selectedRound.value.roundNumber,
    }),
    ok: { label: t('adminJobs.construction.approve'), color: 'positive' },
    cancel: { label: t('adminJobs.construction.cancel'), flat: true, color: 'grey-7' },
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
    await fetchJobDetails();
    const updatedRound = inspectionRounds.value.find((round) => round.id === selectedRound.value?.id);
    selectedRound.value = updatedRound ?? null;

    $q.notify({
      message: t('adminJobs.construction.approveRoundSuccess'),
      color: 'positive',
      icon: 'verified',
      position: 'top',
    });
  } catch (error) {
    console.error('Failed to approve round:', error);
    $q.notify({
      message: t('adminJobs.construction.approveRoundFailed'),
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

// ทีมที่เลือกได้ต้องอยู่สาขาเดียวกับงาน (งานที่ไม่ระบุสาขาเลือกได้ทุกทีม)
const branchTeamOptions = computed(() => {
  const jobBranchId = jobData.value?.branchId ?? null;
  return teamStore.allTeams
    .filter(
      (team) =>
        jobBranchId === null || team.branchId === jobBranchId || team.team_Id === selectedTeam.value,
    )
    .map((team) => ({ label: team.team_name, value: team.team_Id }));
});

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
        (v) => v.label.toLowerCase().indexOf(needle) > -1
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
  openCreateRoundDialog();
};

const openCreateRoundDialog = () => {
  scheduledDate.value = '';
  timeInput.value = '09:00:00';
  selectedInspectors.value = [];

  const latestRoundRaw = jobData.value?.rounds?.sort((a: { roundId: number }, b: { roundId: number }) => b.roundId - a.roundId)[0];
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
      message: t('adminJobs.construction.selectDateRequired'),
      color: 'warning',
      icon: 'warning',
      position: 'top',
    });
    return;
  }

  if (assignmentMode.value === 'team' && !selectedTeam.value && selectedInspectors.value.length === 0) {
    $q.notify({
      message: t('adminJobs.construction.selectTeamOrInspectorRequired'),
      color: 'warning',
      icon: 'warning',
      position: 'top',
    });
    return;
  }

  if (assignmentMode.value === 'individual' && selectedInspectors.value.length === 0) {
    $q.notify({
      message: t('adminJobs.construction.selectInspectorRequired'),
      color: 'warning',
      icon: 'warning',
      position: 'top',
    });
    return;
  }

  isSubmittingRound.value = true;
  try {
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
      const firstInspector = selectedInspectors.value[0];
      if (firstInspector) {
        roundPayload.inspectorId = firstInspector.value;
      }
    }

    const { data: createdRound } = await api.post<{ roundId: number }>(
      `/daily-reports/${jobId.value}/rounds`,
      roundPayload,
    );

    let extraInspectors = selectedInspectors.value;
    if (
      assignmentMode.value === 'individual' ||
      (!selectedTeam.value && assignmentMode.value === 'team')
    ) {
      extraInspectors = selectedInspectors.value.slice(1);
    }

    for (const inspector of extraInspectors) {
      await api.post('/assignments', {
        jobId: jobId.value,
        inspectorId: inspector.value,
        roundId: createdRound.roundId,
      });
    }

    showCreateRoundDialog.value = false;
    await fetchJobDetails();
    const rounds = await fetchRounds();
    applyRounds(rounds);

    const latestRound = inspectionRounds.value[inspectionRounds.value.length - 1];
    $q.notify({
      message: t('adminJobs.construction.createRoundSuccess', {
        number: latestRound?.roundNumber ?? '',
      }),
      color: 'positive',
      icon: 'check_circle',
      position: 'top',
    });
  } catch (error) {
    console.error('Failed to create round:', error);
    $q.notify({
      message: t('adminJobs.construction.createRoundFailed'),
      color: 'negative',
      icon: 'error',
      position: 'top',
    });
  } finally {
    isSubmittingRound.value = false;
  }
};
</script>

<style scoped>
.header-bar {
  border-bottom: 1px solid #f0f0f0;
}

.job-back-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.job-detail-title {
  font-size: 18px;
}

.detail-content {
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
}

.card-round {
  border-radius: 16px;
}

.round-card {
  border-radius: 16px;
  background-color: #ffffff;
}

.action-btn {
  font-size: 13px;
  border-radius: 10px;
  box-shadow: none;
}

.house-image-wrapper {
  width: 100%;
  height: 200px;
}

.house-img {
  width: 100%;
  height: 100%;
}

.house-img-placeholder {
  width: 100%;
  height: 100%;
}

.map-btn {
  width: 40px;
  height: 40px;
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

.custom-toggle {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.custom-toggle :deep(.q-btn) {
  font-weight: 500;
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

/* Create Round Dialog styling matching the mockup precisely */
.create-round-card {
  border-radius: 24px !important;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.text-dark-blue {
  color: #1E293B;
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
  color: #64748B;
}

/* Custom Outlined Inputs with rounded edges and grey background */
.custom-input, .custom-select {
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  background-color: #F8FAFC;
  padding: 2px 8px;
  transition: all 0.2s ease-in-out;
}

.custom-input:hover, .custom-select:hover {
  border-color: #CBD5E1;
}

.custom-input.q-field--focused, .custom-select.q-field--focused {
  border-color: #3B82F6;
  background-color: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

/* Customize Chips */
.custom-select :deep(.q-chip) {
  background: #E2E8F0;
  color: #1E293B;
  font-weight: 500;
  border-radius: 6px;
}

/* Custom Buttons matching screenshot */
.cancel-btn {
  border: 1px solid #E2E8F0 !important;
  color: #475569 !important;
  border-radius: 50px !important;
  font-weight: 600;
  height: 48px;
  font-size: 14px;
}

.cancel-btn:hover {
  background-color: #F8FAFC !important;
  border-color: #CBD5E1 !important;
}

.submit-btn {
  background: #2563EB !important;
  color: white !important;
  border-radius: 50px !important;
  font-weight: 600;
  height: 48px;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.submit-btn:hover {
  background: #1D4ED8 !important;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
}

/* Style the dropdown menu items */
.custom-dropdown-popup {
  border-radius: 12px !important;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid #E2E8F0;
}
</style>
