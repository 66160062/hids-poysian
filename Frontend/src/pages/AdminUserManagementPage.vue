<template>
  <q-page class="admin-user-page bg-grey-1 q-pb-xl">
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
          :placeholder="t('adminManage.userManagement.searchPlaceholder')"
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
          <div class="text-h6 text-weight-bold text-dark">{{ t('adminManage.userManagement.filterTitle') }}</div>
          <div class="row items-center">
            <q-btn
              v-if="activeFilterCount > 0"
              flat
              dense
              color="negative"
              :label="t('adminManage.userManagement.clear')"
              class="q-mr-sm"
              @click="clearFilters"
            />
            <q-btn flat round dense icon="close" color="grey-6" v-close-popup />
          </div>
        </div>

        <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">{{ t('adminManage.userManagement.branchLabel') }}</div>
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

        <div class="text-weight-medium text-grey-8 q-mb-sm" style="font-size: 14px">{{ t('adminManage.userManagement.roleLabel') }}</div>
        <div class="row q-gutter-x-sm no-wrap overflow-auto hide-scrollbar q-py-xs q-mb-lg">
          <q-btn
            v-for="filter in roleFilters"
            :key="filter.value"
            unelevated
            rounded
            :color="activeRoleFilter === filter.value ? 'primary' : 'grey-2'"
            :text-color="activeRoleFilter === filter.value ? 'white' : 'grey-8'"
            class="filter-chip"
            no-caps
            @click="activeRoleFilter = filter.value"
          >
            <span class="text-weight-medium q-px-sm">{{ filter.label }}</span>
          </q-btn>
        </div>

        <q-btn
          unelevated
          rounded
          color="primary"
          :label="t('adminManage.userManagement.done')"
          class="full-width text-weight-bold"
          style="height: 48px; font-size: 16px"
          v-close-popup
        />
      </q-card>
    </q-dialog>

    <!-- Active Filters Chips -->
    <div v-if="activeFilterCount > 0" class="row items-center q-gutter-x-sm q-px-md q-mb-sm">
      <span class="text-caption text-grey-7 q-mr-xs">{{ t('adminManage.userManagement.filteringLabel') }}</span>
      <q-chip
        v-if="activeRoleFilter !== 'all'"
        removable
        @remove="activeRoleFilter = 'all'"
        color="blue-1"
        text-color="primary"
        dense
        class="text-weight-medium"
      >
        {{ roleFilters.find((f) => f.value === activeRoleFilter)?.label }}
      </q-chip>
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

    <!-- User List -->
    <div class="q-pa-md">
      <!-- Empty State -->
      <div v-if="!isLoading && filteredUsers.length === 0" class="text-center q-py-xl text-grey-6">
        <q-icon name="person_off" size="64px" class="q-mb-md" />
        <div>{{ t('adminManage.userManagement.noUsersFound') }}</div>
      </div>

      <!-- Users -->
      <div v-else class="row q-col-gutter-md">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="col-12 col-sm-6 col-md-4 card-stagger"
        >
          <AdminUserCard
            :user="user"
            :teamOptions="teamOptions"
            @edit="openEditDialog"
            @delete="confirmDeleteUser"
          />
        </div>
      </div>
    </div>

    <!-- FAB Add Button -->
    <q-page-sticky position="bottom-right" :offset="[16, 16]" class="q-gutter-y-sm column">
      <q-btn fab icon="add" color="primary" @click="openCreateDialog" />
    </q-page-sticky>

    <!-- Refactored Form Dialog -->
    <AdminUserFormDialog
      v-model="showFormDialog"
      :isEditing="isEditing"
      :initialData="formData"
      :roleOptions="roleOptions"
      :teamOptions="teamOptions"
      @save="onSaveUser"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import AdminUserCard from 'src/components/AdminUserCard.vue';
import AdminUserFormDialog from 'src/components/AdminUserFormDialog.vue';
import ConfirmActionDialog from 'src/components/ConfirmActionDialog.vue';
import { createIconSpinner } from 'src/composables/useIconSpinner';
import { useTeamStore } from 'src/stores/useTeam';
import { useUserStore } from 'src/stores/useUser';
import { useBranchStore } from 'src/stores/useBranch';
import type { User } from 'src/models';

const userSpinner = createIconSpinner('group');

const { t } = useI18n();
const $q = useQuasar();
const teamStore = useTeamStore();
const userStore = useUserStore();
const branchStore = useBranchStore();

// Global Options
const roleFilters = computed(() => [
  { label: t('adminManage.userManagement.filterAll'), value: 'all' },
  { label: t('adminManage.userManagement.filterAdmin'), value: 'admin' },
  { label: t('adminManage.userManagement.filterInspector'), value: 'inspector' },
]);

const roleOptions = computed(() => [
  { label: t('adminManage.userManagement.roleAdmin'), value: 'admin' },
  { label: t('adminManage.userManagement.roleInspector'), value: 'inspector' },
]);

const teamOptions = computed(() => teamStore.teamOptions);

// State
const isLoading = computed(() => userStore.isLoading);
const usersList = computed(() => userStore.users);
const searchQuery = ref('');
const activeRoleFilter = ref('all');
const selectedBranchId = ref<number | null>(null);
const branchOptions = computed(() => [
  { label: t('adminManage.userManagement.allBranches'), value: null },
  ...branchStore.branches.map((branch) => ({
    label: branch.branchName || t('adminManage.userManagement.branchFallback', { id: branch.branchId }),
    value: branch.branchId,
  })),
]);

const showFilterDialog = ref(false);
const activeFilterCount = computed(() => {
  let count = 0;
  if (activeRoleFilter.value !== 'all') count++;
  if (selectedBranchId.value !== null) count++;
  return count;
});

function clearFilters() {
  activeRoleFilter.value = 'all';
  selectedBranchId.value = null;
}

// Computed filters
const filteredUsers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return usersList.value.filter((user) => {
    const matchSearch =
      !query ||
      [user.fullName, user.phoneNumber, user.email, user.lineId, user.team?.team_name].some((field) =>
        (field || '').toLowerCase().includes(query),
      );
    const matchRole = activeRoleFilter.value === 'all' || user.role === activeRoleFilter.value;
    const matchBranch =
      selectedBranchId.value === null || user.team?.branchId === selectedBranchId.value;
    return matchSearch && matchRole && matchBranch;
  });
});

// Form State
const showFormDialog = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);
const formData = ref<Partial<User>>({});

const defaultForm = (): Partial<User> & { teamId?: number } => ({
  fullName: '',
  phoneNumber: '',
  email: '',
  lineId: '',
  role: 'inspector',
  teamId: 1, // default select
  imageUrl: '',
  password: '',
});

/* =========================================
   UI HANDLERS
   ========================================= */

onMounted(async () => {
  $q.loading.show({
    spinner: userSpinner,
    spinnerColor: 'primary',
    spinnerSize: 70,
    backgroundColor: 'white',
  });
  void branchStore.fetchBranches().catch(() => {
    $q.notify({ type: 'negative', message: t('adminManage.userManagement.fetchBranchesFailed') });
  });
  try {
    await Promise.all([
      userStore.fetchUsers().catch((err) => {
        const error = err as Error & { response?: { data?: { message?: string } } };
        console.error('Fetch users error:', error);
        const msg = error?.response?.data?.message || error?.message || t('adminManage.userManagement.unknownError');
        $q.notify({ type: 'negative', message: t('adminManage.userManagement.fetchFailed', { msg }) });
      }),
      teamStore.fetchTeams(),
    ]);
  } finally {
    $q.loading.hide();
  }
});

const openCreateDialog = () => {
  isEditing.value = false;
  editingId.value = null;
  formData.value = { ...defaultForm() };
  showFormDialog.value = true;
};

const openEditDialog = (user: User) => {
  isEditing.value = true;
  editingId.value = user.id;
  formData.value = { ...user, teamId: user.team?.team_Id };
  showFormDialog.value = true;
};

const onSaveUser = async (payload: { form: Partial<User>; file: File | null }) => {
  const f = payload.form;
  if (
    !f.fullName ||
    !f.phoneNumber ||
    !f.role ||
    (!isEditing.value && !f.password) ||
    (f.role !== 'admin' && !f.teamId)
  ) {
    $q.notify({
      message: t('adminManage.userManagement.fillRequiredFields'),
      color: 'warning',
      icon: 'warning',
      position: 'top',
    });
    return;
  }

  try {
    $q.loading.show({ message: t('adminManage.userManagement.saving') });
    if (isEditing.value && editingId.value) {
      await userStore.updateUser(editingId.value, payload);
      $q.notify({ type: 'positive', message: t('adminManage.userManagement.editSuccess'), icon: 'check_circle' });
    } else {
      await userStore.createUser(payload);
      $q.notify({ type: 'positive', message: t('adminManage.userManagement.addSuccess'), icon: 'check_circle' });
    }
    showFormDialog.value = false;
  } catch (err) {
    const error = err as Error & { response?: { data?: { message?: string } } };
    console.error('Save user failed', error);
    const msg = error?.response?.data?.message || error?.message || t('adminManage.userManagement.unknownError');
    $q.notify({ type: 'negative', message: t('adminManage.userManagement.saveFailed', { msg }) });
  } finally {
    $q.loading.hide();
  }
};

const confirmDeleteUser = (user: User) => {
  $q.dialog({
    component: ConfirmActionDialog,
    componentProps: {
      title: t('adminManage.userManagement.deleteConfirmTitle'),
      message: t('adminManage.userManagement.deleteConfirmMessage', { name: user.fullName }),
      icon: 'delete',
      color: 'negative',
      confirmLabel: t('adminManage.userManagement.deleteConfirmOk'),
      cancelLabel: t('adminManage.userManagement.deleteConfirmCancel'),
    },
  }).onOk(() => {
    $q.loading.show({ message: t('adminManage.userManagement.deleting') });
    userStore.deleteUser(user.id)
      .then(() => {
        $q.notify({ type: 'positive', message: t('adminManage.userManagement.deleteSuccess'), icon: 'check_circle' });
      })
      .catch((err) => {
        const error = err as Error & { response?: { data?: { message?: string } } };
        console.error('Delete user failed', error);
        const msg = error?.response?.data?.message || error?.message || t('adminManage.userManagement.unknownError');
        $q.notify({ type: 'negative', message: t('adminManage.userManagement.deleteFailed', { msg }) });
      })
      .finally(() => {
        $q.loading.hide();
      });
  });
};
</script>

<style scoped>
.admin-user-page {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-sheet: cubic-bezier(0.32, 0.72, 0, 1);
  max-width: 600px;
  margin: 0 auto;
  min-height: 100vh;
}

@media (min-width: 600px) {
  .admin-user-page {
    max-width: 800px;
  }
}
@media (min-width: 1024px) {
  .admin-user-page {
    max-width: 1100px;
  }
}
@media (min-width: 1440px) {
  .admin-user-page {
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

.hide-scrollbar {
  scrollbar-width: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.filter-chip {
  min-width: fit-content;
  border-radius: 20px;
  border: 1px solid #e0e0e0;
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
