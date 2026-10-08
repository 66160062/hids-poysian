<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
    <q-card class="dialog-card">
      <!-- Header -->
      <q-card-section class="dialog-header row items-center justify-between">
        <div class="row items-center">
          <q-avatar size="36px" color="amber-1" text-color="amber-10" icon="engineering" class="q-mr-sm" />
          <div class="text-h6 text-weight-bold">
            {{ isEditing ? t('adminManage.contractorManagement.editContractor') : t('adminManage.contractorManagement.addContractor') }}
          </div>
        </div>
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <!-- Form Body -->
      <q-card-section class="dialog-body q-pa-md scroll" style="max-height: 70vh">
        <q-form ref="formRef" class="q-gutter-y-md" @submit.prevent="onSave">
          <!-- Full Name -->
          <div>
            <div class="dialog-field-label">
              {{ t('adminManage.contractorManagement.fullNameLabel') }}
            </div>
            <q-input
              v-model="localForm.fullName"
              outlined
              dense
              filled
              hide-bottom-space
              :placeholder="t('adminManage.contractorManagement.fullNameRequired')"
              :rules="[(val) => !!val?.trim() || t('adminManage.contractorManagement.fullNameRequired')]"
            />
          </div>

          <!-- Phone Number -->
          <div>
            <div class="dialog-field-label">
              {{ t('adminManage.contractorManagement.phoneLabel') }}
            </div>
            <q-input
              v-model="localForm.phoneNumber"
              outlined
              dense
              filled
              hide-bottom-space
              placeholder="0812345678"
              :rules="[(val) => !!val?.trim() || t('adminManage.contractorManagement.phoneRequired')]"
            >
              <template #prepend>
                <q-icon name="phone" size="18px" color="primary" />
              </template>
            </q-input>
          </div>

          <!-- Email -->
          <div>
            <div class="dialog-field-label">
              {{ t('adminManage.contractorManagement.emailLabel') }}
            </div>
            <q-input
              v-model="localForm.email"
              type="email"
              outlined
              dense
              filled
              hide-bottom-space
              placeholder="contractor@example.com"
            >
              <template #prepend>
                <q-icon name="email" size="18px" color="teal-8" />
              </template>
            </q-input>
          </div>

          <!-- Company Name / Line ID -->
          <div>
            <div class="dialog-field-label">
              {{ t('adminManage.contractorManagement.companyNameLabel') }}
            </div>
            <q-input
              v-model="localForm.companyName"
              outlined
              dense
              filled
              hide-bottom-space
              placeholder="Company / Line ID"
            >
              <template #prepend>
                <q-icon name="business" size="18px" color="orange-8" />
              </template>
            </q-input>
          </div>
        </q-form>
      </q-card-section>

      <q-separator />

      <!-- Footer Buttons -->
      <q-card-actions class="dialog-footer q-pa-md q-gutter-sm">
        <q-btn
          :label="t('adminManage.contractorManagement.cancel')"
          color="grey-8"
          flat
          no-caps
          v-close-popup
          class="col dialog-btn dialog-btn--cancel"
        />
        <q-btn
          :label="t('adminManage.contractorManagement.save')"
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
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QForm } from 'quasar';
import type { Contractor, ContractorPayload } from 'src/stores/useContractor';

const { t } = useI18n();

const props = defineProps<{
  modelValue: boolean;
  isEditing?: boolean;
  initialData?: Partial<Contractor>;
  saving?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'save', payload: ContractorPayload): void;
}>();

const formRef = ref<QForm | null>(null);

const localForm = ref<{
  fullName: string;
  phoneNumber: string;
  email: string;
  companyName: string;
}>({
  fullName: '',
  phoneNumber: '',
  email: '',
  companyName: '',
});

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      if (props.initialData) {
        localForm.value = {
          fullName: props.initialData.fullName || '',
          phoneNumber: props.initialData.phoneNumber || '',
          email: props.initialData.email || '',
          companyName: props.initialData.companyName || '',
        };
      } else {
        localForm.value = {
          fullName: '',
          phoneNumber: '',
          email: '',
          companyName: '',
        };
      }
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
    fullName: localForm.value.fullName.trim(),
    phoneNumber: localForm.value.phoneNumber.trim(),
    email: localForm.value.email.trim() || undefined,
    companyName: localForm.value.companyName.trim() || undefined,
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
.dialog-btn {
  border-radius: 12px;
  height: 42px;
  font-weight: 600;
}
.dialog-btn--cancel {
  background: #f3f4f6;
}
</style>
