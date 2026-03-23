<template>
  <q-page class="bg-grey-2 window-height column no-wrap">
    <div class="relative-position flex flex-center col-auto bg-grey-3" style="height: 45vh">
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
      style="border-radius: 24px 24px 0 0; margin-top: -24px; z-index: 1"
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
          <div class="row no-wrap items-center">
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
          </div>

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

const router = useRouter();
const route = useRoute();
const inspectionStore = useInspectionStore();
const roundId = route.params.roundId as string;
const step = ref<number>(1);

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
  severity: '',
  jobType: null,
  defectTypes: [],
  note: '',
});

// ── Master data ───────────────────────────────────────────────

const isLoadingRooms = ref(false);
const isLoadingFloors = ref(false);

const roomOptions = computed(() => {
  const seen = new Set<number>();
  return templates.value
    .filter((t) => {
      if (seen.has(t.room.roomId)) return false;
      seen.add(t.room.roomId);
      return true;
    })
    .map((t) => ({ value: t.room.roomId, label: t.room.roomName }));
});

const subRoomOptions = computed(() => {
  if (!form.value.roomId) return [];

  const seen = new Set<number>();
  return templates.value
    .filter((t) => t.room.roomId === form.value.roomId && t.subRoom !== null)
    .filter((t) => {
      if (seen.has(t.subRoom!.subRoomId)) return false;
      seen.add(t.subRoom!.subRoomId);
      return true;
    })
    .map((t) => ({ value: t.subRoom!.subRoomId, label: t.subRoom!.roomName }));
});

const floorOptions = computed(() => {
  if (!form.value.roomId) return [];
  const seen = new Set<number>();
  return templates.value
    .filter((t) => t.room.roomId === form.value.roomId)
    .filter((t) => {
      if (seen.has(t.floor.floorId)) return false;
      seen.add(t.floor.floorId);
      return true;
    })
    .map((t) => ({ value: t.floor.floorId, label: t.floor.label }));
});

const severityOptions = [
  { value: 'Major', label: 'Major' },
  { value: 'Minor', label: 'Minor' },
];

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

// ── Room/Floor change → lookup templateId ────────────────────

const onRoomChange = () => {
  form.value.subRoomId = null;
  form.value.templateId = null;
  void lookupTemplate();
};

const onFloorChange = () => {
  form.value.templateId = null;
  void lookupTemplate();
};

function lookupTemplate() {
  const { roomId, subRoomId, floorId } = form.value;
  if (!roomId || !floorId) return;

  const found = templates.value.find(
    (t) =>
      t.room.roomId === roomId &&
      t.floor.floorId === floorId &&
      (subRoomId ? t.subRoom?.subRoomId === subRoomId : !t.subRoom),
  );
  form.value.templateId = found?.templateId ?? null;
}

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
    step.value = 2;
    return;
  }

  if (!form.value.templateId) {
    alert('ไม่พบห้องที่ตรงกับที่เลือก กรุณาเลือกใหม่');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('roundId', String(roundId));
    formData.append('templateId', String(form.value.templateId));
    formData.append('inspectorId', '1'); // TODO: ดึงจาก auth store
    formData.append('severity', form.value.severity);
    formData.append('description', form.value.note || '-');
    formData.append('status', 'PENDING_REPAIR');

    // ส่ง subCategoryIds[] ทุกตัวที่เลือก
    form.value.defectTypes.forEach((id) => {
      formData.append('subCategoryIds', String(id));
    });

    if (selectedFile.value) {
      formData.append('file', selectedFile.value);
    }

    await inspectionStore.saveDefect(formData);

    // refresh defects ในหน้า inspection
    await inspectionStore.fetchDefects(roundId);

    alert('บันทึกข้อมูลสำเร็จ!');
    router.back();
  } catch {
    alert('เกิดข้อผิดพลาดในการบันทึก');
  }
};

// ── Lifecycle ─────────────────────────────────────────────────

const templates = ref<
  {
    templateId: number;
    room: { roomId: number; roomName: string };
    subRoom: { subRoomId: number; roomName: string } | null;
    floor: { floorId: number; label: string };
  }[]
>([]);

onMounted(async () => {
  void inspectionStore.fetchInspectionMasterData(roundId);

  const { data } = await api.get('/room-templates');
  templates.value = data;
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
