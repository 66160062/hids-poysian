<template>
  <q-dialog v-model="isOpen" maximized persistent transition-show="slide-up" transition-hide="slide-down">
    <q-card class="bg-dark text-white column no-wrap">
      <!-- ─── Top bar ────────────────────────────────────────── -->
      <q-bar class="bg-black text-white" style="height: 50px">
        <q-btn dense flat icon="close" v-close-popup @click="handleCancel" />
        <q-space />
        <div class="text-weight-bold">{{ t('components.imageAnnotationDialog.title') }}</div>
        <q-space />
        <q-btn dense flat icon="check" color="positive" @click="handleSave" />
      </q-bar>

      <!-- ─── Canvas area ────────────────────────────────────── -->
      <q-card-section
        class="col q-pa-none flex flex-center"
        style="position: relative; overflow: hidden; background: #222"
      >
        <canvas ref="canvasEl"></canvas>

        <!-- Crop overlay hint -->
        <div
          v-if="isCropping"
          class="absolute-top text-center q-pa-sm"
          style="background: rgba(0,0,0,0.6); z-index: 10"
        >
          <span class="text-caption text-grey-4">
            {{ t('components.imageAnnotationDialog.cropHint') }}
          </span>
          <q-btn
            dense flat size="sm"
            color="positive"
            :label="t('components.imageAnnotationDialog.applyCrop')"
            icon="check"
            class="q-ml-sm"
            @click="handleApplyCrop"
          />
          <q-btn
            dense flat size="sm"
            color="negative"
            :label="t('components.imageAnnotationDialog.cancelCrop')"
            icon="close"
            class="q-ml-xs"
            @click="cancelCrop"
          />
        </div>

        <!-- Zoom indicator -->
        <div class="absolute-bottom-right q-pa-xs" style="z-index: 10">
          <q-btn
            round dense flat
            icon="center_focus_strong"
            color="white"
            size="sm"
            @click="resetZoom"
          >
            <q-tooltip>{{ t('components.imageAnnotationDialog.resetZoom') }}</q-tooltip>
          </q-btn>
        </div>
      </q-card-section>

      <!-- ─── Toolbar ────────────────────────────────────────── -->
      <q-card-actions class="bg-black justify-center q-pa-sm" style="flex-wrap: wrap">
        <!-- Drawing tools -->
        <q-btn-group flat>
          <q-btn
            :color="currentMode === 'freehand' ? 'primary' : 'white'"
            flat icon="edit"
            @click="setDrawMode('freehand')"
          >
            <q-tooltip>{{ t('components.imageAnnotationDialog.freehand') }}</q-tooltip>
          </q-btn>
          <q-btn
            :color="currentMode === 'circle' ? 'primary' : 'white'"
            flat icon="radio_button_unchecked"
            @click="addCircle"
          >
            <q-tooltip>{{ t('components.imageAnnotationDialog.circle') }}</q-tooltip>
          </q-btn>
          <q-btn
            :color="currentMode === 'arrow' ? 'primary' : 'white'"
            flat icon="arrow_outward"
            @click="addArrow"
          >
            <q-tooltip>{{ t('components.imageAnnotationDialog.arrow') }}</q-tooltip>
          </q-btn>
          <q-btn
            :color="currentMode === 'cross' ? 'primary' : 'white'"
            flat icon="close"
            @click="addCross"
          >
            <q-tooltip>{{ t('components.imageAnnotationDialog.cross') }}</q-tooltip>
          </q-btn>
          <q-btn
            :color="currentMode === 'rectangle' ? 'primary' : 'white'"
            flat icon="crop_square"
            @click="addRectangle"
          >
            <q-tooltip>{{ t('components.imageAnnotationDialog.rectangle') }}</q-tooltip>
          </q-btn>
          <q-btn
            :color="currentMode === 'select' ? 'primary' : 'white'"
            flat icon="pan_tool"
            @click="setDrawMode('select')"
          >
            <q-tooltip>{{ t('components.imageAnnotationDialog.select') }}</q-tooltip>
          </q-btn>
        </q-btn-group>

        <q-separator vertical dark class="q-mx-xs" />

        <!-- Image manipulation tools -->
        <q-btn-group flat>
          <q-btn flat icon="rotate_left" color="white" @click="rotateImage(-90)">
            <q-tooltip>{{ t('components.imageAnnotationDialog.rotateLeft') }}</q-tooltip>
          </q-btn>
          <q-btn flat icon="rotate_right" color="white" @click="rotateImage(90)">
            <q-tooltip>{{ t('components.imageAnnotationDialog.rotateRight') }}</q-tooltip>
          </q-btn>
          <q-btn flat icon="crop" :color="isCropping ? 'primary' : 'white'" @click="handleCropToggle">
            <q-tooltip>{{ t('components.imageAnnotationDialog.crop') }}</q-tooltip>
          </q-btn>
        </q-btn-group>

        <q-separator vertical dark class="q-mx-xs" />

        <!-- Undo & Delete -->
        <q-btn-group flat>
          <q-btn color="warning" flat icon="undo" @click="undo">
            <q-tooltip>{{ t('components.imageAnnotationDialog.undo') }}</q-tooltip>
          </q-btn>
          <q-btn color="negative" flat icon="delete_outline" @click="deleteSelected">
            <q-tooltip>{{ t('components.imageAnnotationDialog.deleteSelected') }}</q-tooltip>
          </q-btn>
        </q-btn-group>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useFabricCanvas, type AnnotatorSaveResult } from 'src/composables/useFabricCanvas';

const { t } = useI18n();
const $q = useQuasar();

const props = defineProps<{
  modelValue: boolean;
  imageUrl: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  /** @deprecated Use 'saveResult' instead for full original + edited export */
  (e: 'save', file: Blob): void;
  /** New: emits original, edited, and annotation data */
  (e: 'saveResult', result: AnnotatorSaveResult): void;
}>();

const isOpen = ref(props.modelValue);
const canvasEl = ref<HTMLCanvasElement | null>(null);

const {
  initCanvas,
  destroyCanvas,
  currentMode,
  isCropping,
  setDrawMode,
  addCircle,
  addArrow,
  addCross,
  addRectangle,
  rotateImage,
  startCrop,
  applyCrop,
  cancelCrop,
  resetZoom,
  undo,
  deleteSelected,
  exportAsBlob,
  exportSaveResult,
} = useFabricCanvas();

watch(() => props.modelValue, async (newVal) => {
  isOpen.value = newVal;
  if (newVal) {
    await nextTick();
    if (canvasEl.value && props.imageUrl) {
      await initCanvas(canvasEl.value, props.imageUrl);
    }
  } else {
    await destroyCanvas();
  }
});

watch(isOpen, (val) => {
  emit('update:modelValue', val);
});

const handleCancel = () => {
  isOpen.value = false;
};

const handleCropToggle = () => {
  if (isCropping.value) {
    cancelCrop();
  } else {
    startCrop();
  }
};

const handleApplyCrop = async () => {
  const success = await applyCrop();
  if (!success) {
    $q.notify({
      color: 'negative',
      message: t('components.imageAnnotationDialog.cropError'),
      icon: 'error',
    });
  }
};

const handleSave = async () => {
  // If crop mode is still active, apply it first
  if (isCropping.value) {
    await applyCrop();
  }

  const result = await exportSaveResult();
  if (!result) {
    // Fallback: try legacy single-blob export
    const blob = await exportAsBlob();
    if (!blob) {
      $q.notify({
        color: 'negative',
        message: t('components.imageAnnotationDialog.saveError'),
        icon: 'error',
      });
      return;
    }
    emit('save', blob);
    isOpen.value = false;
    return;
  }

  // Emit both legacy and new events for backward compatibility
  emit('save', result.editedBlob);
  emit('saveResult', result);
  isOpen.value = false;
};
</script>
