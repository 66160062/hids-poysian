<template>
  <q-page class="q-pa-md page">
    <div class="row items-center justify-between q-mb-md"><div class="text-h6">{{ t('adminManage.branchManagement.title') }}</div><q-btn color="primary" icon="add" :label="t('adminManage.branchManagement.addBranch')" @click="openForm()" /></div>
    <q-banner v-if="!branches.length" rounded class="bg-blue-1 text-primary q-mb-md">{{ t('adminManage.branchManagement.emptyBanner') }}</q-banner>
    <q-list bordered separator class="rounded-borders bg-white"><q-item v-for="branch in branches" :key="branch.branchId"><q-item-section avatar><q-avatar color="grey-2"><img v-if="branch.logoUrl" :src="imageUrl(branch.logoUrl)" /><q-icon v-else name="business" /></q-avatar></q-item-section><q-item-section><q-item-label>{{ branch.branchName }}</q-item-label><q-item-label caption>{{ t('adminManage.branchManagement.jobMappingHint') }}</q-item-label></q-item-section><q-item-section side><q-btn flat round icon="edit" @click="openForm(branch)" /></q-item-section></q-item></q-list>
    <q-dialog v-model="dialog">
      <q-card style="min-width: min(420px, 90vw)">
        <q-form @submit="save">
          <q-card-section class="text-h6">{{ editing ? t('adminManage.branchManagement.editTitle') : t('adminManage.branchManagement.addTitle') }}</q-card-section>
          <q-card-section class="q-gutter-md">
            <q-input v-model="name" outlined maxlength="255" :label="t('adminManage.branchManagement.nameLabel')" autofocus />
            <BranchContactFields v-model="contacts" />
            <q-file v-model="logo" outlined accept="image/*" :label="t('adminManage.branchManagement.logoLabel')" />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat :label="t('adminManage.branchManagement.cancel')" v-close-popup />
            <q-btn type="submit" color="primary" :label="t('adminManage.branchManagement.save')" :disable="!name.trim()" :loading="saving" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'; import { storeToRefs } from 'pinia'; import { useQuasar } from 'quasar'; import { useI18n } from 'vue-i18n'; import { useBranchStore, branchContacts, type Branch } from 'src/stores/useBranch';
import BranchContactFields from 'src/components/BranchContactFields.vue';
const store = useBranchStore(); const { branches } = storeToRefs(store); const $q = useQuasar(); const { t } = useI18n(); const dialog = ref(false); const editing = ref<Branch | null>(null); const name = ref(''); const logo = ref<File | null>(null);
const contacts = ref(branchContacts());
const saving = ref(false);
const imageUrl = (path: string) => path.startsWith('http') ? path : `${import.meta.env.VITE_API_URL}${path}`;
function openForm(branch: Branch | null = null) { editing.value = branch; name.value = branch?.branchName ?? ''; contacts.value = branchContacts(branch); logo.value = null; dialog.value = true; }
async function save() {
  if (!name.value.trim()) return;
  saving.value = true;
  try {
    await store.saveBranch(editing.value?.branchId ?? null, name.value.trim(), logo.value, contacts.value);
    dialog.value = false;
    $q.notify({ type: 'positive', message: t('adminManage.branchManagement.saveSuccess') });
  } catch {
    $q.notify({ type: 'negative', message: t('adminManage.branchManagement.saveFailed') });
  } finally {
    saving.value = false;
  }
}
onMounted(() => void store.fetchBranches());
</script>
<style scoped>.page { max-width: 720px; margin: 0 auto; }</style>
