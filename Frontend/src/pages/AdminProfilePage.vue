<template>
  <q-layout view="lHh Lpr lFf" class="bg-grey-1">
    <q-header class="bg-white text-dark" >
      <q-toolbar class="q-px-sm">
        <q-btn
          flat
          dense
          no-caps
          icon="chevron_left"
          label="กลับ"
          color="primary"
          class="text-weight-medium"
          @click="goBack"
        />
        <q-space />
        <q-toolbar-title class="text-center text-weight-bold text-body1 absolute-center">
          แก้ไขผู้ใช้
        </q-toolbar-title>
        <q-space />
        <q-btn
          flat
          dense
          no-caps
          label="บันทึก"
          color="primary"
          class="text-weight-bold"
          @click="submitForm"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="admin-profile-page q-pb-xl">
        <q-form ref="profileFormRef" @submit="saveChanges" class="q-pa-md">
          <div class="column items-center q-mb-xl">
            <div class="relative-position q-mb-md">
              <q-avatar size="90px" :color="!displayImageUrl ? 'primary' : ''" :text-color="!displayImageUrl ? 'white' : ''" class="text-h3">
                <img v-if="displayImageUrl" :src="displayImageUrl" />
                <span v-else>{{ form.full_name?.charAt(0).toUpperCase() || 'A' }}</span>
              </q-avatar>
              <q-btn
                round
                color="primary"
                icon="camera_alt"
                size="sm"
                class="absolute-bottom-right"
                style="bottom: 0px; right: 0px; border: 2px solid white; transform: translate(10%, 10%);"
                @click="triggerFileInput"
              />
              <input type="file" accept="image/*" ref="fileInputRef" style="display: none" @change="onFileSelected" />
            </div>
            <div class="text-h6 text-weight-bold q-mb-xs">{{ form.full_name || 'ชื่อผู้ใช้' }}</div>
            <q-badge color="green-1" text-color="green-8" class="q-px-sm q-py-xs status-badge">
              <div class="row items-center text-weight-medium">
                <div class="active-dot q-mr-sm"></div>
                Active Account
              </div>
            </q-badge>
          </div>

          <div class="q-mb-lg">
            <div class="text-weight-bold text-grey-8 q-mb-sm q-px-xs">ข้อมูลทั่วไป</div>
            <q-card flat bordered class="custom-card">
              <q-card-section class="q-pa-none">
                <q-input
                  v-model="form.full_name"
                  borderless
                  label="ชื่อ นามสกุล *"
                  stack-label
                  class="custom-input q-px-md q-py-xs"
                  :rules="[(val) => !!val || 'กรุณาระบุชื่อ']"
                  hide-bottom-space
                />
                <q-separator color="grey-2" />
                <q-input
                  v-model="form.phone_number"
                  borderless
                  label="เบอร์โทรศัพท์ *"
                  stack-label
                  class="custom-input q-px-md q-py-xs"
                  mask="###-###-####"
                  :rules="[
                    (val) => !!val || 'กรุณาระบุเบอร์โทร',
                    (val) => val.length === 12 || 'กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก',
                  ]"
                  hide-bottom-space
                />
                <q-separator color="grey-2" />
                <q-input
                  v-model="form.email"
                  type="email"
                  borderless
                  label="ที่อยู่อีเมล *"
                  stack-label
                  class="custom-input q-px-md q-py-xs"
                  :rules="[(val) => !!val || 'กรุณาระบุอีเมล']"
                  hide-bottom-space
                />
                <q-separator color="grey-2" />
                <q-input
                  v-model="form.line_id"
                  borderless
                  label="Line ID"
                  stack-label
                  class="custom-input q-px-md q-py-xs"
                  hide-bottom-space
                />
              </q-card-section>
            </q-card>
          </div>

          <div class="q-mb-lg">
            <div class="text-weight-bold text-grey-8 q-mb-sm q-px-xs">เปลี่ยนรหัสผ่าน</div>
            <q-card flat bordered class="custom-card">
              <q-card-section class="q-pa-none">
                <q-input
                  v-model="passwordForm.oldPassword"
                  type="password"
                  autocomplete="new-password"
                  borderless
                  label="รหัสผ่านปัจจุบัน"
                  stack-label
                  class="custom-input q-px-md q-py-xs"
                />
                <q-separator color="grey-2" />
                <q-input
                  v-model="passwordForm.newPassword"
                  type="password"
                  autocomplete="new-password"
                  borderless
                  label="รหัสผ่านใหม่"
                  stack-label
                  class="custom-input q-px-md q-py-xs"
                />
                <q-separator color="grey-2" />
                <q-input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  autocomplete="new-password"
                  borderless
                  label="ยืนยันรหัสผ่านใหม่"
                  stack-label
                  class="custom-input q-px-md q-py-xs"
                />
              </q-card-section>
            </q-card>
          </div>

          <div class="q-mb-xl q-pb-xl">
            <q-card flat class="bg-red-1 custom-card q-pa-md" style="border: 1px solid #ffcdd2;">
              <div class="text-red-8 text-weight-bold q-mb-xs" style="font-size: 14px;">Danger Zone</div>
              <div class="text-grey-7 q-mb-md" style="font-size: 11px; line-height: 1.5;">
                การปิดใช้งานบัญชีนี้จะยกเลิกสิทธิ์การเข้าถึงแพลตฟอร์ม HIDS ทั้งหมดสำหรับผู้ใช้รายนี้ทันที
              </div>
              <q-btn
                outline
                color="red"
                class="full-width bg-white q-mb-md"
                no-caps
                style="border-radius: 8px; font-weight: 600;"
                label="ปิดการใช้งานบัญชี"
              />
              <q-separator color="red-2" class="q-my-md" />
              <div class="text-grey-7 q-mb-md" style="font-size: 11px; line-height: 1.5;">
                ออกจากระบบและปิดเซสชั่นปัจจุบัน
              </div>
              <q-btn
                outline
                color="red"
                class="full-width bg-white"
                no-caps
                style="border-radius: 8px; font-weight: 600;"
                label="ออกจากระบบ"
                icon="logout"
                @click="logout"
              />
            </q-card>
          </div>

        </q-form>
      </q-page>
    </q-page-container>

    <q-footer class="bg-white border-top q-pa-md">
      <div class="row q-gutter-x-sm max-width-container">
        <q-btn
          flat
          class="col bg-grey-2 text-dark"
          no-caps
          style="border-radius: 8px; font-weight: 600; height: 44px;"
          label="ยกเลิก"
          @click="goBack"
        />
        <q-btn
          unelevated
          color="primary"
          class="col"
          no-caps
          style="border-radius: 8px; font-weight: 600; height: 44px;"
          label="บันทึกการเปลี่ยนแปลง"
          @click="submitForm"
        />
      </div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar, LocalStorage, QForm } from 'quasar';
import { useAuthStore } from 'src/stores/useAuth';
import { api } from 'src/boot/axios';

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();

const API_BASE_URL = import.meta.env.VITE_API_URL as string || 'http://localhost:3000';
const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};

const profileFormRef = ref<QForm | null>(null);
const submitForm = () => {
  profileFormRef.value?.submit();
};

const form = ref({
  full_name: '',
  phone_number: '',
  email: '',
  line_id: '',
});

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const previewImage = ref<string | null>(null);

const displayImageUrl = computed(() => {
  if (previewImage.value) return previewImage.value;
  if (authStore.currentUser?.imageUrl && !authStore.currentUser.imageUrl.includes('unknown.jpg')) {
    return getImageUrl(authStore.currentUser.imageUrl);
  }
  return null;
});

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    if (file) {
      selectedFile.value = file;
      previewImage.value = URL.createObjectURL(file);
    }
  }
};

const loadUserData = () => {
  const user = authStore.currentUser;
  if (user) {
    form.value.full_name = user.fullName || '';
    form.value.phone_number = user.phoneNumber || '';
    form.value.email = user.email || '';
    form.value.line_id = user.lineId || '';
  }
};

onMounted(() => {
  loadUserData();
});

const goBack = () => {
  router.back();
};

const saveChanges = async () => {
  const user = authStore.currentUser;
  if (!user) return;

  if (!form.value.full_name || !form.value.phone_number || !form.value.email) {
    $q.notify({
      message: 'กรุณากรอกข้อมูลที่บังคับให้ครบถ้วน',
      color: 'warning',
      icon: 'warning',
      position: 'top',
    });
    return;
  }

  const formData = new FormData();
  formData.append('fullName', form.value.full_name);
  formData.append('phoneNumber', form.value.phone_number);
  formData.append('email', form.value.email);
  if (form.value.line_id) formData.append('lineId', form.value.line_id);

  if (passwordForm.value.newPassword) {
    if (!passwordForm.value.oldPassword) {
      $q.notify({ message: 'กรุณากรอกรหัสผ่านปัจจุบัน', color: 'negative', position: 'top' });
      return;
    }
    try {
      // Verify old password using login endpoint
      await api.post('/auth/login', { email: user.email, password: passwordForm.value.oldPassword });
    } catch {
      $q.notify({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง', color: 'negative', position: 'top' });
      return;
    }
    if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
      $q.notify({ message: 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน', color: 'negative', position: 'top' });
      return;
    }
    if (passwordForm.value.newPassword.length < 6) {
      $q.notify({ message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร', color: 'warning', position: 'top' });
      return;
    }
    formData.append('password', passwordForm.value.newPassword);
  }

  if (selectedFile.value) {
    formData.append('imageUrl', selectedFile.value);
  }

  try {
    $q.loading.show({ message: 'กำลังบันทึกข้อมูล...' });
    const res = await api.patch(`/users/${user.id}`, formData);
    
    // Update local state
    if (res.data) {
      authStore.user = res.data;
      LocalStorage.set('user', res.data);
    }

    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
    selectedFile.value = null;

    $q.notify({
      message: 'บันทึกข้อมูลเรียบร้อยแล้ว',
      color: 'positive',
      icon: 'check_circle',
      position: 'top'
    });
  } catch (error) {
    console.error('Failed to update profile:', error);
    $q.notify({ message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', color: 'negative', position: 'top' });
  } finally {
    $q.loading.hide();
  }
};

const logout = () => {
  $q.dialog({
    title: 'ยืนยันการออกจากระบบ',
    message: 'คุณแน่ใจหรือว่าต้องการออกจากระบบ?',
    cancel: true,
    persistent: true
  }).onOk(() => {
    // Clear user data and redirect to login
    localStorage.clear();
    sessionStorage.clear();
    void router.push('/login');
    $q.notify({
      message: 'ออกจากระบบเรียบร้อยแล้ว',
      color: 'info',
      position: 'top'
    });
  });
};
</script>

<style scoped>
.admin-profile-page {
  max-width: 600px;
  margin: 0 auto;
}

.max-width-container {
  max-width: 600px;
  margin: 0 auto;
}

.custom-card {
  border-radius: 16px;
  border-color: #f0f0f0;
}

.custom-input :deep(.q-field__control) {
  min-height: 60px;
}

.custom-input :deep(.q-field__label) {
  color: #757575;
  font-size: 13px;
  font-weight: 500;
  top: 10px;
}

.custom-input :deep(.q-field__native) {
  color: #212121;
  font-weight: 500;
  font-size: 15px;
  padding-top: 20px;
}

.status-badge {
  border-radius: 20px;
  font-size: 12px;
}

.active-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #4caf50;
}

.border-top {
  border-top: 1px solid #f0f0f0;
}

@media (min-width: 600px) {
  .admin-profile-page, .max-width-container {
    max-width: 800px;
  }
}
</style>
