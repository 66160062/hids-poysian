<template>
  <q-page class="q-pa-md page">
    <div class="row items-center justify-between q-mb-md"><div class="text-h6">บริษัท / สาขา</div><q-btn color="primary" icon="add" label="เพิ่มบริษัท" @click="openForm()" /></div>
    <q-banner v-if="!branches.length" rounded class="bg-blue-1 text-primary q-mb-md">เพิ่มบริษัทหรือสาขาก่อนเปิดเล่มงาน เพื่อแยกงานและโลโก้ในรายงาน</q-banner>
    <q-list bordered separator class="rounded-borders bg-white"><q-item v-for="branch in branches" :key="branch.branchId"><q-item-section avatar><q-avatar color="grey-2"><img v-if="branch.logoUrl" :src="imageUrl(branch.logoUrl)" /><q-icon v-else name="business" /></q-avatar></q-item-section><q-item-section><q-item-label>{{ branch.branchName }}</q-item-label><q-item-label caption>งานที่เปิดเล่มจะถูก map กับบริษัทนี้</q-item-label></q-item-section><q-item-section side><q-btn flat round icon="edit" @click="openForm(branch)" /></q-item-section></q-item></q-list>
    <q-dialog v-model="dialog"><q-card style="min-width: min(420px, 90vw)"><q-card-section class="text-h6">{{ editing ? 'แก้ไขบริษัท / สาขา' : 'เพิ่มบริษัท / สาขา' }}</q-card-section><q-card-section class="q-gutter-md"><q-input v-model="name" outlined label="ชื่อบริษัท / สาขา" autofocus /><q-file v-model="logo" outlined accept="image/*" label="โลโก้บริษัท / สาขา" /></q-card-section><q-card-actions align="right"><q-btn flat label="ยกเลิก" v-close-popup /><q-btn color="primary" label="บันทึก" :disable="!name.trim()" @click="save" /></q-card-actions></q-card></q-dialog>
  </q-page>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'; import { useQuasar } from 'quasar'; import { useBranchStore, type Branch } from 'src/stores/useBranch';
const store = useBranchStore(); const { branches } = store; const $q = useQuasar(); const dialog = ref(false); const editing = ref<Branch | null>(null); const name = ref(''); const logo = ref<File | null>(null);
const imageUrl = (path: string) => path.startsWith('http') ? path : `${import.meta.env.VITE_API_URL}${path}`;
function openForm(branch: Branch | null = null) { editing.value = branch; name.value = branch?.branchName ?? ''; logo.value = null; dialog.value = true; }
async function save() { try { await store.saveBranch(editing.value?.branchId ?? null, name.value.trim(), logo.value); dialog.value = false; $q.notify({ type: 'positive', message: 'บันทึกบริษัท / สาขาแล้ว' }); } catch { $q.notify({ type: 'negative', message: 'บันทึกไม่สำเร็จ' }); } }
onMounted(() => void store.fetchBranches());
</script>
<style scoped>.page { max-width: 720px; margin: 0 auto; }</style>
