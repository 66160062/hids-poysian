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
    <q-page-sticky position="bottom-right" :offset="[16, 16]">
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
import { useQuasar } from 'quasar';
import AdminUserCard from 'src/components/AdminUserCard.vue';
import AdminUserFormDialog from 'src/components/AdminUserFormDialog.vue';

const $q = useQuasar();

export interface User {
  id: number;
  team_id: number | null;
  full_name: string;
  phone_number: string;
  email: string;
  line_id: string;
  role: 'admin' | 'inspector';
  image_url: string;
  password?: string;
}

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

const teamOptions = [
  { label: 'ทีม A', value: 1 },
  { label: 'ทีม B', value: 2 },
];

// State
const isLoading = ref(false);
const usersList = ref<User[]>([]);
const searchQuery = ref('');
const activeRoleFilter = ref('all');

// Computed filters
const filteredUsers = computed(() => {
  return usersList.value.filter((user) => {
    const matchName = user.full_name.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchRole = activeRoleFilter.value === 'all' || user.role === activeRoleFilter.value;
    return matchName && matchRole;
  });
});

// Form State
const showFormDialog = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);
const formData = ref<Partial<User>>({});

const defaultForm = (): Partial<User> => ({
  full_name: '',
  phone_number: '',
  email: '',
  line_id: '',
  role: 'inspector',
  team_id: 1, // default select
  image_url: '',
  password: '',
});

/* =========================================
   BACKEND PREPARATION (Mocked Async Functions)
   ========================================= */

const fetchUsers = async () => {
  isLoading.value = true;
  try {
    // TODO: Connect to backend API: await api.get('/users');
    // Using timeout to simulate network request
    await new Promise((resolve) => setTimeout(resolve, 600));

    usersList.value = [
      {
        id: 1,
        team_id: null,
        full_name: 'สมชาย ใจดี',
        phone_number: '081-234-5678',
        email: 'somchai@example.com',
        line_id: 'somchai.jd',
        role: 'admin',
        image_url: 'https://cdn.quasar.dev/img/avatar1.jpg',
      },
      {
        id: 2,
        team_id: 1,
        full_name: 'สมหญิง รักงาน',
        phone_number: '089-876-5432',
        email: 'somying@example.com',
        line_id: 'somying.r',
        role: 'inspector',
        image_url: 'https://cdn.quasar.dev/img/avatar2.jpg',
      },
      {
        id: 3,
        team_id: 2,
        full_name: 'วิศวกร เก่งมาก',
        phone_number: '083-456-7890',
        email: 'engineer@example.com',
        line_id: 'eng.keng',
        role: 'inspector',
        image_url: 'https://cdn.quasar.dev/img/avatar3.jpg',
      },
    ];
  } catch (error) {
    console.error('Fetch users error:', error);
    $q.notify({ type: 'negative', message: 'ดึงข้อมูลล้มเหลว' });
  } finally {
    isLoading.value = false;
  }
};

const createUser = async (payload: { form: Partial<User>; file: File | null }) => {
  // TODO: Implement backend API call e.g. using FormData if file exists
  await new Promise((resolve) => setTimeout(resolve, 300));
  const f = payload.form;
  const newUser: User = {
    id: Date.now(),
    team_id: f.team_id || null,
    full_name: f.full_name || '',
    phone_number: f.phone_number || '',
    email: f.email || '',
    line_id: f.line_id || '',
    role: f.role || 'inspector',
    image_url: f.image_url || '/project-images/unknown.jpg',
  };
  usersList.value.unshift(newUser);
  $q.notify({ type: 'positive', message: 'เพิ่มผู้ใช้สำเร็จ', icon: 'check_circle' });
};

const updateUser = async (id: number, payload: { form: Partial<User>; file: File | null }) => {
  // TODO: Implement backend API call e.g. api.put(`/users/${id}`, payload)
  await new Promise((resolve) => setTimeout(resolve, 300));
  const idx = usersList.value.findIndex((u) => u.id === id);
  if (idx !== -1) {
    usersList.value[idx] = { ...usersList.value[idx], ...payload.form } as User;
  }
  $q.notify({ type: 'positive', message: 'แก้ไขข้อมูลสำเร็จ', icon: 'check_circle' });
};

const deleteUser = async (id: number) => {
  // TODO: Connect to backend API
  await new Promise((resolve) => setTimeout(resolve, 300));
  usersList.value = usersList.value.filter((u) => u.id !== id);
  $q.notify({ type: 'positive', message: 'ลบผู้ใช้สำเร็จ', icon: 'check_circle' });
};

/* =========================================
   UI HANDLERS
   ========================================= */

onMounted(() => {
  void fetchUsers();
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
  formData.value = { ...user };
  showFormDialog.value = true;
};

const onSaveUser = async (payload: { form: Partial<User>; file: File | null }) => {
  const f = payload.form;
  if (
    !f.full_name ||
    !f.phone_number ||
    !f.role ||
    (!isEditing.value && !f.password) ||
    (f.role !== 'admin' && !f.team_id)
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
      await updateUser(editingId.value, payload);
    } else {
      await createUser(payload);
    }
    showFormDialog.value = false;
  } catch (error) {
    console.error('Save user failed', error);
  } finally {
    $q.loading.hide();
  }
};

const confirmDeleteUser = (user: User) => {
  $q.dialog({
    title: 'ยืนยันการลบ',
    message: `คุณต้องการลบผู้ใช้ "${user.full_name}" ใช่หรือไม่?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    $q.loading.show({ message: 'กำลังลบข้อมูล...' });
    void deleteUser(user.id)
      .catch((error) => {
        console.error('Delete user failed', error);
        $q.notify({ type: 'negative', message: 'ลบข้อมูลล้มเหลว' });
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
