<template>
  <q-page class="admin-team-page bg-grey-1 q-pb-xl">
    <!-- Header Area -->
    <div
      class="q-pa-md text-dark"
      style="border-bottom-left-radius: 20px; border-bottom-right-radius: 20px"
    >
      <!-- Search + Filter Row -->
      <div class="row q-gutter-x-sm no-wrap items-center">
        <q-input
          v-model="searchQuery"
          dense
          borderless
          rounded
          :placeholder="t('adminManage.teamManagement.searchPlaceholder')"
          class="search-input col"
          hide-bottom-space
        >
          <template v-slot:prepend>
            <q-icon name="search" color="grey-7" />
          </template>
          <template v-slot:append v-if="searchQuery">
            <q-icon name="close" @click="searchQuery = ''" class="cursor-pointer" />
          </template>
        </q-input>

        <q-btn
          round
          unelevated
          :color="activeFilterCount > 0 ? 'primary' : 'white'"
          :text-color="activeFilterCount > 0 ? 'white' : 'primary'"
          icon="tune"
          class="shadow-1"
          style="height: 48px; width: 48px; min-height: 48px"
          @click="showFilterDialog = true"
        >
          <q-badge
            v-if="activeFilterCount > 0"
            color="red"
            floating
            rounded
            style="top: 2px; right: 2px"
            >{{ activeFilterCount }}</q-badge
          >
        </q-btn>
      </div>
    </div>

    <!-- Filter Bottom Sheet Dialog -->
    <q-dialog
      v-model="showFilterDialog"
      position="bottom"
      transition-show="sheet-in"
      transition-hide="sheet-out"
    >
      <q-card
        style="width: 100%; max-width: 600px; border-radius: 28px 28px 0 0"
        class="q-pa-lg filter-sheet"
      >
        <div class="sheet-handle" />
        <div class="row items-center justify-between q-mb-lg">
          <div class="text-h6 text-weight-bold text-dark">{{ t('adminManage.teamManagement.filterTitle') }}</div>
          <div class="row items-center">
            <q-btn
              v-if="activeFilterCount > 0"
              flat
              dense
              color="negative"
              :label="t('adminManage.teamManagement.clearButton')"
              class="q-mr-sm"
              @click="clearFilters"
            />
            <q-btn flat round dense icon="close" color="grey-6" v-close-popup />
          </div>
        </div>

        <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">{{ t('adminManage.teamManagement.branchLabel') }}</div>
        <q-select
          v-model="selectedBranchId"
          :options="branchOptions"
          emit-value
          map-options
          dense
          outlined
          rounded
          class="q-mb-lg filter-select"
          behavior="dialog"
        />

        <q-btn
          unelevated
          rounded
          color="primary"
          :label="t('adminManage.teamManagement.doneButton')"
          class="full-width text-weight-bold"
          style="height: 48px; font-size: 16px"
          v-close-popup
        />
      </q-card>
    </q-dialog>

    <!-- Active Filters Chips -->
    <div v-if="activeFilterCount > 0" class="row items-center q-gutter-x-sm q-px-md q-mt-sm">
      <span class="text-caption text-grey-7 q-mr-xs">{{ t('adminManage.teamManagement.filteringLabel') }}</span>
      <q-chip
        v-if="selectedBranchId !== null"
        removable
        @remove="selectedBranchId = null"
        color="blue-1"
        text-color="primary"
        dense
        class="text-weight-medium"
      >
        {{ branchOptions.find((b) => b.value === selectedBranchId)?.label }}
      </q-chip>
    </div>

    <!-- Main Content -->
    <div class="q-pa-md q-mt-sm">
      <div v-if="!teamStore.isLoading && filteredTeams.length === 0" class="text-center q-py-xl text-grey-6">
        <q-icon name="groups" size="64px" class="q-mb-md" />
        <div>{{ t('adminManage.teamManagement.noTeamsFound') }}</div>
      </div>
      <div v-else class="row q-col-gutter-md">
        <div
          v-for="team in filteredTeams"
          :key="team.team_Id"
          class="col-12 col-sm-6 col-md-4 card-stagger"
        >
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
      <q-card class="dialog-card">
        <q-card-section class="dialog-header row items-center no-wrap">
          <div class="dialog-header-icon">
            <q-icon :name="isEditing ? 'edit' : 'group_add'" size="24px" />
          </div>
          <div class="col q-ml-md">
            <div class="dialog-title text-weight-bold text-dark">{{ isEditing ? t('adminManage.teamManagement.editTeamTitle') : t('adminManage.teamManagement.addTeamTitle') }}</div>
          </div>
          <q-btn icon="close" flat round dense class="dialog-close-btn" v-close-popup />
        </q-card-section>
        <q-separator />

        <q-card-section class="dialog-body">
          <q-form @submit="onSave" class="q-gutter-md" id="team-edit-form">
            <div class="upload-zone row items-center">
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
                  <q-tooltip>{{ t('adminManage.teamManagement.removeLogoTooltip') }}</q-tooltip>
                </q-btn>
              </div>
              <div class="col">
                <div class="dialog-field-label">
                  {{ t('adminManage.teamManagement.teamLogoLabel') }} <span class="text-grey-5">({{ t('adminManage.teamManagement.optionalLabel') }})</span>
                </div>
                <q-file
                  v-model="pickedLogoFile"
                  outlined
                  dense
                  filled
                  clearable
                  accept="image/*"
                  :label="t('adminManage.teamManagement.chooseLogoFileLabel')"
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
              <div class="dialog-field-label">
                {{ t('adminManage.teamManagement.teamNameLabel') }} <span class="text-negative">*</span>
              </div>
              <q-input
                v-model="localForm.team_name"
                outlined
                dense
                filled
                :rules="[(val) => !!val || t('adminManage.teamManagement.teamNameRequired')]"
                hide-bottom-space
              />
            </div>

            <div>
              <div class="dialog-field-label">{{ t('adminManage.teamManagement.contactInfoLabel') }}</div>
              <q-input v-model="localForm.contact_info" outlined dense filled hide-bottom-space />
            </div>

            <div>
              <div class="dialog-field-label">{{ t('adminManage.teamManagement.branchLabel') }}</div>
              <q-select
                v-model="localForm.branchId"
                :options="branchFormOptions"
                emit-value
                map-options
                outlined
                dense
                filled
                hide-bottom-space
              />
            </div>

            <!-- Creating a team: must pick at least one starting member up front -->
            <div v-if="!isEditing">
              <div class="dialog-field-label">
                {{ t('adminManage.teamManagement.initialMembersLabel') }} <span class="text-negative">*</span>
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
                :label="t('adminManage.teamManagement.selectMembersLabel')"
                hide-bottom-space
                :rules="[(val: number[]) => (Array.isArray(val) && val.length > 0) || t('adminManage.teamManagement.selectAtLeastOneMember')]"
                :loading="userStore.isLoading"
              >
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey-6">{{ t('adminManage.teamManagement.noUnassignedInspectors') }}</q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- Members management: only available once the team exists -->
            <div v-if="isEditing">
              <q-separator class="q-mb-md" />
              <div class="dialog-field-label">
                <q-icon name="groups" size="xs" class="q-mr-xs" />
                {{ t('adminManage.teamManagement.teamMembersLabel') }}
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
                  :label="t('adminManage.teamManagement.addMemberLabel')"
                  hide-bottom-space
                  :loading="userStore.isLoading"
                >
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey-6">{{ t('adminManage.teamManagement.noAvailableInspectors') }}</q-item-section>
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
                {{ t('adminManage.teamManagement.noMembersInTeam') }}
              </div>
              <q-list v-else separator bordered class="dialog-member-list">
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
                      <q-tooltip>{{ t('adminManage.teamManagement.removeMemberTooltip') }}</q-tooltip>
                    </q-btn>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-form>
        </q-card-section>

        <q-separator />
        <q-card-actions class="dialog-footer q-gutter-sm">
          <q-btn
            :label="t('adminManage.teamManagement.backButton')"
            color="grey-8"
            flat
            no-caps
            @click="closeForm"
            class="col dialog-btn dialog-btn--cancel"
          />
          <q-btn
            :label="t('adminManage.teamManagement.saveButton')"
            type="submit"
            form="team-edit-form"
            color="primary"
            unelevated
            no-caps
            class="col dialog-btn"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Crop Dialog: shown right after picking a logo file -->
    <q-dialog v-model="showCropDialog" persistent>
      <q-card style="width: 480px; max-width: 90vw; border-radius: 16px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-weight-bold">{{ t('adminManage.teamManagement.cropLogoTitle') }}</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="cancelCrop" />
        </q-card-section>
        <q-card-section class="q-pt-md">
          <div class="text-caption text-grey-7 q-mb-sm">
            {{ t('adminManage.teamManagement.cropHint') }}
          </div>
          <cropper
            v-if="cropSourceUrl"
            ref="cropperRef"
            class="logo-cropper"
            :src="cropSourceUrl"
            :stencil-props="{ aspectRatio: 1 }"
          />
          <div class="row justify-end q-mt-md q-gutter-sm">
            <q-btn :label="t('adminManage.teamManagement.cropCancel')" color="grey-6" flat @click="cancelCrop" style="border-radius: 8px" />
            <q-btn :label="t('adminManage.teamManagement.cropConfirm')" color="primary" unelevated @click="confirmCrop" style="border-radius: 8px" />
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
import { useBranchStore } from 'src/stores/useBranch';
import AdminTeamCard from 'src/components/AdminTeamCard.vue';
import ConfirmActionDialog from 'src/components/ConfirmActionDialog.vue';
import { createIconSpinner } from 'src/composables/useIconSpinner';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import type { Team, User } from 'src/models';

const teamSpinner = createIconSpinner('groups');

const { t } = useI18n();
const $q = useQuasar();
const teamStore = useTeamStore();
const userStore = useUserStore();
const branchStore = useBranchStore();

const isFormMode = ref(false);
const isEditing = ref(false);
const editTeamId = ref<number | null>(null);

const searchQuery = ref('');
const filteredTeams = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return teamStore.teams.filter((team) => {
    const matchBranch =
      selectedBranchId.value === null || team.branchId === selectedBranchId.value;
    if (!matchBranch) return false;
    if (!query) return true;
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
  branchId: number | null;
}>({
  team_name: '',
  logo_url: '',
  contact_info: '',
  branchId: null,
});
const logoFile = ref<File | null>(null);
const selectedBranchId = ref<number | null>(null);
const branchOptions = computed(() => [
  { label: t('adminManage.teamManagement.allBranchesOption'), value: null },
  ...branchStore.branches.map((branch) => ({
    label: branch.branchName || t('adminManage.teamManagement.branchFallbackLabel', { id: branch.branchId }),
    value: branch.branchId,
  })),
]);
// ตัวเลือกสาขาสำหรับฟอร์มเพิ่ม/แก้ไขทีม — ใช้ "ไม่ระบุสาขา" แทน "รวมทุกสาขา" ของตัวกรอง
const branchFormOptions = computed(() => [
  { label: t('adminManage.teamManagement.noBranchOption'), value: null },
  ...branchStore.branches.map((branch) => ({
    label: branch.branchName || t('adminManage.teamManagement.branchFallbackLabel', { id: branch.branchId }),
    value: branch.branchId,
  })),
]);

const showFilterDialog = ref(false);
const activeFilterCount = computed(() => (selectedBranchId.value !== null ? 1 : 0));

function clearFilters() {
  selectedBranchId.value = null;
}

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
  void branchStore.fetchBranches().catch(() => {
    $q.notify({ type: 'negative', message: t('adminManage.teamManagement.fetchBranchesFailed'), position: 'top' });
  });
  try {
    await Promise.all([
      teamStore.fetchTeams().catch(() => {
        $q.notify({ type: 'negative', message: t('adminManage.teamManagement.fetchTeamsFailed'), position: 'top' });
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
    $q.loading.show({ message: t('adminManage.teamManagement.addingMember') });
    userStore
      .updateUser(inspector.id, { form: { teamId: targetTeam.team_Id }, file: null })
      .then(() => {
        $q.notify({ type: 'positive', message: t('adminManage.teamManagement.addMemberSuccess'), icon: 'check_circle', position: 'top' });
        newMemberId.value = null;
      })
      .catch(() => {
        $q.notify({ type: 'negative', message: t('adminManage.teamManagement.addMemberFailed'), position: 'top' });
      })
      .finally(() => {
        $q.loading.hide();
      });
  };

  if (currentTeamId && currentTeamId !== targetTeam.team_Id) {
    const oldTeamName = teamStore.teams.find((t) => t.team_Id === currentTeamId)?.team_name || t('adminManage.teamManagement.previousTeamFallback');
    $q.dialog({
      title: t('adminManage.teamManagement.moveTeamTitle'),
      message: t('adminManage.teamManagement.moveTeamMessage', {
        name: inspector.fullName,
        oldTeam: oldTeamName,
        newTeam: targetTeam.team_name,
      }),
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
    title: t('adminManage.teamManagement.removeMemberConfirmTitle'),
    message: t('adminManage.teamManagement.removeMemberConfirmMessage', { name: user.fullName }),
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk(() => {
    $q.loading.show({ message: t('adminManage.teamManagement.removingMember') });
    userStore
      .updateUser(user.id, { form: { teamId: 0 }, file: null })
      .then(() => {
        $q.notify({ type: 'positive', message: t('adminManage.teamManagement.removeMemberSuccess'), icon: 'check_circle', position: 'top' });
      })
      .catch(() => {
        $q.notify({ type: 'negative', message: t('adminManage.teamManagement.removeMemberFailed'), position: 'top' });
      })
      .finally(() => {
        $q.loading.hide();
      });
  });
};

const openCreateForm = () => {
  isEditing.value = false;
  editTeamId.value = null;
  localForm.value = { team_name: '', logo_url: '', contact_info: '', branchId: null };
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
    branchId: team.branchId ?? null,
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
  $q.loading.show({ message: t('adminManage.teamManagement.saving') });
  try {
    if (isEditing.value && editTeamId.value) {
      await teamStore.updateTeam(editTeamId.value, { form: localForm.value, file: logoFile.value });
      $q.notify({ type: 'positive', message: t('adminManage.teamManagement.editTeamSuccess'), icon: 'check_circle', position: 'top' });
    } else {
      const newTeam = await teamStore.createTeam({ form: localForm.value, file: logoFile.value });
      await Promise.all(
        newTeamMemberIds.value.map((userId) =>
          userStore.updateUser(userId, { form: { teamId: newTeam.team_Id }, file: null }),
        ),
      );
      $q.notify({ type: 'positive', message: t('adminManage.teamManagement.createTeamSuccess'), icon: 'check_circle', position: 'top' });
    }
    closeForm();
  } catch {
    $q.notify({ type: 'negative', message: t('adminManage.teamManagement.saveErrorApiCheck'), position: 'top' });
  } finally {
    $q.loading.hide();
  }
};

const confirmDelete = (team: Team) => {
  $q.dialog({
    component: ConfirmActionDialog,
    componentProps: {
      title: t('adminManage.teamManagement.deactivateConfirmTitle'),
      message: t('adminManage.teamManagement.deactivateConfirmMessage', { name: team.team_name }),
      icon: 'block',
      color: 'negative',
      confirmLabel: t('adminManage.teamManagement.deactivateConfirmLabel'),
      cancelLabel: t('adminManage.teamManagement.cancelLabel'),
    },
  }).onOk(() => {
    $q.loading.show({ message: t('adminManage.teamManagement.deactivating') });
    teamStore
      .deleteTeam(team.team_Id)
      .then(async () => {
        await userStore.fetchUsers();
        $q.notify({ type: 'positive', message: t('adminManage.teamManagement.deactivateSuccess'), icon: 'check_circle', position: 'top' });
      })
      .catch(() => {
        $q.notify({ type: 'negative', message: t('adminManage.teamManagement.deactivateFailed'), position: 'top' });
      })
      .finally(() => {
        $q.loading.hide();
      });
  });
};
</script>

<style scoped>
.admin-team-page {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-sheet: cubic-bezier(0.32, 0.72, 0, 1);
  max-width: 600px;
  margin: 0 auto;
  min-height: 100vh;
}

@media (min-width: 600px) {
  .admin-team-page {
    max-width: 800px;
  }
}
@media (min-width: 1024px) {
  .admin-team-page {
    max-width: 1100px;
  }
}
@media (min-width: 1440px) {
  .admin-team-page {
    max-width: 1300px;
  }
}

.search-input {
  background-color: #ffffff;
  border: 1px solid #ebebeb;
  border-radius: 24px;
  padding: 2px 16px;
  height: 48px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  transition:
    box-shadow 200ms var(--ease-out),
    border-color 200ms var(--ease-out);
}
.search-input:focus-within {
  border-color: rgba(25, 118, 210, 0.5);
  box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.12);
}

.filter-sheet {
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.12);
}
.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 999px;
  background: #e0e0e0;
  margin: -8px auto 16px;
}

.card-stagger {
  animation: card-in 320ms var(--ease-out) both;
}
.card-stagger:nth-child(1) { animation-delay: 0ms; }
.card-stagger:nth-child(2) { animation-delay: 40ms; }
.card-stagger:nth-child(3) { animation-delay: 80ms; }
.card-stagger:nth-child(4) { animation-delay: 120ms; }
.card-stagger:nth-child(n + 5) { animation-delay: 150ms; }
@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .card-stagger,
  .search-input {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

.filter-select :deep(.q-field__control) {
  height: 42px;
  min-height: 42px;
  border: 1px solid #e0e0e0;
}
.filter-select :deep(.q-field__control:before),
.filter-select :deep(.q-field__control:after) {
  border: none !important;
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

.dialog-card {
  width: 100%;
  max-width: 480px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}
@media (min-width: 600px) {
  .dialog-card {
    max-width: 560px;
  }
}
@media (min-width: 1024px) {
  .dialog-card {
    max-width: 640px;
  }
}
.dialog-header {
  padding: 20px 24px;
}
.dialog-header-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1976d2;
  flex-shrink: 0;
}
.dialog-title {
  font-size: 18px;
  line-height: 1.3;
}
.dialog-close-btn {
  background-color: #f2f4f7;
  transition: background-color 0.15s ease;
}
.dialog-close-btn:hover {
  background-color: #e7ebf0;
}
.dialog-body {
  padding: 22px 24px;
  max-height: 62vh;
  overflow-y: auto;
}
.dialog-field-label {
  font-size: 13px;
  font-weight: 600;
  color: #55606e;
  margin-bottom: 6px;
}
.upload-zone {
  padding: 14px;
  border: 1.5px dashed #d7dee6;
  border-radius: 16px;
  background-color: #fafbfc;
}
.dialog-member-list {
  border-radius: 12px;
  border-color: #eef0f2;
}
.dialog-body :deep(.q-field__control) {
  border-radius: 12px;
}
.dialog-footer {
  padding: 16px 24px;
  background-color: #fafbfc;
}
.dialog-btn {
  border-radius: 12px;
  height: 44px;
  font-weight: 600;
  min-width: 120px;
}
.dialog-btn--cancel {
  border: 1px solid #e3e6ea;
  background-color: #ffffff;
}

@media (max-width: 599px) {
  .dialog-header,
  .dialog-body,
  .dialog-footer {
    padding-left: 16px;
    padding-right: 16px;
  }
  .dialog-body {
    max-height: 70vh;
  }
  .dialog-title {
    font-size: 16px;
  }
}
</style>

<style>
/* Frosted-glass backdrop + spring-eased bottom sheet for the filter dialog */
.q-dialog__backdrop {
  backdrop-filter: blur(6px) saturate(180%);
  -webkit-backdrop-filter: blur(6px) saturate(180%);
}

.q-transition--sheet-in-enter-active {
  transition: all 320ms cubic-bezier(0.32, 0.72, 0, 1);
}
.q-transition--sheet-in-enter-from {
  transform: translateY(100%);
  opacity: 0.6;
}
.q-transition--sheet-out-leave-active {
  transition: all 200ms cubic-bezier(0.32, 0.72, 0, 1);
}
.q-transition--sheet-out-leave-to {
  transform: translateY(100%);
  opacity: 0.6;
}

@media (prefers-reduced-motion: reduce) {
  .q-transition--sheet-in-enter-active,
  .q-transition--sheet-out-leave-active {
    transition-duration: 0.01ms !important;
  }
}
</style>
