<template>
  <q-dialog :model-value="modelValue" position="bottom" @update:model-value="emit('update:modelValue', $event)" @show="onShow">
    <q-card class="cr-sheet" role="dialog" aria-labelledby="cr-work-sheet-title">
      <div class="cr-sheet__handle" aria-hidden="true" />
      <q-card-section class="row items-center q-pb-none">
        <h2 id="cr-work-sheet-title" class="cr-sheet__title">
          {{ isEdit ? t('construction.report.workSheet.editTitle') : t('construction.report.workSheet.addTitle') }}
        </h2>
        <q-space />
        <q-btn flat round icon="close" class="cr-tap" :aria-label="t('construction.report.workSheet.cancel')" v-close-popup />
      </q-card-section>

      <q-card-section class="column q-gutter-y-md cr-sheet__body">
        <q-input
          ref="nameInput"
          v-model="draft.name"
          outlined
          :label="t('construction.report.workSheet.name')"
          :placeholder="t('construction.report.workSheet.namePlaceholder')"
          :error="nameError"
          :error-message="t('construction.report.workSheet.nameRequired')"
          maxlength="200"
          @update:model-value="nameError = false"
        />

        <div>
          <div id="cr-work-location" class="cr-label">{{ t('construction.report.workSheet.location') }}</div>
          <div class="row q-gutter-xs" role="group" aria-labelledby="cr-work-location">
            <button
              v-for="opt in roomOptions"
              :key="opt.value"
              type="button"
              class="cr-chip"
              :class="{ 'cr-chip--active': draft.location === opt.value }"
              :aria-pressed="draft.location === opt.value"
              @click="draft.location = draft.location === opt.value ? '' : opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div>
          <div id="cr-work-unit" class="cr-label">{{ t('construction.report.workSheet.unit') }}</div>
          <div class="row q-gutter-xs" role="group" aria-labelledby="cr-work-unit">
            <button
              v-for="opt in unitOptions"
              :key="opt.value"
              type="button"
              class="cr-chip"
              :class="{ 'cr-chip--active': draft.unit === opt.value }"
              :aria-pressed="draft.unit === opt.value"
              @click="draft.unit = draft.unit === opt.value ? '' : opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div>
          <div class="cr-label">{{ t('construction.report.workSheet.percent') }}</div>
          <PercentQuickPick v-model="draft.actual" :label="t('construction.report.workSheet.percent')" :previous="work?.previousPercent" />
        </div>
      </q-card-section>

      <q-card-actions class="cr-sheet__actions">
        <q-btn unelevated no-caps color="primary" class="cr-primary-btn full-width" :label="t('construction.report.workSheet.save')" @click="save" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import PercentQuickPick from './PercentQuickPick.vue';
import { ROOM_OPTION_KEYS, UNIT_OPTION_KEYS } from 'src/composables/constructionReport/reportForm';
import type { WorkEntry } from 'src/composables/constructionReport/reportForm';

const props = defineProps<{ modelValue: boolean; work: WorkEntry | null }>();
const emit = defineEmits<{
  'update:modelValue': [open: boolean];
  save: [value: { name: string; location: string; unit: string; actual: number | null }];
}>();
const { t } = useI18n();

const isEdit = computed(() => !!props.work);
const draft = reactive({ name: '', location: '', unit: '', actual: null as number | null });
const nameError = ref(false);
const nameInput = ref<{ focus: () => void } | null>(null);

// งานใหม่: โฟกัสช่องชื่อหลังแอนิเมชันเปิด sheet จบ / แก้ไข: ไม่เปิดคีย์บอร์ดบังปุ่ม %
function onShow() {
  if (!isEdit.value) nameInput.value?.focus();
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    nameError.value = false;
    draft.name = props.work?.name ?? '';
    draft.location = props.work?.location ?? '';
    draft.unit = props.work?.unit ?? '';
    draft.actual = props.work?.actual ?? null;
  },
);

const roomOptions = computed(() =>
  Object.entries(ROOM_OPTION_KEYS).map(([value, key]) => ({ value, label: t(`construction.inspect.roomOptions.${key}`) })),
);
const unitOptions = computed(() =>
  Object.entries(UNIT_OPTION_KEYS).map(([value, key]) => ({ value, label: t(`construction.inspect.unitOptions.${key}`) })),
);

function save() {
  const name = draft.name.trim();
  if (!name) {
    nameError.value = true;
    return;
  }
  emit('save', { name, location: draft.location, unit: draft.unit, actual: draft.actual ?? props.work?.previousPercent ?? 0 });
  emit('update:modelValue', false);
}
</script>
