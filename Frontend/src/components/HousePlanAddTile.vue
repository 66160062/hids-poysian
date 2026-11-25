<template>
  <!-- ช่อง "+" ท้ายกริดแปลน: ชั้นถูกกำหนดตายตัวตามลำดับ (รูปแรก = ชั้น 1, ถัดไป = ชั้น 2 ...)
       ป้ายบอกชั้นที่จะได้ไว้ก่อนแตะ จึงไม่ต้องมี dropdown ให้เลือก -->
  <div class="col-6 col-sm-4">
    <q-card
      flat
      bordered
      class="add-plan-tile flex flex-center"
      :class="nextFloor ? 'cursor-pointer' : 'add-plan-tile--disabled'"
      role="button"
      :tabindex="nextFloor ? 0 : -1"
      :aria-disabled="!nextFloor"
      :aria-label="title"
      @click="onAdd"
      @keydown.enter.prevent="onAdd"
      @keydown.space.prevent="onAdd"
    >
      <div class="column items-center text-center q-px-sm">
        <q-icon name="add" size="36px" :color="nextFloor ? 'primary' : 'grey-4'" />
        <div class="text-caption text-weight-medium q-mt-xs" :class="nextFloor ? 'text-primary' : 'text-grey-6'">
          {{ title }}
        </div>
      </div>
    </q-card>
    <div v-if="error" class="text-caption text-negative q-mt-xs" role="alert">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { SelectOption } from 'src/stores/useInspection';

const props = defineProps<{
  // ชั้นที่จะได้ถ้าเพิ่มรูปตอนนี้ (nextPlanFloor) — null เมื่อทุกชั้นมีแปลนแล้ว
  nextFloor: SelectOption | null;
  error?: string | null;
}>();

// parent ต้องเปิด input file ต่อทันที (ยังอยู่ใน user gesture เดียวกัน เบราว์เซอร์จึงยอมเปิด)
const emit = defineEmits<{ (e: 'add', floorId: number): void }>();

const { t } = useI18n();
const title = computed(() =>
  props.nextFloor
    ? t('components.planPosition.addPlanForFloor', { floor: props.nextFloor.label })
    : t('components.planPosition.allFloorsHavePlans'),
);

const onAdd = () => {
  if (props.nextFloor) emit('add', props.nextFloor.value);
};
</script>

<style scoped>
/* ขนาดเท่าการ์ดแปลน (.upload-box ของหน้าเป็น scoped style จึงไม่มาถึง component นี้) */
.add-plan-tile {
  background-color: #fcfdfe;
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  width: 100%;
  min-height: 160px;
  transition: all 0.2s ease;
}
.add-plan-tile:not(.add-plan-tile--disabled):hover,
.add-plan-tile:not(.add-plan-tile--disabled):focus-visible {
  border-color: var(--q-primary);
  background-color: #f0f7ff;
}
.add-plan-tile--disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
