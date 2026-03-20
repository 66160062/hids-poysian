<template>
  <q-page class="bg-grey-2 window-height column no-wrap">

    <div class="relative-position flex flex-center col-auto bg-grey-3" style="height: 45vh;">

      <q-btn flat round dense icon="arrow_back_ios" color="primary" class="absolute-top-left q-mt-md q-ml-sm"
        @click="handleBack" style="z-index: 10;" />

      <q-img v-if="imagePreview" :src="imagePreview" class="fit" fit="cover" />
      <div v-else class="column items-center text-grey-5">
        <q-icon name="image" size="80px" color="grey-4" />
        <div class="text-subtitle1 text-weight-medium q-mt-sm">ไม่มีรูปภาพ</div>
      </div>

      <div class="absolute-bottom-right q-pa-md column q-gutter-y-sm" style="margin-bottom: 20px; z-index: 10;">
        <q-btn round color="primary" icon="photo_library" size="md" class="shadow-3" @click="triggerGallery" />
        <q-btn round color="primary" icon="photo_camera" size="md" class="shadow-3" @click="triggerCamera" />
      </div>

      <input type="file" ref="galleryInput" accept="image/*" style="display: none" @change="onFileSelected" />
      <input type="file" ref="cameraInput" accept="image/*" capture="environment" style="display: none"
        @change="onFileSelected" />
    </div>

    <div class="bg-white col q-pa-lg flex column shadow-up-2"
      style="border-radius: 24px 24px 0 0; margin-top: -24px; z-index: 1;">

      <div v-if="step === 1" class="col column">
        <div class="text-h6 text-weight-bold text-primary">รายละเอียดห้อง</div>
        <div class="text-caption text-grey-7 q-mb-lg">กรุณากรอกรายละเอียดห้อง</div>

        <div class="column q-gutter-y-md">
          <div class="row no-wrap items-start">
            <div class="q-pt-sm" style="width: 40px">
              <q-icon name="meeting_room" size="sm" color="primary" />
            </div>
            <div class="col column q-gutter-y-md">
              <q-select outlined dense v-model="form.roomType" :options="['ห้องนอน', 'ห้องน้ำ', 'ห้องนั่งเล่น']"
                label="ประเภทห้อง" />
              <q-select outlined dense v-model="form.subRoomType" :options="['-']" label="ประเภทห้องย่อย" />
            </div>
          </div>

          <div class="row no-wrap items-start">
            <div class="q-pt-sm" style="width: 40px">
              <q-icon name="layers" size="sm" color="primary" />
            </div>
            <div class="col">
              <q-select outlined dense v-model="form.floor" :options="['ชั้น 1', 'ชั้น 2']" label="ชั้น" />
            </div>
          </div>
        </div>
      </div>

      <div v-if="step === 2" class="col column">
        <div class="text-h6 text-weight-bold text-primary">รายละเอียดงาน</div>
        <div class="text-caption text-grey-7 q-mb-lg">กรุณากรอกรายละเอียดงาน</div>

        <div class="column q-gutter-y-md">
          <div class="row no-wrap items-start">
            <div class="q-pt-sm" style="width: 40px">
              <q-icon name="work_outline" size="sm" color="primary" />
            </div>
            <div class="col column q-gutter-y-md">
              <q-select outlined dense v-model="form.jobType" :options="['ผนัง', 'พื้น', 'ฝ้าเพดาน']"
                label="ประเภทงาน" />
              <q-select outlined dense multiple use-chips v-model="form.defectTypes"
                :options="['สีด่าง', 'ร้าว', 'ผิวไม่เสมอ']" label="เลือกประเภทตำหนิ (เลือกได้หลายรายการ)" />
            </div>
          </div>

          <div class="row no-wrap items-start">
            <div class="q-pt-sm" style="width: 40px">
              <q-icon name="edit_note" size="sm" color="primary" />
            </div>
            <div class="col">
              <q-input outlined dense type="textarea" v-model="form.note" label="หมายเหตุ" rows="3" />
            </div>
          </div>
        </div>
      </div>

      <div class="row justify-between items-end q-mt-auto q-pt-md">

        <div class="column">
          <div class="text-caption text-primary text-weight-bold q-mb-xs">หน้าที่ {{ step }}/2</div>
          <div class="row q-gutter-x-xs">
            <div :class="step === 1 ? 'bg-primary' : 'bg-grey-4'" style="width: 16px; height: 4px; border-radius: 2px;">
            </div>
            <div :class="step === 2 ? 'bg-primary' : 'bg-grey-4'" style="width: 16px; height: 4px; border-radius: 2px;">
            </div>
          </div>
        </div>

        <q-btn color="primary" :label="step === 1 ? 'ถัดไป' : 'บันทึก'" :icon-right="step === 1 ? 'chevron_right' : ''"
          class="text-weight-bold" style="border-radius: 8px; padding: 8px 24px;" @click="handleNext" />

      </div>

    </div>
  </q-page>
</template>

<script setup lang="ts">
import imageCompression from 'browser-image-compression';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const step = ref<number>(1);
const form = ref({
  roomType: null,
  subRoomType: null,
  floor: null,
  jobType: null,
  defectTypes: [],
  note: ''
});

const imagePreview = ref<string | null>(null);
const selectedFile = ref<File | null>(null);

const galleryInput = ref<HTMLInputElement | null>(null);
const cameraInput = ref<HTMLInputElement | null>(null);

const triggerGallery = () => {
  galleryInput.value?.click();
};

const triggerCamera = () => {
  cameraInput.value?.click();
};

const onFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    
    try {
      const options = {
        maxSizeMB: 1,             // ขนาดไฟล์สูงสุดไม่เกิน 1 MB (ปรับได้ตามต้องการ)
        maxWidthOrHeight: 1024,   // ความกว้าง/สูงสูงสุด 1024px (ปรับได้)
        useWebWorker: true,       // ให้ทำงานเบื้องหลัง แอปจะได้ไม่กระตุกตอนบีบอัด
      };

      console.log(`ขนาดรูปก่อนบีบอัด: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

      // 🔄 สั่งบีบอัดรูปภาพ!
      const compressedFile = await imageCompression(file, options);

      console.log(`ขนาดรูปหลังบีบอัด: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

      // ✅ เก็บรูปที่บีบอัดแล้วไปใช้งานต่อ
      selectedFile.value = compressedFile;
      imagePreview.value = URL.createObjectURL(compressedFile);

    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการบีบอัดรูปภาพ:', error);
      // ถ้าบีบอัดพัง (ซึ่งเกิดยากมาก) ก็ใช้ไฟล์รูปต้นฉบับแทน
      selectedFile.value = file;
      imagePreview.value = URL.createObjectURL(file);
    }
  }

  // ล้างค่าเพื่อให้เลือกรูปเดิมซ้ำได้ในครั้งต่อไป
  target.value = '';
};

// ======================================

const handleBack = () => {
  if (step.value === 2) {
    step.value = 1;
  } else {
    router.back();
  }
};

const handleNext = () => {
  if (step.value === 1) {
    step.value = 2;
  } else {
    // ลองเปิด Console ดู จะเห็นทั้งข้อมูลฟอร์มและไฟล์ภาพที่เลือกครับ
    console.log('ข้อมูลฟอร์ม:', form.value);
    console.log('ไฟล์รูปภาพ:', selectedFile.value);

    alert('บันทึกข้อมูลสำเร็จ!');
    router.back();
  }
};
</script>

<style scoped>
:deep(.q-field--dense .q-field__control) {
  height: 40px;
}

:deep(.q-field--dense .q-field__marginal) {
  height: 40px;
}
</style>
