<template>
  <q-dialog ref="dialogRef" persistent transition-show="fade" transition-hide="fade" @hide="onDialogHide">
    <q-card flat class="confirm-dialog" :class="`confirm-dialog--${color}`">
      <div class="confirm-dialog__body">
        <!-- ส่ง icon เป็น '' เพื่อซ่อนไอคอน -->
        <div v-if="icon" class="confirm-dialog__icon">
          <q-icon :name="icon" size="40px" />
        </div>
        <div class="confirm-dialog__text" :class="{ 'confirm-dialog__text--no-icon': !icon }">
          <div class="confirm-dialog__title">{{ title }}</div>
          <div class="confirm-dialog__message">{{ message }}</div>
        </div>
      </div>

      <div class="confirm-dialog__actions">
        <q-btn
          :label="resolvedCancelLabel"
          flat
          no-caps
          :ripple="false"
          class="confirm-dialog__btn confirm-dialog__btn--cancel"
          @click="onDialogCancel"
        />
        <q-btn
          :label="resolvedConfirmLabel"
          unelevated
          no-caps
          :ripple="false"
          class="confirm-dialog__btn confirm-dialog__btn--confirm"
          @click="onDialogOK"
        />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
  defineProps<{
    title: string;
    message: string;
    icon?: string;
    color?: 'negative' | 'primary' | 'warning' | 'positive';
    confirmLabel?: string;
    cancelLabel?: string;
  }>(),
  {
    icon: 'warning',
    color: 'negative',
    confirmLabel: '',
    cancelLabel: '',
  },
);

defineEmits([...useDialogPluginComponent.emits]);

const { t } = useI18n();
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();

const resolvedConfirmLabel = computed(() => props.confirmLabel || t('common.dialog.confirm'));
const resolvedCancelLabel = computed(() => props.cancelLabel || t('common.dialog.cancel'));
</script>

<style scoped lang="scss">
.confirm-dialog {
  --accent: #dc2626;
  --accent-hover: #b91c1c;

  width: 100%;
  max-width: 360px;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  box-shadow: none;
  overflow: hidden;
}

.confirm-dialog--primary {
  --accent: #2563eb;
  --accent-hover: #1d4ed8;
}

.confirm-dialog--warning {
  --accent: #d97706;
  --accent-hover: #b45309;
}

.confirm-dialog--positive {
  --accent: #16a34a;
  --accent-hover: #15803d;
}

.confirm-dialog__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 28px 24px 20px;
}

.confirm-dialog__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}

.confirm-dialog__text {
  margin-top: 16px;
}

.confirm-dialog__text--no-icon {
  margin-top: 0;
}

.confirm-dialog__title {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.35;
  color: #111827;
}

.confirm-dialog__message {
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.55;
  color: #6b7280;
}

.confirm-dialog__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 0 20px 20px;
}

.confirm-dialog__btn {
  height: 44px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  box-shadow: none;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;

  // Quasar paints a hover/focus overlay via ::before — keep the flat look
  :deep(.q-focus-helper) {
    display: none;
  }
}

.confirm-dialog__btn--cancel {
  color: #374151;
  background: #ffffff;
  border: 1px solid #e5e7eb;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
}

.confirm-dialog__btn--confirm {
  color: #ffffff;
  background: var(--accent);
  border: 1px solid var(--accent);

  &:hover {
    background: var(--accent-hover);
    border-color: var(--accent-hover);
  }
}

.confirm-dialog__btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
</style>
