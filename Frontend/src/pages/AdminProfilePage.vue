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
          @click="saveChanges"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="admin-profile-page q-pb-xl">
        <div class="q-pa-md">
          <div class="column items-center q-mb-xl">
            <div class="relative-position q-mb-md">
              <q-avatar size="90px">
                <img src="https://cdn.quasar.dev/img/avatar4.jpg" />
              </q-avatar>
              <q-btn
                round
                color="primary"
                icon="camera_alt"
                size="sm"
                class="absolute-bottom-right"
                style="bottom: 0px; right: 0px; border: 2px solid white; transform: translate(10%, 10%);"
              />
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
                  label="ชื่อ นามสกุล"
                  stack-label
                  class="custom-input q-px-md q-py-xs"
                />
                <q-separator color="grey-2" />
                <q-input
                  v-model="form.phone_number"
                  borderless
                  label="เบอร์โทรศัพท์"
                  stack-label
                  class="custom-input q-px-md q-py-xs"
                />
                <q-separator color="grey-2" />
                <q-input
                  v-model="form.email"
                  borderless
                  label="ที่อยู่อีเมล"
                  stack-label
                  class="custom-input q-px-md q-py-xs"
                />
                <q-separator color="grey-2" />
                <q-input
                  v-model="form.line_id"
                  borderless
                  label="Line ID"
                  stack-label
                  class="custom-input q-px-md q-py-xs"
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
                  borderless
                  label="รหัสผ่านปัจจุบัน"
                  stack-label
                  class="custom-input q-px-md q-py-xs"
                />
                <q-separator color="grey-2" />
                <q-input
                  v-model="passwordForm.newPassword"
                  type="password"
                  borderless
                  label="รหัสผ่านใหม่"
                  stack-label
                  class="custom-input q-px-md q-py-xs"
                />
                <q-separator color="grey-2" />
                <q-input
                  v-model="passwordForm.confirmPassword"
                  type="password"
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

        </div>
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
          @click="saveChanges"
        />
      </div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

const router = useRouter();
const $q = useQuasar();

// Mock ข้อมูลผู้ใช้ รวมถึงรหัสผ่าน (รหัสจำลองคือ '123456')
const form = ref({
  full_name: 'Alex Thompson',
  phone_number: '081-234-5678',
  email: 'a.thompson@hids-admin.com',
  line_id: '@alex_thompson',
  password: 'password123'
});

// ฟอร์มสำหรับเปลี่ยนรหัสผ่าน
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const goBack = () => {
  router.back();
};

const saveChanges = () => {
  // 1. ตรวจสอบเงื่อนไขถ้ายูสเซอร์มีการกรอกช่องเปลี่ยนรหัสผ่าน
  if (passwordForm.value.oldPassword || passwordForm.value.newPassword) {
    if (passwordForm.value.oldPassword !== form.value.password) {
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

    // ถ้ารหัสผ่านผ่านเงื่อนไข ให้อัปเดตรหัสในตัวแปร form
    form.value.password = passwordForm.value.newPassword;

    // เคลียร์ช่องรหัสผ่านให้ว่างหลังจากกดเซฟ
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
  }

  // 2. ส่งข้อมูลบันทึกตามปกติ
  console.log('Data to save:', form.value);

  $q.notify({
    message: 'บันทึกข้อมูลเรียบร้อยแล้ว',
    color: 'positive',
    icon: 'check_circle',
    position: 'top'
  });
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
