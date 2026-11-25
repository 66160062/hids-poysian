<template>
  <q-dialog :model-value="modelValue" position="bottom" @update:model-value="emit('update:modelValue', $event)" @show="onShow">
    <q-card class="cr-sheet" role="dialog" aria-labelledby="cr-machine-sheet-title">
      <div class="cr-sheet__handle" aria-hidden="true" />
      <q-card-section class="row items-center q-pb-none">
        <h2 id="cr-machine-sheet-title" class="cr-sheet__title">{{ t('construction.report.machineSheet.title') }}</h2>
        <q-space />
        <q-btn flat round icon="close" class="cr-tap" :aria-label="t('construction.report.workSheet.cancel')" v-close-popup />
      </q-card-section>
      <q-card-section class="column q-gutter-y-md cr-sheet__body">
        <q-input
          v-model="name"
          outlined
          ref="nameInput"
          maxlength="100"
          :label="t('construction.report.machineSheet.name')"
          :placeholder="t('construction.report.machineSheet.namePlaceholder')"
          :error="nameError"
          :error-message="t('construction.report.machineSheet.nameRequired')"
          @update:model-value="nameError = false"
        />
        <q-input
          v-model="size"
          outlined
          maxlength="50"
          :label="t('construction.report.machineSheet.size')"
          :placeholder="t('construction.report.machineSheet.sizePlaceholder')"
        />
      </q-card-section>
      <q-card-actions class="cr-sheet__actions">
        <q-btn unelevated no-caps color="primary" class="cr-primary-btn full-width" :label="t('construction.report.machineSheet.save')" @click="save" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [open: boolean]; save: [value: { name: string; size: string }] }>();
const { t } = useI18n();

const name = ref('');
const size = ref('');
const nameError = ref(false);
const nameInput = ref<{ focus: () => void } | null>(null);

// โฟกัสหลังแอนิเมชันเปิด sheet จบ (autofocus ทำงานก่อน sheet แสดงจึงไม่ติด)
function onShow() {
  nameInput.value?.focus();
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    name.value = '';
    size.value = '';
    nameError.value = false;
  },
);

function save() {
  const trimmed = name.value.trim();
  if (!trimmed) {
    nameError.value = true;
    return;
  }
  emit('save', { name: trimmed, size: size.value.trim() });
  emit('update:modelValue', false);
}
</script>
