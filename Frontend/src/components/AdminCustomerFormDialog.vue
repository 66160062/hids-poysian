<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
    <q-card class="dialog-card">
      <!-- Header -->
      <q-card-section class="dialog-header row items-center justify-between">
        <div class="row items-center">
          <q-avatar size="36px" color="teal-1" text-color="teal-9" icon="person" class="q-mr-sm" />
          <div class="text-h6 text-weight-bold">
            {{ isEditing ? t('adminManage.customerManagement.editCustomer') : t('adminManage.customerManagement.addCustomer') }}
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
              {{ t('adminManage.customerManagement.fullNameLabel') }}
            </div>
            <q-input
              v-model="localForm.name"
              outlined
              dense
              filled
              hide-bottom-space
              :placeholder="t('adminManage.customerManagement.fullNameRequired')"
              :rules="[(val) => !!val?.trim() || t('adminManage.customerManagement.fullNameRequired')]"
            />
          </div>

          <!-- Phone Numbers Section -->
          <div class="bg-grey-1 q-pa-sm rounded-borders">
            <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">
              <q-icon name="phone" size="16px" color="primary" class="q-mr-xs" />
              {{ t('adminManage.customerManagement.phoneLabel') }}
            </div>
            <q-input
              v-model="localForm.phone"
              outlined
              dense
              filled
              hide-bottom-space
              placeholder="0812345678"
              class="q-mb-sm"
              :rules="[
                (val) => !!val?.trim() || t('adminManage.customerManagement.phoneRequired'),
              ]"
            />

            <!-- Additional Phones Toggle/Inputs -->
            <q-expansion-item
              dense
              dense-toggle
              header-class="text-caption text-primary q-pa-none"
              :label="t('adminManage.customerManagement.additionalPhones')"
              default-opened
            >
              <div class="q-gutter-y-xs q-pt-xs">
                <q-input
                  v-model="localForm.phone2"
                  outlined
                  dense
                  filled
                  hide-bottom-space
                  :placeholder="t('adminManage.customerManagement.phone2Label')"
                />
                <q-input
                  v-model="localForm.phone3"
                  outlined
                  dense
                  filled
                  hide-bottom-space
                  :placeholder="t('adminManage.customerManagement.phone3Label')"
                />
              </div>
            </q-expansion-item>
          </div>

          <!-- Emails Section -->
          <div class="bg-grey-1 q-pa-sm rounded-borders">
            <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">
              <q-icon name="email" size="16px" color="teal-8" class="q-mr-xs" />
              {{ t('adminManage.customerManagement.emailLabel') }}
            </div>
            <q-input
              v-model="localForm.email"
              type="email"
              outlined
              dense
              filled
              hide-bottom-space
              placeholder="customer@example.com"
              class="q-mb-sm"
              :rules="[
                (val) => !!val?.trim() || t('adminManage.customerManagement.emailRequired'),
              ]"
            />

            <!-- Additional Emails Toggle/Inputs -->
            <q-expansion-item
              dense
              dense-toggle
              header-class="text-caption text-primary q-pa-none"
              :label="t('adminManage.customerManagement.additionalEmails')"
              default-opened
            >
              <div class="q-gutter-y-xs q-pt-xs">
                <q-input
                  v-model="localForm.email2"
                  type="email"
                  outlined
                  dense
                  filled
                  hide-bottom-space
                  :placeholder="t('adminManage.customerManagement.email2Label')"
                />
                <q-input
                  v-model="localForm.email3"
                  type="email"
                  outlined
                  dense
                  filled
                  hide-bottom-space
                  :placeholder="t('adminManage.customerManagement.email3Label')"
                />
              </div>
            </q-expansion-item>
          </div>

          <!-- Line ID -->
          <div>
            <div class="dialog-field-label">
              {{ t('adminManage.customerManagement.lineIdLabel') }}
            </div>
            <q-input
              v-model="localForm.lineId"
              outlined
              dense
              filled
              hide-bottom-space
              placeholder="Line ID"
            >
              <template #prepend>
                <q-icon name="chat" size="18px" color="green-7" />
              </template>
            </q-input>
          </div>

          <!-- Preferred Locale -->
          <div>
            <div class="dialog-field-label">
              {{ t('adminManage.customerManagement.preferredLocaleLabel') }}
            </div>
            <q-select
              v-model="localForm.preferredLocale"
              :options="localeOptions"
              outlined
              dense
              filled
              emit-value
              map-options
              hide-bottom-space
            >
              <template #prepend>
                <q-icon name="translate" size="18px" />
              </template>
            </q-select>
          </div>
        </q-form>
      </q-card-section>

      <q-separator />

      <!-- Footer Buttons -->
      <q-card-actions class="dialog-footer q-pa-md q-gutter-sm">
        <q-btn
          :label="t('adminManage.customerManagement.cancel')"
          color="grey-8"
          flat
          no-caps
          v-close-popup
          class="col dialog-btn dialog-btn--cancel"
        />
        <q-btn
          :label="t('adminManage.customerManagement.save')"
          color="primary"
          unelevated
          no-caps
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
import type { Customer } from 'src/stores/useCustomer';

const { t } = useI18n();

const props = defineProps<{
  modelValue: boolean;
  isEditing?: boolean;
  initialData?: Partial<Customer>;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'save', payload: Partial<Customer>): void;
}>();

const formRef = ref<QForm | null>(null);

const localForm = ref<{
  name: string;
  phone: string;
  phone2: string;
  phone3: string;
  email: string;
  email2: string;
  email3: string;
  lineId: string;
  preferredLocale: string;
}>({
  name: '',
  phone: '',
  phone2: '',
  phone3: '',
  email: '',
  email2: '',
  email3: '',
  lineId: '',
  preferredLocale: 'th-TH',
});

const localeOptions = computed(() => [
  { label: t('adminManage.customerManagement.localeThai'), value: 'th-TH' },
  { label: t('adminManage.customerManagement.localeEnglish'), value: 'en-US' },
]);

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      if (props.initialData) {
        localForm.value = {
          name: props.initialData.name || '',
          phone: props.initialData.phone || '',
          phone2: props.initialData.phone2 || '',
          phone3: props.initialData.phone3 || '',
          email: props.initialData.email || '',
          email2: props.initialData.email2 || '',
          email3: props.initialData.email3 || '',
          lineId: props.initialData.lineId || '',
          preferredLocale: props.initialData.preferredLocale || 'th-TH',
        };
      } else {
        localForm.value = {
          name: '',
          phone: '',
          phone2: '',
          phone3: '',
          email: '',
          email2: '',
          email3: '',
          lineId: '',
          preferredLocale: 'th-TH',
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
  emit('save', { ...localForm.value });
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
