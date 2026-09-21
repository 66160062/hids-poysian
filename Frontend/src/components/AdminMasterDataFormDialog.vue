<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="dialog-card">
      <q-card-section class="dialog-header row items-center no-wrap">
        <div class="dialog-header-icon">
          <q-icon :name="isEditing ? 'edit' : icon" size="24px" />
        </div>
        <div class="col q-ml-md">
          <div class="dialog-title text-weight-bold text-dark">{{ title }}</div>
        </div>
        <q-btn icon="close" flat round dense class="dialog-close-btn" v-close-popup />
      </q-card-section>
      <q-separator />

      <q-card-section class="dialog-body">
        <q-form :id="formId" class="q-gutter-md" @submit="emit('submit')">
          <slot />
        </q-form>
      </q-card-section>

      <q-separator />
      <q-card-actions class="dialog-footer q-gutter-sm">
        <q-btn
          :label="t('adminManage.masterData.cancel')"
          color="grey-8"
          flat
          no-caps
          v-close-popup
          class="col dialog-btn dialog-btn--cancel"
        />
        <q-btn
          :label="t('adminManage.masterData.save')"
          type="submit"
          :form="formId"
          color="primary"
          unelevated
          no-caps
          :loading="saving"
          class="col dialog-btn"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    icon: string;
    isEditing?: boolean;
    saving?: boolean;
    formId: string;
  }>(),
  {
    isEditing: false,
    saving: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit'): void;
}>();
</script>

<style scoped>
.dialog-card {
  width: 100%;
  max-width: 480px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}
@media (min-width: 600px) {
  .dialog-card {
    max-width: 560px;
  }
}
.dialog-header {
  padding: 20px 24px;
}
.dialog-header-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1976d2;
  flex-shrink: 0;
}
.dialog-title {
  font-size: 18px;
  line-height: 1.3;
}
.dialog-close-btn {
  background-color: #f2f4f7;
  transition: background-color 0.15s ease;
}
.dialog-close-btn:hover {
  background-color: #e7ebf0;
}
.dialog-body {
  padding: 22px 24px;
  max-height: 62vh;
  overflow-y: auto;
}
.dialog-body :deep(.dialog-field-label) {
  font-size: 13px;
  font-weight: 600;
  color: #55606e;
  margin-bottom: 6px;
}
.dialog-body :deep(.q-field__control) {
  border-radius: 12px;
}
.dialog-footer {
  padding: 16px 24px;
  background-color: #fafbfc;
}
.dialog-btn {
  border-radius: 12px;
  height: 44px;
  font-weight: 600;
  min-width: 120px;
}
.dialog-btn--cancel {
  border: 1px solid #e3e6ea;
  background-color: #ffffff;
}

@media (max-width: 599px) {
  .dialog-header,
  .dialog-body,
  .dialog-footer {
    padding-left: 16px;
    padding-right: 16px;
  }
  .dialog-body {
    max-height: 70vh;
  }
  .dialog-title {
    font-size: 16px;
  }
}
</style>
