<template>
  <q-page class="admin-team-page bg-grey-1 q-pb-xl">
    <!-- Header Area -->
    <div
      class="q-pa-md text-dark"
      style="border-bottom-left-radius: 20px; border-bottom-right-radius: 20px"
    >
      <!-- Search Input -->
      <q-input
        v-model="searchQuery"
        dense
        outlined
        bg-color="white"
        :placeholder="t('adminManage.teamManagement.searchPlaceholder')"
        class="search-input"
        hide-bottom-space
      >
        <template v-slot:prepend>
          <q-icon name="search" color="grey-7" />
        </template>
        <template v-slot:append v-if="searchQuery">
          <q-icon name="close" @click="searchQuery = ''" class="cursor-pointer" />
        </template>
      </q-input>
    </div>

    <!-- Main Content -->
    <div class="q-pa-md q-mt-sm">
      <div v-if="!teamStore.isLoading && filteredTeams.length === 0" class="text-center q-py-xl text-grey-6">
        <q-icon name="groups" size="64px" class="q-mb-md" />
        <div>ไม่พบข้อมูลทีม</div>
      </div>
      <div v-else class="row q-col-gutter-md">
        <div v-for="team in filteredTeams" :key="team.team_Id" class="col-12 col-sm-6 col-md-4">
          <AdminTeamCard
            :team="team"
            :memberCount="getTeamMembers(team.team_Id).length"
            @edit="openEditForm"
            @delete="confirmDelete"
          />
        </div>
      </div>
    </div>

    <!-- FAB Add Button -->
    <q-page-sticky position="bottom-right" :offset="[16, 16]">
      <q-btn fab icon="add" color="primary" @click="openCreateForm" />
    </q-page-sticky>

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
              <div class="relative-position q-mr-md">
                <q-avatar size="64px" class="bg-grey-3">
                  <img
                    v-if="localForm.logo_url"
                    class="avatar-img"
                    :src="
                      localForm.logo_url && localForm.logo_url.startsWith('blob')
                        ? localForm.logo_url
                        : getImageUrl(localForm.logo_url)
                    "
                  />
                  <q-icon name="groups" size="lg" color="grey-5" v-else />
                </q-avatar>
                <q-btn
                  v-if="localForm.logo_url"
                  icon="close"
                  round
                  dense
                  size="xs"
                  color="negative"
                  text-color="white"
                  class="absolute-top-right"
                  style="transform: translate(30%, -30%)"
                  @click="removeLogo"
                >
                  <q-tooltip>ลบรูปโลโก้</q-tooltip>
                </q-btn>
              </div>
              <div class="col">
                <div class="text-subtitle2 text-grey-8 q-mb-xs">
                  โลโก้ทีม <span class="text-grey-5">(ตัวเลือก)</span>
                </div>
                <q-file
                  v-model="pickedLogoFile"
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

            <!-- Creating a team: must pick at least one starting member up front -->
            <div v-if="!isEditing">
              <div class="text-subtitle2 text-grey-8 q-mb-xs">
                สมาชิกเริ่มต้น <span class="text-negative">*</span>
              </div>
              <q-select
                v-model="newTeamMemberIds"
                :options="unassignedInspectorOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                multiple
                use-chips
                outlined
                dense
                filled
                label="เลือกผู้ตรวจสอบเข้าทีม"
                hide-bottom-space
                :rules="[(val: number[]) => (Array.isArray(val) && val.length > 0) || 'กรุณาเลือกสมาชิกอย่างน้อย 1 คน']"
                :loading="userStore.isLoading"
              >
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey-6">ไม่มีผู้ตรวจสอบที่ยังไม่มีทีม</q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- Members management: only available once the team exists -->
            <div v-if="isEditing">
              <q-separator class="q-mb-md" />
              <div class="text-subtitle2 text-grey-8 q-mb-xs">
                <q-icon name="groups" size="xs" class="q-mr-xs" />
                สมาชิกทีม
              </div>

              <div class="row items-center q-gutter-sm q-mb-md">
                <q-select
                  v-model="newMemberId"
                  :options="availableInspectorOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  outlined
                  dense
                  filled
                  class="col"
                  label="เพิ่มผู้ตรวจสอบเข้าทีม"
                  hide-bottom-space
                  :loading="userStore.isLoading"
                >
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey-6">ไม่มีผู้ตรวจสอบที่เพิ่มได้</q-item-section>
                    </q-item>
                  </template>
                </q-select>
                <q-btn
                  color="primary"
                  icon="person_add"
                  round
                  unelevated
                  :disable="!newMemberId"
                  @click="addMember"
                />
              </div>

              <div v-if="selectedTeamMembers.length === 0" class="text-center q-py-md text-grey-6">
                ไม่มีสมาชิกในทีมนี้
              </div>
              <q-list v-else separator bordered style="border-radius: 8px">
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
                    <q-btn
                      icon="person_remove"
                      color="negative"
                      flat
                      round
                      dense
                      size="sm"
                      @click="confirmRemoveMember(user)"
                    >
                      <q-tooltip>นำออกจากทีม</q-tooltip>
                    </q-btn>
                  </q-item-section>
                </q-item>
              </q-list>
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

    <!-- Crop Dialog: shown right after picking a logo file -->
    <q-dialog v-model="showCropDialog" persistent>
      <q-card style="width: 480px; max-width: 90vw; border-radius: 16px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-weight-bold">ตัดกรอบรูปโลโก้</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="cancelCrop" />
        </q-card-section>
        <q-card-section class="q-pt-md">
          <div class="text-caption text-grey-7 q-mb-sm">
            ลาก / ซูมเพื่อเลือกกรอบที่ต้องการ
          </div>
          <cropper
            v-if="cropSourceUrl"
            ref="cropperRef"
            class="logo-cropper"
            :src="cropSourceUrl"
            :stencil-props="{ aspectRatio: 1 }"
          />
          <div class="row justify-end q-mt-md q-gutter-sm">
            <q-btn label="ยกเลิก" color="grey-6" flat @click="cancelCrop" style="border-radius: 8px" />
            <q-btn label="ยืนยัน" color="primary" unelevated @click="confirmCrop" style="border-radius: 8px" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useTeamStore } from 'src/stores/useTeam';
import { useUserStore } from 'src/stores/useUser';
import AdminTeamCard from 'src/components/AdminTeamCard.vue';
import { createIconSpinner } from 'src/composables/useIconSpinner';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import type { Team, User } from 'src/models';

const teamSpinner = createIconSpinner('groups');

const { t } = useI18n();
const $q = useQuasar();
const teamStore = useTeamStore();
const userStore = useUserStore();

const isFormMode = ref(false);
const isEditing = ref(false);
const editTeamId = ref<number | null>(null);

const searchQuery = ref('');
const filteredTeams = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return teamStore.teams;
  return teamStore.teams.filter((team) => {
    const memberNames = getTeamMembers(team.team_Id).map((m) => m.fullName);
    return [team.team_name, team.contact_info, ...memberNames].some((field) =>
      (field || '').toLowerCase().includes(query),
    );
  });
});

const selectedTeamMembers = computed(() => {
  if (editTeamId.value === null) return [];
  return getTeamMembers(editTeamId.value);
});

// เฉพาะ inspector เท่านั้นที่เพิ่มเข้าทีมได้
const newMemberId = ref<number | null>(null);
const availableInspectorOptions = computed(() => {
  const currentTeamId = editTeamId.value;
  return userStore.users
    .filter((u) => u.role === 'inspector' && (u.teamId ?? u.team?.team_Id) !== currentTeamId)
    .map((u) => ({ label: u.fullName, value: u.id }));
});

// ตอนสร้างทีมใหม่ ต้องเลือกสมาชิกเริ่มต้นอย่างน้อย 1 คน (เฉพาะ inspector ที่ยังไม่มีทีม)
const newTeamMemberIds = ref<number[]>([]);
const unassignedInspectorOptions = computed(() => {
  return userStore.users
    .filter((u) => u.role === 'inspector' && !(u.teamId ?? u.team?.team_Id))
    .map((u) => ({ label: u.fullName, value: u.id }));
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

// ไฟล์ที่เพิ่งเลือกจากเครื่อง รอเข้ากระบวนการตัดกรอบ ก่อนกลายเป็น logoFile จริง
const pickedLogoFile = ref<File | null>(null);
const showCropDialog = ref(false);
const cropSourceUrl = ref('');
const cropperRef = ref<InstanceType<typeof Cropper> | null>(null);

onMounted(async () => {
  $q.loading.show({
    spinner: teamSpinner,
    spinnerColor: 'primary',
    spinnerSize: 70,
    backgroundColor: 'white',
  });
  try {
    await Promise.all([
      teamStore.fetchTeams().catch(() => {
        $q.notify({ type: 'negative', message: 'ดึงข้อมูลทีมล้มเหลว', position: 'top' });
      }),
      userStore.fetchUsers().catch(() => {
        // silently fail fetching users if error, main focus is teams
      }),
    ]);
  } finally {
    $q.loading.hide();
  }
});

const getImageUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  return `${import.meta.env.VITE_API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const getTeamMembers = (teamId: number) => {
  return userStore.users.filter(user => user.teamId === teamId || user.team?.team_Id === teamId);
};

const addMember = () => {
  if (!newMemberId.value || editTeamId.value === null) return;
  const targetTeam = teamStore.teams.find((t) => t.team_Id === editTeamId.value);
  const inspector = userStore.users.find((u) => u.id === newMemberId.value);
  if (!inspector || !targetTeam) return;

  const currentTeamId = inspector.teamId ?? inspector.team?.team_Id;
  const doAdd = () => {
    $q.loading.show({ message: 'กำลังเพิ่มสมาชิก...' });
    userStore
      .updateUser(inspector.id, { form: { teamId: targetTeam.team_Id }, file: null })
      .then(() => {
        $q.notify({ type: 'positive', message: 'เพิ่มสมาชิกสำเร็จ', icon: 'check_circle', position: 'top' });
        newMemberId.value = null;
      })
      .catch(() => {
        $q.notify({ type: 'negative', message: 'เพิ่มสมาชิกไม่สำเร็จ', position: 'top' });
      })
      .finally(() => {
        $q.loading.hide();
      });
  };

  if (currentTeamId && currentTeamId !== targetTeam.team_Id) {
    const oldTeamName = teamStore.teams.find((t) => t.team_Id === currentTeamId)?.team_name || 'ทีมเดิม';
    $q.dialog({
      title: 'ย้ายทีม',
      message: `${inspector.fullName} อยู่ในทีม "${oldTeamName}" อยู่แล้ว ต้องการย้ายมาทีม "${targetTeam.team_name}" หรือไม่?`,
      cancel: true,
      persistent: true,
      color: 'primary',
    }).onOk(doAdd);
  } else {
    doAdd();
  }
};

const confirmRemoveMember = (user: User) => {
  $q.dialog({
    title: 'นำออกจากทีม',
    message: `ต้องการนำ "${user.fullName}" ออกจากทีมนี้ใช่หรือไม่?`,
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk(() => {
    $q.loading.show({ message: 'กำลังนำออกจากทีม...' });
    userStore
      .updateUser(user.id, { form: { teamId: 0 }, file: null })
      .then(() => {
        $q.notify({ type: 'positive', message: 'นำสมาชิกออกจากทีมสำเร็จ', icon: 'check_circle', position: 'top' });
      })
      .catch(() => {
        $q.notify({ type: 'negative', message: 'นำสมาชิกออกไม่สำเร็จ', position: 'top' });
      })
      .finally(() => {
        $q.loading.hide();
      });
  });
};

const openCreateForm = () => {
  isEditing.value = false;
  editTeamId.value = null;
  localForm.value = { team_name: '', logo_url: '', contact_info: '' };
  logoFile.value = null;
  pickedLogoFile.value = null;
  newMemberId.value = null;
  newTeamMemberIds.value = [];
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
  pickedLogoFile.value = null;
  newMemberId.value = null;
  isFormMode.value = true;
};

const closeForm = () => {
  isFormMode.value = false;
};

// เลือกไฟล์แล้วเปิด dialog ตัดกรอบก่อนเสมอ ยังไม่เซ็ต logoFile จริงจนกว่าจะกดยืนยัน
const onImageFileChange = (file: File | null) => {
  if (!file) {
    return;
  }
  cropSourceUrl.value = URL.createObjectURL(file);
  showCropDialog.value = true;
};

const removeLogo = () => {
  if (localForm.value.logo_url && localForm.value.logo_url.startsWith('blob:')) {
    URL.revokeObjectURL(localForm.value.logo_url);
  }
  localForm.value.logo_url = '';
  logoFile.value = null;
  pickedLogoFile.value = null;
};

const cancelCrop = () => {
  if (cropSourceUrl.value) {
    URL.revokeObjectURL(cropSourceUrl.value);
  }
  cropSourceUrl.value = '';
  pickedLogoFile.value = null;
  showCropDialog.value = false;
};

const confirmCrop = () => {
  const result = cropperRef.value?.getResult();
  const canvas = result?.canvas;
  if (!canvas) {
    cancelCrop();
    return;
  }
  canvas.toBlob((blob) => {
    if (!blob) {
      cancelCrop();
      return;
    }
    if (localForm.value.logo_url && localForm.value.logo_url.startsWith('blob:')) {
      URL.revokeObjectURL(localForm.value.logo_url);
    }
    const croppedFile = new File([blob], 'logo.jpg', { type: 'image/jpeg' });
    logoFile.value = croppedFile;
    localForm.value.logo_url = URL.createObjectURL(croppedFile);

    URL.revokeObjectURL(cropSourceUrl.value);
    cropSourceUrl.value = '';
    pickedLogoFile.value = null;
    showCropDialog.value = false;
  }, 'image/jpeg', 0.92);
};

const onSave = async () => {
  $q.loading.show({ message: 'กำลังบันทึกข้อมูล...' });
  try {
    if (isEditing.value && editTeamId.value) {
      await teamStore.updateTeam(editTeamId.value, { form: localForm.value, file: logoFile.value });
      $q.notify({ type: 'positive', message: 'แก้ไขทีมสำเร็จ', icon: 'check_circle', position: 'top' });
    } else {
      const newTeam = await teamStore.createTeam({ form: localForm.value, file: logoFile.value });
      await Promise.all(
        newTeamMemberIds.value.map((userId) =>
          userStore.updateUser(userId, { form: { teamId: newTeam.team_Id }, file: null }),
        ),
      );
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
    title: 'ยืนยันการปิดใช้งานทีม',
    message: `คุณต้องการปิดใช้งานทีม "${team.team_name}" ใช่หรือไม่? ทีมจะไม่แสดงในรายการนี้อีก และสมาชิกในทีมจะถูกถอดออกจากทีม แต่ข้อมูลทีมและรอบตรวจเก่าที่เชื่อมกับทีมนี้จะยังเก็บไว้ในระบบตามเดิม`,
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk(() => {
    $q.loading.show({ message: 'กำลังปิดใช้งาน...' });
    teamStore
      .deleteTeam(team.team_Id)
      .then(async () => {
        await userStore.fetchUsers();
        $q.notify({ type: 'positive', message: 'ปิดใช้งานทีมสำเร็จ', icon: 'check_circle', position: 'top' });
      })
      .catch(() => {
        $q.notify({ type: 'negative', message: 'ปิดใช้งานทีมไม่สำเร็จ', position: 'top' });
      })
      .finally(() => {
        $q.loading.hide();
      });
  });
};
</script>

<style scoped>
.admin-team-page {
  max-width: 600px;
  margin: 0 auto;
  min-height: 100vh;
}

@media (min-width: 600px) {
  .admin-team-page {
    max-width: 800px;
  }
}

.search-input :deep(.q-field__control) {
  border-radius: 30px;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-cropper {
  height: 320px;
  background: #ddd;
}
</style>
