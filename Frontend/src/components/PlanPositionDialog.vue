<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="column no-wrap bg-grey-1" style="height: 100dvh">
      <!-- Top Header -->
      <q-toolbar class="bg-white text-dark shadow-1 col-auto q-px-md">
        <q-btn
          flat
          round
          dense
          icon="close"
          color="grey-7"
          @click="closeDialog"
        />
        <q-toolbar-title class="text-subtitle1 text-weight-bold row items-center q-gutter-x-xs">
          <q-icon name="place" color="primary" size="22px" />
          <span>{{ readonly ? 'ตำแหน่งในแปลนบ้าน' : 'ระบุตำแหน่งในแปลนบ้าน' }}</span>
        </q-toolbar-title>
        <q-btn
          v-if="plans.length > 0 && !readonly"
          flat
          dense
          no-caps
          color="primary"
          icon="add_photo_alternate"
          label="เพิ่มแปลน"
          @click="showUploadSection = !showUploadSection"
        />
      </q-toolbar>

      <!-- Loading State -->
      <div v-if="isLoadingPlans" class="col flex flex-center column text-grey-6">
        <q-spinner-dots size="48px" color="primary" />
        <div class="text-body2 q-mt-md">กำลังโหลดข้อมูลแปลนบ้าน...</div>
      </div>

      <!-- Main Content -->
      <div v-else class="col column no-wrap overflow-hidden">
        <!-- If plans exist -->
        <template v-if="plans.length > 0 && !showUploadSection">
          <!-- Plan selector tabs / chips -->
          <div class="bg-white q-px-sm q-py-xs shadow-1 col-auto">
            <div class="row items-center no-wrap q-gutter-x-sm overflow-auto q-py-xs">
              <q-btn
                v-for="plan in plans"
                :key="plan.planId"
                unelevated
                rounded
                dense
                no-caps
                class="q-px-md text-weight-medium"
                :color="activePlan?.planId === plan.planId ? 'primary' : 'grey-3'"
                :text-color="activePlan?.planId === plan.planId ? 'white' : 'dark'"
                @click="selectPlan(plan)"
              >
                <div class="row items-center no-wrap q-gutter-x-xs">
                  <span>{{ plan.name }}</span>
                  <q-badge
                    v-if="currentPlanId === plan.planId && currentPinX !== null"
                    color="negative"
                    rounded
                    floating
                  />
                  <span
                    v-if="plan.floor?.label"
                    class="text-caption"
                    :class="activePlan?.planId === plan.planId ? 'text-blue-1' : 'text-grey-6'"
                  >
                    ({{ plan.floor.label }})
                  </span>
                </div>
              </q-btn>
            </div>
          </div>

          <!-- Interactive Plan Viewer Area -->
          <div class="col relative-position flex flex-center bg-grey-9 overflow-hidden q-pa-sm">
            <div
              v-if="activePlan"
              class="relative-position plan-canvas-wrapper"
              :class="{ 'is-panning': isPanning, 'is-readonly': readonly }"
              :style="canvasTransformStyle"
              @pointerdown="onPointerDown"
              @pointermove="onPointerMove"
              @pointerup="onPointerUp"
              @pointercancel="onPointerCancel"
              @wheel="onWheel"
            >
              <img
                ref="imageRef"
                :src="formatImageUrl(activePlan.imageUrl)"
                alt="แปลนบ้าน"
                class="plan-image shadow-3 rounded-borders"
                @load="onImageLoad"
              />

              <!-- Pin Marker (only shown on the currently pinned plan) -->
              <div
                v-if="currentPlanId === activePlan.planId && currentPinX !== null && currentPinY !== null"
                class="pin-marker"
                :style="{ left: `${currentPinX}%`, top: `${currentPinY}%` }"
              >
                <div class="pin-pulse" />
                <div class="pin-core">
                  <q-icon name="place" size="28px" color="negative" class="pin-icon" />
                </div>
              </div>
            </div>

            <!-- Hint overlay -->
            <div class="absolute-top row justify-center q-mt-sm pointer-events-none" style="z-index: 5">
              <q-chip
                dense
                color="black"
                text-color="white"
                class="bg-opacity-80 text-caption q-px-sm"
              >
                <q-icon name="place" size="14px" class="q-mr-xs text-negative" />
                <span v-if="readonly">
                  {{ currentPinX !== null ? `ตำแหน่งหมุด: (${currentPinX}%, ${currentPinY}%)` : 'ยังไม่มีหมุดตำแหน่งบนแปลนนี้' }}
                </span>
                <span v-else>
                  {{ currentPinX !== null ? `พิกัด: (${currentPinX}%, ${currentPinY}%) แตะเพื่อย้ายหมุด` : 'แตะบนรูปแปลนเพื่อปักหมุดตำแหน่ง Defect' }}
                </span>
              </q-chip>
            </div>

            <!-- Reset Zoom Button -->
            <q-btn
              v-if="scale > 1.01"
              round
              dense
              color="dark"
              text-color="white"
              icon="zoom_out_map"
              class="zoom-reset-btn"
              style="position: absolute; right: 12px; bottom: 12px; z-index: 6; opacity: 0.85;"
              @click="resetZoom"
            >
              <q-tooltip>รีเซ็ตการซูม</q-tooltip>
            </q-btn>
          </div>
        </template>

        <!-- If NO plans exist OR user clicks "+ เพิ่มแปลน" -->
        <div v-else class="col column overflow-y-auto q-pa-md bg-white">
          <div class="text-center q-my-sm">
            <div class="text-h6 text-weight-bold text-primary">
              {{ plans.length === 0 ? 'ยังไม่มีรูปแปลนบ้านในระบบ' : 'เพิ่มรูปแปลนบ้านใหม่' }}
            </div>
            <div class="text-caption text-grey-7">
              คุณสามารถถ่ายรูปแปลนกระดาษหน้างาน หรือเลือกบันทึกโซนห้องแทนได้
            </div>
          </div>

          <!-- Choice 1: Upload Plan -->
          <q-card flat bordered class="q-pa-md q-my-sm rounded-borders bg-blue-1 border-primary">
            <div class="row items-center q-gutter-x-sm text-subtitle2 text-weight-bold text-primary q-mb-sm">
              <q-icon name="camera_alt" size="22px" />
              <span>ทางเลือกที่ 1: ถ่ายรูป / อัปโหลดแปลนบ้าน</span>
            </div>
            <div class="text-caption text-grey-8 q-mb-md">
              ถ่ายรูปพิมพ์เขียวหรือเอกสารแปลนบ้าน ระบบจะบันทึกเข้าสู่โครงการนี้ทันที
            </div>

            <!-- New Plan Form -->
            <div class="column q-gutter-y-sm">
              <q-input
                outlined
                dense
                bg-color="white"
                v-model="newPlanName"
                label="ชื่อแปลน (เช่น แปลนชั้น 1, แปลนห้องนั่งเล่น)"
                placeholder="แปลนชั้น 1"
              />

              <!-- Action buttons to capture / select photo -->
              <div class="row q-gutter-sm q-mt-xs">
                <q-btn
                  unelevated
                  color="primary"
                  icon="photo_camera"
                  label="ถ่ายรูปแปลน"
                  class="col"
                  :loading="isUploadingPlan"
                  @click="triggerCamera"
                />
                <q-btn
                  outline
                  color="primary"
                  icon="photo_library"
                  label="เลือกจากอัลบั้ม"
                  class="col"
                  :loading="isUploadingPlan"
                  @click="triggerGallery"
                />
              </div>

              <!-- Hidden inputs -->
              <input
                ref="cameraInput"
                type="file"
                accept="image/*"
                capture="environment"
                style="display: none"
                @change="onPlanFileSelected"
              />
              <input
                ref="galleryInput"
                type="file"
                accept="image/*"
                style="display: none"
                @change="onPlanFileSelected"
              />
            </div>
          </q-card>

          <div v-if="plans.length > 0" class="row justify-center q-mt-sm">
            <q-btn
              flat
              color="grey-8"
              label="กลับไปเลือกแปลนเดิมที่มีอยู่"
              icon="arrow_back"
              @click="showUploadSection = false"
            />
          </div>
        </div>

        <!-- Location Zone Section -->
        <div v-if="!readonly" class="bg-white q-px-md q-py-sm col-auto border-top shadow-up-1">
          <div class="row items-center justify-between q-mb-xs">
            <div class="text-caption text-weight-bold text-grey-8 row items-center q-gutter-x-xs">
              <q-icon name="label" size="16px" color="primary" />
              <span>ระบุโซน/ตำแหน่งเฉพาะ (ตัวเลือกเพิ่มเติม)</span>
            </div>
            <q-btn
              v-if="locationZone"
              flat
              dense
              round
              size="xs"
              color="grey-6"
              icon="close"
              @click="locationZone = ''"
            />
          </div>

          <!-- Preset Zone Chips -->
          <div class="row no-wrap q-gutter-x-xs overflow-auto q-py-xs">
            <q-chip
              v-for="zone in presetZones"
              :key="zone"
              clickable
              dense
              size="12px"
              :color="locationZone === zone ? 'primary' : 'grey-2'"
              :text-color="locationZone === zone ? 'white' : 'dark'"
              @click="selectPresetZone(zone)"
            >
              {{ zone }}
            </q-chip>
          </div>

          <!-- Custom Zone Text Input -->
          <q-input
            outlined
            dense
            v-model="locationZone"
            placeholder="หรือพิมพ์ระบุโซน เช่น ผนังฝั่งระเบียง, ใต้ตู้ซิงค์"
            class="q-mt-xs"
          />
        </div>
        <div v-else-if="locationZone" class="bg-white q-px-md q-py-sm col-auto border-top shadow-up-1 row items-center q-gutter-x-sm">
          <q-icon name="label" size="18px" color="primary" />
          <span class="text-caption text-weight-bold text-grey-8">โซน/ตำแหน่ง:</span>
          <q-badge color="info" class="text-caption q-px-sm">{{ locationZone }}</q-badge>
        </div>

        <!-- Footer Actions -->
        <div v-if="!readonly" class="bg-white q-px-md q-py-sm col-auto border-top row items-center justify-between">
          <q-btn
            flat
            color="negative"
            icon="clear"
            label="ล้างหมุด / ไม่ระบุ"
            :disable="currentPinX === null && currentPlanId === null"
            @click="handleClearPin"
          />

          <div class="row q-gutter-x-sm">
            <q-btn
              flat
              color="grey-7"
              label="ยกเลิก"
              @click="closeDialog"
            />
            <q-btn
              unelevated
              color="primary"
              icon="check"
              label="ยืนยันตำแหน่ง"
              class="q-px-lg text-weight-bold"
              @click="handleConfirm"
            />
          </div>
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';
import type { JobPlan } from 'src/models';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    jobId?: number | null;
    selectedFloorId?: number | null;
    initialPlanId?: number | null;
    initialX?: number | null;
    initialY?: number | null;
    initialZone?: string | null;
    readonly?: boolean;
  }>(),
  {
    readonly: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (
    e: 'save',
    data: {
      planId: number | null;
      planX: number | null;
      planY: number | null;
      locationZone: string | null;
    },
  ): void;
}>();

const $q = useQuasar();

// ── State ─────────────────────────────────────────────────────
const isLoadingPlans = ref(false);
const isUploadingPlan = ref(false);
const showUploadSection = ref(false);
const plans = ref<JobPlan[]>([]);
const activePlan = ref<JobPlan | null>(null);

const currentPlanId = ref<number | null>(null);
const currentPinX = ref<number | null>(null);
const currentPinY = ref<number | null>(null);
const locationZone = ref<string>('');

const newPlanName = ref('');
const imageRef = ref<HTMLImageElement | null>(null);
const cameraInput = ref<HTMLInputElement | null>(null);
const galleryInput = ref<HTMLInputElement | null>(null);

// ── Zoom & Pan (view-only gesture — never changes the saved image, only how it's displayed) ──
const MIN_SCALE = 1;
const MAX_SCALE = 4;
const scale = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);
const isPanning = ref(false);

const canvasTransformStyle = computed(() => ({
  transform: `translate(${offsetX.value}px, ${offsetY.value}px) scale(${scale.value})`,
}));

// Pointer gesture bookkeeping — plain vars, not refs: only read/written inside handlers, never rendered
const activePointers = new Map<number, { x: number; y: number }>();
let dragStart: { x: number; y: number; offsetX: number; offsetY: number } | null = null;
let pinchStartDistance = 0;
let pinchStartScale = 1;
let pointerMoved = 0;
let hadMultiTouch = false;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pointerDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clampOffset() {
  const img = imageRef.value;
  if (!img) return;
  const maxX = (img.offsetWidth * (scale.value - 1)) / 2;
  const maxY = (img.offsetHeight * (scale.value - 1)) / 2;
  offsetX.value = clamp(offsetX.value, -maxX, maxX);
  offsetY.value = clamp(offsetY.value, -maxY, maxY);
}

function applyZoom(nextScale: number) {
  scale.value = clamp(nextScale, MIN_SCALE, MAX_SCALE);
  if (scale.value === MIN_SCALE) {
    offsetX.value = 0;
    offsetY.value = 0;
  } else {
    clampOffset();
  }
}

function resetZoom() {
  scale.value = 1;
  offsetX.value = 0;
  offsetY.value = 0;
}

function onWheel(e: WheelEvent) {
  if (!activePlan.value) return;
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
  applyZoom(scale.value * factor);
}

function onPointerDown(e: PointerEvent) {
  (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (activePointers.size === 1) {
    pointerMoved = 0;
    hadMultiTouch = false;
    dragStart = { x: e.clientX, y: e.clientY, offsetX: offsetX.value, offsetY: offsetY.value };
  } else if (activePointers.size === 2) {
    hadMultiTouch = true;
    const [a, b] = Array.from(activePointers.values());
    pinchStartDistance = a && b ? pointerDistance(a, b) : 0;
    pinchStartScale = scale.value;
    dragStart = null;
  }
}

function onPointerMove(e: PointerEvent) {
  if (!activePointers.has(e.pointerId)) return;
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (activePointers.size === 2) {
    const [a, b] = Array.from(activePointers.values());
    if (a && b && pinchStartDistance > 0) {
      const ratio = pointerDistance(a, b) / pinchStartDistance;
      applyZoom(pinchStartScale * ratio);
    }
    return;
  }

  if (dragStart) {
    isPanning.value = true;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    pointerMoved = Math.max(pointerMoved, Math.hypot(dx, dy));
    offsetX.value = dragStart.offsetX + dx;
    offsetY.value = dragStart.offsetY + dy;
    clampOffset();
  }
}

function endPointer(e: PointerEvent, allowTap: boolean) {
  activePointers.delete(e.pointerId);
  pinchStartDistance = 0;

  if (activePointers.size === 1) {
    // dropped from pinch (2 fingers) back to a single finger — restart the pan baseline from here
    const [remaining] = Array.from(activePointers.values());
    if (remaining) {
      dragStart = { x: remaining.x, y: remaining.y, offsetX: offsetX.value, offsetY: offsetY.value };
    }
    return;
  }

  if (activePointers.size === 0) {
    isPanning.value = false;
    dragStart = null;
    if (allowTap && !hadMultiTouch && pointerMoved < 8) {
      placePinAt(e.clientX, e.clientY);
    }
  }
}

function onPointerUp(e: PointerEvent) {
  endPointer(e, true);
}

function onPointerCancel(e: PointerEvent) {
  endPointer(e, false);
}

const presetZones = [
  'ผนังฝั่งประตู',
  'ผนังฝั่งหน้าต่าง',
  'เพดาน',
  'พื้นห้อง',
  'ผนังฝั่งระเบียง',
  'หลังประตู',
  'ใต้ตู้ซิงค์',
  'เสาโครงสร้าง',
];

// ── Helpers ───────────────────────────────────────────────────
const formatImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl}${url}`;
};

// ── Plan Loading ──────────────────────────────────────────────
const fetchPlans = async () => {
  if (!props.jobId) return;
  isLoadingPlans.value = true;
  try {
    const { data } = await api.get<JobPlan[]>(`/jobs/${props.jobId}/plans`);
    plans.value = data;

    // Auto-select initial plan or matching floor plan
    if (plans.value.length > 0) {
      const firstPlan = plans.value[0] ?? null;
      if (props.initialPlanId) {
        const found = plans.value.find((p) => p.planId === props.initialPlanId);
        activePlan.value = found ?? firstPlan;
      } else if (props.selectedFloorId) {
        const matchingFloorPlan = plans.value.find(
          (p) => p.floor?.floorId === props.selectedFloorId,
        );
        activePlan.value = matchingFloorPlan ?? firstPlan;
      } else {
        activePlan.value = firstPlan;
      }
      showUploadSection.value = false;
    } else {
      activePlan.value = null;
      showUploadSection.value = true;
    }
  } catch (error) {
    console.error('Failed to fetch job plans', error);
    // Try alias endpoint if first failed
    try {
      const { data } = await api.get<JobPlan[]>(`/inspection-jobs/${props.jobId}/plans`);
      plans.value = data;
      if (plans.value.length > 0) {
        activePlan.value = plans.value[0] ?? null;
      }
    } catch {
      $q.notify({
        message: 'ไม่สามารถโหลดรูปแปลนบ้านได้',
        color: 'warning',
        icon: 'warning',
      });
    }
  } finally {
    isLoadingPlans.value = false;
  }
};

const selectPlan = (plan: JobPlan) => {
  activePlan.value = plan;
  resetZoom();
};

// ── Pinning Logic ─────────────────────────────────────────────
// getBoundingClientRect() reflects the image's on-screen box AFTER the zoom/pan
// transform is applied, so this percentage math stays correct at any zoom level.
const placePinAt = (clientX: number, clientY: number) => {
  const img = imageRef.value;
  if (props.readonly || !img || !activePlan.value) return;

  const rect = img.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * 100;
  const y = ((clientY - rect.top) / rect.height) * 100;

  const clampedX = Math.max(0, Math.min(100, x));
  const clampedY = Math.max(0, Math.min(100, y));

  currentPinX.value = Number(clampedX.toFixed(2));
  currentPinY.value = Number(clampedY.toFixed(2));
  currentPlanId.value = activePlan.value.planId;
};

const onImageLoad = () => {
  // Can trigger layout calculations if needed
};

const handleClearPin = () => {
  currentPinX.value = null;
  currentPinY.value = null;
  currentPlanId.value = null;
};

const selectPresetZone = (zone: string) => {
  if (locationZone.value === zone) {
    locationZone.value = '';
  } else {
    locationZone.value = zone;
  }
};

// ── Uploading Plan ────────────────────────────────────────────
const triggerCamera = () => {
  cameraInput.value?.click();
};

const triggerGallery = () => {
  galleryInput.value?.click();
};

const onPlanFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file || !props.jobId) return;

  target.value = '';

  const planName =
    newPlanName.value.trim() ||
    `แปลนบ้าน ${plans.value.length + 1}`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', planName);
  if (props.selectedFloorId) {
    formData.append('floorId', String(props.selectedFloorId));
  }
  formData.append('orderIndex', String(plans.value.length));

  isUploadingPlan.value = true;
  try {
    const { data: createdPlan } = await api.post<JobPlan>(
      `/jobs/${props.jobId}/plans`,
      formData,
    );

    $q.notify({
      message: 'อัปโหลดรูปแปลนสำเร็จ',
      color: 'positive',
      icon: 'check_circle',
    });

    plans.value.push(createdPlan);
    activePlan.value = createdPlan;
    showUploadSection.value = false;
    newPlanName.value = '';
  } catch (err) {
    console.error('Upload plan error', err);
    $q.notify({
      message: 'ไม่สามารถอัปโหลดรูปแปลนได้',
      color: 'negative',
      icon: 'error',
    });
  } finally {
    isUploadingPlan.value = false;
  }
};

// ── Dialog Controls & Confirm ─────────────────────────────────
const closeDialog = () => {
  emit('update:modelValue', false);
};

const handleConfirm = () => {
  emit('save', {
    planId: currentPlanId.value,
    planX: currentPinX.value,
    planY: currentPinY.value,
    locationZone: locationZone.value.trim() || null,
  });
  closeDialog();
};

// ── Watch Dialog Open ─────────────────────────────────────────
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      currentPlanId.value = props.initialPlanId ?? null;
      currentPinX.value = props.initialX ?? null;
      currentPinY.value = props.initialY ?? null;
      locationZone.value = props.initialZone ?? '';
      resetZoom();
      void fetchPlans();
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.plan-canvas-wrapper {
  display: inline-block;
  max-width: 100%;
  max-height: 100%;
  cursor: crosshair;
  user-select: none;
  touch-action: none;
  transform-origin: center center;
  transition: transform 0.15s ease-out;
}

.plan-canvas-wrapper.is-panning {
  transition: none;
}

.plan-canvas-wrapper.is-readonly {
  cursor: grab;
}

.plan-canvas-wrapper.is-readonly.is-panning {
  cursor: grabbing;
}

.plan-image {
  display: block;
  max-width: 100%;
  max-height: 58vh;
  object-fit: contain;
  margin: 0 auto;
}

/* Pin marker styling & Pulse Animation */
.pin-marker {
  position: absolute;
  transform: translate(-50%, -100%);
  pointer-events: none;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.pin-core {
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4));
  animation: pin-bounce 0.4s ease-out;
}

.pin-icon {
  display: block;
}

.pin-pulse {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translate(-50%, 50%);
  width: 20px;
  height: 20px;
  background-color: rgba(244, 67, 54, 0.4);
  border-radius: 50%;
  animation: marker-pulse 1.8s infinite ease-out;
}

@keyframes marker-pulse {
  0% {
    transform: translate(-50%, 50%) scale(0.4);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, 50%) scale(2.4);
    opacity: 0;
  }
}

@keyframes pin-bounce {
  0% {
    transform: translateY(-20px) scale(0.8);
    opacity: 0;
  }
  60% {
    transform: translateY(2px) scale(1.05);
    opacity: 1;
  }
  100% {
    transform: translateY(0) scale(1);
  }
}

.border-top {
  border-top: 1px solid #e0e0e0;
}

.border-primary {
  border: 1px dashed var(--q-primary);
}

.pointer-events-none {
  pointer-events: none;
}
</style>
