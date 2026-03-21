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
      <div v-if="step === 1" class="col column">
        <div class="text-h6 text-weight-bold text-primary">รายละเอียดห้อง</div>
        <div class="text-caption text-grey-7 q-mb-lg">กรุณากรอกรายละเอียดห้อง</div>
        <div class="column q-gutter-y-md">
          <div class="row no-wrap items-start">
            <q-icon name="meeting_room" size="sm" color="primary" class="q-pt-sm q-mr-sm" />
            <div class="col column q-gutter-y-md">
              <q-select
                outlined
                dense
                v-model="form.roomType"
                :options="['ห้องนอน', 'ห้องน้ำ', 'ห้องนั่งเล่น']"
                label="ประเภทห้อง"
              />
              <q-select
                outlined
                dense
                v-model="form.subRoomType"
                :options="['-']"
                label="ประเภทห้องย่อย"
              />
            </div>
          </div>
          <div class="row no-wrap items-start">
            <q-icon name="layers" size="sm" color="primary" class="q-pt-sm q-mr-sm" />
            <div class="col">
              <q-select
                outlined
                dense
                v-model="form.floor"
                :options="['ชั้น 1', 'ชั้น 2']"
                label="ชั้น"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-if="step === 2" class="col column">
        <div class="text-h6 text-weight-bold text-primary">รายละเอียดงาน</div>
        <div class="text-caption text-grey-7 q-mb-lg">กรุณากรอกรายละเอียดงาน</div>

        <div class="column q-gutter-y-md">
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
                style="max-width: 100%"
              >
                <template v-slot:selected-item="scope">
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

const router = useRouter();
const route = useRoute();
const inspectionStore = useInspectionStore();
const roundId = route.params.roundId;
const step = ref<number>(1);

interface DefectForm {
  roomType: string | null;
  subRoomType: string | null;
  floor: string | null;
  jobType: number | null;
  defectTypes: number[];
  note: string;
}

const form = ref<DefectForm>({
  roomType: null,
  subRoomType: null,
  floor: null,
  jobType: null,
  defectTypes: [],
  note: '',
});

// ดึง Category จาก Store มาทำ Options
const categoryOptions = computed(() =>
  inspectionStore.categories.map((c) => ({
    label: c.name,
    value: c.categoryId,
  })),
);

const onCategoryChange = (val: number | null) => {
  form.value.jobType = val; // เก็บ ID ลงใน form
  form.value.defectTypes = []; // ล้างค่าตำหนิเก่าทุกครั้งที่เปลี่ยนประเภทงาน
};

// ดึง Sub-Category โดยกรองตาม Category ที่เลือกใน jobType
const subCategoryOptions = computed(() => {
  if (!form.value.jobType) return [];
  return inspectionStore.getSubByCategoryId(form.value.jobType).map((s) => ({
    label: s.name,
    value: s.subCategoryId,
  }));
});

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
    } catch (error) {
      console.error('Compression Error:', error);
      selectedFile.value = file;
      imagePreview.value = URL.createObjectURL(file);
    }
  }
  target.value = '';
};

// --- Navigation & Submit ---
const handleBack = () => {
  if (step.value === 2) {
    step.value = 1;
  } else {
    router.back();
  }
};

const handleNext = async () => {
  if (step.value === 1) {
    step.value = 2;
  } else {
    try {
      const formData = new FormData();
      formData.append('roundId', String(roundId));
      formData.append('description', form.value.note || '');
      formData.append('status', 'ไม่ผ่าน'); //
      if (form.value.defectTypes && form.value.defectTypes.length > 0) {
        // ส่ง ID ของตัวแรกที่เลือก เพื่อให้ตรงกับ DB ที่เป็นประเภท int
        formData.append('subCategoryId', String(form.value.defectTypes[0]));
      }

      if (selectedFile.value) {
        formData.append('file', selectedFile.value);
        formData.append('imagefileSize', String(selectedFile.value.size)); //
      }

      await inspectionStore.saveDefect(formData);
      alert('บันทึกข้อมูลสำเร็จ!');
      router.back();
    } catch (err) {
      console.error('Save error:', err); // แก้ warning unused var
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  }
};

onMounted(() => {
  if (roundId) {
    void inspectionStore.fetchInspectionMasterData(String(roundId));
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
