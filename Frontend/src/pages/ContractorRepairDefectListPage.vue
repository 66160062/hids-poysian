<template>
  <q-page class="defect-list-page bg-grey-1">
    <div class="q-px-md q-pt-md q-pb-xl">
      <!-- Error Banner -->
      <q-banner v-if="error" class="text-white bg-negative q-mb-md" rounded dense>
        {{ error }}
        <template #action>
          <q-btn flat label="ลองใหม่" @click="loadData" />
        </template>
      </q-banner>

      <!-- Summary Stats -->
      <q-card flat bordered class="summary-card q-mb-md">
        <q-card-section class="q-pa-sm">
          <div class="row q-col-gutter-xs">
            <div class="col-4 text-center stat-box">
              <q-icon name="meeting_room" color="grey-6" size="18px" />
              <div class="stat-label">จำนวนห้อง</div>
              <div class="stat-num">{{ stats.rooms }}</div>
            </div>
            <div class="col-4 text-center stat-box border-lr">
              <q-icon name="build" color="grey-6" size="18px" />
              <div class="stat-label">ประเภทงาน</div>
              <div class="stat-num">{{ stats.jobTypes }}</div>
            </div>
            <div class="col-4 text-center stat-box">
              <q-icon name="list_alt" color="grey-6" size="18px" />
              <div class="stat-label">จำนวนรายการ</div>
              <div class="stat-num">{{ stats.total }}</div>
            </div>
          </div>

          <q-separator class="q-my-sm" />

          <div class="row q-col-gutter-xs">
            <div class="col-6 text-center">
              <div class="row items-center justify-center q-gutter-xs">
                <q-icon name="check_circle" color="green" size="20px" />
                <span class="text-caption text-grey-7">ผ่าน</span>
              </div>
              <div class="text-h6 text-green text-weight-bold">{{ stats.passed }}</div>
            </div>
            <div class="col-6 text-center">
              <div class="row items-center justify-center q-gutter-xs">
                <q-icon name="cancel" color="red" size="20px" />
                <span class="text-caption text-grey-7">ไม่ผ่าน</span>
              </div>
              <div class="text-h6 text-red text-weight-bold">{{ stats.failed }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Filter Button -->
      <div class="row justify-end q-mb-md">
        <q-btn
          outline
          color="grey-7"
          icon="filter_list"
          label="ตัวกรอง"
          size="sm"
          rounded
          @click="showFilter = true"
        />
      </div>

      <!-- Defect List -->
      <div class="text-subtitle2 text-weight-bold q-mb-sm">รายการตรวจ</div>

      <q-card
        v-for="item in defectItems"
        :key="item.id"
        flat
        bordered
        class="defect-card q-mb-sm"
        @click="goToDetail(item)"
      >
        <q-card-section class="q-pa-sm">
          <div class="row q-gutter-sm no-wrap">
            <!-- Image -->
            <div class="col-auto">
              <q-img
                :src="item.image"
                width="90px"
                height="72px"
                style="border-radius: 10px; object-fit: cover"
              />
            </div>

            <!-- Info -->
            <div class="col">
              <!-- Status Badge -->
              <div class="row justify-end q-mb-xs">
                <q-badge
                  :color="
                    item.status === 'verified'
                      ? 'green'
                      : item.status === 'repaired'
                        ? 'blue'
                        : item.status === 'pending_repair'
                          ? 'orange'
                          : 'red'
                  "
                  :label="defectStatusLabel(item.status)"
                  class="status-badge"
                />
              </div>

              <div class="text-caption text-grey-6">ประเภทงาน</div>
              <div class="text-body2 text-weight-bold">{{ item.jobType }}</div>
              <div class="text-caption text-grey-6">รายการ</div>

              <div class="row q-gutter-xs q-mt-xs">
                <q-chip
                  v-for="tag in item.tags"
                  :key="tag"
                  dense
                  outline
                  color="grey-6"
                  text-color="grey-8"
                  size="sm"
                  >{{ tag }}</q-chip
                >
              </div>

              <!-- Location -->
              <div class="text-caption text-grey-5 q-mt-xs">{{ item.location }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Filter Dialog -->
    <q-dialog v-model="showFilter" position="bottom">
      <q-card style="width: 100%; max-width: 480px; border-radius: 16px 16px 0 0; max-height: 85vh">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1 text-weight-bold">ตัวกรอง</div>
          <q-space />
          <q-btn flat round icon="close" v-close-popup />
        </q-card-section>

        <q-scroll-area style="height: calc(85vh - 120px)">
          <q-card-section>
            <!-- แสดงเฉพาะตอนดูทั้งหมด (ไม่ได้กดมาจากห้อง) -->
            <template v-if="!roomId">
              <div class="filter-section-title q-mb-xs">ประเภทห้อง</div>
              <FilterChipGroup v-model="selectedRooms" :options="filterRooms" class="q-mb-md" />
            </template>

            <div class="filter-section-title q-mb-xs">ประเภทงาน</div>
            <FilterChipGroup v-model="selectedJobTypes" :options="filterJobTypes" class="q-mb-md" />

            <div class="filter-section-title q-mb-xs">ประเภทความรุนแรง</div>
            <FilterChipGroup
              v-model="selectedSeverities"
              :options="filterSeverities"
              class="q-mb-md"
            />

            <div class="filter-section-title q-mb-xs">สถานะ</div>
            <FilterChipGroup v-model="selectedStatuses" :options="filterStatuses" />
          </q-card-section>
        </q-scroll-area>

        <q-card-actions class="q-px-md q-pb-md">
          <q-btn flat label="ล้างทั้งหมด" color="red" class="col" @click="resetFilter" />
          <q-btn
            unelevated
            label="ค้นหา"
            color="primary"
            icon="search"
            class="col"
            @click="showFilter = false"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia'; // ✅ เพิ่ม
import {
  useContractorRepair,
  defectStatusLabel,
  type DefectItem,
} from 'src/stores/useContractormain';
import { useLinkAccess } from 'src/stores/useLinkAccess';
import FilterChipGroup from 'src/components/FilterChipGroup.vue';

const route = useRoute();
const router = useRouter();
const { projectId } = useLinkAccess();

const store = useContractorRepair();
const { rooms, allDefectItems, error } = storeToRefs(store); // ✅ storeToRefs สำหรับ state
const { getDefectsByRoom, fetchRepairData } = store; // ✅ function ใช้ตรงๆ

function getJobId(): number | null {
  const queryJobId = route.query.jobId;
  if (typeof queryJobId === 'string' && queryJobId) return Number(queryJobId);
  return projectId.value;
}

async function loadData() {
  const jobId = getJobId();
  if (!jobId) return;
  await fetchRepairData(jobId);
}

// โหลดข้อมูลเองถ้ายังไม่มีใน store (เช่น เปิดลิงก์ตรงมาที่หน้านี้ ไม่ได้ผ่านหน้า repair-overview มาก่อน)
onMounted(() => {
  if (allDefectItems.value.length > 0) return;
  void loadData();
});

const filterRooms = computed(() => ['ทั้งหมด', ...rooms.value.map((r) => r.name)]);
const filterJobTypes = ['ทั้งหมด', 'ผนัง', 'กระเบื้อง', 'ประตู', 'ไฟฟ้า', 'ประปา', 'ฝ้าเพดาน'];
const filterSeverities = ['ทั้งหมด', 'Major', 'Minor'];
const filterStatuses = ['รอดำเนินการ', 'ซ่อมแล้ว', 'ไม่ผ่าน', 'ผ่าน'];

const showFilter = ref(false);
const selectedRooms = ref<string[]>([]);
const selectedJobTypes = ref<string[]>([]);
const selectedSeverities = ref<string[]>([]);
const selectedStatuses = ref<string[]>([]);

const roomId = computed(() => {
  const id = Number(route.params.id);
  return isNaN(id) ? null : id;
});

const baseItems = computed((): DefectItem[] =>
  roomId.value ? getDefectsByRoom(roomId.value) : allDefectItems.value,
);

const stats = computed(() => ({
  rooms: roomId.value ? 1 : rooms.value.length,
  jobTypes: [...new Set(baseItems.value.map((d: DefectItem) => d.jobType))].length,
  total: baseItems.value.length,
  passed: baseItems.value.filter((d: DefectItem) => d.status === 'verified').length,
  failed: baseItems.value.filter((d: DefectItem) => d.status === 'rejected').length,
}));

const defectItems = computed(() =>
  baseItems.value.filter((item: DefectItem) => {
    const matchRoom =
      selectedRooms.value.length === 0 ||
      selectedRooms.value.includes('ทั้งหมด') ||
      selectedRooms.value.some((r) => item.location.startsWith(r.split(',')[0] ?? ''));
    const matchJob =
      selectedJobTypes.value.length === 0 ||
      selectedJobTypes.value.includes('ทั้งหมด') ||
      selectedJobTypes.value.includes(item.jobType);
    const matchStatus =
      selectedStatuses.value.length === 0 ||
      selectedStatuses.value.includes(defectStatusLabel(item.status));
    return matchRoom && matchJob && matchStatus;
  }),
);

const resetFilter = () => {
  selectedRooms.value = [];
  selectedJobTypes.value = [];
  selectedSeverities.value = [];
  selectedStatuses.value = [];
};

const goToDetail = (item: DefectItem) => {
  void router.push(`/contractor/defect-detail/${item.id}`);
};
</script>

<style scoped>
.defect-list-page {
  max-width: 480px;
  margin: 0 auto;
}

.summary-card {
  border-radius: 14px !important;
  background: #fff !important;
  border-color: #ebebeb !important;
}

.stat-box {
  padding: 6px 4px;
}
.stat-label {
  font-size: 10px;
  color: #9e9e9e;
  margin: 2px 0;
  line-height: 1.3;
}
.stat-num {
  font-size: 22px;
  font-weight: 700;
  color: #212121;
}
.border-lr {
  border-left: 1px solid #eee;
  border-right: 1px solid #eee;
}

.defect-card {
  border-radius: 14px !important;
  background: #fff !important;
  border-color: #ebebeb !important;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.defect-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.status-badge {
  border-radius: 8px;
  font-size: 11px;
  padding: 2px 8px;
}
.filter-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #424242;
}
</style>
