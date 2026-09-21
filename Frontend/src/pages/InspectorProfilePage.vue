<template>
  <q-layout view="lHh Lpr lFf" class="bg-grey-1">
    <q-header class="bg-white text-dark" >
      <q-toolbar class="q-px-sm">
        <q-icon
          name="arrow_back_ios_new"
          color="primary"
          size="24px"
          class="cursor-pointer"
          @click="goBack"
        />
        <q-space />
        <q-toolbar-title class="text-center text-weight-bold absolute-center page-title">
          {{ t('inspector.profile.title') }}
        </q-toolbar-title>
        <q-space />
        <q-btn
          flat
          dense
          no-caps
          :label="t('inspector.profile.save')"
          color="primary"
          class="text-weight-bold"
          @click="submitForm"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="inspector-profile-page q-pb-xl">
        <q-form ref="profileFormRef" @submit="saveChanges" class="q-pa-md">
          <div class="column items-center q-mb-xl">
            <div class="relative-position q-mb-md">
              <q-avatar size="90px" :color="!displayImageUrl ? 'primary' : ''" :text-color="!displayImageUrl ? 'white' : ''" class="text-h3">
                <img v-if="displayImageUrl" :src="displayImageUrl" />
                <span v-else>{{ form.full_name?.charAt(0).toUpperCase() || 'I' }}</span>
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
            <div class="text-h6 text-weight-bold q-mb-xs">{{ form.full_name || t('inspector.profile.defaultUserName') }}</div>
            <q-badge color="green-1" text-color="green-8" class="q-px-sm q-py-xs status-badge">
              <div class="row items-center text-weight-medium">
                <div class="active-dot q-mr-sm"></div>
                Active Account
              </div>
            </q-badge>
          </div>

          <div class="q-mb-lg">
            <div class="text-weight-bold text-grey-8 q-mb-sm q-px-xs">{{ t('inspector.profile.generalInfo') }}</div>
            <q-card flat bordered class="custom-card">
              <q-card-section class="q-pa-none">
                <q-input
                  v-model="form.full_name"
                  borderless
                  :label="t('inspector.profile.fullNameLabel')"
                  stack-label
                  class="custom-input q-px-md q-py-xs"
                  :rules="[(val) => !!val || t('inspector.profile.ruleRequireName')]"
                  hide-bottom-space
                />
                <q-separator color="grey-2" />
                <q-input
                  v-model="form.phone_number"
                  borderless
                  :label="t('inspector.profile.phoneLabel')"
                  stack-label
                  class="custom-input q-px-md q-py-xs"
                  mask="###-###-####"
                  :rules="[
                    (val) => !!val || t('inspector.profile.ruleRequirePhone'),
                    (val) => val.length === 12 || t('inspector.profile.ruleInvalidPhone'),
                  ]"
                  hide-bottom-space
                />
                <q-separator color="grey-2" />
                <q-input
                  v-model="form.email"
                  type="email"
                  borderless
                  :label="t('inspector.profile.emailLabel')"
                  stack-label
                  class="custom-input q-px-md q-py-xs"
                  :rules="[(val) => !!val || t('inspector.profile.ruleRequireEmail')]"
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
            <div class="text-weight-bold text-grey-8 q-mb-sm q-px-xs">{{ t('inspector.profile.changePassword') }}</div>
            <q-card flat bordered class="custom-card">
              <q-card-section class="q-pa-none">
                <q-input
                  v-model="passwordForm.oldPassword"
                  type="password"
                  autocomplete="new-password"
                  borderless
                  :label="t('inspector.profile.currentPassword')"
                  stack-label
                  class="custom-input q-px-md q-py-xs"
                />
                <q-separator color="grey-2" />
                <q-input
                  v-model="passwordForm.newPassword"
                  type="password"
                  autocomplete="new-password"
                  borderless
                  :label="t('inspector.profile.newPassword')"
                  stack-label
                  class="custom-input q-px-md q-py-xs"
                />
                <q-separator color="grey-2" />
                <q-input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  autocomplete="new-password"
                  borderless
                  :label="t('inspector.profile.confirmNewPassword')"
                  stack-label
                  class="custom-input q-px-md q-py-xs"
                />
              </q-card-section>
            </q-card>
          </div>

          <div class="q-mb-xl q-pb-xl">
            <q-card flat class="bg-red-1 custom-card q-pa-md" style="border: 1px solid #ffcdd2;">
              <div class="text-grey-7 q-mb-md" style="font-size: 11px; line-height: 1.5;">
                {{ t('inspector.profile.logoutDescription') }}
              </div>
              <q-btn
                outline
                color="red"
                class="full-width bg-white"
                no-caps
                style="border-radius: 8px; font-weight: 600;"
                :label="t('inspector.profile.logout')"
                icon="logout"
                @click="logout"
              />
            </q-card>
          </div>

        </q-form>
      </q-page>
    </q-page-container>

    <!-- Crop Dialog: shown right after picking a profile picture -->
    <q-dialog v-model="showCropDialog" persistent>
      <q-card style="width: 480px; max-width: 90vw; border-radius: 16px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-weight-bold">{{ t('inspector.profile.cropTitle') }}</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="cancelCrop" />
        </q-card-section>
        <q-card-section class="q-pt-md">
          <div class="text-caption text-grey-7 q-mb-sm">{{ t('inspector.profile.cropHint') }}</div>
          <cropper
            v-if="cropSourceUrl"
            ref="cropperRef"
            class="profile-cropper"
            :src="cropSourceUrl"
            :stencil-props="{ aspectRatio: 1 }"
          />
          <div class="row justify-end q-mt-md q-gutter-sm">
            <q-btn
              :label="t('inspector.profile.cropCancel')"
              color="grey-6"
              flat
              @click="cancelCrop"
              style="border-radius: 8px"
            />
            <q-btn
              :label="t('inspector.profile.cropConfirm')"
              color="primary"
              unelevated
              @click="confirmCrop"
              style="border-radius: 8px"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar, LocalStorage, QForm } from 'quasar';
import { useAuthStore } from 'src/stores/useAuth';
import { api } from 'src/boot/axios';
import ConfirmActionDialog from 'src/components/ConfirmActionDialog.vue';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();
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

// รูปที่เพิ่งเลือกจากเครื่อง รอเข้ากระบวนการตัดกรอบ ก่อนกลายเป็น selectedFile จริง
const showCropDialog = ref(false);
const cropSourceUrl = ref('');
const cropperRef = ref<InstanceType<typeof Cropper> | null>(null);

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
      cropSourceUrl.value = URL.createObjectURL(file);
      showCropDialog.value = true;
    }
  }
  target.value = '';
};

const cancelCrop = () => {
  if (cropSourceUrl.value) {
    URL.revokeObjectURL(cropSourceUrl.value);
  }
  cropSourceUrl.value = '';
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
    if (previewImage.value) {
      URL.revokeObjectURL(previewImage.value);
    }
    const croppedFile = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
    selectedFile.value = croppedFile;
    previewImage.value = URL.createObjectURL(croppedFile);

    URL.revokeObjectURL(cropSourceUrl.value);
    cropSourceUrl.value = '';
    showCropDialog.value = false;
  }, 'image/jpeg', 0.92);
};

const loadUserData = async () => {
  const user = authStore.currentUser;
  if (user && user.id) {
    try {
      const res = await api.get(`/users/${user.id}`);
      if (res.data) {
        form.value.full_name = res.data.fullName || '';
        form.value.phone_number = res.data.phoneNumber || '';
        form.value.email = res.data.email || '';
        form.value.line_id = res.data.lineId || '';

        const updatedUser = { ...user, ...res.data };
        authStore.user = updatedUser;
        LocalStorage.set('user', updatedUser);
        return;
      }
    } catch (error) {
      console.error('Failed to fetch latest user data:', error);
    }

    form.value.full_name = user.fullName || '';
    form.value.phone_number = user.phoneNumber || '';
    form.value.email = user.email || '';
    form.value.line_id = user.lineId || '';
  }
};

onMounted(() => {
  void loadUserData();
});

const goBack = () => {
  router.back();
};

const saveChanges = async () => {
  const user = authStore.currentUser;
  if (!user) return;

  if (!form.value.full_name || !form.value.phone_number || !form.value.email) {
    $q.notify({
      message: t('inspector.profile.notifyFillRequired'),
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
      $q.notify({ message: t('inspector.profile.notifyNeedCurrentPassword'), color: 'negative', position: 'top' });
      return;
    }
    try {
      await api.post('/auth/login', { email: user.email, password: passwordForm.value.oldPassword });
    } catch {
      $q.notify({ message: t('inspector.profile.notifyWrongCurrentPassword'), color: 'negative', position: 'top' });
      return;
    }
    if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
      $q.notify({ message: t('inspector.profile.notifyPasswordMismatch'), color: 'negative', position: 'top' });
      return;
    }
    if (passwordForm.value.newPassword.length < 6) {
      $q.notify({ message: t('inspector.profile.notifyPasswordTooShort'), color: 'warning', position: 'top' });
      return;
    }
    formData.append('password', passwordForm.value.newPassword);
  }

  if (selectedFile.value) {
    formData.append('imageUrl', selectedFile.value);
  }

  try {
    $q.loading.show({ message: t('inspector.profile.loadingSave') });
    const res = await api.patch(`/users/${user.id}`, formData);

    if (res.data) {
      authStore.user = res.data;
      LocalStorage.set('user', res.data);
    }

    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
    selectedFile.value = null;

    $q.notify({
      message: t('inspector.profile.notifySaveSuccess'),
      color: 'positive',
      icon: 'check_circle',
      position: 'top'
    });
  } catch (error) {
    console.error('Failed to update profile:', error);
    $q.notify({ message: t('inspector.profile.notifySaveError'), color: 'negative', position: 'top' });
  } finally {
    $q.loading.hide();
  }
};

const logout = () => {
  $q.dialog({
    component: ConfirmActionDialog,
    componentProps: {
      title: t('inspector.profile.logoutConfirmTitle'),
      message: t('inspector.profile.logoutConfirmMessage'),
      icon: 'logout',
      color: 'negative',
    },
  }).onOk(() => {
    // Clear auth state (store + storage) before redirecting, otherwise the
    // router guard still sees a token and bounces back to the role home.
    authStore.logout();
    localStorage.clear();
    sessionStorage.clear();
    void router.replace('/login');
    $q.notify({
      message: t('inspector.profile.notifyLogoutSuccess'),
      color: 'info',
      position: 'top'
    });
  });
};
</script>

<style scoped>
.inspector-profile-page {
  max-width: 600px;
  margin: 0 auto;
}

.page-title {
  font-size: 21px;
  letter-spacing: 0.01em;
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

.profile-cropper {
  height: 320px;
  background: #ddd;
}

@media (min-width: 600px) {
  .inspector-profile-page {
    max-width: 800px;
  }
}
</style>
