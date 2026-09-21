<template>
  <q-page class="row justify-center bg-grey-1" style="height: 100dvh; overflow: hidden">
    <div class="detail-content column no-wrap" style="height: 100%">
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
          @click="showAnnotator = true"
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
          @click="showAnnotator = true"
        />
      </template>
      <div v-else class="column items-center text-grey-5">
        <q-icon name="image" size="80px" color="grey-4" />
        <div class="text-subtitle1 text-weight-medium q-mt-sm">{{ t('inspection.addDefect.noImage') }}</div>
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

    <PlanPositionDialog
      v-model="planDialog"
      :job-id="jobId"
      :selected-floor-id="form.floorId"
      :initial-plan-id="form.planId"
      :initial-x="form.planX"
      :initial-y="form.planY"
      :initial-zone="form.locationZone"
      @save="onPlanPositionSave"
    />

    <div
      class="bg-white col q-pa-lg flex column no-wrap shadow-up-2"
      style="border-radius: 24px 24px 0 0; margin-top: -24px; z-index: 1; overflow-y: auto"
    >
      <!-- Step 1: รายละเอียดห้อง -->
      <div v-if="step === 1" class="col-auto column no-wrap">
        <div class="text-h6 text-weight-bold text-primary">{{ t('inspection.addDefect.roomDetailsTitle') }}</div>
        <div class="text-caption text-grey-7 q-mb-lg">{{ t('inspection.addDefect.roomDetailsSubtitle') }}</div>
        <div class="column no-wrap q-gutter-y-md">
          <div class="row no-wrap items-start">
            <q-icon name="meeting_room" size="sm" color="primary" class="q-pt-sm q-mr-sm" />
            <div class="col column no-wrap q-gutter-y-md">
              <!-- ประเภทห้อง -->
              <q-select
                outlined
                dense
                use-input
                input-debounce="0"
                v-model="form.roomId"
                :options="roomOptionsFiltered"
                :label="t('inspection.addDefect.roomType')"
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
                :label="t('inspection.addDefect.subRoomType')"
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
                :label="t('inspection.addDefect.floor')"
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
      <div v-if="step === 2" class="col-auto column no-wrap">
        <div class="text-h6 text-weight-bold text-primary">{{ t('inspection.addDefect.jobDetailsTitle') }}</div>
        <div class="text-caption text-grey-7 q-mb-lg">{{ t('inspection.addDefect.jobDetailsSubtitle') }}</div>
        <div class="column no-wrap q-gutter-y-md">
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
                :label="t('inspection.addDefect.jobType')"
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
                :label="t('inspection.addDefect.selectDefectTypes')"
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
                :label="t('inspection.addDefect.note')"
                rows="3"
                :disable="isLocked"
              />
            </div>
          </div>

          <!-- ตำแหน่งในแปลนบ้าน -->
          <div class="row no-wrap items-center">
            <q-icon name="place" size="sm" color="primary" class="q-mr-sm" />
            <div class="col">
              <q-card
                flat
                bordered
                class="q-pa-sm rounded-borders cursor-pointer bg-grey-1 hover-bg-grey-2"
                :class="{ 'border-positive-subtle': form.planId && form.planX !== null }"
                @click="planDialog = true"
              >
                <div class="row items-center justify-between no-wrap">
                  <div class="column q-gutter-y-xs">
                    <div class="text-caption text-weight-bold text-dark row items-center q-gutter-x-xs">
                      <span>{{ t('inspection.addDefect.planPositionLabel') }}</span>
                      <q-icon name="open_in_new" size="14px" color="grey-6" />
                    </div>

                    <!-- Status Display -->
                    <div class="row items-center q-gutter-x-xs">
                      <template v-if="form.planId && form.planX !== null">
                        <q-badge color="positive" class="text-caption q-px-xs">
                          {{ t('inspection.addDefect.planPositionSet') }}
                        </q-badge>
                        <span v-if="form.locationZone" class="text-caption text-grey-7">
                          • {{ form.locationZone }}
                        </span>
                      </template>
                      <template v-else-if="form.locationZone">
                        <q-badge color="info" class="text-caption q-px-xs">
                          {{ form.locationZone }}
                        </q-badge>
                      </template>
                      <template v-else>
                        <span class="text-caption text-grey-6">
                          {{ t('inspection.addDefect.planPositionNotSet') }}
                        </span>
                      </template>
                    </div>
                  </div>

                  <q-btn
                    round
                    flat
                    dense
                    icon="chevron_right"
                    color="grey-6"
                  />
                </div>
              </q-card>
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
                {{
                  form.severity === 'Major'
                    ? t('inspection.addDefect.severityMajor')
                    : t('inspection.addDefect.severityMinor')
                }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="row justify-between items-end q-mt-auto q-pt-md">
        <div class="column">
          <div class="text-caption text-primary text-weight-bold q-mb-xs">
            {{ t('inspection.addDefect.pageOf', { step }) }}
          </div>
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
          :label="step === 1 ? t('inspection.addDefect.next') : t('inspection.addDefect.save')"
          :icon-right="step === 1 ? 'chevron_right' : ''"
          :loading="inspectionStore.isLoading"
          :disable="isSubmitting || (isLocked && step === 2)"
          class="text-weight-bold"
          style="border-radius: 8px; padding: 8px 24px"
          @click="handleNext"
        />
      </div>
    </div>
    </div>

    <ImageAnnotatorDialog
      v-if="imagePreview"
      v-model="showAnnotator"
      :image-url="imagePreview"
      @save="onAnnotatorSave"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import ImageAnnotatorDialog from 'src/components/ImageAnnotatorDialog.vue';
import { useInspectionStore } from 'src/stores/useInspection';
import { useRoundLock } from 'src/composables/useRoundLock';
import { api } from 'src/boot/axios';
import type { Defect } from 'src/models';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import imageCompression from 'browser-image-compression';
import PlanPositionDialog from 'src/components/PlanPositionDialog.vue';
import { createIconSpinner } from 'src/composables/useIconSpinner';
import { localizedName } from 'src/composables/useLocalizedField';

const addDefectSpinner = createIconSpinner('note_add');

const route = useRoute();
const router = useRouter();
const inspectionStore = useInspectionStore();
const $q = useQuasar();
const { t } = useI18n();

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
  planId: number | null;
  planX: number | null;
  planY: number | null;
  locationZone: string | null;
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
  planId: null,
  planX: null,
  planY: null,
  locationZone: null,
});

const jobId = ref<number | null>(null);
const planDialog = ref(false);

const onPlanPositionSave = (data: {
  planId: number | null;
  planX: number | null;
  planY: number | null;
  locationZone: string | null;
}) => {
  form.value.planId = data.planId;
  form.value.planX = data.planX;
  form.value.planY = data.planY;
  form.value.locationZone = data.locationZone;
};

const fetchJobInfo = async () => {
  if (route.query.jobId) {
    jobId.value = Number(route.query.jobId);
    return;
  }
  try {
    const { data } = await api.get<{ job?: { jobId?: number } }>(`/inspection-rounds/${roundId}`);
    if (data?.job?.jobId) {
      jobId.value = data.job.jobId;
    }
  } catch (err) {
    console.error('Failed to fetch job info for round', err);
  }
};

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
  inspectionStore.categories.map((c) => ({ label: localizedName(c), value: c.categoryId })),
);

const subCategoryOptions = computed(() => {
  if (!form.value.jobType) return [];
  return inspectionStore.getSubByCategoryId(form.value.jobType).map((s) => ({
    label: localizedName(s),
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
const showAnnotator = ref(false);

const galleryInput = ref<HTMLInputElement | null>(null);
const cameraInput = ref<HTMLInputElement | null>(null);

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

const onAnnotatorSave = (blob: Blob) => {
  const file = new File([blob], `defect-${Date.now()}.jpg`, { type: 'image/jpeg' });
  const oldPreview = imagePreview.value;
  selectedFile.value = file;
  imagePreview.value = URL.createObjectURL(blob);
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

// defect ซ้ำ: เช็คทั้ง defect ที่บันทึกแล้ว และ defect ที่กำลังบันทึกอยู่เบื้องหลัง (defectSyncState, isCreate)
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

  return Object.values(inspectionStore.defectSyncState).some(
    (entry) =>
      entry.isCreate &&
      entry.previewDefect &&
      matchesCurrentForm(
        entry.previewDefect.room?.roomId ?? null,
        entry.previewDefect.subRoom?.subRoomId ?? null,
        entry.previewDefect.floor?.floorId ?? null,
        entry.previewDefect.severity,
        entry.previewDefect.description,
        entry.previewDefect.subCategories.map((s) => s.subCategoryId).sort((a, b) => a - b),
      ),
  );
};

// patch defect ใน store ทันทีตามฟอร์มปัจจุบัน (optimistic) เพื่อให้หน้ารายการอัปเดตก่อนที่ backend จะตอบกลับ
const buildLocalSubCategories = () =>
  inspectionStore.subCategories
    .filter((s) => form.value.defectTypes.includes(s.subCategoryId))
    .map((s) => ({
      subCategoryId: s.subCategoryId,
      name: s.name,
      nameEn: s.nameEn ?? null,
      ...(s.categoryId
        ? { category: { name: s.categoryId.name, nameEn: s.categoryId.nameEn ?? null, categoryId: s.categoryId.categoryId } }
        : {}),
    }));

const patchDefectLocally = (defectId: number) => {
  const idx = inspectionStore.defects.findIndex((d) => d.defectId === defectId);
  if (idx === -1) return;
  const existing = inspectionStore.defects[idx]!;
  const roomLabel = roomOptions.value.find((r) => r.value === form.value.roomId)?.label;
  const subRoomLabel = subRoomOptions.value.find((r) => r.value === form.value.subRoomId)?.label;
  const floorLabel = floorOptions.value.find((f) => f.value === form.value.floorId)?.label;

  inspectionStore.defects[idx] = {
    ...existing,
    ...(form.value.roomId
      ? { room: { roomId: form.value.roomId, roomName: roomLabel ?? existing.room?.roomName ?? '' } }
      : {}),
    subRoom: form.value.subRoomId ? { subRoomId: form.value.subRoomId, roomName: subRoomLabel ?? '' } : null,
    ...(form.value.floorId
      ? { floor: { floorId: form.value.floorId, label: floorLabel ?? existing.floor?.label ?? '' } }
      : {}),
    severity: form.value.severity,
    subCategories: buildLocalSubCategories(),
    description: form.value.note || '-',
    planId: form.value.planId,
    planX: form.value.planX,
    planY: form.value.planY,
    locationZone: form.value.locationZone,
    ...(imagePreview.value ? { imageUrl: imagePreview.value } : {}),
  };
};

const buildPreviewDefect = (): Defect => ({
  defectId: -Date.now(),
  description: form.value.note || '-',
  severity: form.value.severity,
  status: 'pending_repair',
  ...(imagePreview.value ? { imageUrl: imagePreview.value } : {}),
  subCategories: buildLocalSubCategories(),
  ...(form.value.roomId
    ? { room: { roomId: form.value.roomId, roomName: roomOptions.value.find((r) => r.value === form.value.roomId)?.label ?? '' } }
    : {}),
  subRoom: form.value.subRoomId
    ? { subRoomId: form.value.subRoomId, roomName: subRoomOptions.value.find((r) => r.value === form.value.subRoomId)?.label ?? '' }
    : null,
  ...(form.value.floorId
    ? { floor: { floorId: form.value.floorId, label: floorOptions.value.find((f) => f.value === form.value.floorId)?.label ?? '' } }
    : {}),
  planId: form.value.planId,
  planX: form.value.planX,
  planY: form.value.planY,
  locationZone: form.value.locationZone,
});

const isSubmitting = ref(false);

const handleNext = async () => {
  if (step.value === 1) {
    if (!form.value.roomId) {
      $q.notify({
        message: t('inspection.addDefect.selectRoomTypeRequired'),
        color: 'negative',
        icon: 'warning',
      });
      return;
    }
    if (!form.value.floorId) {
      $q.notify({
        message: t('inspection.addDefect.selectFloorRequired'),
        color: 'negative',
        icon: 'warning',
      });
      return;
    }
    step.value = 2;
    return;
  }

  if (!form.value.severity) {
    $q.notify({
      message: t('inspection.addDefect.selectSeverityRequired'),
      color: 'negative',
      icon: 'warning',
    });
    return;
  }
  if (!form.value.jobType) {
    $q.notify({
      message: t('inspection.addDefect.selectJobTypeRequired'),
      color: 'negative',
      icon: 'warning',
    });
    return;
  }
  if (form.value.defectTypes.length === 0) {
    $q.notify({
      message: t('inspection.addDefect.selectDefectTypeRequired'),
      color: 'negative',
      icon: 'warning',
    });
    return;
  }

  if (!isEditMode.value && isDuplicateDefect()) {
    $q.notify({
      message: t('inspection.addDefect.duplicateDefect'),
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

  if (form.value.planId) {
    formData.append('planId', String(form.value.planId));
  }
  if (form.value.planX !== null && form.value.planX !== undefined) {
    formData.append('planX', String(form.value.planX));
  }
  if (form.value.planY !== null && form.value.planY !== undefined) {
    formData.append('planY', String(form.value.planY));
  }
  if (form.value.locationZone) {
    formData.append('locationZone', form.value.locationZone);
  }

  if (selectedFile.value) {
    if (pendingImageCompression) await pendingImageCompression;
    if (selectedFile.value) {
      formData.append('file', selectedFile.value);
    }
  }

  if (isEditMode.value) {
    if (isSubmitting.value) return;
    isSubmitting.value = true;
    const defectId = Number(defectIdFromQuery);
    // optimistic: patch หน้ารายการทันที แล้วออกจากหน้านี้เลย ไม่รอ backend ตอบกลับ
    patchDefectLocally(defectId);
    router.back();
    void inspectionStore.runDefectSync(defectId, false, roundId, () =>
      inspectionStore.updateDefect(defectId, formData),
    );
    isSubmitting.value = false;
    return;
  }

  // สร้างใหม่: เช็คเงื่อนไขผ่านแล้วแสดง placeholder + เคลียร์ฟอร์มให้กรอกตัวถัดไปได้ทันที
  // ส่วนการบันทึกลงหลังบ้านให้ทำงานต่อเบื้องหลังโดยไม่บล็อก UI (optimistic, retry ได้จากการ์ดถ้าพัง)
  const tempId = -Date.now();
  const previewDefect = buildPreviewDefect();

  imagePreview.value = null;
  selectedFile.value = null;
  form.value.planId = null;
  form.value.planX = null;
  form.value.planY = null;
  form.value.locationZone = null;
  step.value = 2;

  void inspectionStore.runDefectSync(
    tempId,
    true,
    roundId,
    () => inspectionStore.saveDefect(formData),
    previewDefect,
  );
};

const handleDelete = () => {
  $q.dialog({
    title: t('inspection.addDefect.confirmDeleteTitle'),
    message: t('inspection.addDefect.confirmDeleteMessage'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await inspectionStore.deleteDefect(Number(defectIdFromQuery));
        await inspectionStore.fetchDefects(roundId);
        $q.notify({
          message: t('inspection.addDefect.deleteSuccess'),
          color: 'positive',
          icon: 'check_circle',
        });
        router.back();
      } catch {
        $q.notify({
          message: t('inspection.addDefect.deleteError'),
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
  $q.loading.show({
    spinner: addDefectSpinner,
    spinnerColor: 'primary',
    spinnerSize: 70,
    backgroundColor: 'white',
  });
  try {
    await loadAddDefectData();
  } finally {
    $q.loading.hide();
  }
});

async function loadAddDefectData() {
  void inspectionStore.fetchInspectionMasterData(roundId);
  void fetchJobInfo();

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

      form.value.planId = defect.plan?.planId ?? defect.planId ?? null;
      form.value.planX =
        defect.planX !== null && defect.planX !== undefined
          ? Number(defect.planX)
          : null;
      form.value.planY =
        defect.planY !== null && defect.planY !== undefined
          ? Number(defect.planY)
          : null;
      form.value.locationZone = defect.locationZone ?? null;

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
}
</script>

<style scoped>
.detail-content {
  width: 100%;
  max-width: 480px;
}
@media (min-width: 768px) {
  .detail-content {
    max-width: 720px;
  }
}
@media (min-width: 1024px) {
  .detail-content {
    max-width: 1100px;
  }
}
@media (min-width: 1440px) {
  .detail-content {
    max-width: 1280px;
  }
}

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

.border-positive-subtle {
  border: 1px solid var(--q-positive) !important;
  background-color: #f0fdf4 !important;
}
</style>
