<template>
  <q-dialog v-model="isOpen" maximized persistent transition-show="slide-up" transition-hide="slide-down">
    <q-card class="bg-dark text-white column no-wrap">
      <q-bar class="bg-black text-white" style="height: 50px">
        <q-btn dense flat icon="close" v-close-popup @click="handleCancel" />
        <q-space />
        <div class="text-weight-bold">แก้ไขรูปภาพ</div>
        <q-space />
        <q-btn dense flat icon="check" color="positive" @click="handleSave" />
      </q-bar>
      
      <q-card-section class="col q-pa-none flex flex-center" style="position: relative; overflow: hidden; background: #222">
        <canvas ref="canvasEl"></canvas>
      </q-card-section>
      
      <!-- Toolbar -->
      <q-card-actions class="bg-black justify-center q-pa-sm">
        <q-btn-group flat>
          <q-btn :color="currentMode === 'freehand' ? 'primary' : 'white'" flat icon="edit" @click="setDrawMode('freehand')" />
          <q-btn :color="currentMode === 'circle' ? 'primary' : 'white'" flat icon="radio_button_unchecked" @click="addCircle" />
          <q-btn :color="currentMode === 'arrow' ? 'primary' : 'white'" flat icon="arrow_outward" @click="addArrow" />
          <q-btn :color="currentMode === 'select' ? 'primary' : 'white'" flat icon="pan_tool" @click="setDrawMode('select')" />
          <q-separator vertical dark class="q-mx-sm" />
          <q-btn color="warning" flat icon="undo" @click="undo" />
        </q-btn-group>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useFabricCanvas } from 'src/composables/useFabricCanvas';

const props = defineProps<{
  modelValue: boolean;
  imageUrl: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'save', file: Blob): void;
}>();

const isOpen = ref(props.modelValue);
const canvasEl = ref<HTMLCanvasElement | null>(null);

const { 
  initCanvas, 
  destroyCanvas, 
  currentMode, 
  setDrawMode, 
  addCircle, 
  addArrow, 
  undo, 
  exportAsBlob 
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

const handleSave = async () => {
  const blob = await exportAsBlob();
  if (blob) {
    emit('save', blob);
  }
  isOpen.value = false;
};
</script>
