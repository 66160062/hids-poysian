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
        v-if="isEditMode && !isLocked"
        flat
        round
        dense
        icon="delete"
        color="negative"
        class="absolute-top-right q-mt-md q-mr-sm bg-white shadow-1"
        @click="handleDelete"
        style="z-index: 10"
      />
      <template v-if="imagePreview">
        <q-img
          :src="imagePreview"
          class="fit"
          fit="cover"
          style="cursor: pointer"
          @click="annotationDialog = true"
        />
        <q-btn
          v-if="!isLocked"
          round
          dense
          color="white"
          text-color="primary"
          icon="edit"
          size="sm"
          class="absolute-bottom-left q-mb-md q-ml-sm shadow-1"
          style="z-index: 10"
          @click="annotationDialog = true"
        />
      </template>
      <div v-else class="column items-center text-grey-5">
        <q-icon name="image" size="80px" color="grey-4" />
        <div class="text-subtitle1 text-weight-medium q-mt-sm">ไม่มีรูปภาพ</div>
      </div>
      <div
        v-if="!isLocked"
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

    <ImageAnnotationDialog
      v-if="imagePreview"
      v-model="annotationDialog"
      :image-src="imagePreview"
      @save="onAnnotationSave"
    />

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
                use-input
                input-debounce="0"
                v-model="form.roomId"
                :options="roomOptionsFiltered"
                label="ประเภทห้อง"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                :loading="isLoadingRooms"
                :disable="isLocked"
                @filter="filterRooms"
                @update:model-value="onRoomChange"
              />

              <!-- ประเภทห้องย่อย -->
              <q-select
                @update:model-value="onSubRoomChange"
                outlined
                dense
                use-input
                input-debounce="0"
                v-model="form.subRoomId"
                :options="subRoomOptionsFiltered"
                label="ประเภทห้องย่อย"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                :disable="!form.roomId || isLocked"
                clearable
                @filter="filterSubRooms"
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
                use-input
                input-debounce="0"
                v-model="form.floorId"
                :options="floorOptionsFiltered"
                label="ชั้น"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                :disable="!form.roomId || isLocked"
                :loading="isLoadingFloors"
                @filter="filterFloors"
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
                use-input
                input-debounce="0"
                v-model="form.jobType"
                :options="categoryOptionsFiltered"
                label="ประเภทงาน"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                :disable="isLocked"
                @filter="filterCategories"
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
                use-input
                input-debounce="0"
                v-model="form.defectTypes"
                :options="subCategoryOptionsFiltered"
                label="เลือกประเภทตำหนิ"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                :disable="!form.jobType || isLocked"
                @filter="filterSubCategories"
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
                :disable="isLocked"
              />
            </div>
          </div>

          <div class="row no-wrap items-center q-py-xs">
            <q-icon name="warning_amber" size="sm" class="q-mr-sm" style="visibility: hidden" />
            <div class="row no-wrap rounded-borders shadow-2 overflow-hidden severity-switch q-mr-md">
              <q-btn
                unelevated
                no-caps
                dense
                label="Minor"
                :color="!severityToggle ? 'orange' : 'grey-3'"
                :text-color="!severityToggle ? 'white' : 'grey-7'"
                class="severity-switch__btn"
                :disable="isLocked"
                @click="setSeverity(false)"
              />
              <q-btn
                unelevated
                no-caps
                dense
                label="Major"
                :color="severityToggle ? 'red' : 'grey-3'"
                :text-color="severityToggle ? 'white' : 'grey-7'"
                class="severity-switch__btn"
                :disable="isLocked"
                @click="setSeverity(true)"
              />
            </div>
            <div class="row items-center q-gutter-x-xs">
              <q-icon
                name="warning_amber"
                size="sm"
                :color="form.severity === 'Major' ? 'red' : 'orange'"
              />
              <span
                class="text-subtitle2 text-weight-bold"
                :class="form.severity === 'Major' ? 'text-red' : 'text-orange'"
              >
                {{ form.severity === 'Major' ? 'ตำหนิร้ายแรง' : 'ตำหนิเล็กน้อย' }}
              </span>
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
          :disable="isSubmitting || (isLocked && step === 2)"
          class="text-weight-bold"
          style="border-radius: 8px; padding: 8px 24px"
          @click="handleNext"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useInspectionStore } from 'src/stores/useInspection';
import { useRoundLock } from 'src/composables/useRoundLock';
import { api } from 'src/boot/axios';
import { isAxiosError } from 'axios';
import { useQuasar } from 'quasar';
import imageCompression from 'browser-image-compression';
import ImageAnnotationDialog from 'src/components/ImageAnnotationDialog.vue';

const route = useRoute();
const router = useRouter();
const inspectionStore = useInspectionStore();
const $q = useQuasar();

const roundId = route.params.roundId as string;
const defectIdFromQuery = route.query.defectId as string | undefined;
const actionFromQuery = route.query.action as string | undefined;
const isEditMode = computed(() => !!defectIdFromQuery);
const { isLocked, fetchLockState } = useRoundLock(roundId);
void fetchLockState();

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

// ── Searchable dropdowns ──────────────────────────────────────
// q-select ต้องผูกกับ ref แยกที่ filter แล้ว ไม่ใช่ผูกตรงกับ list ต้นทาง
type SelectOption = { value: number; label: string };

const roomOptionsFiltered = ref<SelectOption[]>([]);
const subRoomOptionsFiltered = ref<SelectOption[]>([]);
const floorOptionsFiltered = ref<SelectOption[]>([]);

function createFilterFn(getSource: () => SelectOption[], target: typeof roomOptionsFiltered) {
  return (val: string, update: (cb: () => void) => void) => {
    update(() => {
      const source = getSource();
      if (val === '') {
        target.value = source;
        return;
      }
      const needle = val.toLowerCase();
      target.value = source.filter((o) => o.label.toLowerCase().includes(needle));
    });
  };
}

const filterRooms = createFilterFn(() => roomOptions.value, roomOptionsFiltered);
const filterSubRooms = createFilterFn(() => subRoomOptions.value, subRoomOptionsFiltered);
const filterFloors = createFilterFn(() => floorOptions.value, floorOptionsFiltered);

watch(roomOptions, (v) => (roomOptionsFiltered.value = v), { immediate: true });
watch(subRoomOptions, (v) => (subRoomOptionsFiltered.value = v), { immediate: true });
watch(floorOptions, (v) => (floorOptionsFiltered.value = v), { immediate: true });

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

const categoryOptionsFiltered = ref<SelectOption[]>([]);
const subCategoryOptionsFiltered = ref<SelectOption[]>([]);

const filterCategories = createFilterFn(() => categoryOptions.value, categoryOptionsFiltered);
const filterSubCategories = createFilterFn(() => subCategoryOptions.value, subCategoryOptionsFiltered);

watch(categoryOptions, (v) => (categoryOptionsFiltered.value = v), { immediate: true });
watch(subCategoryOptions, (v) => (subCategoryOptionsFiltered.value = v), { immediate: true });

// ── Image ─────────────────────────────────────────────────────

const imagePreview = ref<string | null>(null);
const selectedFile = ref<File | null>(null);
const galleryInput = ref<HTMLInputElement | null>(null);
const cameraInput = ref<HTMLInputElement | null>(null);
const annotationDialog = ref(false);

const triggerGallery = () => galleryInput.value?.click();
const triggerCamera = () => cameraInput.value?.click();

// บีบอัดรูป + แปลงเป็น webp ก่อนส่งขึ้น backend เพื่อลด bandwidth ตอนอัปโหลด
// และให้ตรงเงื่อนไข passthrough ของ backend (storage.service.ts) จะได้ข้ามการ re-encode ซ้ำด้วย sharp
// ถ้าบีบอัดพลาด (เช่น browser ไม่รองรับ) ให้ fallback ใช้ไฟล์ต้นฉบับแทน ไม่บล็อกการอัปโหลด
const compressDefectImage = async (file: File): Promise<File> => {
  try {
    return await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/webp',
    });
  } catch (error) {
    console.error('Image compression failed, uploading original file:', error);
    return file;
  }
};

// เริ่มบีบอัดทันทีตอนเลือก/annotate รูปเสร็จ (background) แทนตอนกด save
// เพื่อให้ compress ทำงานคู่ขนานไปกับตอน user กรอกฟอร์มที่เหลือ กด save แล้วแทบไม่ต้องรอ
// เช็ค selectedFile.value === file ก่อน apply กันกรณี user เปลี่ยน/ลบรูปใหม่ระหว่าง compress เก่ายังไม่เสร็จ
let pendingImageCompression: Promise<void> | null = null;
const startImageCompression = (file: File) => {
  pendingImageCompression = compressDefectImage(file).then((compressed) => {
    if (selectedFile.value === file) {
      selectedFile.value = compressed;
    }
  });
};

const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    selectedFile.value = file;
    imagePreview.value = URL.createObjectURL(file);
    startImageCompression(file);
  }
  target.value = '';
};

const onAnnotationSave = (file: File, previewUrl: string) => {
  const oldPreview = imagePreview.value;
  selectedFile.value = file;
  imagePreview.value = previewUrl;
  if (oldPreview?.startsWith('blob:')) {
    URL.revokeObjectURL(oldPreview);
  }
  startImageCompression(file);
};

// ── Navigation & Submit ───────────────────────────────────────

const handleBack = () => {
  if (step.value === 2) step.value = 1;
  else router.back();
};

// defect ที่กด "บันทึก" ไปแล้วแต่ยังบันทึกลงหลังบ้านไม่เสร็จ (fire-and-forget)
// เก็บไว้เช็คซ้ำกันเอง เพราะ inspectionStore.defects ยังไม่ได้อัปเดตจนกว่า fetchDefects จะเสร็จ
interface PendingDefect {
  roomId: number | null;
  subRoomId: number | null;
  floorId: number | null;
  severity: string;
  note: string;
  types: number[];
}
const pendingDefects = ref<PendingDefect[]>([]);

const isDuplicateDefect = () => {
  const selectedTypes = [...form.value.defectTypes].sort((a, b) => a - b);

  const matchesCurrentForm = (
    roomId: number | null,
    subRoomId: number | null,
    floorId: number | null,
    severity: string,
    note: string,
    types: number[],
  ) => {
    if (roomId !== form.value.roomId) return false;
    if (subRoomId !== form.value.subRoomId) return false;
    if (floorId !== form.value.floorId) return false;
    if (severity !== form.value.severity) return false;
    if (note !== (form.value.note || '-')) return false;
    if (types.length !== selectedTypes.length) return false;
    return types.every((id, i) => id === selectedTypes[i]);
  };

  const duplicateInStore = inspectionStore.defects.some((d) =>
    matchesCurrentForm(
      d.room?.roomId ?? null,
      d.subRoom?.subRoomId ?? null,
      d.floor?.floorId ?? null,
      d.severity,
      d.description,
      d.subCategories.map((s) => s.subCategoryId).sort((a, b) => a - b),
    ),
  );
  if (duplicateInStore) return true;

  return pendingDefects.value.some((p) =>
    matchesCurrentForm(p.roomId, p.subRoomId, p.floorId, p.severity, p.note, [...p.types].sort((a, b) => a - b)),
  );
};

// 409 จาก backend = เจอ defect ซ้ำที่ check ฝั่งนี้มองไม่เห็น (เช่น inspector อีกคนบันทึกจุดเดียวกันไปก่อนแล้ว)
const getSubmitErrorMessage = (err: unknown, fallback: string) => {
  if (isAxiosError(err) && err.response?.status === 409) {
    return (
      (err.response.data as { message?: string } | undefined)?.message ??
      'มีรายการ Defect นี้อยู่แล้วในห้อง/ชั้นเดียวกัน'
    );
  }
  return fallback;
};

const isSubmitting = ref(false);

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

  if (!isEditMode.value && isDuplicateDefect()) {
    $q.notify({
      message: 'มีรายการ Defect นี้อยู่แล้วในห้อง/ชั้นเดียวกัน',
      color: 'negative',
      icon: 'warning',
    });
    return;
  }

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
    if (pendingImageCompression) await pendingImageCompression;
    if (selectedFile.value) {
      formData.append('file', selectedFile.value);
    }
  }

  if (isEditMode.value) {
    if (isSubmitting.value) return;
    isSubmitting.value = true;
    try {
      await inspectionStore.updateDefect(Number(defectIdFromQuery), formData);
      await inspectionStore.fetchDefects(roundId);
      $q.notify({
        message: 'อัปเดตข้อมูลสำเร็จ!',
        color: 'positive',
        icon: 'check_circle',
        timeout: 1500,
      });
      router.back();
    } catch (err) {
      $q.notify({
        message: getSubmitErrorMessage(err, 'เกิดข้อผิดพลาดในการบันทึก'),
        color: 'negative',
        icon: 'error',
      });
    } finally {
      isSubmitting.value = false;
    }
    return;
  }

  // สร้างใหม่: เช็คเงื่อนไขผ่านแล้วเคลียร์ฟอร์มให้กรอกตัวถัดไปได้ทันที
  // ส่วนการบันทึกลงหลังบ้านให้ทำงานต่อเบื้องหลังโดยไม่บล็อก UI
  const pending: PendingDefect = {
    roomId: form.value.roomId,
    subRoomId: form.value.subRoomId,
    floorId: form.value.floorId,
    severity: form.value.severity,
    note: form.value.note || '-',
    types: [...form.value.defectTypes],
  };
  pendingDefects.value.push(pending);

  imagePreview.value = null;
  selectedFile.value = null;
  step.value = 2;

  void (async () => {
    try {
      await inspectionStore.saveDefect(formData);
      await inspectionStore.fetchDefects(roundId);
      $q.notify({
        message: 'บันทึกข้อมูลสำเร็จ!',
        color: 'positive',
        icon: 'check_circle',
        timeout: 1500,
      });
    } catch (err) {
      $q.notify({
        message: getSubmitErrorMessage(err, 'เกิดข้อผิดพลาดในการบันทึก'),
        color: 'negative',
        icon: 'error',
      });
    } finally {
      const idx = pendingDefects.value.indexOf(pending);
      if (idx !== -1) pendingDefects.value.splice(idx, 1);
    }
  })();
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

const severityToggle = ref(false); // true = Major, false = Minor

const onSeverityToggle = (val: boolean) => {
  form.value.severity = val ? 'Major' : 'Minor';
};

const setSeverity = (val: boolean) => {
  if (isLocked.value) return;
  severityToggle.value = val;
  onSeverityToggle(val);
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
      severityToggle.value = defect.severity === 'Major';

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

.severity-switch {
  border-radius: 10px;
  border: 1px solid #e0e0e0;
}
.severity-switch__btn {
  min-width: 64px;
  font-weight: 600;
  font-size: 12px;
  transition: background-color 0.2s ease, color 0.2s ease;
}
</style>
