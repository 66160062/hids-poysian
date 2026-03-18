<template>
  <div class="swipe-container q-mb-md">
    <div class="swipe-back-layer">
      <q-btn
        flat
        class="full-height full-width delete-btn"
        color="white"
        icon="delete"
        label="ลบ"
        @click.stop="$emit('delete', work)"
      />
    </div>

    <!-- Front Layer: Task Card -->
    <q-card
      flat
      bordered
      class="work-card"
      :class="{ 'is-swiped': isOpen }"
      :style="cardStyle"
      @click="handleCardClick"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <q-card-section>
        <div class="row items-start justify-between">
          <div class="text-weight-bold text-subtitle1">{{ work.title }}</div>
          <q-chip dense :color="getStatusColor(work.status)" text-color="dark" class="status-chip">
            {{ work.status }}
          </q-chip>
        </div>

        <div class="row q-gutter-sm q-mt-xs">
          <q-chip dense outline color="blue-2" text-color="blue-7" class="info-chip">
            {{ work.type }}
          </q-chip>
          <q-chip dense outline color="blue-2" text-color="blue-7" class="info-chip">
            {{ work.area }}
          </q-chip>
        </div>

        <div class="row items-center q-mt-sm text-grey-8">
          <q-icon name="person_outline" size="18px" class="q-mr-xs" />
          <span class="text-caption">ผู้ตรวจสอบ:</span>
          <span class="text-caption text-weight-medium q-ml-xs">{{ work.inspector }}</span>
        </div>

        <q-separator class="q-my-sm" />

        <div class="row items-center justify-between">
          <div class="row items-center text-grey-6">
            <q-icon name="calendar_today" size="16px" class="q-mr-xs" />
            <span class="text-caption">{{ work.date }}</span>
          </div>
          <div class="row q-gutter-x-sm">
            <q-btn flat round dense icon="edit" color="grey-7" @click.stop="$emit('edit', work)" />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

export interface Work {
  id: number;
  title: string;
  type: string;
  area: string;
  inspector: string;
  date: string;
  status: string;
  statusKey: string;
}

const props = defineProps<{
  work: Work;
  isOpen?: boolean;
}>();

const emit = defineEmits<{
  (e: 'interaction-start'): void;
  (e: 'open'): void;
  (e: 'close'): void;
  (e: 'delete', work: Work): void;
  (e: 'edit', work: Work): void;
  (e: 'click', work: Work): void;
}>();

const DELETE_REVEAL = 90;
const currentOffset = ref(props.isOpen ? -DELETE_REVEAL : 0);
const isPanning = ref(false);
const pointerStart = ref<{ x: number; y: number } | null>(null);
const pointerLocked = ref<'horizontal' | 'vertical' | null>(null);

watch(
  () => props.isOpen,
  (newVal) => {
    if (!isPanning.value) {
      currentOffset.value = newVal ? -DELETE_REVEAL : 0;
    }
  },
);

function onPointerDown(e: PointerEvent) {
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

  isPanning.value = false;
  pointerLocked.value = null;
  pointerStart.value = { x: e.clientX, y: e.clientY };

  emit('interaction-start');
}

function onPointerMove(e: PointerEvent) {
  if (!pointerStart.value) return;

  const dx = e.clientX - pointerStart.value.x;
  const dy = e.clientY - pointerStart.value.y;

  if (!pointerLocked.value) {
    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
    pointerLocked.value = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
  }

  if (pointerLocked.value !== 'horizontal') return;

  e.preventDefault();
  isPanning.value = true;

  const baseOffset = props.isOpen ? -DELETE_REVEAL : 0;
  let rawOffset = baseOffset + dx;

  // อนุญาตให้เลื่อนกลับไปขวาได้แต่ไม่เกิน 0
  if (rawOffset > 0) rawOffset = 0;
  if (rawOffset < -DELETE_REVEAL) rawOffset = -DELETE_REVEAL;

  currentOffset.value = rawOffset;
}

function onPointerUp() {
  if (!pointerStart.value) return;

  const wasPanning = isPanning.value;

  if (pointerLocked.value === 'horizontal') {
    if (-currentOffset.value > DELETE_REVEAL / 2) {
      currentOffset.value = -DELETE_REVEAL;
      emit('open');
    } else {
      currentOffset.value = 0;
      emit('close');
    }
  }

  pointerStart.value = null;
  pointerLocked.value = null;

  if (wasPanning) {
    // Delay resetting isPanning so that the browser's native click event
    // that fires immediately after mouse release is blocked by handleCardClick
    setTimeout(() => {
      isPanning.value = false;
    }, 50);
  } else {
    isPanning.value = false;
  }
}

const cardStyle = computed(() => {
  return {
    transform: `translate3d(${currentOffset.value}px, 0, 0)`,
    transition: isPanning.value ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    cursor: 'pointer',
  };
});

function handleCardClick() {
  if (isPanning.value) return;
  if (props.isOpen) {
    currentOffset.value = 0;
    emit('close');
    return;
  }
  emit('click', props.work);
}

function getStatusColor(status: string) {
  switch (status) {
    case 'กำลังดำเนินการ':
      return 'orange-2';
    case 'รอดำเนินการ':
      return 'grey-3';
    case 'เสร็จสิ้น':
      return 'green-2';
    default:
      return 'grey-3';
  }
}
</script>

<style scoped>
.swipe-container {
  position: relative;
  border-radius: 12px;
}

.swipe-back-layer {
  position: absolute;
  top: 1px;
  right: 1px;
  bottom: 1px;
  width: 98px;
  background: var(--q-negative);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  border-radius: 0 11px 11px 0;
}

.delete-btn {
  width: 100%;
  height: 100%;
}

.work-card {
  border-radius: 12px;
  border-color: #e8e8e8;
  transition: all 0.2s;
  position: relative;
  z-index: 2;
  background: white;
  touch-action: none;
  user-select: none;
  will-change: transform;
  cursor: grab;
}
.work-card:active {
  cursor: grabbing;
}

.work-card.clickable {
  cursor: pointer;
}

.work-card.clickable:hover {
  border-color: var(--q-primary);
  background-color: #fcfcfc;
}

.status-chip {
  font-size: 11px;
  font-weight: 500;
  border-radius: 4px;
}

.info-chip {
  font-size: 11px;
  border-radius: 6px;
  background: #f0f7ff !important;
}
</style>
