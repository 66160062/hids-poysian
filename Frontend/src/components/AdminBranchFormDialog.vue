<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
    <q-card class="dialog-card">
      <!-- Header -->
      <q-card-section class="dialog-header row items-center justify-between">
        <div class="row items-center">
          <q-avatar size="36px" color="deep-purple-1" text-color="deep-purple-9" icon="business" class="q-mr-sm" />
          <div>
            <div class="text-h6 text-weight-bold">
              {{ isEditing ? t('adminManage.branchManagement.editTitle') : t('adminManage.branchManagement.addTitle') }}
            </div>
            <div class="text-caption text-grey-6">
              {{ t('adminManage.teamManagement.manageBranchesSubtitle') }}
            </div>
          </div>
        </div>
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <!-- Form Body -->
      <q-card-section class="dialog-body q-pa-md scroll" style="max-height: 70vh">
        <q-form ref="formRef" class="q-gutter-y-md" @submit.prevent="onSave">
          <!-- Branch Name -->
          <div>
            <div class="dialog-field-label">
              {{ t('adminManage.branchManagement.nameLabel') }} <span class="text-negative">*</span>
            </div>
            <q-input
              v-model="localBranchName"
              outlined
              dense
              filled
              hide-bottom-space
              :placeholder="t('adminManage.branchManagement.namePlaceholder')"
              :rules="[(val) => !!val?.trim() || t('adminManage.userManagement.fillRequiredFields')]"
            >
              <template #prepend>
                <q-icon name="apartment" size="18px" color="deep-purple-8" />
              </template>
            </q-input>
          </div>

          <!-- Logo Upload Section -->
          <div>
            <div class="dialog-field-label">
              {{ t('adminManage.branchManagement.logoLabel') }}
            </div>
            <div class="row items-center q-gutter-x-md q-mb-sm">
              <q-avatar size="52px" color="grey-2" text-color="grey-7" class="branch-logo-preview">
                <img v-if="previewLogoUrl" :src="previewLogoUrl" />
                <q-icon v-else name="image" size="24px" />
              </q-avatar>
              <div class="col">
                <q-file
                  v-model="localLogoFile"
                  outlined
                  dense
                  filled
                  accept="image/*"
                  :label="t('adminManage.branchManagement.chooseLogoFile')"
                  clearable
                  hide-bottom-space
                  @update:model-value="onLogoChange"
                >
                  <template #prepend>
                    <q-icon name="upload" size="18px" />
                  </template>
                </q-file>
              </div>
            </div>
          </div>
        </q-form>
      </q-card-section>

      <q-separator />

      <!-- Footer Buttons -->
      <q-card-actions class="dialog-footer q-pa-md q-gutter-sm">
        <q-btn
          :label="t('adminManage.teamManagement.cancelLabel')"
          color="grey-8"
          flat
          no-caps
          v-close-popup
          class="col dialog-btn dialog-btn--cancel"
        />
        <q-btn
          :label="isEditing ? t('adminManage.teamManagement.saveButton') : t('adminManage.branchManagement.addBranch')"
          color="primary"
          unelevated
          no-caps
          :loading="saving"
          @click="onSave"
          class="col dialog-btn"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QForm } from 'quasar';
import type { Branch } from 'src/stores/useBranch';

const { t } = useI18n();

const props = defineProps<{
  modelValue: boolean;
  isEditing?: boolean;
  initialData?: Partial<Branch> | null;
  saving?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'save', payload: { branchName: string; logoFile: File | null }): void;
}>();

const formRef = ref<QForm | null>(null);
const localBranchName = ref('');
const localLogoFile = ref<File | null>(null);
const tempPreviewUrl = ref('');

const getImageUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  return `${import.meta.env.VITE_API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const previewLogoUrl = computed(() => {
  if (tempPreviewUrl.value) return tempPreviewUrl.value;
  if (props.initialData?.logoUrl) return getImageUrl(props.initialData.logoUrl);
  return '';
});

function onLogoChange(file: File | null | undefined) {
  if (tempPreviewUrl.value) {
    URL.revokeObjectURL(tempPreviewUrl.value);
    tempPreviewUrl.value = '';
  }
  if (file) {
    tempPreviewUrl.value = URL.createObjectURL(file);
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      if (tempPreviewUrl.value) {
        URL.revokeObjectURL(tempPreviewUrl.value);
        tempPreviewUrl.value = '';
      }
      localBranchName.value = props.initialData?.branchName || '';
      localLogoFile.value = null;
    }
  },
  { immediate: true },
);

const onSave = async () => {
  if (formRef.value) {
    const valid = await formRef.value.validate(true);
    if (!valid) return;
  }
  emit('save', {
    branchName: localBranchName.value.trim(),
    logoFile: localLogoFile.value,
  });
};
</script>

<style scoped>
.dialog-card {
  width: 100%;
  max-width: 500px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}
.dialog-header {
  padding: 16px 20px;
}
.dialog-field-label {
  font-size: 13.5px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
}
.branch-logo-preview {
  border-radius: 12px;
  border: 1px dashed #d1d5db;
  overflow: hidden;
}
.dialog-btn {
  border-radius: 12px;
  height: 42px;
  font-weight: 600;
}
.dialog-btn--cancel {
  background: #f3f4f6;
}
</style>
