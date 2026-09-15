<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card flat class="column no-wrap bg-white" style="height: 100dvh">
      <!-- Top Header -->
      <q-toolbar class="bg-white text-dark col-auto q-px-md plan-toolbar">
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
          <span>{{ readonly ? t('components.planPosition.viewTitle') : t('components.planPosition.editTitle') }}</span>
        </q-toolbar-title>
        <q-btn
          v-if="plans.length > 0 && !readonly"
          unelevated
          rounded
          dense
          no-caps
          color="blue-1"
          text-color="primary"
          icon="add_photo_alternate"
          :label="t('components.planPosition.addPlanButton')"
          class="q-px-md add-plan-btn"
          @click="showUploadSection = !showUploadSection"
        />
      </q-toolbar>

      <!-- Loading State -->
      <div v-if="isLoadingPlans" class="col flex flex-center bg-white plan-loading-state">
        <IconBounceSpinner icon="photo_size_select_actual" color="primary" size="56px" />
      </div>

      <!-- Main Content -->
      <div v-else class="col column no-wrap overflow-hidden">
        <!-- If plans exist -->
        <template v-if="plans.length > 0 && !showUploadSection">
          <!-- Interactive Plan Viewer Area -->
          <div ref="viewerAreaRef" class="col relative-position flex flex-center plan-viewer-bg overflow-hidden q-pa-sm">
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
                :alt="t('components.planPosition.planImageAlt')"
                class="plan-image rounded-borders"
                :style="planImageStyle"
                draggable="false"
                @load="onImageLoad"
                @dragstart.prevent
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
            <div class="absolute-top row justify-center q-mt-sm pointer-events-none plan-hint-row">
              <div class="plan-hint-chip row items-center no-wrap">
                <q-icon name="place" size="14px" class="q-mr-xs text-negative" />
                <span v-if="readonly">
                  {{ currentPinX !== null ? t('components.planPosition.pinPositionLabel', { x: currentPinX, y: currentPinY }) : t('components.planPosition.noPinYet') }}
                </span>
                <span v-else>
                  {{ currentPinX !== null ? t('components.planPosition.coordinatesMoveHint', { x: currentPinX, y: currentPinY }) : t('components.planPosition.tapToPinHint') }}
                </span>
              </div>
            </div>

            <!-- Reset Zoom Button -->
            <q-btn
              v-if="scale > 1.01"
              unelevated
              round
              dense
              color="dark"
              text-color="white"
              icon="zoom_out_map"
              class="zoom-reset-btn"
              @click="resetZoom"
            >
              <q-tooltip>{{ t('components.planPosition.resetZoomTooltip') }}</q-tooltip>
            </q-btn>
          </div>

          <!-- Plan Thumbnail Slider -->
          <div class="bg-white q-py-sm col-auto plan-slider-shell">
            <div class="dialog-inset">
              <div ref="sliderRef" class="plan-slider" role="tablist" :aria-label="t('components.planPosition.planSelectorLabel')">
                <button
                  v-for="plan in plans"
                  :key="plan.planId"
                  type="button"
                  role="tab"
                  class="plan-thumb-btn"
                  :class="{ 'is-active': activePlan?.planId === plan.planId }"
                  :aria-selected="activePlan?.planId === plan.planId"
                  @click="(e) => selectPlan(plan, e)"
                >
                  <span class="plan-thumb-frame">
                    <img
                      :src="formatImageUrl(plan.imageUrl)"
                      :alt="plan.name"
                      loading="lazy"
                      class="plan-thumb-img"
                    />
                    <span
                      v-if="currentPlanId === plan.planId && currentPinX !== null"
                      class="plan-thumb-pin-dot"
                    />
                    <span class="plan-thumb-scrim" />
                    <span class="plan-thumb-label">
                      {{ plan.name }}<template v-if="plan.floor?.label"> · {{ plan.floor.label }}</template>
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- If NO plans exist OR user clicks "+ เพิ่มแปลน" -->
        <div v-else class="col column overflow-y-auto q-pa-md bg-white">
          <div class="dialog-inset-narrow">
            <div class="column items-center q-my-md">
              <div class="text-h6 text-weight-bold text-dark text-center">
                {{ t('components.planPosition.uploadPlanTitle') }}
              </div>
            </div>

            <!-- Choice 1: Upload Plan -->
            <q-card flat bordered class="q-pa-md q-my-sm upload-card">
              <!-- New Plan Form -->
              <div class="column q-gutter-y-sm">
                <q-input
                  outlined
                  dense
                  bg-color="white"
                  v-model="newPlanName"
                  class="plan-name-input"
                  :label="t('components.planPosition.planNameLabel')"
                  :placeholder="t('components.planPosition.planNamePlaceholder')"
                />

                <!-- Action buttons to capture / select photo -->
                <div class="row q-gutter-sm q-mt-xs photo-action-row">
                  <q-btn
                    unelevated
                    rounded
                    no-caps
                    color="primary"
                    icon="photo_camera"
                    :label="t('components.planPosition.takePhotoButton')"
                    class="col action-pill"
                    :loading="isUploadingPlan"
                    @click="triggerCamera"
                  />
                  <q-btn
                    outline
                    rounded
                    no-caps
                    color="primary"
                    icon="photo_library"
                    :label="t('components.planPosition.chooseFromGalleryButton')"
                    class="col action-pill"
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
                  multiple
                  style="display: none"
                  @change="onPlanFileSelected"
                />
              </div>
            </q-card>

            <div v-if="plans.length > 0" class="row justify-center q-mt-sm">
              <q-btn
                flat
                rounded
                no-caps
                color="grey-8"
                :label="t('components.planPosition.backToExistingPlansButton')"
                icon="arrow_back"
                @click="showUploadSection = false"
              />
            </div>
          </div>
        </div>

        <!-- Location Zone Section -->
        <div v-if="!readonly" class="bg-white q-py-sm col-auto border-top">
          <div class="dialog-inset q-px-md">
            <div class="row items-center justify-between q-mb-xs">
              <div class="text-caption text-weight-bold text-grey-8 row items-center q-gutter-x-xs">
                <q-icon name="label" size="16px" color="primary" />
                <span>{{ t('components.planPosition.zoneLabel') }}</span>
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
            <div class="row no-wrap q-gutter-x-xs overflow-auto q-py-xs zone-chip-row">
              <q-chip
                v-for="zone in presetZones"
                :key="zone"
                clickable
                dense
                :color="locationZone === zone ? 'primary' : 'grey-2'"
                :text-color="locationZone === zone ? 'white' : 'dark'"
                class="zone-chip"
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
              class="custom-input q-mt-xs"
              :placeholder="t('components.planPosition.zonePlaceholder')"
            />
          </div>
        </div>
        <div v-else-if="locationZone" class="bg-white q-py-sm col-auto border-top">
          <div class="dialog-inset q-px-md row items-center q-gutter-x-sm">
            <q-icon name="label" size="18px" color="primary" />
            <span class="text-caption text-weight-bold text-grey-8">{{ t('components.planPosition.zoneReadonlyLabel') }}</span>
            <q-badge color="info" class="text-caption q-px-sm zone-readonly-badge">{{ locationZone }}</q-badge>
          </div>
        </div>

        <!-- Footer Actions -->
        <div v-if="!readonly" class="bg-white q-py-sm col-auto border-top">
          <div class="dialog-inset q-px-md row items-center justify-between wrap q-gutter-y-sm footer-actions-row">
            <q-btn
              flat
              rounded
              no-caps
              color="negative"
              icon="clear"
              :label="t('components.planPosition.clearPinButton')"
              :disable="currentPinX === null && currentPlanId === null"
              @click="handleClearPin"
            />

            <div class="row q-gutter-x-sm">
              <q-btn
                flat
                rounded
                no-caps
                color="grey-7"
                :label="t('components.planPosition.cancelButton')"
                @click="closeDialog"
              />
              <q-btn
                unelevated
                no-caps
                color="primary"
                icon="check"
                :label="t('components.planPosition.confirmPositionButton')"
                class="confirm-btn text-weight-bold"
                @click="handleConfirm"
              />
            </div>
          </div>
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { api } from 'src/boot/axios';
import IconBounceSpinner from 'src/components/IconBounceSpinner.vue';
import { defaultPlanNames } from 'src/composables/useDefaultPlanName';
import type { HousePlan } from 'src/models';

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
const { t } = useI18n();

// ── State ─────────────────────────────────────────────────────
const isLoadingPlans = ref(false);
const isUploadingPlan = ref(false);
const showUploadSection = ref(false);
const plans = ref<HousePlan[]>([]);
const activePlan = ref<HousePlan | null>(null);
const sliderRef = ref<HTMLElement | null>(null);

function scrollActiveThumbIntoView() {
  requestAnimationFrame(() => {
    const el = sliderRef.value?.querySelector<HTMLElement>('.plan-thumb-btn.is-active');
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  });
}

const currentPlanId = ref<number | null>(null);
const currentPinX = ref<number | null>(null);
const currentPinY = ref<number | null>(null);
const locationZone = ref<string>('');

const newPlanName = ref('');
const imageRef = ref<HTMLImageElement | null>(null);
const cameraInput = ref<HTMLInputElement | null>(null);
const galleryInput = ref<HTMLInputElement | null>(null);

// ── Viewer area sizing ────────────────────────────────────────
// วัดพื้นที่จริงที่เหลือให้รูปแปลนด้วย ResizeObserver แทนการพึ่ง CSS
// max-height:100% เพราะ .plan-canvas-wrapper เป็น inline-block ที่ห่อขนาดตามรูป
// (ไม่ใช่กล่องที่มี height แน่นอน) ทำให้ % ไม่ resolve ตาม spec แบบเชื่อถือได้ในทุกเบราว์เซอร์ —
// ผลคือบนจอคอมพิวเตอร์รูปขยายจนทับ label ของ thumbnail/โซนด้านล่าง ต้องวัดจริงด้วย JS แทน
const viewerAreaRef = ref<HTMLElement | null>(null);
const viewerAreaHeight = ref<number | null>(null);
let viewerResizeObserver: ResizeObserver | null = null;

watch(viewerAreaRef, (el) => {
  viewerResizeObserver?.disconnect();
  if (!el) return;
  viewerResizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (entry) viewerAreaHeight.value = entry.contentRect.height;
  });
  viewerResizeObserver.observe(el);
});

onBeforeUnmount(() => {
  viewerResizeObserver?.disconnect();
});

const planImageStyle = computed(() =>
  viewerAreaHeight.value ? { maxHeight: `${viewerAreaHeight.value}px` } : {},
);

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

const presetZones = computed(() => [
  t('components.planPosition.zoneDoorWall'),
  t('components.planPosition.zoneWindowWall'),
  t('components.planPosition.zoneCeiling'),
  t('components.planPosition.zoneFloor'),
  t('components.planPosition.zoneBalconyWall'),
  t('components.planPosition.zoneBehindDoor'),
  t('components.planPosition.zoneUnderSink'),
  t('components.planPosition.zoneStructuralColumn'),
]);

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
    const { data } = await api.get<HousePlan[]>(`/jobs/${props.jobId}/house-plans`);
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
      scrollActiveThumbIntoView();
    } else {
      activePlan.value = null;
      showUploadSection.value = true;
    }
  } catch (error) {
    console.error('Failed to fetch job plans', error);
    // Try alias endpoint if first failed
    try {
      const { data } = await api.get<HousePlan[]>(`/inspection-jobs/${props.jobId}/house-plans`);
      plans.value = data;
      if (plans.value.length > 0) {
        activePlan.value = plans.value[0] ?? null;
        scrollActiveThumbIntoView();
      }
    } catch {
      $q.notify({
        message: t('components.planPosition.loadPlansFailed'),
        color: 'warning',
        icon: 'warning',
      });
    }
  } finally {
    isLoadingPlans.value = false;
  }
};

const selectPlan = (plan: HousePlan, event?: MouseEvent) => {
  activePlan.value = plan;
  resetZoom();
  const btn = event?.currentTarget as HTMLElement | undefined;
  if (btn) {
    btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }
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
  const files = target.files ? Array.from(target.files) : [];
  target.value = '';
  if (!files.length || !props.jobId) return;

  const trimmedName = newPlanName.value.trim();
  isUploadingPlan.value = true;
  let successCount = 0;
  let lastCreatedPlan: HousePlan | null = null;

  for (const [index, file] of files.entries()) {
    const defaultNames = defaultPlanNames(plans.value.length + 1);
    const planName = trimmedName
      ? files.length > 1
        ? `${trimmedName} ${index + 1}`
        : trimmedName
      : defaultNames.th;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', planName);
    if (!trimmedName) formData.append('nameEn', defaultNames.en);
    if (props.selectedFloorId) {
      formData.append('floorId', String(props.selectedFloorId));
    }
    formData.append('orderIndex', String(plans.value.length));

    try {
      const { data: createdPlan } = await api.post<HousePlan>(
        `/jobs/${props.jobId}/house-plans`,
        formData,
      );
      plans.value.push(createdPlan);
      lastCreatedPlan = createdPlan;
      successCount += 1;
    } catch (err) {
      console.error('Upload plan error', err);
    }
  }

  isUploadingPlan.value = false;

  if (successCount > 0) {
    $q.notify({
      message:
        successCount === files.length
          ? t('components.planPosition.uploadPlanSuccess')
          : t('components.planPosition.uploadPlanPartialSuccess', {
              success: successCount,
              total: files.length,
            }),
      color: 'positive',
      icon: 'check_circle',
    });

    activePlan.value = lastCreatedPlan;
    showUploadSection.value = false;
    newPlanName.value = '';
    scrollActiveThumbIntoView();
  }

  if (successCount < files.length) {
    $q.notify({
      message: t('components.planPosition.uploadPlanFailed'),
      color: 'negative',
      icon: 'error',
    });
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
/* ─── Responsive content inset (mirrors the admin/inspector form-container
   pattern: full-width on phones, centered max-width on tablet/desktop) ──── */
.dialog-inset {
  width: 100%;
}

.dialog-inset-narrow {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  align-self: center;
}

@media (min-width: 600px) {
  .dialog-inset {
    max-width: 720px;
    margin: 0 auto;
  }

  .dialog-inset-narrow {
    max-width: 480px;
  }
}

/* ─── Toolbar ─────────────────────────────────────────────────── */
.plan-toolbar {
  min-height: 56px;
  border-bottom: 1px solid #e0e0e0;
}

.add-plan-btn {
  transition: transform 150ms cubic-bezier(0.23, 1, 0.32, 1);
}

.add-plan-btn:active {
  transform: scale(0.96);
}

/* ─── Plan Thumbnail Slider ─────────────────────────────────── */
.plan-slider-shell {
  position: relative;
}

.plan-slider {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  padding: 4px 16px 6px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.plan-slider::-webkit-scrollbar {
  display: none;
}

.plan-thumb-btn {
  flex: 0 0 auto;
  scroll-snap-align: center;
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  border-radius: 14px;
  -webkit-tap-highlight-color: transparent;
  transition: transform 180ms cubic-bezier(0.23, 1, 0.32, 1);
}

.plan-thumb-btn:active {
  transform: scale(0.96);
}

.plan-thumb-btn.is-active {
  transform: translateY(-2px);
}

.plan-thumb-frame {
  position: relative;
  display: block;
  width: 76px;
  height: 76px;
  border-radius: 14px;
  overflow: hidden;
  outline: 1px solid rgba(0, 0, 0, 0.12);
  outline-offset: -1px;
  transition: outline-color 180ms ease;
}

.plan-thumb-btn.is-active .plan-thumb-frame {
  outline: 3px solid var(--q-primary, #1976d2);
  outline-offset: 1px;
}

.plan-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.plan-thumb-scrim {
  position: absolute;
  inset: auto 0 0 0;
  height: 34%;
  background: rgba(0, 0, 0, 0.6);
  pointer-events: none;
}

.plan-thumb-label {
  position: absolute;
  left: 6px;
  right: 6px;
  bottom: 5px;
  color: #fff;
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}

.plan-thumb-pin-dot {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--q-negative, #e53935);
  border: 2px solid #fff;
  z-index: 2;
}

@media (hover: hover) and (pointer: fine) {
  .plan-thumb-btn:not(.is-active):hover .plan-thumb-frame {
    outline-color: rgba(0, 0, 0, 0.2);
  }

  .plan-thumb-btn:not(.is-active):hover {
    transform: translateY(-1px);
  }
}

.plan-thumb-btn:focus-visible {
  outline: none;
}

.plan-thumb-btn:focus-visible .plan-thumb-frame {
  outline: 2px solid var(--q-primary, #1976d2);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .plan-thumb-btn,
  .plan-thumb-frame {
    transition-duration: 0.01ms !important;
  }
}

@media (min-width: 600px) {
  .plan-thumb-frame {
    width: 92px;
    height: 92px;
  }
}

/* ─── Viewer background & hint chip ──────────────────────────── */
.plan-viewer-bg {
  background: #1c1c1e;
}

.plan-hint-row {
  z-index: 5;
}

.plan-hint-chip {
  padding: 6px 14px;
  border-radius: 999px;
  background: #141416;
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
}

.zoom-reset-btn {
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 6;
  border: 1px solid rgba(255, 255, 255, 0.16);
  transition: transform 150ms cubic-bezier(0.23, 1, 0.32, 1);
}

.zoom-reset-btn:active {
  transform: scale(0.94);
}

/* ─── Empty state / upload card ──────────────────────────────── */
.upload-card {
  border-radius: 16px;
  border-color: #f0f0f0;
  background: #fcfdfe;
}

.custom-input :deep(.q-field__control) {
  border-radius: 12px;
  background-color: #f8fafc;
}

.custom-input :deep(.q-field__control:before) {
  border-bottom: none;
}

/* Plan name field — same shape/motion language as the contractor page's
   search input, minus the focus glow (this dialog stays shadow-free). */
.plan-name-input :deep(.q-field__control) {
  border-radius: 12px;
  transition: border-color 150ms cubic-bezier(0.23, 1, 0.32, 1);
}

.plan-name-input.q-field--focused :deep(.q-field__control) {
  border-color: var(--q-primary, #1976d2);
}

.action-pill {
  border-radius: 14px;
  height: 46px;
  transition: transform 150ms cubic-bezier(0.23, 1, 0.32, 1);
}

.action-pill:active {
  transform: scale(0.97);
}

/* ─── Zone section ────────────────────────────────────────────── */
.zone-chip-row {
  padding-bottom: 2px;
}

.zone-chip {
  border-radius: 999px;
  font-size: 12px;
  transition: background-color 150ms ease, color 150ms ease;
}

.zone-readonly-badge {
  border-radius: 999px;
}

/* ─── Footer confirm button ──────────────────────────────────── */
.confirm-btn {
  border-radius: 999px;
  padding: 0 24px;
  height: 44px;
  transition: transform 150ms cubic-bezier(0.23, 1, 0.32, 1);
}

.confirm-btn:active {
  transform: scale(0.97);
}

@media (max-width: 359px) {
  .footer-actions-row {
    justify-content: center !important;
  }

  .photo-action-row {
    flex-direction: column;
  }
}

.plan-loading-state {
  animation: plan-loading-fade-in 0.25s ease-out;
}

@keyframes plan-loading-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

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
  /* ใช้ 100% ของ .plan-canvas-wrapper (flex item ที่คำนวณความสูงจริงตาม
     พื้นที่ที่เหลือใน .plan-viewer-bg) แทนหน่วย vh ตายตัว เพราะ vh ไม่รู้ว่า
     toolbar/thumbnail/โซน/footer ตอนนี้กินพื้นที่ไปเท่าไหร่ — ถ้าตั้งเป็น vh
     คงที่ รูปจะสูงเกินพื้นที่จริงแล้วโดน overflow-hidden ตัดจนเห็นแปลนไม่ครบ */
  max-height: 100%;
  object-fit: contain;
  margin: 0 auto;
  -webkit-user-drag: none;
  user-select: none;
  outline: 1px solid rgba(255, 255, 255, 0.08);
  outline-offset: -1px;
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

.pointer-events-none {
  pointer-events: none;
}
</style>
