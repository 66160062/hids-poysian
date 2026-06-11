<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
  >
    <q-card style="width: 800px; max-width: 90vw; border-radius: 16px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 text-weight-bold">จัดการข้อมูลทีม</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <!-- View Mode: List Teams -->
        <div v-if="!isFormMode">
          <div class="row justify-end q-mb-sm">
            <q-btn
              color="primary"
              icon="add"
              label="เพิ่มทีมใหม่"
              unelevated
              style="border-radius: 8px"
              @click="openCreateForm"
            />
          </div>

          <q-table
            flat
            bordered
            :rows="teamStore.teams"
            :columns="columns"
            row-key="team_Id"
            :loading="teamStore.isLoading"
            no-data-label="ไม่พบข้อมูลทีม"
            style="border-radius: 12px"
          >
            <template v-slot:body-cell-logoUrl="props">
              <q-td :props="props">
                <q-avatar size="40px" class="bg-grey-3">
                  <img v-if="props.row.logo_url" :src="getImageUrl(props.row.logo_url)" />
                  <q-icon v-else name="groups" color="grey-5" />
                </q-avatar>
              </q-td>
            </template>
            <template v-slot:body-cell-actions="props">
              <q-td :props="props" class="text-right">
                <q-btn
                  flat
                  round
                  dense
                  icon="edit"
                  color="primary"
                  @click="openEditForm(props.row)"
                />
                <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  color="negative"
                  @click="confirmDelete(props.row)"
                />
              </q-td>
            </template>
          </q-table>
        </div>

        <!-- Form Mode: Create/Edit Team -->
        <div v-else>
          <q-form @submit="onSave" class="q-gutter-md">
            <div class="row items-center q-mb-md">
              <q-avatar size="64px" class="q-mr-md bg-grey-3">
                <img
                  :src="
                    localForm.logo_url && localForm.logo_url.startsWith('blob')
                      ? localForm.logo_url
                      : getImageUrl(localForm.logo_url)
                  "
                  v-if="localForm.logo_url"
                />
                <q-icon name="groups" size="lg" color="grey-5" v-else />
              </q-avatar>
              <div class="col">
                <div class="text-subtitle2 text-grey-8 q-mb-xs">
                  โลโก้ทีม <span class="text-grey-5">(ตัวเลือก)</span>
                </div>
                <q-file
                  v-model="logoFile"
                  outlined
                  dense
                  filled
                  clearable
                  accept="image/*"
                  label="เลือกไฟล์โลโก้..."
                  hide-bottom-space
                  @update:model-value="onImageFileChange"
                >
                  <template v-slot:prepend>
                    <q-icon name="image" />
                  </template>
                </q-file>
              </div>
            </div>

            <div>
              <div class="text-subtitle2 text-grey-8 q-mb-xs">
                ชื่อทีม <span class="text-negative">*</span>
              </div>
              <q-input
                v-model="localForm.team_name"
                outlined
                dense
                filled
                :rules="[(val) => !!val || 'กรุณาระบุชื่อทีม']"
                hide-bottom-space
              />
            </div>

            <div>
              <div class="text-subtitle2 text-grey-8 q-mb-xs">ข้อมูลติดต่อ</div>
              <q-input v-model="localForm.contact_info" outlined dense filled hide-bottom-space />
            </div>

            <div class="row justify-end q-mt-lg q-gutter-sm">
              <q-btn
                label="ย้อนกลับ"
                color="grey-6"
                flat
                @click="closeForm"
                style="border-radius: 8px"
              />
              <q-btn
                label="บันทึกข้อมูล"
                type="submit"
                color="primary"
                unelevated
                style="border-radius: 8px"
              />
            </div>
          </q-form>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import { useTeamStore } from 'src/stores/useTeam';
import type { Team } from 'src/models';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});

defineEmits(['update:modelValue']);
const $q = useQuasar();
const teamStore = useTeamStore();

const isFormMode = ref(false);
const isEditing = ref(false);
const editTeamId = ref<number | null>(null);

// Mapped Form explicitly matching CreateTeamDto
const localForm = ref<{
  team_name: string;
  logo_url: string;
  contact_info: string;
}>({
  team_name: '',
  logo_url: '',
  contact_info: '',
});
const logoFile = ref<File | null>(null);

const columns: QTableColumn[] = [
  { name: 'logo_url', align: 'left', label: 'โลโก้', field: 'logo_url', sortable: false },
  {
    name: 'team_name',
    required: true,
    label: 'ชื่อทีม',
    align: 'left',
    field: 'team_name',
    sortable: true,
  },
  {
    name: 'contact_info',
    align: 'left',
    label: 'ข้อมูลติดต่อ',
    field: 'contact_info',
    sortable: true,
  },
  { name: 'actions', align: 'right', label: 'จัดการ', field: 'actions', sortable: false },
];

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      void teamStore.fetchTeams().catch(() => {
        $q.notify({ type: 'negative', message: 'ดึงข้อมูลทีมล้มเหลว' });
      });
      isFormMode.value = false;
    }
  },
);

const getImageUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  return `${import.meta.env.VITE_API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const openCreateForm = () => {
  isEditing.value = false;
  editTeamId.value = null;
  localForm.value = { team_name: '', logo_url: '', contact_info: '' };
  logoFile.value = null;
  isFormMode.value = true;
};

const openEditForm = (team: Team) => {
  isEditing.value = true;
  editTeamId.value = team.team_Id;
  localForm.value = {
    team_name: team.team_name || '',
    logo_url: team.logo_url || '',
    contact_info: team.contact_info || '',
  };
  logoFile.value = null;
  isFormMode.value = true;
};

const closeForm = () => {
  isFormMode.value = false;
};

const onImageFileChange = (file: File | null) => {
  if (file) {
    if (localForm.value.logo_url && localForm.value.logo_url.startsWith('blob:')) {
      URL.revokeObjectURL(localForm.value.logo_url);
    }
    localForm.value.logo_url = URL.createObjectURL(file);
  } else {
    localForm.value.logo_url = '';
  }
};

const onSave = async () => {
  $q.loading.show({ message: 'กำลังบันทึกข้อมูล...' });
  try {
    if (isEditing.value && editTeamId.value) {
      await teamStore.updateTeam(editTeamId.value, { form: localForm.value, file: logoFile.value });
      $q.notify({ type: 'positive', message: 'แก้ไขทีมสำเร็จ', icon: 'check_circle' });
    } else {
      await teamStore.createTeam({ form: localForm.value, file: logoFile.value });
      $q.notify({ type: 'positive', message: 'สร้างทีมใหม่สำเร็จ', icon: 'check_circle' });
    }
    closeForm();
  } catch {
    $q.notify({ type: 'negative', message: 'พบข้อผิดพลาดในการบันทึก กรุณาตรวจสอบตัวแปรฝั่ง API' });
  } finally {
    $q.loading.hide();
  }
};

const confirmDelete = (team: Team) => {
  $q.dialog({
    title: 'ยืนยันการลบ',
    message: `คุณต้องการลบทีม "${team.team_name}" ใช่หรือไม่?`,
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk(() => {
    $q.loading.show({ message: 'กำลังลบ...' });
    const idToDelete = team.team_Id;
    teamStore
      .deleteTeam(idToDelete)
      .then(() => {
        $q.notify({ type: 'positive', message: 'ลบทีมสำเร็จ', icon: 'check_circle' });
      })
      .catch(() => {
        $q.notify({ type: 'negative', message: 'ลบทีมไม่สำเร็จ' });
      })
      .finally(() => {
        $q.loading.hide();
      });
  });
};
</script>
