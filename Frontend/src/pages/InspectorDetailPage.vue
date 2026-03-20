<template>
  <q-page class="bg-grey-2 q-pb-xl">
    <q-header class="bg-white text-black" bordered>
      <q-toolbar>
        <q-btn flat dense icon="arrow_back_ios" color="blue" @click="router.back()" />
        <q-toolbar-title class="text-center text-weight-bold q-pr-xl" style="font-size: 18px">
          รายละเอียด
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <div v-if="loading" class="flex flex-center q-pa-xl">
      <q-spinner color="blue" size="40px" />
    </div>

    <div v-else-if="jobData" class="q-pa-md">
      <q-img
        :src="`http://localhost:3000${jobData.job.projectImageUrl}`"
        style="height: 200px; border-radius: 16px"
        class="q-mb-md shadow-2"
      />

      <div class="bg-white q-pa-md rounded-borders shadow-1 q-mb-sm" style="border-radius: 12px">
        <div class="row justify-between items-center q-mb-xs">
          <div class="text-h6 text-blue text-weight-bold">{{ jobData.job.projectName }}</div>
          <q-badge color="orange" class="q-pa-xs text-weight-bold" rounded>รอเข้าตรวจ</q-badge>
        </div>

        <div class="text-grey-7" style="font-size: 11px; line-height: 1.4">
          เลขที่ {{ jobData.job.address?.houseNumber }} ถ.{{ jobData.job.address?.soi }} ต.{{
            jobData.job.address?.subDistrict
          }}
          อ.{{ jobData.job.address?.district }} จ.{{ jobData.job.address?.province }}
          {{ jobData.job.address?.postalCode }}
        </div>

        <q-separator class="q-my-md" />

        <div class="row items-center justify-between">
          <div class="column q-gutter-y-xs">
            <div class="row items-center text-blue">
              <q-icon name="home" size="20px" class="q-mr-sm" />
              <span class="text-black text-weight-medium">
                {{ jobData.job.houseType?.name }} {{ jobData.job.address?.floor }} ชั้น
              </span>
            </div>
            <div class="row items-center text-blue">
              <q-icon name="zoom_out_map" size="20px" class="q-mr-sm" />
              <span class="text-black text-weight-medium">
                {{ jobData.job.usableArea }} ตร.ม.
              </span>
            </div>
          </div>
          <q-btn round color="blue-1" text-color="blue" icon="map" size="sm" unelevated />
        </div>
      </div>

      <div class="bg-white q-pa-md rounded-borders shadow-1 q-mb-sm" style="border-radius: 12px">
        <div class="text-subtitle1 text-blue text-weight-bold q-mb-sm">
          {{ jobData.job.customer?.fullName }}
        </div>
        <div class="row items-center justify-between">
          <div class="column q-gutter-y-xs">
            <div class="row items-center text-blue">
              <q-icon name="phone" size="20px" class="q-mr-sm" />
              <span class="text-black">{{ jobData.job.customer?.phoneNumber }}</span>
            </div>
            <div class="row items-center text-blue">
              <q-icon name="email" size="20px" class="q-mr-sm" />
              <span class="text-black">{{ jobData.job.customer?.email || '-' }}</span>
            </div>
          </div>
          <q-btn round color="blue-1" text-color="blue" icon="call" size="sm" unelevated />
        </div>
      </div>

      <q-card flat bordered style="border-radius: 12px" class="q-mb-md">
        <q-card-section>
          <div class="row justify-between items-center q-mb-sm">
            <div class="text-subtitle1 text-weight-bold">
              รายงานการตรวจ <span class="text-blue">ครั้งที่ {{ jobData.roundNumber || 1 }}</span>
            </div>
            <div class="text-blue text-caption text-weight-bold">
              {{ formatDate(jobData.scheduledDate) }}
            </div>
          </div>
          <div class="text-caption text-grey-7 q-mb-md">
            ผู้ตรวจ: {{ jobData.teamMember?.inspector?.team?.teamName || 'ทีมวิศวกร' }}
          </div>

          <q-btn
            color="blue"
            class="full-width q-mb-sm q-py-sm"
            style="border-radius: 10px"
            unelevated
            @click="router.push(`/inspector/job/${roundId}/inspection`)"
          >
            <div class="row full-width justify-between items-center q-px-sm">
              <span class="text-weight-bold">เริ่มตรวจบ้าน</span>
              <q-icon
                name="chevron_right"
                class="bg-white text-blue rounded-borders q-pa-xs"
                size="18px"
              />
            </div>
          </q-btn>

          <q-btn
            outline
            color="blue"
            class="full-width q-py-sm"
            style="border-radius: 10px; border-width: 1.5px"
          >
            <div class="row full-width justify-between items-center q-px-sm">
              <span class="text-weight-bold">สรุปรายงาน</span>
              <q-icon
                name="chevron_right"
                class="bg-blue text-white rounded-borders q-pa-xs"
                size="18px"
              />
            </div>
          </q-btn>
        </q-card-section>
      </q-card>

      <q-btn
        disable
        color="grey-4"
        text-color="grey-6"
        class="full-width text-weight-bold q-py-md"
        style="border-radius: 12px; font-size: 16px"
        label="ส่งอนุมัติการตรวจ"
        unelevated
      />
    </div>

    <div v-else class="text-center q-pa-xl text-grey-7">ไม่พบข้อมูลงานตรวจนี้</div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from 'src/boot/axios';
import type { InspectionRound } from 'src/models';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const jobData = ref<InspectionRound | null>(null);

const roundId = route.params.roundId as string;

// ฟังก์ชันดึงข้อมูลจาก API
async function fetchJobDetails() {
  loading.value = true;
  try {
    // แก้ endpoint ให้ตรงกับของหลังบ้านคุณ (เช่น /inspection-rounds/:id)
    const res = await api.get(`/inspection-rounds/${roundId}`);
    console.log('API response:', res.data);
    jobData.value = res.data;
  } catch (error) {
    console.error('Error fetching job details:', error);
  } finally {
    loading.value = false;
  }
}

// ฟังก์ชันแปลงวันที่ให้เป็นภาษาไทย
function formatDate(dateStr: string) {
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
.rounded-borders {
  border-radius: 12px;
}
</style>
