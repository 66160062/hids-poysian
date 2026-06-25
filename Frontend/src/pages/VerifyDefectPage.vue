<template>
  <q-page class="bg-white q-pa-md" style="max-width: 480px; margin: 0 auto; padding-bottom: 80px;">
    <div class="row items-center q-mb-md">
      <q-btn flat round dense icon="arrow_back_ios" color="primary" @click="handleBack" />
      <div class="text-h6 text-weight-bold text-primary q-ml-sm">ตรวจสอบงานซ่อม</div>
    </div>

    <template v-if="!defect">
      <div class="flex flex-center q-pa-xl">
        <q-spinner color="primary" size="3em" />
      </div>
    </template>

    <template v-else>
      <div class="text-caption text-grey-5 q-mb-xs">#{{ defect.defectId }}</div>
      <q-card flat bordered class="q-mb-md">
        <q-card-section class="q-pa-sm">
          <div class="text-caption text-grey-6">สถานะ</div>
          <div class="text-body2 text-weight-bold text-orange">ส่งซ่อมแล้ว (รอตรวจ)</div>
          <div class="text-caption text-grey-6 q-mt-xs">สถานที่</div>
          <div class="text-body2">{{ locationLabel }}</div>
        </q-card-section>
      </q-card>

      <!-- Before Image -->
      <div class="q-mb-sm">
        <div class="text-subtitle2 text-weight-bold text-primary">รูปอ้างอิงก่อนซ่อม</div>
      </div>
      <div class="q-mb-lg" style="position: relative;">
        <img
          :src="getImageUrl(defect.imageUrl)"
          style="width:100%; border-radius:14px; border:2px solid #1976D2; display:block; aspect-ratio:16/9; object-fit:cover;"
        />
        <div style="position:absolute; top:8px; left:8px;">
          <q-badge color="red" label="BEFORE" style="font-size:11px; font-weight:700;" />
        </div>
      </div>

      <!-- After Image -->
      <div class="q-mb-sm">
        <div class="text-subtitle2 text-weight-bold text-primary">รูปหลังแก้ไข (โดยผู้รับเหมา)</div>
      </div>
      <div class="q-mb-lg" style="position: relative;">
        <img
          :src="getImageUrl(defect.contractorImageUrl) || getImageUrl(defect.imageUrl)"
          style="width:100%; border-radius:14px; border:2px solid #4CAF50; display:block; aspect-ratio:16/9; object-fit:cover;"
        />
        <div style="position:absolute; top:8px; left:8px;">
          <q-badge color="green" label="AFTER" style="font-size:11px; font-weight:700;" />
        </div>
      </div>

      <div class="text-subtitle2 text-weight-bold q-mb-sm">บันทึกเพิ่มเติมจากผู้รับเหมา</div>
      <q-card flat bordered class="q-mb-xl">
        <q-card-section>
          <div class="text-body2 text-grey-8">{{ defect.contractorNote || '-' }}</div>
        </q-card-section>
      </q-card>

      <!-- Bottom Actions -->
      <div class="fixed-bottom q-pa-md bg-white shadow-up-2 row q-gutter-x-sm">
        <q-btn
          unelevated
          outline
          color="negative"
          icon="close"
          label="ไม่ผ่าน"
          class="col"
          size="md"
          @click="handleFail"
        />
        <q-btn
          unelevated
          color="positive"
          icon="check"
          label="ผ่าน"
          class="col"
          size="md"
          :loading="isSubmitting"
          @click="handlePass"
        />
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useInspectionStore } from 'src/stores/useInspection';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';
import type { Defect } from 'src/models';

const route = useRoute();
const router = useRouter();
const inspectionStore = useInspectionStore();
const $q = useQuasar();

const roundId = route.params.roundId as string;
const defectId = Number(route.query.defectId);

const defect = ref<Defect | null>(null);
const isSubmitting = ref(false);

const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return path.startsWith('http') ? path : `${baseUrl}${path}`;
};

const locationLabel = computed(() => {
  if (!defect.value) return '-';
  const d = defect.value;
  const room = d.room?.roomName ?? '-';
  const subRoom = d.subRoom?.roomName ?? '-';
  const floor = d.floor?.label ?? '-';
  return `${room}, ${subRoom}, ${floor}`;
});

const loadDefect = async () => {
  let found = inspectionStore.defects.find((d) => d.defectId === defectId);
  if (!found) {
    try {
      const { data } = await api.get(`/defects/${defectId}`);
      found = data;
    } catch (err) {
      console.error(err);
      $q.notify({ message: 'ไม่พบข้อมูล Defect', color: 'negative' });
      router.back();
      return;
    }
  }
  defect.value = found as Defect;
};

const handleBack = () => {
  router.back();
};

const handleFail = () => {
  void router.replace({
    name: 'addDefect',
    params: { roundId },
    query: {
      defectId,
      action: 'fail',
    },
  });
};

const handlePass = async () => {
  isSubmitting.value = true;
  try {
    const formData = new FormData();
    formData.append('status', 'verified');
    
    await inspectionStore.updateDefect(defectId, formData);
    await inspectionStore.fetchDefects(roundId);
    
    $q.notify({
      message: 'ยืนยันงานซ่อมเรียบร้อย',
      color: 'positive',
      icon: 'check_circle',
    });
    router.back();
  } catch {
    $q.notify({
      message: 'เกิดข้อผิดพลาดในการบันทึก',
      color: 'negative',
      icon: 'error',
    });
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  void loadDefect();
});
</script>

<style scoped>
</style>
