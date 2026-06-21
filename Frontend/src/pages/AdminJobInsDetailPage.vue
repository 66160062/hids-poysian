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
          <q-img loading="eager" v-if="job.projectImage" :src="job.projectImage" class="house-img" fit="cover" />
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
              @click="openRoundReview(round)"
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
                <q-icon name="chevron_right" color="grey-5" class="q-mt-xs" />
              </q-item-section>
            </q-item>
          </q-list>
          <div class="q-pa-md">
            <div :class="{ 'cursor-not-allowed': isLatestRoundNotCompleted }">
              <q-btn
                unelevated
                color="primary"
                icon="add_circle"
                label="สร้างรอบการตรวจใหม่"
                class="full-width create-round-btn"
                no-caps
                :disable="isLatestRoundNotCompleted"
                :style="isLatestRoundNotCompleted ? 'pointer-events: none;' : ''"
                @click="onCreateRound"
              />
              <q-tooltip v-if="isLatestRoundNotCompleted" class="bg-red text-white" anchor="top middle" self="bottom middle">
                กรุณาปิดรอบก่อนหน้าให้เสร็จสิ้นก่อน
              </q-tooltip>
            </div>
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
          <q-img loading="eager" :src="currentImageUrl" fit="contain" class="full-height full-width" />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Create New Round Dialog -->
    <q-dialog v-model="showCreateRoundDialog" transition-show="scale" transition-hide="scale">
      <q-card class="create-round-card q-pa-lg">
        <!-- Dialog Header -->
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6 text-weight-bold text-dark-blue">สร้างรอบการตรวจใหม่</div>
          <q-btn icon="close" flat round dense v-close-popup class="text-grey-6 close-dialog-btn" />
        </div>

        <div class="row q-col-gutter-md q-mb-md">
          <!-- Inspection Date Field -->
          <div class="col-12 col-sm-6">
            <div class="text-caption text-grey-7 text-weight-bold q-mb-xs field-label">วันที่นัดตรวจ</div>
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
            <div class="text-caption text-grey-7 text-weight-bold q-mb-xs field-label">รอบการเข้าตรวจ</div>
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
                {label: 'เช้า (9:00-12:00)', value: '09:00:00'},
                {label: 'บ่าย (13:00-16:00)', value: '13:00:00'}
              ]"
            />
          </div>
        </div>

        <!-- Select Team vs Individuals Toggle -->
        <div class="q-mb-md">
          <div class="text-caption text-grey-7 text-weight-bold q-mb-xs field-label">รูปแบบการมอบหมายงาน</div>
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
              {label: 'มอบหมายให้ทีม', value: 'team'},
              {label: 'มอบหมายรายบุคคล', value: 'individual'}
            ]"
            class="q-mb-md border-grey"
            style="border: 1px solid #e0e0e0"
          />
        </div>

        <!-- Select Team -->
        <div v-if="assignmentMode === 'team'" class="q-mb-lg">
          <div class="text-caption text-grey-7 text-weight-bold q-mb-xs field-label">เลือกทีม (Team)</div>
          <q-select
            borderless
            dense
            v-model="selectedTeam"
            :options="teamStore.teamOptions"
            placeholder="ค้นหาและเลือกทีม..."
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
            {{ assignmentMode === 'team' ? 'ผู้ตรวจเพิ่มเติม (ถ้ามี)' : 'เลือกผู้ตรวจ (รายบุคคล)' }}
          </div>
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
              label="ยกเลิก"
              class="full-width cancel-btn"
              no-caps
              v-close-popup
            />
          </div>
          <div class="col-6">
            <q-btn
              unelevated
              label="สร้างรอบการตรวจ"
              class="full-width submit-btn"
              no-caps
              :loading="isSubmittingRound"
              @click="submitCreateRound"
            />
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Review Round / Defect Dialog -->
    <q-dialog v-model="showRoundReviewDialog" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="bg-grey-1 column no-wrap full-height">
        <q-toolbar class="bg-white shadow-1">
          <q-btn flat round dense icon="close" v-close-popup />
          <q-toolbar-title class="text-subtitle1 text-weight-bold">
            ตรวจรอบที่ {{ selectedRound?.roundNumber ?? '-' }}
          </q-toolbar-title>
          <q-btn
            unelevated
            color="positive"
            icon="verified"
            :label="approvalButtonLabel"
            no-caps
            :disable="!canApproveSelectedRound"
            :loading="isApprovingRound"
            @click="confirmApproveRound"
          />
        </q-toolbar>

        <q-card-section class="review-dialog-content col q-pa-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-5">
              <q-card flat bordered class="card-round review-panel">
                <q-card-section class="row items-center justify-between">
                  <div>
                    <div class="text-subtitle2 text-weight-bold">รายการ Defect</div>
                    <div class="text-caption text-grey-6">
                      {{ roundDefects.length }} รายการ
                    </div>
                  </div>
                  <q-chip v-if="selectedRound" dense :color="getRoundStatusColor(selectedRound.status)" text-color="dark">
                    {{ selectedRound.status }}
                  </q-chip>
                </q-card-section>
                <q-separator />

                <div v-if="isLoadingRoundDefects" class="column items-center q-pa-xl">
                  <q-spinner color="primary" size="32px" />
                  <div class="text-caption text-grey-6 q-mt-sm">กำลังโหลด defect...</div>
                </div>

                <q-card-section v-else-if="roundDefectsError" class="column items-center q-py-xl">
                  <q-icon name="error_outline" size="48px" color="negative" />
                  <div class="text-body2 text-negative q-mt-sm text-center">{{ roundDefectsError }}</div>
                  <q-btn
                    flat
                    color="primary"
                    icon="refresh"
                    label="ลองใหม่"
                    class="q-mt-sm"
                    no-caps
                    @click="retryFetchRoundDefects"
                  />
                </q-card-section>

                <q-card-section v-else-if="roundDefects.length === 0" class="column items-center q-py-xl">
                  <q-icon name="fact_check" size="48px" color="grey-4" />
                  <div class="text-body2 text-grey-6 q-mt-sm text-center">ไม่พบรายการ defect ในรอบนี้</div>
                  <div class="text-caption text-grey-5 q-mt-xs text-center">
                    หากเป็นรอบที่รออนุมัติ ให้ตรวจสอบว่า inspector ได้บันทึก defect แล้วหรือไม่
                  </div>
                </q-card-section>

                <div v-else-if="!selectedGroupKey" class="column q-gutter-y-sm q-pa-sm">
                  <InspectionItemCard
                    v-for="item in groupedDefects"
                    :key="item.groupKey"
                    :groupedData="item"
                    @clickCard="selectedGroupKey = item.groupKey"
                  />
                </div>

                <div v-else class="column">
                  <div class="row items-center q-pa-sm bg-grey-2" style="position: sticky; top: 0; z-index: 10;">
                    <q-btn flat round dense icon="arrow_back" color="primary" @click="selectedGroupKey = null" />
                    <div class="text-subtitle2 q-ml-sm text-weight-bold">{{ groupedDefects.find(g => g.groupKey === selectedGroupKey)?.roomName }}</div>
                  </div>
                  <q-list separator>
                    <q-item
                      v-for="defect in paginatedDefects"
                      :key="defect.defectId"
                      clickable
                      v-ripple
                      :active="selectedDefect?.defectId === defect.defectId"
                      active-class="bg-blue-1 text-primary"
                      @click="selectDefect(defect)"
                    >
                      <q-item-section avatar>
                        <q-avatar rounded size="52px" color="grey-2">
                          <q-img loading="eager" v-if="defect.imageUrl" :src="getImageUrl(defect.imageUrl) ?? ''" fit="cover" />
                          <q-icon v-else name="image_not_supported" color="grey-5" />
                        </q-avatar>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium ellipsis">
                          #{{ defect.defectId }} {{ getDefectRoomLabel(defect) }}
                        </q-item-label>
                        <q-item-label caption lines="2">
                          {{ defect.description || '-' }}
                        </q-item-label>
                        <div class="row q-gutter-xs q-mt-xs">
                          <q-chip dense size="sm" :color="defect.severity === 'Major' ? 'red-1' : 'orange-1'" text-color="dark">
                            {{ defect.severity }}
                          </q-chip>
                          <q-chip dense size="sm" color="grey-2" text-color="dark">
                            {{ defect.status }}
                          </q-chip>
                        </div>
                      </q-item-section>
                    </q-item>
                  </q-list>
                  
                  <!-- Pagination -->
                  <div class="row justify-center q-mt-md q-mb-md" v-if="totalPages > 1">
                    <q-pagination
                      v-model="currentPage"
                      :max="totalPages"
                      color="grey-8"
                      active-color="primary"
                      active-text-color="white"
                      boundary-links
                      direction-links
                      gutter="sm"
                    />
                  </div>
                </div>
              </q-card>
            </div>

            <div class="col-12 col-md-7">
              <q-card flat bordered class="card-round review-panel">
                <q-card-section v-if="!selectedDefect" class="column items-center q-py-xl">
                  <q-icon name="edit_note" size="56px" color="grey-4" />
                  <div class="text-body2 text-grey-6 q-mt-sm text-center">
                    {{ roundDefectsError ? 'ยังแก้ไขไม่ได้เพราะโหลด defect ไม่สำเร็จ' : 'เลือกรายการ defect เพื่อแก้ไข' }}
                  </div>
                </q-card-section>

                <template v-else>
                  <q-card-section>
                    <div class="row items-center justify-between q-mb-md">
                      <div>
                        <div class="text-subtitle2 text-weight-bold">
                          แก้ไข Defect #{{ selectedDefect.defectId }}
                        </div>
                        <div class="text-caption text-grey-6">{{ getDefectRoomLabel(selectedDefect) }}</div>
                      </div>
                      <q-btn
                        flat
                        round
                        icon="open_in_full"
                        color="primary"
                        :disable="!selectedDefect.imageUrl"
                        @click="viewDefectImage"
                      />
                    </div>

                    <div class="column q-gutter-md">
                      <q-input
                        outlined
                        dense
                        type="textarea"
                        rows="4"
                        v-model="defectEditForm.description"
                        label="รายละเอียด defect"
                      />

                      <q-select
                        outlined
                        dense
                        emit-value
                        map-options
                        v-model="defectEditForm.severity"
                        :options="severityOptions"
                        label="ความรุนแรง"
                      />

                      <q-select
                        outlined
                        dense
                        emit-value
                        map-options
                        v-model="defectEditForm.status"
                        :options="defectStatusOptions"
                        label="สถานะ"
                      />

                      <q-select
                        outlined
                        dense
                        multiple
                        use-chips
                        emit-value
                        map-options
                        v-model="defectEditForm.subCategoryIds"
                        :options="defectSubCategoryOptions"
                        :loading="isLoadingDefectMaster"
                        label="ประเภทตำหนิ"
                      />

                      <q-file
                        outlined
                        dense
                        clearable
                        accept="image/*"
                        v-model="defectEditForm.file"
                        label="เปลี่ยนรูป defect"
                      >
                        <template #prepend>
                          <q-icon name="image" />
                        </template>
                      </q-file>
                    </div>
                  </q-card-section>

                  <q-separator />

                  <q-card-actions align="right" class="q-pa-md">
                    <q-btn flat color="grey-7" label="ยกเลิก" no-caps @click="resetSelectedDefectForm" />
                    <q-btn
                      unelevated
                      color="primary"
                      icon="save"
                      label="บันทึก"
                      no-caps
                      :loading="isSavingDefect"
                      @click="saveDefectChanges"
                    />
                  </q-card-actions>
                </template>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { useUserStore } from '../stores/useUser';
import { useTeamStore } from '../stores/useTeam';
import type { Defect } from 'src/models';
import InspectionItemCard from '../components/InspectionItemCard.vue';

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
  teamMembers?: {
    inspector?: { fullName?: string };
    team?: { team_name?: string };
  }[];
}

interface RoundView {
  id: number;
  roundNumber: number;
  date: string;
  status: string;
  statusKey: string;
  inspectors?: string[];
}

interface DefectCategoryOption {
  label: string;
  value: number;
}

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
const isLoadingRoundDefects = ref(false);
const isSavingDefect = ref(false);
const isApprovingRound = ref(false);
const isLoadingDefectMaster = ref(false);
const jobData = ref<JobApiResponse | null>(null);
const jobTeamMembers = ref<TeamMemberChip[]>([]);
const roundDefects = ref<AdminDefect[]>([]);
const roundDefectsError = ref('');
const selectedRound = ref<RoundView | null>(null);
const selectedDefect = ref<AdminDefect | null>(null);
const defectSubCategoryOptions = ref<DefectCategoryOption[]>([]);
const showRoundReviewDialog = ref(false);

// Grouping and Pagination State
interface GroupedDefectItem {
  groupKey: string;
  roomName: string;
  roomId: number;
  floorLabel: string;
  roomType: string;
  severity: string;
  totalItems: number;
  passCount: number;
  failCount: number;
  passPercentage: number;
  failPercentage: number;
  defects: AdminDefect[];
}

const getFloorLabel = (d: AdminDefect) => d.floor?.label ?? 'ไม่ระบุชั้น';
const getRoomName = (d: AdminDefect) => d.subRoom?.roomName ?? d.room?.roomName ?? 'ไม่ระบุห้อง';
const getRoomType = (d: AdminDefect) => d.room?.roomName ?? 'ไม่ระบุประเภท';

const groupedDefects = computed<GroupedDefectItem[]>(() => {
  const map = new Map<string, GroupedDefectItem>();

  for (const defect of roundDefects.value) {
    const key = `room__${getRoomName(defect)}__${getFloorLabel(defect)}`;

    if (!map.has(key)) {
      map.set(key, {
        groupKey: key,
        roomName: getRoomName(defect),
        roomId: defect.room?.roomId ?? defect.defectId,
        floorLabel: getFloorLabel(defect),
        roomType: getRoomType(defect),
        severity: defect.severity,
        totalItems: 0,
        passCount: 0,
        failCount: 0,
        passPercentage: 0,
        failPercentage: 0,
        defects: [],
      });
    }

    const group = map.get(key)!;
    group.totalItems++;
    group.defects.push(defect);
    if (defect.status === 'PASS') group.passCount++;
    else group.failCount++;
  }

  for (const g of map.values()) {
    g.passPercentage = g.totalItems > 0 ? Math.round((g.passCount / g.totalItems) * 100) : 0;
    g.failPercentage = 100 - g.passPercentage;
  }

  return [...map.values()];
});

const selectedGroupKey = ref<string | null>(null);

const currentRoomDefects = computed(() => {
  if (!selectedGroupKey.value) return [];
  const group = groupedDefects.value.find(g => g.groupKey === selectedGroupKey.value);
  return group?.defects ?? [];
});

const currentPage = ref(1);
const itemsPerPage = 10;
const totalPages = computed(() => Math.ceil(currentRoomDefects.value.length / itemsPerPage));

const paginatedDefects = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return currentRoomDefects.value.slice(start, start + itemsPerPage);
});

watch(selectedGroupKey, () => {
  currentPage.value = 1;
});

watch(selectedRound, () => {
  selectedGroupKey.value = null;
});

const defectEditForm = ref<{
  description: string;
  severity: string;
  status: string;
  subCategoryIds: number[];
  file: File | null;
}>({
  description: '',
  severity: 'Minor',
  status: 'PENDING_REPAIR',
  subCategoryIds: [],
  file: null,
});

const severityOptions = [
  { label: 'Minor', value: 'Minor' },
  { label: 'Major', value: 'Major' },
];

const defectStatusOptions = [
  { label: 'รอซ่อม', value: 'PENDING_REPAIR' },
  { label: 'ผ่าน', value: 'PASS' },
  { label: 'ปฏิเสธ', value: 'REJECTED' },
];



const formatRoundDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  
  const formattedDate = date.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  });

  const hour = date.getHours();
  if (hour === 9) {
    return `${formattedDate} (รอบเช้า)`;
  } else if (hour === 13) {
    return `${formattedDate} (รอบบ่าย)`;
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
    inspectors = round.teamMembers.map(member => {
      if (member.team?.team_name) {
        return `[ทีม] ${member.team.team_name}`;
      } else if (member.inspector?.fullName) {
        return member.inspector.fullName;
      }
      return 'ไม่ระบุชื่อ';
    });
  } else if (round.teamMember?.inspector?.fullName) {
    // Fallback for old data structure if any
    inspectors = [round.teamMember.inspector.fullName];
  } else if (jobTeamMembers.value.length > 0) {
    inspectors = jobTeamMembers.value.map((m) => m.fullName);
  } else {
    inspectors = ['ไม่ระบุ'];
  }

  return {
    id: round.roundId,
    roundNumber: round.roundNumber,
    date: formatRoundDate(round.scheduledDate),
    status: mapRoundStatus(round.status),
    statusKey: round.status,
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

async function fetchDefectMasterData() {
  if (defectSubCategoryOptions.value.length > 0) return;

  isLoadingDefectMaster.value = true;
  try {
    const { data } = await api.get<
      { subCategoryId: number; name: string; category?: { name?: string } }[]
    >('/defect-sub-categories');
    defectSubCategoryOptions.value = data.map((item) => ({
      value: item.subCategoryId,
      label: item.category?.name ? `${item.category.name} - ${item.name}` : item.name,
    }));
  } catch (error) {
    console.error('Failed to load defect master data:', error);
    $q.notify({
      message: 'โหลดประเภท defect ไม่สำเร็จ',
      color: 'negative',
      icon: 'error',
      position: 'top',
    });
  } finally {
    isLoadingDefectMaster.value = false;
  }
}

async function loadPageData() {
  isLoading.value = true;
  try {
    await Promise.all([
      fetchJobDetails(), 
      fetchTeamMembers(),
      teamStore.fetchTeams() // ดึงข้อมูลทีม
    ]);
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
  statusKey: string;
  inspectors?: string[];
}[]>([]);

const canApproveSelectedRound = computed(() => selectedRound.value?.statusKey === 'SUBMITTED');
const approvalButtonLabel = computed(() =>
  selectedRound.value?.statusKey === 'APPROVED' ? 'อนุมัติแล้ว' : 'อนุมัติ',
);

const goBack = async () => {
  await router.push('/admin/work');
};

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
    addr?.postalCode || ''
  ];
  
  const searchQuery = addressParts.filter(Boolean).join(' ');
  
  if (searchQuery.trim() && (projectName || addr?.province)) {
    const encodedQuery = encodeURIComponent(searchQuery);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
    window.open(mapsUrl, '_blank');
  } else {
    $q.notify({
      message: 'ไม่พบข้อมูลที่อยู่สำหรับค้นหาในแผนที่',
      color: 'warning',
      position: 'top',
      icon: 'warning'
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

const viewDefectImage = () => {
  if (!selectedDefect.value?.imageUrl) return;
  currentImageUrl.value = getImageUrl(selectedDefect.value.imageUrl) ?? selectedDefect.value.imageUrl;
  showImageDialog.value = true;
};

function getDefectRoomLabel(defect: AdminDefect) {
  const floor = defect.floor?.label;
  const room = defect.room?.roomName;
  const subRoom = defect.subRoom?.roomName;
  return [floor, room, subRoom].filter(Boolean).join(' / ') || 'ไม่ระบุห้อง';
}

async function openRoundReview(round: RoundView) {
  selectedRound.value = round;
  selectedDefect.value = null;
  roundDefects.value = [];
  roundDefectsError.value = '';
  showRoundReviewDialog.value = true;

  await Promise.all([fetchRoundDefects(round.id), fetchDefectMasterData()]);
}

async function fetchRoundDefects(roundId: number) {
  isLoadingRoundDefects.value = true;
  roundDefectsError.value = '';
  try {
    const { data } = await api.get<AdminDefect[]>(`/defects/round/${roundId}`);
    roundDefects.value = data;
    if (data.length > 0) {
      selectDefect(data[0]!);
    }
  } catch (error) {
    console.error('Failed to load round defects:', error);
    roundDefects.value = [];
    selectedDefect.value = null;
    roundDefectsError.value = 'โหลดรายการ defect ไม่สำเร็จ';
    $q.notify({
      message: 'โหลดรายการ defect ไม่สำเร็จ',
      color: 'negative',
      icon: 'error',
      position: 'top',
    });
  } finally {
    isLoadingRoundDefects.value = false;
  }
}

function retryFetchRoundDefects() {
  if (!selectedRound.value) return;
  void fetchRoundDefects(selectedRound.value.id);
}

function selectDefect(defect: AdminDefect) {
  selectedDefect.value = defect;
  defectEditForm.value = {
    description: defect.description || '',
    severity: defect.severity || 'Minor',
    status: defect.status || 'PENDING_REPAIR',
    subCategoryIds: defect.subCategories?.map((item) => item.subCategoryId) ?? [],
    file: null,
  };
}

function resetSelectedDefectForm() {
  if (selectedDefect.value) {
    selectDefect(selectedDefect.value);
  }
}

async function saveDefectChanges() {
  if (!selectedDefect.value) return;

  isSavingDefect.value = true;
  try {
    const formData = new FormData();
    formData.append('description', defectEditForm.value.description || '-');
    formData.append('severity', defectEditForm.value.severity);
    formData.append('status', defectEditForm.value.status);
    defectEditForm.value.subCategoryIds.forEach((id) => {
      formData.append('subCategoryIds', String(id));
    });
    if (defectEditForm.value.file) {
      formData.append('file', defectEditForm.value.file);
    }

    await api.patch(`/defects/${selectedDefect.value.defectId}`, formData);

    if (selectedRound.value) {
      await fetchRoundDefects(selectedRound.value.id);
      const updated = roundDefects.value.find((d) => d.defectId === selectedDefect.value?.defectId);
      if (updated) selectDefect(updated);
    }

    $q.notify({
      message: 'บันทึก defect สำเร็จ',
      color: 'positive',
      icon: 'check_circle',
      position: 'top',
    });
  } catch (error) {
    console.error('Failed to update defect:', error);
    $q.notify({
      message: 'บันทึก defect ไม่สำเร็จ',
      color: 'negative',
      icon: 'error',
      position: 'top',
    });
  } finally {
    isSavingDefect.value = false;
  }
}

function confirmApproveRound() {
  if (!selectedRound.value) return;

  $q.dialog({
    title: 'ยืนยันการอนุมัติ',
    message: `ต้องการอนุมัติรอบที่ ${selectedRound.value.roundNumber} ใช่ไหม?`,
    ok: { label: 'อนุมัติ', color: 'positive' },
    cancel: { label: 'ยกเลิก', flat: true, color: 'grey-7' },
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
    const updatedRound = inspectionRounds.value.find((round) => round.id === selectedRound.value?.id);
    selectedRound.value = updatedRound ?? null;

    $q.notify({
      message: 'อนุมัติรอบตรวจเรียบร้อยแล้ว',
      color: 'positive',
      icon: 'verified',
      position: 'top',
    });
  } catch (error) {
    console.error('Failed to approve round:', error);
    $q.notify({
      message: 'อนุมัติไม่สำเร็จ กรุณาตรวจสอบว่าส่งอนุมัติจาก inspector แล้ว',
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
  scheduledDate.value = '';
  timeInput.value = '09:00:00';
  selectedInspectors.value = [];
  selectedTeam.value = null;
  assignmentMode.value = 'team';
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

  if (assignmentMode.value === 'team' && !selectedTeam.value && selectedInspectors.value.length === 0) {
    $q.notify({
      message: 'กรุณาเลือกทีม หรือ ผู้ตรวจอย่างน้อย 1 คน',
      color: 'warning',
      icon: 'warning',
      position: 'top',
    });
    return;
  }

  if (assignmentMode.value === 'individual' && selectedInspectors.value.length === 0) {
    $q.notify({
      message: 'กรุณาเลือกผู้ตรวจอย่างน้อย 1 คน',
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
      scheduledDate: timeInput.value ? `${scheduledDate.value} ${timeInput.value}` : scheduledDate.value,
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

    await api.post(`/daily-reports/${jobId.value}/rounds`, roundPayload);

    // 2. ดึงรอบที่เพิ่งถูกสร้างขึ้นมา (backend สร้างไปที่ล่าสุดแล้ว)
    // สำหรับคนที่เหลือ ให้ยิงเข้า /assignments เพื่อผูกกับรอบนั้น (ซึ่ง Backend ผูกกับรอบล่าสุดให้)
    let extraInspectors = selectedInspectors.value;
    if (assignmentMode.value === 'individual' || (!selectedTeam.value && assignmentMode.value === 'team')) {
      // ตัดคนแรกออก เพราะถูกส่งไปสร้างรอบแล้ว
      extraInspectors = selectedInspectors.value.slice(1);
    }

    for (const inspector of extraInspectors) {
      await api.post('/assignments', {
        jobId: jobId.value,
        inspectorId: inspector.value,
      });
    }

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

.review-dialog-content {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  overflow-y: auto;
}

.review-panel {
  min-height: 280px;
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
