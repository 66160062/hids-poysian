<template>
  <q-page class="bg-grey-1 q-pb-xl">
    <!-- Header -->
    <div
      class="q-pa-md text-dark bg-white"
      style="border-bottom-left-radius: 20px; border-bottom-right-radius: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);"
    >
      <div class="row items-center justify-between">
        <div class="text-h6 text-weight-bold">จัดการข้อมูลทีม</div>
        <q-btn
          color="primary"
          icon="add"
          label="เพิ่มทีมใหม่"
          unelevated
          rounded
          @click="openCreateForm"
        />
      </div>
    </div>

    <!-- Main Content -->
    <div class="q-pa-md q-mt-sm">
      <div v-if="teamStore.isLoading" class="text-center q-py-xl">
        <q-spinner color="primary" size="3em" />
        <div class="text-grey-6 q-mt-md">กำลังโหลดข้อมูล...</div>
      </div>
      <div v-else-if="teamStore.teams.length === 0" class="text-center q-py-xl text-grey-6">
        <q-icon name="groups" size="64px" class="q-mb-md" />
        <div>ไม่พบข้อมูลทีม</div>
      </div>
      <div v-else class="row q-col-gutter-md">
        <div v-for="team in teamStore.teams" :key="team.team_Id" class="col-12 col-sm-6 col-md-4">
          <AdminTeamCard
            :team="team"
            :memberCount="getTeamMembers(team.team_Id).length"
            @edit="openEditForm"
            @delete="confirmDelete"
            @view-members="openMembersDialog"
          />
        </div>
      </div>
    </div>

    <!-- Members Dialog -->
    <q-dialog v-model="showMembersDialog" persistent>
      <q-card style="width: 500px; max-width: 90vw; border-radius: 16px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-weight-bold">
            <q-icon name="groups" color="primary" size="sm" class="q-mr-sm" />
            สมาชิกทีม: {{ selectedTeam?.team_name }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section class="q-pt-md">
          <div v-if="selectedTeamMembers.length === 0" class="text-center q-py-lg text-grey-6">
            ไม่มีสมาชิกในทีมนี้
          </div>
          <q-list v-else separator>
            <q-item v-for="user in selectedTeamMembers" :key="user.id">
              <q-item-section avatar>
                <q-avatar>
                  <img v-if="user.imageUrl && !user.imageUrl.includes('unknown.jpg')" :src="getImageUrl(user.imageUrl)" />
                  <span v-else class="bg-primary text-white">{{ user.fullName?.charAt(0).toUpperCase() || 'U' }}</span>
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">{{ user.fullName }}</q-item-label>
                <q-item-label caption>{{ user.phoneNumber || user.email }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-chip dense :color="user.role === 'admin' ? 'blue-2' : 'teal-2'" :text-color="user.role === 'admin' ? 'blue-9' : 'teal-9'" class="text-caption text-weight-bold q-ma-none">
                  {{ user.role.toUpperCase() }}
                </q-chip>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Form Dialog -->
    <q-dialog v-model="isFormMode" persistent>
      <q-card style="width: 500px; max-width: 90vw; border-radius: 16px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-weight-bold">{{ isEditing ? 'แก้ไขข้อมูลทีม' : 'เพิ่มทีมใหม่' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md">
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
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useTeamStore } from 'src/stores/useTeam';
import { useUserStore } from 'src/stores/useUser';
import AdminTeamCard from 'src/components/AdminTeamCard.vue';
import type { Team } from 'src/models';

const $q = useQuasar();
const teamStore = useTeamStore();
const userStore = useUserStore();

const isFormMode = ref(false);
const isEditing = ref(false);
const editTeamId = ref<number | null>(null);

const showMembersDialog = ref(false);
const selectedTeam = ref<Team | null>(null);
const selectedTeamMembers = computed(() => {
  if (!selectedTeam.value) return [];
  return getTeamMembers(selectedTeam.value.team_Id);
});

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

onMounted(() => {
  void teamStore.fetchTeams().catch(() => {
    $q.notify({ type: 'negative', message: 'ดึงข้อมูลทีมล้มเหลว', position: 'top' });
  });
  void userStore.fetchUsers().catch(() => {
    // silently fail fetching users if error, main focus is teams
  });
});

const getImageUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  return `${import.meta.env.VITE_API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const getTeamMembers = (teamId: number) => {
  return userStore.users.filter(user => user.teamId === teamId || user.team?.team_Id === teamId);
};

const openMembersDialog = (team: Team) => {
  selectedTeam.value = team;
  showMembersDialog.value = true;
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
      $q.notify({ type: 'positive', message: 'แก้ไขทีมสำเร็จ', icon: 'check_circle', position: 'top' });
    } else {
      await teamStore.createTeam({ form: localForm.value, file: logoFile.value });
      $q.notify({ type: 'positive', message: 'สร้างทีมใหม่สำเร็จ', icon: 'check_circle', position: 'top' });
    }
    closeForm();
  } catch {
    $q.notify({ type: 'negative', message: 'พบข้อผิดพลาดในการบันทึก กรุณาตรวจสอบตัวแปรฝั่ง API', position: 'top' });
  } finally {
    $q.loading.hide();
  }
};

const confirmDelete = (team: Team) => {
  $q.dialog({
    title: 'ยืนยันการลบ',
    message: `คุณต้องการลบทีม "${team.team_name}" ใช่หรือไม่? หากทีมถูกลบ สมาชิกในทีมจะไม่มีสังกัด`,
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk(() => {
    $q.loading.show({ message: 'กำลังลบ...' });
    teamStore
      .deleteTeam(team.team_Id)
      .then(() => {
        $q.notify({ type: 'positive', message: 'ลบทีมสำเร็จ', icon: 'check_circle', position: 'top' });
      })
      .catch(() => {
        $q.notify({ type: 'negative', message: 'ลบทีมไม่สำเร็จ', position: 'top' });
      })
      .finally(() => {
        $q.loading.hide();
      });
  });
};
</script>
