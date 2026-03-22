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
                <q-item-label caption>{{ round.date }}</q-item-label>
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
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useWorkListStore } from '../stores/useWorkList';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const workStore = useWorkListStore();

const jobId = computed(() => Number(route.params.id));
const isLoading = ref(true);

onMounted(async () => {
  try {
    // Simulate Backend API fetch
    await new Promise((resolve) => setTimeout(resolve, 600));
  } finally {
    isLoading.value = false;
  }
});

// Find job from store
const job = computed(() => {
  const found = workStore.works.find((w) => w.id === jobId.value);
  const base = found ?? workStore.works[0];
  if (!base) {
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
      housePlanImage: null,
      projectImage: null,
      status: '-',
      statusKey: '',
    };
  }
  return {
    projectName: base.title,
    houseType: base.type,
    area: base.area.replace(' ตร.ม.', ''),
    appointmentDate: base.date,
    address: base.address ?? `จ.ตัวเมือง: ${base.province ?? '-'}`,
    customerName: base.customerName ?? '-',
    customerPhone: base.customerPhone ?? '-',
    customerEmail: base.customerEmail ?? '-',
    coordName: base.coordName ?? '-',
    coordPhone: base.coordPhone ?? '-',
    coordEmail: base.coordEmail ?? '-',
    coordLine: base.coordLine ?? '-',
    housePlanImage: base.housePlanImage ?? null,
    projectImage: base.projectImage ?? null,
    status: base.status,
    statusKey: base.statusKey,
  };
});

// Mock inspection rounds (empty = empty state UI)
const inspectionRounds: {
  id: number;
  roundNumber: number;
  date: string;
  status: string;
}[] = [];

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

const onCreateRound = () => {
  // TODO: navigate to create inspection round
};

function getRoundStatusColor(status: string) {
  switch (status) {
    case 'กำลังดำเนินการ':
      return 'orange-2';
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
</style>
