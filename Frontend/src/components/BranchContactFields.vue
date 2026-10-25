<template>
  <div class="q-gutter-sm">
    <q-input v-model="contacts.phoneNumber" outlined dense type="tel" maxlength="10"
      :label="t('adminManage.branchManagement.phoneLabel')"
      :rules="[(value) => !value || /^0\d{8,9}$/.test(value.trim()) || t('adminManage.branchManagement.invalidPhone')]"
      hide-bottom-space />
    <q-input v-model="contacts.mailAddress" outlined dense type="email" maxlength="255"
      :label="t('adminManage.branchManagement.emailLabel')"
      :rules="[(value) => !value || patterns.testPattern.email(value.trim()) || t('adminManage.branchManagement.invalidEmail')]"
      hide-bottom-space />
    <q-input v-model="contacts.facebook" outlined dense maxlength="255"
      :label="t('adminManage.branchManagement.facebookLabel')" />
    <q-input v-model="contacts.line" outlined dense maxlength="30"
      :label="t('adminManage.branchManagement.lineLabel')" />
  </div>
</template>

<script setup lang="ts">
import { patterns } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { BranchContacts } from 'src/stores/useBranch';

const contacts = defineModel<BranchContacts>({ required: true });
const { t } = useI18n();
</script>
