<template>
  <q-page class="row justify-center bg-grey-1" style="height: 100dvh; overflow: hidden">
    <div class="detail-content defect-layout column no-wrap" style="height: 100%">
    <div class="defect-image relative-position flex flex-center col-auto bg-grey-3">
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
      class="defect-form bg-white col q-pa-lg flex column no-wrap shadow-up-2"
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
                :loading="isLoadingMaster"
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
                :loading="isLoadingMaster"
                @filter="filterFloors"
                @update:model-value="onFloorChange"
              />
              <!-- เลือก "อื่นๆ" แล้วต้องพิมพ์ชื่อชั้นจริง backend จะหาหรือสร้างชั้นชื่อนี้ให้ -->
              <q-input
                v-if="isOtherFloorSelected"
                v-model="form.customFloor"
                outlined
                dense
                autofocus
                class="q-mt-md"
                maxlength="50"
                :label="t('inspection.addDefect.customFloor')"
                :placeholder="t('inspection.addDefect.customFloorPlaceholder')"
                :disable="isLocked"
                :error="customFloorError"
                :error-message="t('inspection.addDefect.customFloorRequired')"
                @update:model-value="customFloorError = false"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: รายละเอียดงาน -->
      <div v-if="step === 2" class="col-auto column no-wrap">
        <div class="text-h6 text-weight-bold text-primary">{{ t('inspection.addDefect.jobDetailsTitle') }}</div>
        <div class="text-caption text-grey-7" :class="locationSummary ? 'q-mb-sm' : 'q-mb-lg'">{{ t('inspection.addDefect.jobDetailsSubtitle') }}</div>
        <!-- ห้อง/ชั้นที่จะบันทึก (มักมาจากค่าล่าสุด) ให้เห็นชัดและกลับไปเปลี่ยนได้ในแตะเดียว -->
        <div v-if="locationSummary" class="row items-center no-wrap q-mb-md">
          <q-chip dense outline color="primary" icon="place" class="q-ml-none ellipsis">{{ locationSummary }}</q-chip>
          <q-btn
            v-if="!isLocked"
            flat
            dense
            no-caps
            color="primary"
            :label="t('inspection.addDefect.changeLocation')"
            @click="step = 1"
          />
        </div>
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
                :loading="isLoadingMaster"
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

      <div v-if="duplicateError" class="text-negative text-caption text-weight-medium q-mt-md" role="alert">
        {{ t('inspection.addDefect.duplicateNeedsPhoto') }}
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
          :disable="isSubmitting || (isLocked && step === 2)"
          class="text-weight-bold"
          style="border-radius: 8px; padding: 8px 24px"
          @click="handleNext"
        />
      </div>
    </div>
    </div>

    <ImageAnnotatorDialog
      v-if="imagePreview && annotatorRequested"
      v-model="showAnnotator"
      :image-url="imagePreview"
      @save="onAnnotatorSave"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue';
import { useRouter, useRoute } from 'vue-router';
// โหลด fabric.js (ก้อนใหญ่) เฉพาะตอนผู้ใช้เปิดเครื่องมือวาดจริงๆ ไม่ต้องโหลดทุกครั้งที่เปิดหน้า
const ImageAnnotatorDialog = defineAsyncComponent(() => import('src/components/ImageAnnotatorDialog.vue'));
import { useInspectionStore } from 'src/stores/useInspection';
import { useRoundLock } from 'src/composables/useRoundLock';
import { api } from 'src/boot/axios';
import type { Defect } from 'src/models';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import imageCompression from 'browser-image-compression';
import PlanPositionDialog from 'src/components/PlanPositionDialog.vue';
import { localizedName } from 'src/composables/useLocalizedField';

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
  customFloor: string; // ชื่อชั้นที่พิมพ์เอง ใช้เมื่อเลือก "ชั้นอื่นๆ"
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
  customFloor: '',
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
    const round = await inspectionStore.getRound(roundId);
    if (round?.job?.jobId) {
      jobId.value = round.job.jobId;
    }
  } catch (err) {
    console.error('Failed to fetch job info for round', err);
  }
};

// ── Master data ───────────────────────────────────────────────

// ห้อง/ห้องย่อย/ชั้น/หมวด มาจาก cache ใน store (โหลดครั้งเดียวต่อ session) ฟอร์มใช้งานได้ทันที
const isLoadingMaster = computed(() => inspectionStore.isLoading);
const roomOptions = computed(() => inspectionStore.roomOptions);
const subRoomOptions = computed(() => inspectionStore.subRoomOptions);
// ตัวเลือก "ชั้นอื่นๆ....." ในฐานข้อมูลแสดงเป็น "อื่นๆ (ระบุเอง)" ให้รู้ว่าต้องพิมพ์ชื่อชั้นต่อ
const floorOptions = computed(() =>
  inspectionStore.floorOptions.map((o) =>
    o.isOther ? { ...o, label: t('inspection.addDefect.floorOther') } : o,
  ),
);

const isOtherFloorSelected = computed(
  () => floorOptions.value.find((o) => o.value === form.value.floorId)?.isOther === true,
);
const customFloorError = ref(false);

// ชื่อชั้นที่จะแสดง (chip, การ์ดระหว่างบันทึก) = ชื่อที่พิมพ์ ถ้าเลือก "อื่นๆ"
const currentFloorLabel = () =>
  isOtherFloorSelected.value
    ? form.value.customFloor.trim()
    : floorOptions.value.find((f) => f.value === form.value.floorId)?.label;

// ── Searchable dropdowns ──────────────────────────────────────
// q-select ต้องผูกกับ ref แยกที่ filter แล้ว ไม่ใช่ผูกตรงกับ list ต้นทาง
type SelectOption = { value: number; label: string; isOther?: boolean };

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

const onRoomChange = async () => {
  // ไม่ต้อง clear subRoomId แล้ว เพราะมันอิสระ
  // แต่สามารถ clear floorId ถ้าต้องการ (หรือไม่ clear ก็ได้)
};

const onSubRoomChange = () => {
  // ไม่ต้อง clear floorId
};

const onFloorChange = () => {
  // เปลี่ยนไปชั้นปกติแล้ว ชื่อที่เคยพิมพ์ไว้ไม่ใช้แล้ว
  if (!isOtherFloorSelected.value) form.value.customFloor = '';
  customFloorError.value = false;
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
// บันทึกซ้ำโดยไม่มีรูปใหม่ (toast ถูกปิดทั้งแอป จึงแจ้งในหน้า) หายเมื่อเลือกรูปหรือแก้ฟอร์ม
const duplicateError = ref(false);
watch([form, selectedFile], () => (duplicateError.value = false), { deep: true });
const showAnnotator = ref(false);
// mount ตัววาด (และโหลด fabric) หลังผู้ใช้เปิดครั้งแรกเท่านั้น
const annotatorRequested = ref(false);
watch(showAnnotator, (open) => {
  if (open) annotatorRequested.value = true;
});

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
  const floorLabel = currentFloorLabel();

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
    ? { floor: { floorId: form.value.floorId, label: currentFloorLabel() ?? '' } }
    : {}),
  planId: form.value.planId,
  planX: form.value.planX,
  planY: form.value.planY,
  locationZone: form.value.locationZone,
});

const isSubmitting = ref(false);

const locationSummary = computed(() => {
  const parts = [
    roomOptions.value.find((r) => r.value === form.value.roomId)?.label,
    subRoomOptions.value.find((r) => r.value === form.value.subRoomId)?.label,
    currentFloorLabel(),
  ].filter((part): part is string => !!part);
  return parts.join(' · ');
});

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
    // แจ้งในช่องเลย (toast ถูกปิดทั้งแอปใน boot/notify.ts จึงไม่ขึ้น)
    if (isOtherFloorSelected.value && !form.value.customFloor.trim()) {
      customFloorError.value = true;
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

  // โหมดสร้าง: กันกดบันทึกซ้ำระหว่างรอบีบอัดรูป (await ด้านล่าง) ไม่งั้นกด 2 ครั้งพร้อมรูปจะสร้าง 2 รายการ
  // (ตอนมีรูป ตัวเช็คซ้ำถูกข้าม) ปล่อย guard หลังรีเซ็ตฟอร์มแล้ว
  if (!isEditMode.value) {
    if (isSubmitting.value) return;
    isSubmitting.value = true;
  }

  // ซ้ำได้เฉพาะเมื่อแนบรูปใหม่ (บันทึกรายละเอียดเดิมแต่คนละรูป) ส่วนไม่มีรูปยังบล็อก กันกดบันทึกซ้ำโดยไม่ตั้งใจ
  if (!isEditMode.value && !selectedFile.value && isDuplicateDefect()) {
    isSubmitting.value = false;
    duplicateError.value = true;
    return;
  }

  const formData = new FormData();
  formData.append('roundId', String(roundId));
  formData.append('roomId', String(form.value.roomId));
  if (form.value.subRoomId) {
    formData.append('subRoomId', String(form.value.subRoomId));
  }
  formData.append('floorId', String(form.value.floorId));
  if (isOtherFloorSelected.value) {
    formData.append('customFloorLabel', form.value.customFloor.trim());
  }
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
    try {
      if (pendingImageCompression) await pendingImageCompression;
    } catch (error) {
      if (!isEditMode.value) isSubmitting.value = false;
      throw error;
    }
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

  // คงห้อง/ชั้น/หมวด/แปลน/ประเภทตำหนิ/หมายเหตุไว้สำหรับจุดถัดไป (มักเป็นตำหนิแบบเดียวกันที่ต่างกันแค่รูป)
  // ล้างเฉพาะรูปกับหมุด ซ้ำได้ถ้าแนบรูปใหม่ แต่บันทึกซ้ำโดยไม่มีรูปจะถูกบล็อกโดยตัวเช็คซ้ำ
  if (form.value.roomId && form.value.floorId) {
    inspectionStore.rememberLocation(roundId, {
      roomId: form.value.roomId,
      subRoomId: form.value.subRoomId,
      floorId: form.value.floorId,
      customFloorLabel: isOtherFloorSelected.value ? form.value.customFloor.trim() : null,
      categoryId: form.value.jobType,
      planId: form.value.planId,
    });
  }
  imagePreview.value = null;
  selectedFile.value = null;
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
  isSubmitting.value = false;
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
        const deletedId = Number(defectIdFromQuery);
        await inspectionStore.deleteDefect(deletedId);
        inspectionStore.defects = inspectionStore.defects.filter((d) => d.defectId !== deletedId);
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

// ไม่มี loader เต็มจอแล้ว ฟอร์มขึ้นทันที ส่วน dropdown แสดง loading เองระหว่าง master data ยังมาไม่ครบ
// (ครั้งแรกของ session เท่านั้น ครั้งถัดไปมาจาก cache)
onMounted(() => {
  void loadAddDefectData();
});

async function loadAddDefectData() {
  void inspectionStore.fetchInspectionMasterData();
  void fetchJobInfo();

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
    const last = inspectionStore.lastLocation(roundId);
    if (roomId) {
      form.value.roomId = Number(roomId);
      if (subRoomId) form.value.subRoomId = Number(subRoomId);
      if (floorId) form.value.floorId = Number(floorId);
      step.value = 2;
    } else if (last) {
      // เปิดจากปุ่มเพิ่มของหน้ารวม: ใช้ห้อง/ชั้นล่าสุดที่บันทึก เปลี่ยนได้จาก chip ด้านบนของขั้นที่ 2
      form.value.roomId = last.roomId;
      form.value.subRoomId = last.subRoomId;
      form.value.floorId = last.floorId;
      form.value.customFloor = last.customFloorLabel ?? '';
      step.value = 2;
    }
    if (last) {
      form.value.jobType = last.categoryId;
      // แปลนเดิมใช้ได้เฉพาะเมื่อยังอยู่ชั้นเดิม ไม่งั้นให้เลือกใหม่ตามชั้น
      if (form.value.floorId === last.floorId) form.value.planId = last.planId;
    }
  }
}
</script>

<style scoped>
.defect-image {
  height: 40vh;
}
.defect-form {
  border-radius: 24px 24px 0 0;
  margin-top: -24px;
  z-index: 1;
  overflow-y: auto;
}

.detail-content {
  width: 100%;
}

/* จอแนวนอน: รูปอยู่ซ้าย รายละเอียดอยู่ขวา */
@media (orientation: landscape) {
  .defect-layout {
    flex-direction: row;
  }
  .defect-image {
    height: 100%;
    flex: 0 0 50%;
    width: 50%;
  }
  .defect-form {
    flex: 1 1 0;
    min-width: 0;
    margin-top: 0;
    border-radius: 0;
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
