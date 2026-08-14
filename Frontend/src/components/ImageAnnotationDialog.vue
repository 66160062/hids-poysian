<template>
  <q-dialog v-model="dialog" maximized>
    <q-card class="column no-wrap bg-grey-9" style="height: 100dvh">
      <q-bar class="bg-white text-grey-9 q-py-md">
        <q-btn flat round dense icon="close" @click="dialog = false" />
        <q-space />
        <div class="text-subtitle1 text-weight-bold">แก้ไขรูปภาพ</div>
        <q-space />
        <q-btn flat round dense icon="check" color="primary" :disable="!ready" @click="confirm" />
      </q-bar>

      <div class="col flex flex-center overflow-hidden relative-position">
        <q-spinner v-if="!ready && !loadError" color="white" size="48px" />
        <div v-else-if="loadError" class="text-white text-center q-pa-md">
          <q-icon name="error_outline" size="48px" />
          <div class="q-mt-sm">ไม่สามารถโหลดรูปภาพเพื่อแก้ไขได้</div>
        </div>
        <canvas
          v-show="ready"
          ref="canvasEl"
          style="touch-action: none; max-width: 100%; max-height: 100%"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        />
      </div>

      <div class="col-auto bg-white q-pa-sm shadow-up-2" style="border-radius: 16px 16px 0 0">
        <q-btn-toggle
          v-model="activeTool"
          spread
          no-caps
          rounded
          unelevated
          toggle-color="primary"
          color="white"
          text-color="grey-8"
          :options="toolOptions"
          style="border: 1px solid #e0e0e0; border-radius: 8px"
        />
        <div class="row items-center justify-between q-mt-sm">
          <div class="row items-center q-gutter-x-sm">
            <q-btn
              v-for="c in colorOptions"
              :key="c.key"
              round
              dense
              size="sm"
              :style="{
                backgroundColor: c.hex,
                border: activeColor === c.key ? '2px solid #333' : '2px solid transparent',
              }"
              @click="activeColor = c.key"
            />
          </div>
          <div class="row items-center q-gutter-x-xs">
            <q-btn flat round dense icon="undo" :disable="shapes.length === 0" @click="undo" />
            <q-btn
              flat
              round
              dense
              icon="delete_sweep"
              :disable="shapes.length === 0"
              @click="clearAll"
            />
          </div>
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';

const props = defineProps<{
  imageSrc: string;
}>();

const dialog = defineModel<boolean>({ default: false });

const emit = defineEmits<{
  (e: 'save', file: File, previewUrl: string): void;
}>();

// ── Tools / colors ───────────────────────────────────────────

type Tool = 'pen' | 'line' | 'ellipse' | 'arrow';
type ColorKey = 'red' | 'yellow' | 'blue';

const toolOptions = [
  { value: 'pen', icon: 'edit' },
  { value: 'line', icon: 'remove' },
  { value: 'ellipse', icon: 'radio_button_unchecked' },
  { value: 'arrow', icon: 'north_east' },
];

const colorOptions: { key: ColorKey; hex: string }[] = [
  { key: 'red', hex: '#e53935' },
  { key: 'yellow', hex: '#fdd835' },
  { key: 'blue', hex: '#1e88e5' },
];

const activeTool = ref<Tool>('pen');
const activeColor = ref<ColorKey>('red');

const STROKE_WIDTH = 6;

// ── Shape model ───────────────────────────────────────────────

interface BaseShape {
  tool: Tool;
  color: string;
  width: number;
}
interface PenShape extends BaseShape {
  tool: 'pen';
  points: { x: number; y: number }[];
}
interface LineShape extends BaseShape {
  tool: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
interface EllipseShape extends BaseShape {
  tool: 'ellipse';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
interface ArrowShape extends BaseShape {
  tool: 'arrow';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
type Shape = PenShape | LineShape | EllipseShape | ArrowShape;

const shapes = ref<Shape[]>([]);
const currentShape = ref<Shape | null>(null);

// ── Canvas / image loading ───────────────────────────────────

const canvasEl = ref<HTMLCanvasElement | null>(null);
const baseImage = ref<HTMLImageElement | null>(null);
const ready = ref(false);
const loadError = ref(false);
let fetchedBlobUrl: string | null = null;

const MAX_DIMENSION = 1800;

const loadImage = async () => {
  ready.value = false;
  loadError.value = false;
  shapes.value = [];
  currentShape.value = null;

  try {
    const res = await fetch(props.imageSrc);
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    fetchedBlobUrl = URL.createObjectURL(blob);

    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('image decode failed'));
      img.src = fetchedBlobUrl as string;
    });

    let { naturalWidth: w, naturalHeight: h } = img;
    if (Math.max(w, h) > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    baseImage.value = img;

    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    const canvas = canvasEl.value;
    if (!canvas) return;
    canvas.width = w;
    canvas.height = h;

    ready.value = true;
    redraw();
  } catch {
    loadError.value = true;
  }
};

const revokeFetchedBlobUrl = () => {
  if (fetchedBlobUrl) {
    URL.revokeObjectURL(fetchedBlobUrl);
    fetchedBlobUrl = null;
  }
};

watch(dialog, (open) => {
  if (open) void loadImage();
  else revokeFetchedBlobUrl();
});

onUnmounted(() => {
  revokeFetchedBlobUrl();
});

// ── Drawing ───────────────────────────────────────────────────

const colorMap: Record<ColorKey, string> = {
  red: '#e53935',
  yellow: '#fdd835',
  blue: '#1e88e5',
};

const drawShape = (ctx: CanvasRenderingContext2D, s: Shape) => {
  ctx.strokeStyle = s.color;
  ctx.fillStyle = s.color;
  ctx.lineWidth = s.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (s.tool === 'pen') {
    if (s.points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(s.points[0]!.x, s.points[0]!.y);
    for (let i = 1; i < s.points.length; i++) {
      ctx.lineTo(s.points[i]!.x, s.points[i]!.y);
    }
    ctx.stroke();
    return;
  }

  if (s.tool === 'line') {
    ctx.beginPath();
    ctx.moveTo(s.x1, s.y1);
    ctx.lineTo(s.x2, s.y2);
    ctx.stroke();
    return;
  }

  if (s.tool === 'ellipse') {
    const cx = (s.x1 + s.x2) / 2;
    const cy = (s.y1 + s.y2) / 2;
    const rx = Math.abs(s.x2 - s.x1) / 2;
    const ry = Math.abs(s.y2 - s.y1) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  if (s.tool === 'arrow') {
    ctx.beginPath();
    ctx.moveTo(s.x1, s.y1);
    ctx.lineTo(s.x2, s.y2);
    ctx.stroke();

    const angle = Math.atan2(s.y2 - s.y1, s.x2 - s.x1);
    const headLen = Math.max(12, s.width * 4);
    const headAngle = Math.PI / 7;

    ctx.beginPath();
    ctx.moveTo(s.x2, s.y2);
    ctx.lineTo(s.x2 - headLen * Math.cos(angle - headAngle), s.y2 - headLen * Math.sin(angle - headAngle));
    ctx.lineTo(s.x2 - headLen * Math.cos(angle + headAngle), s.y2 - headLen * Math.sin(angle + headAngle));
    ctx.closePath();
    ctx.fill();
  }
};

const redraw = () => {
  const canvas = canvasEl.value;
  const img = baseImage.value;
  if (!canvas || !img) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  for (const s of shapes.value) drawShape(ctx, s);
  if (currentShape.value) drawShape(ctx, currentShape.value);
};

// ── Pointer handling ─────────────────────────────────────────

const toCanvasCoords = (e: PointerEvent, canvas: HTMLCanvasElement) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) * canvas.width) / rect.width,
    y: ((e.clientY - rect.top) * canvas.height) / rect.height,
  };
};

const onPointerDown = (e: PointerEvent) => {
  const canvas = canvasEl.value;
  if (!canvas || !ready.value) return;
  (e.target as HTMLElement).setPointerCapture(e.pointerId);
  const { x, y } = toCanvasCoords(e, canvas);
  const color = colorMap[activeColor.value];

  if (activeTool.value === 'pen') {
    currentShape.value = { tool: 'pen', color, width: STROKE_WIDTH, points: [{ x, y }] };
  } else {
    currentShape.value = {
      tool: activeTool.value,
      color,
      width: STROKE_WIDTH,
      x1: x,
      y1: y,
      x2: x,
      y2: y,
    };
  }
};

const onPointerMove = (e: PointerEvent) => {
  const canvas = canvasEl.value;
  if (!canvas || !currentShape.value) return;
  const { x, y } = toCanvasCoords(e, canvas);
  if (currentShape.value.tool === 'pen') {
    currentShape.value.points.push({ x, y });
  } else {
    currentShape.value.x2 = x;
    currentShape.value.y2 = y;
  }
  redraw();
};

const onPointerUp = () => {
  if (!currentShape.value) return;
  shapes.value.push(currentShape.value);
  currentShape.value = null;
};

// ── Undo / Clear ─────────────────────────────────────────────

const undo = () => {
  shapes.value.pop();
  redraw();
};

const clearAll = () => {
  shapes.value = [];
  redraw();
};

// ── Confirm ───────────────────────────────────────────────────

const confirm = () => {
  const canvas = canvasEl.value;
  if (!canvas || !ready.value) return;
  currentShape.value = null;

  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const file = new File([blob], `defect-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);
      emit('save', file, previewUrl);
      dialog.value = false;
    },
    'image/jpeg',
    0.9,
  );
};
</script>
