<template>
  <q-page class="bg-grey-1">
    <!-- Header -->
    <div class="header-bar bg-white row items-center justify-between q-px-md q-py-sm shadow-1">
      <q-btn flat round icon="chevron_left" color="primary" @click="goBack" />
      <div class="text-subtitle1 text-weight-bold">รายละเอียด</div>
      <q-btn flat no-caps label="แก้ไข" color="primary" @click="onEdit" />
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center q-py-xl absolute-center full-width">
      <q-spinner color="primary" size="3em" />
      <div class="text-grey-6 q-mt-md">กำลังโหลดข้อมูล...</div>
    </div>

    <div v-else class="detail-content q-pa-md">
      <!-- Project Card -->
      <q-card flat bordered class="q-mb-md card-round overflow-hidden">
        <!-- House Image -->
        <div
          class="house-image-wrapper"
          :class="job.projectImage ? 'cursor-pointer' : ''"
          @click="viewProjectImage"
        >
          <q-img v-if="job.projectImage" :src="job.projectImage" class="house-img" fit="cover" />
          <div v-else class="house-img-placeholder row items-center justify-center bg-grey-2">
            <q-icon name="home" size="64px" color="grey-4" />
          </div>
        </div>

        <q-card-section class="q-pt-md">
          <!-- Project Name & Map button -->
          <div class="row items-start justify-between">
            <div class="col">
              <div class="text-h6 text-primary text-weight-bold">{{ job.projectName }}</div>
              <div class="text-caption text-grey-7 q-mt-xs">{{ job.address }}</div>
            </div>
            <q-btn round flat icon="map" color="primary" class="map-btn" />
          </div>

          <!-- Type & Area -->
          <div class="q-mt-sm column q-gutter-y-xs">
            <div class="row items-center">
              <q-icon name="home_work" size="18px" color="primary" class="q-mr-sm" />
              <span class="text-body2 text-grey-8">{{ job.houseType }}</span>
            </div>
            <div class="row items-center">
              <q-icon name="straighten" size="18px" color="primary" class="q-mr-sm" />
              <span class="text-body2 text-grey-8">{{ job.area }} ตร.ม.</span>
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
                <span class="text-caption">ลูกค้า</span>
              </div>
              <div class="text-weight-bold text-body2">{{ job.customerName }}</div>
              <div class="text-caption text-primary q-mt-xs">
                <q-icon name="phone" size="13px" class="q-mr-xs" />
                {{ job.customerPhone }}
              </div>
              <div class="text-caption text-grey-7 q-mt-xs">{{ job.customerEmail }}</div>
            </div>

            <!-- ผู้ประสานงาน -->
            <div class="col-6">
              <div class="row items-center q-mb-xs text-grey-6">
                <q-icon name="contacts" size="16px" class="q-mr-xs" />
                <span class="text-caption">ผู้ประสานงาน</span>
              </div>
              <div class="text-weight-bold text-body2">{{ job.coordName }}</div>
              <div class="text-caption text-primary q-mt-xs">
                <q-icon name="phone" size="13px" class="q-mr-xs" />
                {{ job.coordPhone }}
              </div>
              <div class="text-caption text-grey-7 q-mt-xs">{{ job.coordEmail }}</div>
              <div class="text-caption text-grey-7 q-mt-xs">Line ID: {{ job.coordLine }}</div>
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
              <q-img :src="job.housePlanImage" class="plan-img" fit="cover" />
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
              label="View Plan"
              icon="grid_view"
              class="plan-btn"
              no-caps
              @click="viewPlan"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- รอบการตรวจ Section -->
      <div class="text-subtitle2 text-weight-bold q-mb-sm">รอบการตรวจ</div>
      <q-card flat bordered class="card-round">
        <q-card-section v-if="inspectionRounds.length === 0" class="column items-center q-py-xl">
          <q-icon name="playlist_add_check_circle" size="56px" color="grey-4" class="q-mb-md" />
          <div class="text-body2 text-grey-6 text-center">
            ยังไม่มีการสร้างรอบการตรวจ<br />
            เริ่มต้นด้วยการสร้างรอบการตรวจแรกสำหรับโครงการนี้
          </div>
          <q-btn
            unelevated
            color="primary"
            icon="add_circle"
            label="สร้างรอบการตรวจใหม่"
            class="q-mt-lg create-round-btn"
            no-caps
            @click="onCreateRound"
          />
        </q-card-section>

        <template v-else>
          <q-list separator>
            <q-item
              v-for="round in inspectionRounds"
              :key="round.id"
              clickable
              v-ripple
              class="q-py-md"
            >
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white" size="36px">
                  {{ round.roundNumber }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium"
                  >รอบที่ {{ round.roundNumber }}</q-item-label
                >
                <q-item-label caption class="column q-gutter-y-xs">
                  <span>วันที่: {{ round.date }}</span>
                  <span v-if="round.inspectors && round.inspectors.length" class="text-primary text-caption text-weight-medium">
                    ผู้ตรวจ: {{ round.inspectors.join(', ') }}
                  </span>
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-chip
                  dense
                  :color="getRoundStatusColor(round.status)"
                  text-color="dark"
                  class="text-caption"
                >
                  {{ round.status }}
                </q-chip>
              </q-item-section>
            </q-item>
          </q-list>
          <div class="q-pa-md">
            <q-btn
              unelevated
              color="primary"
              icon="add_circle"
              label="สร้างรอบการตรวจใหม่"
              class="full-width create-round-btn"
              no-caps
              @click="onCreateRound"
            />
          </div>
        </template>
      </q-card>

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
          <q-img :src="currentImageUrl" fit="contain" class="full-height full-width" />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Create New Round Dialog -->
    <q-dialog v-model="showCreateRoundDialog" transition-show="scale" transition-hide="scale">
      <q-card class="create-round-card q-pa-lg">
        <!-- Dialog Header -->
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6 text-weight-bold text-dark-blue">Create New Round</div>
          <q-btn icon="close" flat round dense v-close-popup class="text-grey-6 close-dialog-btn" />
        </div>

        <!-- Inspection Date Field -->
        <div class="q-mb-md">
          <div class="text-caption text-grey-7 text-weight-bold q-mb-xs field-label">Inspection Date</div>
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
              <q-date v-model="scheduledDate" mask="YYYY-MM-DD" @update:model-value="showDatePicker = false">
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="ปิด" color="primary" flat />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-input>
        </div>

        <!-- Build Inspection Team Field -->
        <div class="q-mb-lg">
          <div class="text-caption text-grey-7 text-weight-bold q-mb-xs field-label">Build Inspection Team</div>
          <q-select
            borderless
            dense
            multiple
            use-chips
            use-input
            v-model="selectedInspectors"
            :options="filteredInspectorOptions"
            placeholder="Search and select team members..."
            class="custom-select"
            @filter="filterInspectors"
            popup-content-class="custom-dropdown-popup"
          >
            <template v-slot:prepend>
              <q-icon name="person_search" color="grey-6" size="20px" class="q-ml-sm" />
            </template>
          </q-select>
          <div class="text-caption text-grey-5 q-mt-xs q-pl-sm font-sub">
            Start typing to search for inspectors
          </div>
        </div>

        <!-- Dialog Actions -->
        <q-card-actions class="row q-col-gutter-x-md q-px-none q-pb-none q-mt-lg">
          <div class="col-6">
            <q-btn
              outline
              label="Cancel"
              class="full-width cancel-btn"
              no-caps
              v-close-popup
            />
          </div>
          <div class="col-6">
            <q-btn
              unelevated
              label="Create Round"
              class="full-width submit-btn"
              no-caps
              :loading="isSubmittingRound"
              @click="submitCreateRound"
            />
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { useUserStore } from '../stores/useUser';

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
}

interface RoundApiResponse {
  roundId: number;
  roundNumber: number;
  scheduledDate: string;
  status: string;
  teamMember?: {
    inspector?: { fullName?: string };
  };
}

interface TeamMemberChip {
  id: number;
  fullName: string;
}

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const userStore = useUserStore();


const jobId = computed(() => Number(route.params.id));
const isLoading = ref(true);
const isSubmittingRound = ref(false);
const jobData = ref<JobApiResponse | null>(null);
const jobTeamMembers = ref<TeamMemberChip[]>([]);



const formatRoundDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  });
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
  const inspectorName = round.teamMember?.inspector?.fullName;
  const inspectors = inspectorName
    ? [inspectorName]
    : jobTeamMembers.value.map((m) => m.fullName);

  return {
    id: round.roundId,
    roundNumber: round.roundNumber,
    date: formatRoundDate(round.scheduledDate),
    status: mapRoundStatus(round.status),
    inspectors,
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
    await Promise.all([fetchJobDetails(), fetchTeamMembers()]);
    const rounds = await fetchRounds();
    applyRounds(rounds);
    await userStore.fetchUsers().catch((err) => {
      console.warn('Failed to fetch users for inspector picker:', err);
    });
  } catch (error) {
    console.error('Failed to load job detail:', error);
    $q.notify({
      message: 'ไม่สามารถโหลดข้อมูลงานได้',
      color: 'negative',
      icon: 'error',
      position: 'top',
    });
  } finally {
    isLoading.value = false;
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
    appointmentDate: latestRound?.date || (data.createdAt ? new Date(data.createdAt).toLocaleDateString('th-TH') : '-'),
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
  };
});

// Reactive inspection rounds
const inspectionRounds = ref<{
  id: number;
  roundNumber: number;
  date: string;
  status: string;
  inspectors?: string[];
}[]>([]);

const goBack = async () => {
  await router.push('/admin/work');
};

const onEdit = async () => {
  await router.push(`/admin/work/create?editId=${jobId.value}`);
};

const showImageDialog = ref(false);
const currentImageUrl = ref('');

const viewProjectImage = () => {
  if (job.value.projectImage) {
    currentImageUrl.value = job.value.projectImage;
    showImageDialog.value = true;
  }
};

const viewPlan = () => {
  if (job.value.housePlanImage) {
    currentImageUrl.value = job.value.housePlanImage;
    showImageDialog.value = true;
  } else {
    $q.notify({
      message: 'ไม่มีรูปแปลนบ้านสำหรับโครงการนี้',
      color: 'warning',
      icon: 'warning',
      position: 'top',
    });
  }
};

// Dialog form state
const showCreateRoundDialog = ref(false);
const scheduledDate = ref('');
const showDatePicker = ref(false);
const selectedInspectors = ref<{ label: string; value: number }[]>([]);

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
  const parts = dateStr.replace(/\//g, '-').split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${month}/${day}/${year}`;
};

const onCreateRound = () => {
  scheduledDate.value = '';
  selectedInspectors.value = [];
  showCreateRoundDialog.value = true;
};

const submitCreateRound = async () => {
  if (!scheduledDate.value) {
    $q.notify({
      message: 'กรุณาเลือกวันที่ตรวจ',
      color: 'warning',
      icon: 'warning',
      position: 'top',
    });
    return;
  }

  if (selectedInspectors.value.length === 0) {
    $q.notify({
      message: 'กรุณาเลือกทีมผู้ตรวจอย่างน้อย 1 คน',
      color: 'warning',
      icon: 'warning',
      position: 'top',
    });
    return;
  }

  isSubmittingRound.value = true;
  try {
    const assignedInspectorIds = new Set(jobTeamMembers.value.map((m) => m.id));

    for (const inspector of selectedInspectors.value) {
      if (!assignedInspectorIds.has(inspector.value)) {
        await api.post('/assignments', {
          jobId: jobId.value,
          inspectorId: inspector.value,
        });
        assignedInspectorIds.add(inspector.value);
      }
    }

    const primaryInspector = selectedInspectors.value[0];
    if (!primaryInspector) return;

    await api.post(`/daily-reports/${jobId.value}/rounds`, {
      scheduledDate: scheduledDate.value,
      inspectorId: primaryInspector.value,
      status: 'SCHEDULED',
    });

    await fetchTeamMembers();
    const rounds = await fetchRounds();
    applyRounds(rounds);
    await fetchJobDetails();

    const createdRound = inspectionRounds.value[inspectionRounds.value.length - 1];
    $q.notify({
      message: `สร้างรอบการตรวจที่ ${createdRound?.roundNumber ?? ''} สำเร็จ`,
      color: 'positive',
      icon: 'check_circle',
      position: 'top',
    });

    showCreateRoundDialog.value = false;
  } catch (error) {
    console.error('Failed to create round:', error);
    $q.notify({
      message: 'ไม่สามารถสร้างรอบการตรวจได้ กรุณาลองใหม่อีกครั้ง',
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

.detail-content {
  max-width: 600px;
  margin: 0 auto;
}

.card-round {
  border-radius: 16px;
  border-color: #eeeeee;
}

.house-image-wrapper {
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.house-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.house-img-placeholder {
  width: 100%;
  height: 200px;
}

.map-btn {
  background: #e8f0fe;
  color: var(--q-primary);
  border-radius: 12px;
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
  background: #2563EB !important; /* Vibrant primary blue from the mockup */
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
