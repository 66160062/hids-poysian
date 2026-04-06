<template>
  <q-page class="bg-grey-1 q-pb-xl">
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
        placeholder="ค้นหาชื่อผู้ใช้งาน..."
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

    <!-- Filter Group -->
    <div class="q-px-md q-py-sm sticky-filter bg-grey-1">
      <div class="row q-gutter-x-sm no-wrap overflow-auto hide-scrollbar q-py-xs">
        <q-btn
          v-for="filter in roleFilters"
          :key="filter.value"
          unelevated
          rounded
          :color="activeRoleFilter === filter.value ? 'primary' : 'white'"
          :text-color="activeRoleFilter === filter.value ? 'white' : 'grey-8'"
          class="filter-chip"
          no-caps
          @click="activeRoleFilter = filter.value"
        >
          <span class="text-weight-medium q-px-sm">{{ filter.label }}</span>
        </q-btn>
      </div>
    </div>

    <!-- User List -->
    <div class="q-pa-md">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center q-py-xl">
        <q-spinner color="primary" size="3em" />
        <div class="text-grey-6 q-mt-md">กำลังโหลดข้อมูล...</div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredUsers.length === 0" class="text-center q-py-xl text-grey-6">
        <q-icon name="person_off" size="64px" class="q-mb-md" />
        <div>ไม่พบรายชื่อผู้ใช้งาน</div>
      </div>

      <!-- Users -->
      <q-list class="q-gutter-y-md" v-else>
        <AdminUserCard
          v-for="user in filteredUsers"
          :key="user.id"
          :user="user"
          :teamOptions="teamOptions"
          @edit="openEditDialog"
          @delete="confirmDeleteUser"
        />
      </q-list>
    </div>

    <!-- FAB Add Button -->
    <q-page-sticky position="bottom-right" :offset="[16, 16]" class="q-gutter-y-sm column">
      <q-btn fab icon="groups" color="secondary" @click="showTeamDialog = true" />
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

    <!-- Team Management Dialog -->
    <AdminTeamManagementDialog v-model="showTeamDialog" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import AdminUserCard from 'src/components/AdminUserCard.vue';
import AdminUserFormDialog from 'src/components/AdminUserFormDialog.vue';
import AdminTeamManagementDialog from 'src/components/AdminTeamManagementDialog.vue';
import { useTeamStore } from 'src/stores/useTeam';
import { useUserStore } from 'src/stores/useUser';
import type { User } from 'src/models';

const $q = useQuasar();
const teamStore = useTeamStore();
const userStore = useUserStore();

// Global Options
const roleFilters = [
  { label: 'ทั้งหมด', value: 'all' },
  { label: 'ผู้ดูแลระบบ (Admin)', value: 'admin' },
  { label: 'ผู้ตรวจ (Inspector)', value: 'inspector' },
];

const roleOptions = [
  { label: 'ผู้ดูแลระบบ (Admin)', value: 'admin' },
  { label: 'ผู้ตรวจงาน (Inspector)', value: 'inspector' },
];

const teamOptions = computed(() => teamStore.teamOptions);

// State
const isLoading = computed(() => userStore.isLoading);
const usersList = computed(() => userStore.users);
const searchQuery = ref('');
const activeRoleFilter = ref('all');
const showTeamDialog = ref(false);

// Computed filters
const filteredUsers = computed(() => {
  return usersList.value.filter((user) => {
    const matchName = user.fullName.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchRole = activeRoleFilter.value === 'all' || user.role === activeRoleFilter.value;
    return matchName && matchRole;
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

onMounted(() => {
  userStore.fetchUsers().catch((err) => {
    const error = err as Error & { response?: { data?: { message?: string } } };
    console.error('Fetch users error:', error);
    const msg = error?.response?.data?.message || error?.message || 'ไม่ทราบสาเหตุ';
    $q.notify({ type: 'negative', message: `ดึงข้อมูลล้มเหลว: ${msg}` });
  });
  void teamStore.fetchTeams();
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
      message: 'กรุณากรอกข้อมูลที่บังคับให้ครบถ้วน',
      color: 'warning',
      icon: 'warning',
      position: 'top',
    });
    return;
  }

  try {
    $q.loading.show({ message: 'กำลังบันทึกข้อมูล...' });
    if (isEditing.value && editingId.value) {
      await userStore.updateUser(editingId.value, payload);
      $q.notify({ type: 'positive', message: 'แก้ไขข้อมูลสำเร็จ', icon: 'check_circle' });
    } else {
      await userStore.createUser(payload);
      $q.notify({ type: 'positive', message: 'เพิ่มผู้ใช้สำเร็จ', icon: 'check_circle' });
    }
    showFormDialog.value = false;
  } catch (err) {
    const error = err as Error & { response?: { data?: { message?: string } } };
    console.error('Save user failed', error);
    const msg = error?.response?.data?.message || error?.message || 'ไม่ทราบสาเหตุ';
    $q.notify({ type: 'negative', message: `บันทึกข้อมูลไม่สำเร็จ: ${msg}` });
  } finally {
    $q.loading.hide();
  }
};

const confirmDeleteUser = (user: User) => {
  $q.dialog({
    title: 'ยืนยันการลบ',
    message: `คุณต้องการลบผู้ใช้ "${user.fullName}" ใช่หรือไม่?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    $q.loading.show({ message: 'กำลังลบข้อมูล...' });
    userStore.deleteUser(user.id)
      .then(() => {
        $q.notify({ type: 'positive', message: 'ลบผู้ใช้สำเร็จ', icon: 'check_circle' });
      })
      .catch((err) => {
        const error = err as Error & { response?: { data?: { message?: string } } };
        console.error('Delete user failed', error);
        const msg = error?.response?.data?.message || error?.message || 'ไม่ทราบสาเหตุ';
        $q.notify({ type: 'negative', message: `ลบข้อมูลล้มเหลว: ${msg}` });
      })
      .finally(() => {
        $q.loading.hide();
      });
  });
};
</script>

<style scoped>
.search-input :deep(.q-field__control) {
  border-radius: 30px;
}
.sticky-filter {
  position: sticky;
  top: 0;
  z-index: 10;
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
</style>
