<template>
  <q-page class="admin-user-page bg-grey-1 q-pb-xl">
    <!-- Header Section -->
    <div class="q-px-md q-pt-md q-pb-sm text-dark header-bg">
      <div class="q-mb-md">
        <!-- <div class="text-h6 text-weight-bold text-dark">
          {{ t('adminManage.userManagement.title') }}
        </div> -->
        <div class="text-caption text-weight">
          {{ t('adminManage.userManagement.subtitle') }}
        </div>
      </div>

      <!-- KPI Summary Cards (4 Cards) -->
      <div class="kpi-row row no-wrap q-col-gutter-sm q-mb-md">
        <div class="kpi-col col">
          <q-card
            flat
            bordered
            class="kpi-card bg-white shadow-1 cursor-pointer"
            :class="{ 'kpi-card--active': activeRoleFilter === 'all' }"
            v-ripple
            tabindex="0"
            role="button"
            @click="activeRoleFilter = 'all'"
            @keyup.enter="activeRoleFilter = 'all'"
          >
            <q-card-section class="q-pa-sm row items-center no-wrap">
              <q-avatar color="blue-1" text-color="primary" icon="group" size="40px" />
              <div class="q-ml-sm">
                <div class="text-caption text-grey-7">{{ t('adminManage.userManagement.kpiTotalUsers') }}</div>
                <div class="text-h6 text-weight-bold text-dark">{{ allUsersList.length }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="kpi-col col">
          <q-card
            flat
            bordered
            class="kpi-card bg-white shadow-1 cursor-pointer"
            :class="{ 'kpi-card--active': activeRoleFilter === 'admin' }"
            v-ripple
            tabindex="0"
            role="button"
            @click="activeRoleFilter = 'admin'"
            @keyup.enter="activeRoleFilter = 'admin'"
          >
            <q-card-section class="q-pa-sm row items-center no-wrap">
              <q-avatar color="deep-purple-1" text-color="deep-purple-9" icon="admin_panel_settings" size="40px" />
              <div class="q-ml-sm">
                <div class="text-caption text-grey-7">{{ t('adminManage.userManagement.kpiAdmins') }}</div>
                <div class="text-h6 text-weight-bold text-dark">{{ adminCount }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="kpi-col col">
          <q-card
            flat
            bordered
            class="kpi-card bg-white shadow-1 cursor-pointer"
            :class="{ 'kpi-card--active': activeRoleFilter === 'inspector' }"
            v-ripple
            tabindex="0"
            role="button"
            @click="activeRoleFilter = 'inspector'"
            @keyup.enter="activeRoleFilter = 'inspector'"
          >
            <q-card-section class="q-pa-sm row items-center no-wrap">
              <q-avatar color="teal-1" text-color="teal-9" icon="engineering" size="40px" />
              <div class="q-ml-sm">
                <div class="text-caption text-grey-7">{{ t('adminManage.userManagement.kpiInspectors') }}</div>
                <div class="text-h6 text-weight-bold text-dark">{{ inspectorCount }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="kpi-col col">
          <q-card
            flat
            bordered
            class="kpi-card bg-white shadow-1 cursor-pointer"
            :class="{ 'kpi-card--active': activeRoleFilter === 'unassigned' }"
            v-ripple
            tabindex="0"
            role="button"
            @click="activeRoleFilter = 'unassigned'"
            @keyup.enter="activeRoleFilter = 'unassigned'"
          >
            <q-card-section class="q-pa-sm row items-center no-wrap">
              <q-avatar color="orange-1" text-color="orange-9" icon="person_search" size="40px" />
              <div class="q-ml-sm">
                <div class="text-caption text-grey-7">{{ t('adminManage.userManagement.kpiUnassigned') }}</div>
                <div class="text-h6 text-weight-bold text-dark">{{ unassignedCount }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Search Bar & Round Tune Filter Button -->
      <div class="row q-gutter-x-sm no-wrap items-center">
        <q-input
          v-model="searchQuery"
          dense
          borderless
          rounded
          :placeholder="t('adminManage.userManagement.searchPlaceholder')"
          class="col search-input"
          hide-bottom-space
        >
          <template #prepend>
            <q-icon name="search" color="grey-7" />
          </template>
          <template #append v-if="searchQuery">
            <q-icon name="close" class="cursor-pointer" @click="searchQuery = ''" />
          </template>
        </q-input>

        <!-- Round Tune Filter Button -->
        <q-btn
          round
          unelevated
          :color="activeFilterCount > 0 ? 'primary' : 'white'"
          :text-color="activeFilterCount > 0 ? 'white' : 'primary'"
          icon="tune"
          class="shadow-1 shrink-0"
          style="height: 44px; width: 44px; min-height: 44px; min-width: 44px"
        >
          <q-badge
            v-if="activeFilterCount > 0"
            color="red"
            floating
            rounded
            style="top: 2px; right: 2px"
          >
            {{ activeFilterCount }}
          </q-badge>

          <q-menu anchor="bottom right" self="top right" :offset="[0, 8]" class="rounded-borders shadow-3">
            <q-list style="min-width: 230px" class="q-py-xs">
              <q-item-label header class="text-caption text-weight-bold text-grey-7">
                {{ t('adminManage.userManagement.roleFilterLabel') || 'ประเภทผู้ใช้' }}
              </q-item-label>
              <q-item
                v-for="chip in roleFilterChips"
                :key="chip.value"
                clickable
                v-close-popup
                :active="activeRoleFilter === chip.value"
                active-class="bg-blue-1 text-primary text-weight-bold"
                @click="activeRoleFilter = chip.value"
              >
                <q-item-section avatar min-width="24px">
                  <q-icon :name="chip.icon" size="18px" :color="activeRoleFilter === chip.value ? 'primary' : 'grey-7'" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ chip.label }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge
                    :color="activeRoleFilter === chip.value ? 'primary' : 'grey-3'"
                    :text-color="activeRoleFilter === chip.value ? 'white' : 'dark'"
                    rounded
                  >
                    {{ chip.count }}
                  </q-badge>
                </q-item-section>
              </q-item>

              <template v-if="branchOptions.length > 1">
                <q-separator class="q-my-xs" />
                <q-item-label header class="text-caption text-weight-bold text-grey-7">
                  {{ t('adminManage.teamManagement.branchLabel') || 'สาขา' }}
                </q-item-label>
                <q-item
                  v-for="b in branchOptions"
                  :key="String(b.value)"
                  clickable
                  v-close-popup
                  :active="selectedBranchId === b.value"
                  active-class="bg-blue-1 text-primary text-weight-bold"
                  @click="selectedBranchId = b.value"
                >
                  <q-item-section avatar min-width="24px">
                    <q-icon name="business" size="18px" :color="selectedBranchId === b.value ? 'primary' : 'grey-7'" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ b.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-list>
          </q-menu>
        </q-btn>
      </div>

      <!-- Action Buttons Row -->
      <div class="row items-center justify-end q-mt-sm">
        <div class="col-12 col-sm-auto">
          <q-btn
            unelevated
            color="primary"
            icon="add"
            :label="t('adminManage.userManagement.addNewUser')"
            class="full-width action-btn-primary shadow-1"
            no-caps
            @click="openCreateDialog"
          />
        </div>
      </div>
    </div>

    <!-- Active Filter Chips (if selected) -->
    <div v-if="activeRoleFilter !== 'all' || selectedBranchId !== null" class="row items-center q-gutter-x-xs q-px-md q-my-xs">
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
        {{ roleFilterChips.find((r) => r.value === activeRoleFilter)?.label }}
      </q-chip>
      <q-chip
        v-if="selectedBranchId !== null"
        removable
        @remove="selectedBranchId = null"
        color="purple-1"
        text-color="purple-9"
        dense
        class="text-weight-medium"
      >
        {{ branchOptions.find((b) => b.value === selectedBranchId)?.label }}
      </q-chip>
    </div>

    <!-- User Cards Grid -->
    <div class="q-px-md q-pt-sm q-pb-md">
      <!-- Empty State -->
      <div v-if="!isLoading && usersList.length === 0" class="text-center q-py-xl text-grey-6">
        <q-icon name="person_off" size="64px" class="q-mb-md" />
        <div>{{ t('adminManage.userManagement.noUsersFound') }}</div>
      </div>

      <!-- Users Grid -->
      <div v-else class="row q-col-gutter-md">
        <div
          v-for="user in usersList"
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

    <!-- User Form Dialog -->
    <AdminUserFormDialog
      v-model="showFormDialog"
      :isEditing="isEditing"
      :initialData="formData"
      :roleOptions="roleOptions"
      :teamOptions="teamOptions"
      :branchOptions="branchFormOptions"
      @save="onSaveUser"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
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

const { t, locale } = useI18n({ useScope: 'global' });
const $q = useQuasar();
const teamStore = useTeamStore();
const userStore = useUserStore();
const branchStore = useBranchStore();

// State
const isLoading = computed(() => userStore.isLoading);
const isUnassignedInspector = (u: User) => u.role === 'inspector' && !(u.teamId ?? u.team?.team_Id);
// 'unassigned' is a client-side filter (backend only knows real roles), so narrow the fetched inspectors here
const usersList = computed(() =>
  activeRoleFilter.value === 'unassigned' ? userStore.users.filter(isUnassignedInspector) : userStore.users
);
const allUsersList = computed(() => (userStore.allUsers.length > 0 ? userStore.allUsers : userStore.users));
const searchQuery = ref('');
const activeRoleFilter = ref('all');
const selectedBranchId = ref<number | null>(null);

// KPI Counts
const adminCount = computed(() => allUsersList.value.filter((u) => u.role === 'admin').length);
const inspectorCount = computed(() => allUsersList.value.filter((u) => u.role === 'inspector').length);
const unassignedCount = computed(() => allUsersList.value.filter(isUnassignedInspector).length);

const activeFilterCount = computed(() => {
  let count = 0;
  if (activeRoleFilter.value !== 'all') count++;
  if (selectedBranchId.value !== null) count++;
  return count;
});

const roleFilterChips = computed(() => {
  void locale.value;
  return [
    { label: t('adminManage.userManagement.filterAll'), value: 'all', icon: 'group', count: allUsersList.value.length },
    { label: t('adminManage.userManagement.filterAdmin'), value: 'admin', icon: 'admin_panel_settings', count: adminCount.value },
    { label: t('adminManage.userManagement.filterInspector'), value: 'inspector', icon: 'engineering', count: inspectorCount.value },
    { label: t('adminManage.userManagement.filterUnassigned'), value: 'unassigned', icon: 'person_search', count: unassignedCount.value },
  ];
});

const roleOptions = computed(() => {
  void locale.value;
  return [
    { label: t('adminManage.userManagement.roleAdmin'), value: 'admin' },
    { label: t('adminManage.userManagement.roleInspector'), value: 'inspector' },
  ];
});

const teamOptions = computed(() =>
  (teamStore.allTeams.length > 0 ? teamStore.allTeams : teamStore.teams).map((t) => ({
    label: t.team_name,
    value: t.team_Id,
    branchId: t.branchId ?? null,
  }))
);

const branchOptions = computed(() => {
  void locale.value;
  return [
    { label: t('adminManage.userManagement.allBranches'), value: null },
    ...branchStore.branches.map((branch) => ({
      label: branch.branchName || t('adminManage.userManagement.branchFallback', { id: branch.branchId }),
      value: branch.branchId,
    })),
  ];
});

const branchFormOptions = computed(() => {
  void locale.value;
  return branchStore.branches.map((branch) => ({
    label: branch.branchName || t('adminManage.userManagement.branchFallback', { id: branch.branchId }),
    value: branch.branchId,
  }));
});

const loadUsers = async () => {
  try {
    await userStore.fetchUsers({
      all: true,
      search: searchQuery.value.trim() || undefined,
      role:
        activeRoleFilter.value === 'unassigned'
          ? 'inspector'
          : activeRoleFilter.value !== 'all'
            ? activeRoleFilter.value
            : undefined,
      branchId: selectedBranchId.value ?? undefined,
    });
  } catch (err) {
    const error = err as Error & { response?: { data?: { message?: string } } };
    console.error('Fetch users error:', error);
    const msg = error?.response?.data?.message || error?.message || t('adminManage.userManagement.unknownError');
    $q.notify({ type: 'negative', message: t('adminManage.userManagement.fetchFailed', { msg }) });
  }
};

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    void loadUsers();
  }, 400);
});

watch([activeRoleFilter, selectedBranchId], () => {
  void loadUsers();
});

// Form State
const showFormDialog = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);
const formData = ref<Partial<User>>({});

const defaultForm = (): Partial<User> & { teamId?: number | undefined; branchId?: number | null } => ({
  fullName: '',
  phoneNumber: '',
  email: '',
  lineId: '',
  role: 'inspector',
  teamId: undefined,
  branchId: null,
  imageUrl: '',
  password: '',
});

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
      userStore.fetchAllUsers(),
      loadUsers(),
      teamStore.fetchAllTeams(),
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
  formData.value = {
    ...user,
    teamId: user.team?.team_Id ?? user.teamId,
    branchId: user.branchId ?? user.branch?.branchId ?? user.team?.branchId ?? null,
  };
  showFormDialog.value = true;
};

const onSaveUser = async (payload: { form: Partial<User>; file: File | null }) => {
  const f = payload.form;
  if (
    !f.fullName ||
    !f.phoneNumber ||
    !f.role ||
    (f.role !== 'admin' && !f.branchId) ||
    (!isEditing.value && !f.password)
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
    void loadUsers();
    void userStore.fetchAllUsers();
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
    userStore
      .deleteUser(user.id)
      .then(() => {
        $q.notify({ type: 'positive', message: t('adminManage.userManagement.deleteSuccess'), icon: 'check_circle' });
        void loadUsers();
        void userStore.fetchAllUsers();
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
  max-width: 1200px;
  margin: 0 auto;
}

.header-bg {
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
}

.kpi-card {
  height: 100%;
  border-radius: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
}

.kpi-col {
  min-width: 0;
}

/* มือถือ: การ์ด KPI ทั้งหมดอยู่แถวเดียวกัน จัดเนื้อหาเป็นแนวตั้งให้พอดีความกว้าง */
@media (max-width: 599.98px) {
  .kpi-row {
    --kpi-gap: 6px;
    margin-left: calc(-1 * var(--kpi-gap));
  }
  .kpi-row > .kpi-col {
    padding-left: var(--kpi-gap);
  }
  .kpi-row .q-card__section {
    flex-direction: column;
    justify-content: center;
    text-align: center;
    padding: 8px 2px;
  }
  .kpi-row .q-avatar {
    font-size: 30px !important;
  }
  .kpi-row .q-card__section > div:not(.q-avatar) {
    margin-left: 0;
    margin-top: 4px;
    min-width: 0;
    width: 100%;
  }
  .kpi-row .text-caption {
    font-size: 10px;
    line-height: 1.25;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .kpi-row .text-h6 {
    font-size: 1rem;
    line-height: 1.3;
  }
}

.kpi-card.kpi-card--active {
  outline: 2px solid var(--q-primary, #1976d2);
  outline-offset: -1px;
}

.kpi-card:focus-visible {
  outline: 2px solid var(--q-primary, #1976d2);
  outline-offset: 2px;
}

.kpi-card.cursor-pointer {
  user-select: none;
  -webkit-user-select: none;
  caret-color: transparent;
  -webkit-tap-highlight-color: transparent;
}

.search-input {
  background: #ffffff;
  border-radius: 24px;
  padding: 4px 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.action-btn-primary {
  height: 42px;
  border-radius: 14px;
  font-weight: 600;
  font-size: 13px;
}

.scroll-container {
  max-width: 100%;
}

.filter-chip {
  min-height: 42px;
  padding: 6px 14px;
  border-radius: 21px;
  white-space: nowrap;
  font-size: 13px;
  transition: all 0.2s ease;
}

.filter-text {
  white-space: nowrap;
}

.shrink-0 {
  flex-shrink: 0;
}

.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

</style>
