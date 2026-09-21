<template>
  <q-page class="update-repair-page bg-white">
    <div class="q-px-md q-pt-md q-pb-xl">

      <div class="row items-center justify-between q-mb-xs">
        <div class="text-caption text-grey-5 text-weight-medium">#{{ defect.code }}</div>
        <q-badge
          :color="statusColor(defect.status)"
          text-color="white"
          class="q-px-sm text-weight-bold"
          style="font-size: 10px; padding: 4px 8px"
        >
          {{ defectStatusLabel(defect.status) }}
        </q-badge>
      </div>
      <q-card flat bordered class="info-card q-mb-md">
        <q-card-section class="q-pa-md">
          <div class="detail-row">
            <div class="col">
              <div class="detail-label">{{ t('contractor.updateRepair.location') }}</div>
              <div class="detail-value">{{ defect.location }}</div>
            </div>
          </div>

          <div class="detail-row q-mt-sm">
            <div class="col">
              <div class="detail-label">{{ t('contractor.updateRepair.jobType') }}</div>
              <div class="detail-value">{{ defect.jobType }}</div>
            </div>
          </div>

          <div v-if="defect.severity" class="detail-row q-mt-sm">
            <div class="col">
              <div class="detail-label">{{ t('contractor.updateRepair.severity') }}</div>
              <div class="detail-value">{{ defect.severity }}</div>
            </div>
          </div>

          <template v-if="defect.tags?.length">
            <div class="detail-label q-mt-sm q-mb-md">{{ t('contractor.updateRepair.items') }}</div>
            <div class="row q-gutter-xs">
              <q-chip
                v-for="tag in defect.tags"
                :key="tag"
                dense
                color="blue-1"
                text-color="primary"
                class="text-weight-bold q-ma-none"
                size="sm"
              >
                {{ tag }}
              </q-chip>
            </div>
          </template>

          <template v-if="defect.description">
            <div class="detail-label q-mt-sm q-mb-xs">{{ t('contractor.updateRepair.inspectorNote') }}</div>
            <div class="text-body2 text-grey-8">{{ defect.description }}</div>
          </template>

          <!-- Plan Position Button -->
          <div v-if="defect.planId" class="q-mt-sm">
            <q-btn
              flat
              dense
              no-caps
              size="sm"
              color="primary"
              icon="place"
              :label="t('components.planPosition.viewButton')"
              class="bg-blue-1 text-primary q-px-sm"
              style="border-radius: 6px; font-weight: 500;"
              @click="showPlanDialog = true"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- โหมด ผ่าน — แสดง before และ after -->
      <template v-if="isPassed || isReadOnly">
        <div class="step-header row items-center justify-between q-mb-sm">
          <div class="text-subtitle2 text-weight-bold text-primary">{{ t('contractor.updateRepair.step1Title') }}</div>
          <div class="text-caption text-grey-5">{{ defect.reportedAt }}</div>
        </div>
        <div class="q-mb-lg" style="position: relative;">
          <img
            :src="defect.beforeImage"
            class="repair-photo cursor-pointer"
            style="border:2px solid #1976D2;"
            @click="openImageViewer(defect.beforeImage)"
          />
          <div style="position:absolute; top:8px; left:8px;">
            <q-badge color="red" :label="t('common.photo.before')" style="font-size:11px; font-weight:700;" />
          </div>
        </div>

        <div class="step-header q-mb-sm">
          <div class="text-subtitle2 text-weight-bold text-primary">{{ t('contractor.updateRepair.step2TitleReadonly') }}</div>
        </div>
        <div class="q-mb-lg" style="position: relative;">
          <img
            :src="savedAfterImage || defect.beforeImage"
            class="repair-photo cursor-pointer"
            style="border:2px solid #4CAF50;"
            @click="openImageViewer(savedAfterImage || defect.beforeImage)"
          />
          <div style="position:absolute; top:8px; left:8px;">
            <q-badge color="green" :label="t('common.photo.after')" style="font-size:11px; font-weight:700;" />
          </div>
        </div>

        <div class="text-subtitle2 text-weight-bold q-mb-sm">{{ t('contractor.updateRepair.notesTitle') }}</div>
        <q-card flat bordered class="info-card">
          <q-card-section>
            <div class="text-body2 text-grey-8">{{ savedNote || '-' }}</div>
          </q-card-section>
        </q-card>
      </template>
      <!-- โหมด edit (ยังไม่ได้ส่ง) -->
      <template v-else>
        <div class="step-header row items-center justify-between q-mb-sm">
          <div class="text-subtitle2 text-weight-bold text-primary">{{ t('contractor.updateRepair.step1Title') }}</div>
          <div class="text-caption text-grey-5">{{ defect.reportedAt }}</div>
        </div>
        <!-- Before Image โหมด edit -->
        <div class="q-mb-lg" style="position: relative;">
          <img
            :src="defect.beforeImage"
            class="repair-photo cursor-pointer"
            style="border:2px solid #1976D2;"
            @click="openImageViewer(defect.beforeImage)"
          />
          <div style="position:absolute; top:8px; left:8px;">
            <q-badge color="red" :label="t('common.photo.before')" style="font-size:11px; font-weight:700;" />
          </div>
        </div>

        <div class="step-header q-mb-xs">
          <div class="text-subtitle2 text-weight-bold text-primary">{{ t('contractor.updateRepair.step2TitleEdit') }}</div>
          <div class="text-caption text-grey-6 q-mt-xs">{{ t('contractor.updateRepair.step2Hint') }}</div>
        </div>

        <div class="column items-center q-mb-md">
          <q-btn round color="primary" size="xl" style="width:80px; height:80px;" @click="triggerCamera">
            <q-icon name="photo_camera" size="36px" />
          </q-btn>
          <div class="camera-label q-mt-xs">{{ t('contractor.updateRepair.tapToCapture') }}</div>
        </div>

        <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFileChange" />

        <div class="q-mb-lg" style="position: relative;">
          <template v-if="afterImageUrl">
            <img
              :src="afterImageUrl"
              class="repair-photo cursor-pointer"
              style="border:2px solid #4CAF50;"
              @click="openImageViewer(afterImageUrl)"
            />
            <div style="position:absolute; top:8px; left:8px;">
              <q-badge color="green" :label="t('common.photo.after')" style="font-size:11px; font-weight:700;" />
            </div>
            <div style="position:absolute; top:4px; right:4px;">
              <q-btn round flat icon="close" color="white" size="sm" @click.stop="clearAfterImage" />
            </div>
          </template>
          <div
            v-else
            class="after-placeholder column items-center justify-center"
            tabindex="0"
            role="button"
            @click="triggerCamera"
            @keyup.enter="triggerCamera"
          >
            <q-icon name="image" size="36px" color="grey-4" />
            <div class="text-caption text-grey-5 q-mt-xs">{{ t('contractor.updateRepair.noImagePlaceholder') }}</div>
          </div>
        </div>

        <div class="text-subtitle2 text-weight-bold q-mb-sm">{{ t('contractor.updateRepair.notesTitle') }}</div>
        <q-input v-model="note" type="textarea" outlined rows="4" :placeholder="t('contractor.updateRepair.notePlaceholder')" bg-color="grey-1" style="border-radius:12px;" />

      </template>

    </div>

    <!-- Submit Button (แสดงเฉพาะโหมด edit) -->
    <div v-if="!isReadOnly" class="fixed-bottom q-pa-md">
      <div v-if="submitError" class="text-negative text-caption q-mb-xs text-center">{{ submitError }}</div>
      <q-btn
        unelevated color="primary" icon="assignment_turned_in"
        :label="t('contractor.updateRepair.submit')" class="full-width submit-btn"
        size="md" :loading="isSubmitting" :disable="!afterImageUrl || isSubmitting" @click="submitRepair"
      />
    </div>

    <!-- Success Dialog -->
    <q-dialog v-model="showSuccess" persistent>
      <q-card style="min-width:280px; border-radius:16px;">
        <q-card-section class="column items-center q-pa-lg">
          <q-icon name="check_circle" color="green" size="56px" class="q-mb-sm" />
          <div class="text-h6 text-weight-bold q-mb-xs">{{ t('contractor.updateRepair.successTitle') }}</div>
          <div class="text-body2 text-grey-6">{{ t('contractor.updateRepair.successSubtitle') }}</div>
        </q-card-section>
        <q-card-actions align="center" class="q-pb-md">
          <q-btn unelevated color="primary" :label="t('contractor.updateRepair.ok')" style="min-width:120px; border-radius:10px;" @click="confirmSuccess" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Image Viewer Dialog (กดรูปเพื่อดูเต็มจอ) -->
    <q-dialog v-model="showImageViewer" maximized transition-show="fade" transition-hide="fade">
      <q-card class="bg-black text-white column">
        <q-toolbar class="bg-transparent absolute-top z-top">
          <q-space />
          <q-btn dense flat round icon="close" v-close-popup size="lg" color="white" />
        </q-toolbar>
        <q-card-section class="col flex flex-center q-pa-none">
          <q-img
            loading="eager"
            :src="viewerImageUrl"
            fit="contain"
            class="full-height full-width"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Dialog ดูตำแหน่งในแปลน (Read-only) -->
    <PlanPositionDialog
      v-model="showPlanDialog"
      :job-id="defect.jobId ?? projectId"
      :initial-plan-id="defect.planId ?? null"
      :initial-x="defect.planX ?? null"
      :initial-y="defect.planY ?? null"
      :initial-zone="defect.locationZone ?? null"
      readonly
    />

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import PlanPositionDialog from 'src/components/PlanPositionDialog.vue'
import { useRepairDetail } from 'src/stores/useContractorRepairDetail'
import { useLinkAccess } from 'src/stores/useLinkAccess'
import { defectStatusLabel } from 'src/stores/useContractormain'
import { createIconSpinner } from 'src/composables/useIconSpinner'

const $q = useQuasar()
const repairDetailSpinner = createIconSpinner('construction')

const route     = useRoute()
const { t } = useI18n()
const { isContractorEditable, projectId } = useLinkAccess()
const showPlanDialog = ref(false)
const defectId  = Number(route.params.id)
const fileInput = ref<HTMLInputElement>()
const showImageViewer = ref(false)
const viewerImageUrl = ref('')

//  destructure ก่อน
const {
  defect,
  afterImageUrl,
  afterImageFile,
  setAfterImage,
  note,
  submitRepair,
  isSubmitting,
  submitError,
  showSuccess,
  confirmSuccess,
  savedAfterImage,
  savedNote,
  isLoading,
} = useRepairDetail(defectId)

// isLoading เริ่มเป็น true เฉพาะตอนเข้าหน้านี้ตรง ๆ โดย store ยังไม่มีข้อมูล (ต้องยิง API เอง)
// ใช้ watch แทน await เพราะการดึงข้อมูลเริ่มขึ้นเองภายใน useRepairDetail ตั้งแต่ก่อน onMounted แล้ว
onMounted(() => {
  if (!isLoading.value) return
  $q.loading.show({
    spinner: repairDetailSpinner,
    spinnerColor: 'primary',
    spinnerSize: 70,
    backgroundColor: 'white',
  })
  const stopWatch = watch(isLoading, (loading) => {
    if (loading) return
    $q.loading.hide()
    stopWatch()
  })
})

//  computed หลัง destructure
// FIXED = ซ่อมแล้ว (รอวิศวกรตรวจ), PASS = ผ่านการตรวจซ้ำแล้ว — ทั้งสองกรณีแก้ไขซ้ำไม่ได้แล้ว
// ปิดกั้นเป็นค่าเริ่มต้น (deny-by-default): แก้ไขได้เฉพาะผู้ที่เข้าผ่านลิงก์ผู้รับเหมาเท่านั้น
// ป้องกันไม่ให้ customer ที่ล็อกอินตรง (ไม่ผ่านลิงก์) หรือผู้ใช้ role อื่นเข้ามาถ่ายรูปอัพเดตงานได้
const isReadOnly = computed(
  () => !isContractorEditable.value || defect.value.status === 'repaired' || defect.value.status === 'verified',
)
const isPassed   = computed(() => defect.value.status === 'verified')

const onFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  setAfterImage(file)
  const reader = new FileReader()
  reader.onload = () => { afterImageUrl.value = reader.result as string }
  reader.readAsDataURL(file)
}

const triggerCamera   = () => fileInput.value?.click()
const clearAfterImage = () => { afterImageUrl.value = ''; afterImageFile.value = null }
const openImageViewer = (url: string) => { viewerImageUrl.value = url; showImageViewer.value = true }

const statusColor = (status: string): string => {
  const map: Record<string, string> = {
    verified: 'green',
    repaired: 'blue',
    pending_repair: 'orange',
    rejected: 'red',
  }
  return map[status] ?? 'grey'
}
</script>

<style scoped>
.update-repair-page { --ease-out: cubic-bezier(0.23, 1, 0.32, 1); max-width: 480px; margin: 0 auto; width: 100%; }
@media (min-width: 768px) {
  .update-repair-page { max-width: 720px; }
}
@media (min-width: 1024px) {
  .update-repair-page { max-width: 1100px; }
}
@media (min-width: 1440px) {
  .update-repair-page { max-width: 1280px; }
}

.info-card {
  border-radius: 14px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 4px 10px rgba(0, 0, 0, 0.04);
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-label {
  font-size: 11px;
  font-weight: 600;
  color: #9e9e9e;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: #212121;
  margin-top: 2px;
}

.step-header { margin-bottom: 8px; }

.before-img-wrap { border-radius: 14px; overflow: hidden; }

.repair-photo {
  width: 100%;
  max-height: 60vh;
  display: block;
  border-radius: 14px;
  object-fit: contain;
  background: #f0f0f0;
}

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
  transition: border-color 150ms var(--ease-out), background-color 150ms var(--ease-out);
}
.after-placeholder:focus-visible {
  outline: 2px solid var(--q-primary, #1976d2);
  outline-offset: 2px;
}
@media (hover: hover) and (pointer: fine) {
  .after-placeholder:hover {
    border-color: #90caf9;
    background: #f3f8fe;
  }
}

.submit-btn {
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  height: 52px;
  transition: box-shadow 150ms var(--ease-out);
}
.submit-btn:hover {
  box-shadow: 0 4px 14px rgba(25, 118, 210, 0.3);
}
</style>

<style>
/* Frosted-glass backdrop for this page's dialogs */
.q-dialog__backdrop {
  backdrop-filter: blur(6px) saturate(180%);
  -webkit-backdrop-filter: blur(6px) saturate(180%);
}
</style>
