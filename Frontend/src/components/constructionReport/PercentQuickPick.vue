<template>
  <div class="column q-gutter-y-sm">
    <CountStepper
      :model-value="modelValue ?? previous ?? 0"
      :label="label"
      :min="0"
      :max="100"
      :step="5"
      unit="%"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <div class="row q-gutter-xs" role="group" :aria-label="label">
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        class="cr-chip"
        :class="{ 'cr-chip--active': modelValue === opt.value }"
        :aria-pressed="modelValue === opt.value"
        @click="emit('update:modelValue', opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import CountStepper from './CountStepper.vue';

// เลือก % ได้เร็ว: ปุ่ม +/- ทีละ 5% หรือกดค่าที่ใช้บ่อย (มี "เท่าเดิม" สำหรับงานที่ดึงจากรอบก่อน)
const props = defineProps<{ modelValue: number | null; label: string; previous?: number | undefined }>();
const emit = defineEmits<{ 'update:modelValue': [value: number] }>();
const { t } = useI18n();

const options = computed(() => {
  const list: { value: number; label: string }[] = [];
  if (props.previous !== undefined) {
    list.push({ value: props.previous, label: `${t('construction.report.work.sameAsBefore')} ${props.previous}%` });
  }
  for (const v of [25, 50, 75, 100]) {
    if (v !== props.previous && (props.previous === undefined || v > props.previous)) {
      list.push({ value: v, label: `${v}%` });
    }
  }
  return list;
});
</script>
