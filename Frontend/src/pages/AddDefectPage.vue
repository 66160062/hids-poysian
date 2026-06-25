<template>
  <q-page class="column no-wrap" style="height: 100dvh; overflow: hidden">
    <div class="relative-position flex flex-center col-auto bg-grey-3" style="height: 40vh">
      <q-btn
        flat
        round
        dense
        icon="arrow_back_ios"
        color="primary"
        class="absolute-top-left q-mt-md q-ml-sm"
        @click="handleBack"
        style="z-index: 10"
      />
      <q-btn
        v-if="isEditMode"
        flat
        round
        dense
        icon="delete"
        color="negative"
        class="absolute-top-right q-mt-md q-mr-sm bg-white shadow-1"
        @click="handleDelete"
        style="z-index: 10"
      />
      <q-img v-if="imagePreview" :src="imagePreview" class="fit" fit="cover" />
      <div v-else class="column items-center text-grey-5">
        <q-icon name="image" size="80px" color="grey-4" />
        <div class="text-subtitle1 text-weight-medium q-mt-sm">ไม่มีรูปภาพ</div>
      </div>
      <div
        class="absolute-bottom-right q-pa-md column q-gutter-y-sm"
        style="margin-bottom: 20px; z-index: 10"
      >
        <q-btn round color="primary" icon="photo_library" @click="triggerGallery" />
        <q-btn round color="primary" icon="photo_camera" @click="triggerCamera" />
      </div>
      <input
        type="file"
        ref="galleryInput"
        accept="image/*"
        style="display: none"
        @change="onFileSelected"
      />
      <input
        type="file"
        ref="cameraInput"
        accept="image/*"
        capture="environment"
        style="display: none"
        @change="onFileSelected"
      />
    </div>

    <div
      class="bg-white col q-pa-lg flex column shadow-up-2"
      style="border-radius: 24px 24px 0 0; margin-top: -24px; z-index: 1; overflow-y: auto"
    >
      <!-- Step 1: รายละเอียดห้อง -->
      <div v-if="step === 1" class="col column">
        <div class="text-h6 text-weight-bold text-primary">รายละเอียดห้อง</div>
        <div class="text-caption text-grey-7 q-mb-lg">กรุณากรอกรายละเอียดห้อง</div>
        <div class="column q-gutter-y-md">
          <div class="row no-wrap items-start">
            <q-icon name="meeting_room" size="sm" color="primary" class="q-pt-sm q-mr-sm" />
            <div class="col column q-gutter-y-md">
              <!-- ประเภทห้อง -->
              <q-select
                outlined
                dense
                v-model="form.roomId"
                :options="roomOptions"
                label="ประเภทห้อง"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                :loading="isLoadingRooms"
                @update:model-value="onRoomChange"
              />

              <!-- ประเภทห้องย่อย -->
              <q-select
                @update:model-value="onSubRoomChange"
                outlined
                dense
                v-model="form.subRoomId"
                :options="subRoomOptions"
                label="ประเภทห้องย่อย"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                :disable="!form.roomId"
                clearable
              />
            </div>
          </div>

          <div class="row no-wrap items-start">
            <q-icon name="layers" size="sm" color="primary" class="q-pt-sm q-mr-sm" />
            <div class="col">
              <!-- ชั้น -->
              <q-select
                outlined
                dense
                v-model="form.floorId"
                :options="floorOptions"
                label="ชั้น"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                :disable="!form.roomId"
                :loading="isLoadingFloors"
                @update:model-value="onFloorChange"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: รายละเอียดงาน -->
      <div v-if="step === 2" class="col column">
        <div class="text-h6 text-weight-bold text-primary">รายละเอียดงาน</div>
        <div class="text-caption text-grey-7 q-mb-lg">กรุณากรอกรายละเอียดงาน</div>
        <div class="column q-gutter-y-md">
          <!-- ความรุนแรง -->
          <!-- <div class="row no-wrap items-center">
            <q-icon name="warning_amber" size="sm" color="primary" class="q-mr-sm" />
            <div class="col">
              <q-select
                outlined
                dense
                v-model="form.severity"
                :options="severityOptions"
                label="ความรุนแรง"
                option-value="value"
                option-label="label"
                emit-value
                map-options
              />
            </div>
          </div> -->

          <!-- ประเภทงาน -->
          <div class="row no-wrap items-center">
            <q-icon name="work_outline" size="sm" color="primary" class="q-mr-sm" />
            <div class="col">
              <q-select
                outlined
                dense
                v-model="form.jobType"
                :options="categoryOptions"
                label="ประเภทงาน"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                @update:model-value="onCategoryChange"
              />
            </div>
          </div>

          <!-- ประเภทตำหนิ -->
          <div class="row no-wrap items-start">
            <q-icon name="list" size="sm" color="primary" class="q-pt-sm q-mr-sm" />
            <div class="col">
              <q-select
                outlined
                multiple
                use-chips
                stack-label
                v-model="form.defectTypes"
                :options="subCategoryOptions"
                label="เลือกประเภทตำหนิ"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                :disable="!form.jobType"
              >
                <template #selected-item="scope">
                  <q-chip
                    removable
                    dense
                    @remove="scope.removeAtIndex(scope.index)"
                    :tabindex="scope.tabindex"
                    color="primary"
                    text-color="white"
                    size="11px"
                    class="q-ma-xs"
                  >
                    {{ scope.opt.label }}
                  </q-chip>
                </template>
              </q-select>
            </div>
          </div>

          <!-- หมายเหตุ -->
          <div class="row no-wrap items-start">
            <q-icon name="edit_note" size="sm" color="primary" class="q-pt-sm q-mr-sm" />
            <div class="col">
              <q-input
                outlined
                dense
                type="textarea"
                v-model="form.note"
                label="หมายเหตุ"
                rows="3"
              />
            </div>
          </div>

          <div class="row no-wrap items-center">
            <div class="row no-wrap items-center justify-end" style="width: 100%">
              <span
                class="text-weight-bold"
                :class="form.severity === 'Major' ? 'text-red' : 'text-orange'"
                style="font-size: 15px"
              >
                {{ form.severity === 'Major' ? 'Major Defect' : 'Minor Defect' }}
              </span>
              <q-toggle
                v-model="severityToggle"
                :color="form.severity === 'Major' ? 'red' : 'orange'"
                keep-color
                @update:model-value="onSeverityToggle"
                size="60px"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="row justify-between items-end q-mt-auto q-pt-md">
        <div class="column">
          <div class="text-caption text-primary text-weight-bold q-mb-xs">หน้าที่ {{ step }}/2</div>
          <div class="row q-gutter-x-xs">
            <div
              :class="step === 1 ? 'bg-primary' : 'bg-grey-4'"
              style="width: 16px; height: 4px; border-radius: 2px"
            />
            <div
              :class="step === 2 ? 'bg-primary' : 'bg-grey-4'"
              style="width: 16px; height: 4px; border-radius: 2px"
            />
          </div>
        </div>
        <q-btn
          color="primary"
          :label="step === 1 ? 'ถัดไป' : 'บันทึก'"
          :icon-right="step === 1 ? 'chevron_right' : ''"
          :loading="inspectionStore.isLoading"
          class="text-weight-bold"
          style="border-radius: 8px; padding: 8px 24px"
          @click="handleNext"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import imageCompression from 'browser-image-compression';
import { useInspectionStore } from 'src/stores/useInspection';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';

const route = useRoute();
const router = useRouter();
const inspectionStore = useInspectionStore();
const $q = useQuasar();

const roundId = route.params.roundId as string;
const defectIdFromQuery = route.query.defectId as string | undefined;
const actionFromQuery = route.query.action as string | undefined;
const isEditMode = computed(() => !!defectIdFromQuery);

const step = ref(1);

// ── Types ─────────────────────────────────────────────────────

interface DefectForm {
  roomId: number | null;
  subRoomId: number | null;
  floorId: number | null;
  templateId: number | null;
  severity: string;
  jobType: number | null;
  defectTypes: number[];
  note: string;
}

// ── Form state ────────────────────────────────────────────────

const form = ref<DefectForm>({
  roomId: null,
  subRoomId: null,
  floorId: null,
  templateId: null,
  severity: 'Minor',
  jobType: null,
  defectTypes: [],
  note: '',
});

// ── Master data ───────────────────────────────────────────────

const isLoadingRooms = ref(false);
const isLoadingFloors = ref(false);

const roomOptions = ref<{ value: number; label: string }[]>([]);
const subRoomOptions = ref<{ value: number; label: string }[]>([]);
const floorOptions = ref<{ value: number; label: string }[]>([]);

const fetchRooms = async () => {
  const { data } = await api.get<{ roomId: number; roomName: string }[]>('/rooms');
  roomOptions.value = data.map((r) => ({ value: r.roomId, label: r.roomName }));
};

const fetchSubRooms = async () => {
  const { data } = await api.get<{ subRoomId: number; roomName: string }[]>('/sub-rooms');
  subRoomOptions.value = data.map((s) => ({ value: s.subRoomId, label: s.roomName }));
};

const fetchFloors = async () => {
  const { data } = await api.get<{ floorId: number; label: string }[]>('/floor');
  floorOptions.value = data.map((f) => ({ value: f.floorId, label: f.label }));
};

const onRoomChange = async () => {
  // ไม่ต้อง clear subRoomId แล้ว เพราะมันอิสระ
  // แต่สามารถ clear floorId ถ้าต้องการ (หรือไม่ clear ก็ได้)
};

const onSubRoomChange = () => {
  // ไม่ต้อง clear floorId 
};

const onFloorChange = () => {
  // ไม่ต้อง lookup template แล้ว
};

// ── Category / SubCategory ────────────────────────────────────

const categoryOptions = computed(() =>
  inspectionStore.categories.map((c) => ({ label: c.name, value: c.categoryId })),
);

const subCategoryOptions = computed(() => {
  if (!form.value.jobType) return [];
  return inspectionStore.getSubByCategoryId(form.value.jobType).map((s) => ({
    label: s.name,
    value: s.subCategoryId,
  }));
});

const onCategoryChange = (val: number | null) => {
  form.value.jobType = val;
  form.value.defectTypes = [];
};

// ── Image ─────────────────────────────────────────────────────

const imagePreview = ref<string | null>(null);
const selectedFile = ref<File | null>(null);
const galleryInput = ref<HTMLInputElement | null>(null);
const cameraInput = ref<HTMLInputElement | null>(null);

const triggerGallery = () => galleryInput.value?.click();
const triggerCamera = () => cameraInput.value?.click();

const onFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    try {
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      selectedFile.value = compressedFile;
      imagePreview.value = URL.createObjectURL(compressedFile);
    } catch {
      selectedFile.value = file;
      imagePreview.value = URL.createObjectURL(file);
    }
  }
  target.value = '';
};

// ── Navigation & Submit ───────────────────────────────────────

const handleBack = () => {
  if (step.value === 2) step.value = 1;
  else router.back();
};

const handleNext = async () => {
  if (step.value === 1) {
    if (!form.value.roomId) {
      $q.notify({ message: 'กรุณาเลือกประเภทห้อง', color: 'negative', icon: 'warning' });
      return;
    }
    if (!form.value.floorId) {
      $q.notify({ message: 'กรุณาเลือกชั้น', color: 'negative', icon: 'warning' });
      return;
    }
    step.value = 2;
    return;
  }

  if (!form.value.severity) {
    $q.notify({ message: 'กรุณาเลือกความรุนแรง', color: 'negative', icon: 'warning' });
    return;
  }
  if (!form.value.jobType) {
    $q.notify({ message: 'กรุณาเลือกประเภทงาน', color: 'negative', icon: 'warning' });
    return;
  }
  if (form.value.defectTypes.length === 0) {
    $q.notify({
      message: 'กรุณาเลือกประเภทตำหนิอย่างน้อย 1 รายการ',
      color: 'negative',
      icon: 'warning',
    });
    return;
  }

  try {
    const formData = new FormData();
    formData.append('roundId', String(roundId));
    formData.append('roomId', String(form.value.roomId));
    if (form.value.subRoomId) {
      formData.append('subRoomId', String(form.value.subRoomId));
    }
    formData.append('floorId', String(form.value.floorId));
    formData.append('inspectorId', '1'); // TODO: ดึงจาก auth store
    formData.append('severity', form.value.severity);
    formData.append('description', form.value.note || '-');

    if (!isEditMode.value) {
      formData.append('status', 'pending_repair');
    } else if (actionFromQuery === 'fail') {
      formData.append('status', 'pending_repair');
    }

    // ส่ง subCategoryIds[] ทุกตัวที่เลือก
    form.value.defectTypes.forEach((id) => {
      formData.append('subCategoryIds', String(id));
    });

    if (selectedFile.value) {
      formData.append('file', selectedFile.value);
    }

    if (isEditMode.value) {
      await inspectionStore.updateDefect(Number(defectIdFromQuery), formData);
      await inspectionStore.fetchDefects(roundId);
      $q.notify({
        message: 'อัปเดตข้อมูลสำเร็จ!',
        color: 'positive',
        icon: 'check_circle',
        timeout: 1500,
      });
      router.back();
    } else {
      await inspectionStore.saveDefect(formData);
      await inspectionStore.fetchDefects(roundId);

      // reset เฉพาะ step 2 คง room info ไว้
      form.value.severity = '';
      form.value.jobType = null;
      form.value.defectTypes = [];
      form.value.note = '';
      imagePreview.value = null;
      selectedFile.value = null;
      step.value = 1;

      $q.notify({
        message: 'บันทึกข้อมูลสำเร็จ!',
        color: 'positive',
        icon: 'check_circle',
        timeout: 1500,
      });
    }
  } catch {
    $q.notify({ message: 'เกิดข้อผิดพลาดในการบันทึก', color: 'negative', icon: 'error' });
  }
};

const handleDelete = () => {
  $q.dialog({
    title: 'ยืนยันการลบ',
    message: 'คุณต้องการลบรายการ Defect นี้ใช่หรือไม่?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await inspectionStore.deleteDefect(Number(defectIdFromQuery));
        await inspectionStore.fetchDefects(roundId);
        $q.notify({
          message: 'ลบข้อมูลสำเร็จ',
          color: 'positive',
          icon: 'check_circle',
        });
        router.back();
      } catch {
        $q.notify({
          message: 'เกิดข้อผิดพลาดในการลบ',
          color: 'negative',
          icon: 'error',
        });
      }
    })();
  });
};

// ── Lifecycle ─────────────────────────────────────────────────

const severityToggle = ref(true); // true = Major, false = Minor

const onSeverityToggle = (val: boolean) => {
  form.value.severity = val ? 'Minor' : 'Major';
};

onMounted(async () => {
  void inspectionStore.fetchInspectionMasterData(roundId);

  await fetchRooms();
  await fetchSubRooms();
  await fetchFloors();

  if (defectIdFromQuery) {
    const defectId = Number(defectIdFromQuery);
    let defect = inspectionStore.defects.find((d) => d.defectId === defectId);
    if (!defect) {
      try {
        const { data } = await api.get(`/defects/${defectId}`);
        defect = data;
      } catch (err) {
        console.error(err);
      }
    }
    
    if (defect) {
      form.value.roomId = defect.room?.roomId ?? null;
      form.value.subRoomId = defect.subRoom?.subRoomId ?? null;
      form.value.floorId = defect.floor?.floorId ?? null;
      form.value.severity = defect.severity;
      severityToggle.value = defect.severity === 'Minor';
      
      if (defect.subCategories && defect.subCategories.length > 0) {
        form.value.jobType = defect.subCategories[0]?.category?.categoryId ?? null;
        form.value.defectTypes = defect.subCategories.map((s: { subCategoryId: number }) => s.subCategoryId);
      }
      form.value.note = defect.description !== '--' ? defect.description : '';
      
      if (defect.imageUrl) {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        imagePreview.value = defect.imageUrl.startsWith('http') ? defect.imageUrl : `${baseUrl}${defect.imageUrl}`;
      }
      step.value = 1; // Stay on step 1 to allow editing room details if needed
    }
  } else {
    const { roomId, subRoomId, floorId } = route.query;
    if (roomId) {
      form.value.roomId = Number(roomId);
      if (subRoomId) form.value.subRoomId = Number(subRoomId);
      if (floorId) form.value.floorId = Number(floorId);
      step.value = 2;
    }
  }
});
</script>

<style scoped>
:deep(.q-field--dense .q-field__control) {
  height: 40px;
}
:deep(.q-field--dense .q-field__marginal) {
  height: 40px;
}
</style>
