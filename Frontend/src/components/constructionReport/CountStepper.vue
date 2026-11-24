<template>
  <div class="count-stepper row items-center no-wrap" :class="{ 'count-stepper--compact': compact }" role="group" :aria-label="label">
    <q-btn
      round
      unelevated
      color="grey-3"
      text-color="grey-9"
      icon="remove"
      class="count-stepper__btn"
      :disable="value <= min"
      :aria-label="t('construction.report.counter.decrease', { label })"
      @click="change(-step)"
    />
    <input
      class="count-stepper__value"
      type="text"
      inputmode="numeric"
      pattern="[0-9]*"
      :value="value"
      :aria-label="label"
      @focus="selectAll"
      @change="onInput"
    />
    <q-btn
      round
      unelevated
      color="primary"
      icon="add"
      class="count-stepper__btn"
      :disable="max !== undefined && value >= max"
      :aria-label="t('construction.report.counter.increase', { label })"
      @click="change(step)"
    />
    <span v-if="unit" class="count-stepper__unit text-grey-8">{{ unit }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

// ตัวนับแบบกด +/- ปุ่มใหญ่ (กดด้วยนิ้วโป้งข้างเดียวได้) และยังพิมพ์ตัวเลขตรงกลางได้ถ้าต้องการ
const props = withDefaults(
  defineProps<{
    modelValue: number | null;
    label: string;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    compact?: boolean;
  }>(),
  { min: 0, step: 1, unit: '', compact: false },
);
const emit = defineEmits<{ 'update:modelValue': [value: number] }>();
const { t } = useI18n();

const value = computed(() => props.modelValue ?? props.min);

function clamp(n: number): number {
  let out = Math.max(props.min, n);
  if (props.max !== undefined) out = Math.min(props.max, out);
  return out;
}
function change(delta: number) {
  emit('update:modelValue', clamp(value.value + delta));
}
function onInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const n = Number.parseInt(input.value, 10);
  const next = Number.isFinite(n) ? clamp(n) : value.value;
  input.value = String(next);
  emit('update:modelValue', next);
}
function selectAll(event: FocusEvent) {
  (event.target as HTMLInputElement).select();
}
</script>

<style scoped>
.count-stepper {
  gap: 8px;
}
.count-stepper__btn {
  width: 48px;
  height: 48px;
  font-size: 18px;
}
.count-stepper__value {
  width: 56px;
  height: 48px;
  border: 1px solid #cfd8dc;
  border-radius: 10px;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  background: #fff;
  color: #212121;
}
.count-stepper__value:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 1px;
}
.count-stepper--compact .count-stepper__btn {
  width: 44px;
  height: 44px;
}
.count-stepper--compact .count-stepper__value {
  width: 48px;
  height: 44px;
  font-size: 18px;
}
.count-stepper__unit {
  font-size: 14px;
  min-width: 2.5em;
}
</style>
