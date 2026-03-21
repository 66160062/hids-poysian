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

          <DefectReport
            ref="reportComp"
            :round="jobData"
            :defects="defects"
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
                <DefectReport :round="jobData" :defects="defects" />
              </q-card-section>
            </q-card>
          </q-dialog>
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
import DefectReport from 'src/components/DefectReport.vue';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const jobData = ref<InspectionRound | null>(null);

const roundId = route.params.roundId as string;

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
    console.log('API response:', res.data);
    jobData.value = res.data;
  } catch (error) {
    console.error('Error fetching job details:', error);
  } finally {
    loading.value = false;
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

onMounted(() => {
  void fetchJobDetails();
  void fetchDefects();
  void checkSummary();
});
</script>

<style scoped>
.rounded-borders {
  border-radius: 12px;
}
</style>
