<template>
  <q-page class="update-repair-page bg-white">
    <div class="q-px-md q-pt-md q-pb-xl">

      <div class="text-caption text-grey-5 q-mb-xs">#{{ defect.code }}</div>
      <q-card flat bordered class="info-card q-mb-md">
        <q-card-section class="q-pa-sm">
          <div class="text-caption text-grey-6">ประเภทงาน</div>
          <div class="text-body2 text-weight-bold">{{ defect.jobType }}</div>
          <div class="text-caption text-grey-6 q-mt-xs">สถานที่</div>
          <div class="text-body2">{{ defect.location }}</div>
          <div class="row q-gutter-xs q-mt-xs">
            <q-chip v-for="tag in defect.tags" :key="tag" dense outline color="grey-6" size="sm">{{ tag }}</q-chip>
          </div>
        </q-card-section>
      </q-card>

      <!-- โหมด ผ่าน — แสดง before และ after -->
<template v-if="isPassed || isReadOnly">

  <div class="step-header row items-center justify-between q-mb-sm">
    <div class="text-subtitle2 text-weight-bold text-primary">ขั้นตอนที่ 1: รูปอ้างอิงก่อนซ่อม</div>
    <div class="text-caption text-grey-5">{{ defect.reportedAt }}</div>
  </div>
  <div class="q-mb-lg" style="position: relative;">
    <img
      :src="defect.beforeImage"
      style="width:100%; border-radius:14px; border:2px solid #1976D2; display:block; aspect-ratio:16/9; object-fit:cover;"
    />
    <div style="position:absolute; top:8px; left:8px;">
      <q-badge color="red" label="BEFORE" style="font-size:11px; font-weight:700;" />
    </div>
  </div>

  <div class="step-header q-mb-sm">
    <div class="text-subtitle2 text-weight-bold text-primary">ขั้นตอนที่ 2: รูปหลังแก้ไข</div>
  </div>
  <div class="q-mb-lg" style="position: relative;">
    <img
      :src="savedAfterImage || defect.beforeImage"
      style="width:100%; border-radius:14px; border:2px solid #4CAF50; display:block; aspect-ratio:16/9; object-fit:cover;"
    />
    <div style="position:absolute; top:8px; left:8px;">
      <q-badge color="green" label="AFTER" style="font-size:11px; font-weight:700;" />
    </div>
  </div>

  <div class="text-subtitle2 text-weight-bold q-mb-sm">บันทึกเพิ่มเติมจากผู้รับเหมา</div>
  <q-card flat bordered class="info-card">
    <q-card-section>
      <div class="text-body2 text-grey-8">{{ savedNote || '-' }}</div>
    </q-card-section>
  </q-card>

</template>
      <!-- ══════════════════════════════════════ -->
      <!-- โหมด edit (ยังไม่ได้ส่ง)              -->
      <!-- ══════════════════════════════════════ -->
      <template v-else>

        <div class="step-header row items-center justify-between q-mb-sm">
          <div class="text-subtitle2 text-weight-bold text-primary">ขั้นตอนที่ 1: รูปอ้างอิงก่อนซ่อม</div>
          <div class="text-caption text-grey-5">{{ defect.reportedAt }}</div>
        </div>
        <!-- Before Image โหมด edit -->
<div class="q-mb-lg" style="position: relative;">
  <img
    :src="defect.beforeImage"
    style="width:100%; border-radius:14px; border:2px solid #1976D2; display:block; aspect-ratio:16/9; object-fit:cover;"
  />
  <div style="position:absolute; top:8px; left:8px;">
    <q-badge color="red" label="BEFORE" style="font-size:11px; font-weight:700;" />
  </div>
</div>

        <div class="step-header q-mb-xs">
          <div class="text-subtitle2 text-weight-bold text-primary">ขั้นตอนที่ 2: ถ่ายรูปหลังแก้ไข</div>
          <div class="text-caption text-grey-6 q-mt-xs">ตรวจสอบให้แน่ใจว่าพื้นที่ซ่อมแซมแห้งและมองเห็นชัดเจน</div>
        </div>

        <div class="column items-center q-mb-md">
          <q-btn round color="primary" size="xl" style="width:80px; height:80px;" @click="triggerCamera">
            <q-icon name="photo_camera" size="36px" />
          </q-btn>
          <div class="camera-label q-mt-xs">แตะเพื่อถ่ายรูป</div>
        </div>

        <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFileChange" />

        <div class="q-mb-lg" style="position: relative;">
          <template v-if="afterImageUrl">
            <img :src="afterImageUrl" style="width:100%; border-radius:14px; border:2px solid #4CAF50; display:block; aspect-ratio:16/9; object-fit:cover;" />
            <div style="position:absolute; top:8px; left:8px;">
              <q-badge color="green" label="AFTER" style="font-size:11px; font-weight:700;" />
            </div>
            <div style="position:absolute; top:4px; right:4px;">
              <q-btn round flat icon="close" color="white" size="sm" @click="clearAfterImage" />
            </div>
          </template>
          <div v-else class="after-placeholder column items-center justify-center" @click="triggerCamera">
            <q-icon name="image" size="36px" color="grey-4" />
            <div class="text-caption text-grey-5 q-mt-xs">รอการแสดงผลรูปภาพ</div>
          </div>
        </div>

        <div class="text-subtitle2 text-weight-bold q-mb-sm">บันทึกเพิ่มเติมจากผู้รับเหมา</div>
        <q-input v-model="note" type="textarea" outlined rows="4" placeholder="e.g., Replaced main valve and sealed joint..." bg-color="grey-1" style="border-radius:12px;" />

      </template>

    </div>

    <!-- Submit Button (แสดงเฉพาะโหมด edit) -->
    <div v-if="!isReadOnly" class="fixed-bottom q-pa-md">
      <div v-if="submitError" class="text-negative text-caption q-mb-xs text-center">{{ submitError }}</div>
      <q-btn
        unelevated color="primary" icon="assignment_turned_in"
        label="ส่งให้วิศวกรตรวจสอบ" class="full-width submit-btn"
        size="md" :loading="isSubmitting" :disable="!afterImageUrl || isSubmitting" @click="submitRepair"
      />
    </div>

    <!-- Success Dialog -->
    <q-dialog v-model="showSuccess" persistent>
      <q-card style="min-width:280px; border-radius:16px;">
        <q-card-section class="column items-center q-pa-lg">
          <q-icon name="check_circle" color="green" size="56px" class="q-mb-sm" />
          <div class="text-h6 text-weight-bold q-mb-xs">ส่งงานสำเร็จ</div>
          <div class="text-body2 text-grey-6">รอวิศวกรตรวจสอบ</div>
        </q-card-section>
        <q-card-actions align="center" class="q-pb-md">
          <q-btn unelevated color="primary" label="ตกลง" style="min-width:120px; border-radius:10px;" @click="confirmSuccess" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useRepairDetail } from 'src/stores/useContractorRepairDetail'
import { useLinkAccess } from 'src/stores/useLinkAccess'

const route     = useRoute()
const { isCustomerViewOnly } = useLinkAccess()
const defectId  = Number(route.params.id)
const fileInput = ref<HTMLInputElement>()

//  destructure ก่อน
const {
  defect,
  afterImageUrl,
  afterImageFile,
  note,
  submitRepair,
  isSubmitting,
  submitError,
  showSuccess,
  confirmSuccess,
  savedAfterImage,
  savedNote,
} = useRepairDetail(defectId)

//  computed หลัง destructure
// FIXED = ซ่อมแล้ว (รอวิศวกรตรวจ), PASS = ผ่านการตรวจซ้ำแล้ว — ทั้งสองกรณีแก้ไขซ้ำไม่ได้แล้ว
const isReadOnly = computed(
  () => isCustomerViewOnly.value || defect.value.status === 'repaired' || defect.value.status === 'verified',
)
const isPassed   = computed(() => defect.value.status === 'verified')

const onFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  afterImageFile.value = file
  const reader = new FileReader()
  reader.onload = () => { afterImageUrl.value = reader.result as string }
  reader.readAsDataURL(file)
}

const triggerCamera   = () => fileInput.value?.click()
const clearAfterImage = () => { afterImageUrl.value = ''; afterImageFile.value = null }
</script>

<style scoped>
.update-repair-page { max-width: 480px; margin: 0 auto; }

.step-header { margin-bottom: 8px; }

.before-img-wrap { border-radius: 14px; overflow: hidden; }

.camera-label {
  font-size: 12px;
  color: #fff;
  background: #1976D2;
  padding: 2px 12px;
  border-radius: 20px;
  font-weight: 600;
}

.after-placeholder {
  width: 100%;
  height: 180px;
  border: 2px dashed #bdbdbd;
  border-radius: 14px;
  background: #f9f9f9;
  cursor: pointer;
}

.submit-btn {
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  height: 52px;
}
</style>