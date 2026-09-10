<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    persistent
  >
    <q-card style="min-width: 350px; border-radius: 16px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 text-weight-bold">
          {{ isEditing ? t('components.adminUserFormDialog.editTitle') : t('components.adminUserFormDialog.addTitle') }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <q-form @submit="onSave" class="q-gutter-md">
          <!-- Profile Image (Mock Upload) -->
          <div class="row items-center q-mb-md">
            <q-avatar size="64px" class="q-mr-md" :class="displayImageUrl ? 'bg-grey-3' : 'bg-primary text-white'">
              <img v-if="displayImageUrl" :src="displayImageUrl" />
              <span v-else class="text-h4">{{ localForm.fullName?.charAt(0).toUpperCase() || 'A' }}</span>
            </q-avatar>
            <div class="col">
              <div class="text-subtitle2 text-grey-8 q-mb-xs">
                {{ t('components.adminUserFormDialog.profileImage') }} <span class="text-grey-5">({{ t('components.adminUserFormDialog.optional') }})</span>
              </div>
              <q-file
                v-model="pickedProfileImageFile"
                outlined
                dense
                filled
                clearable
                accept="image/*"
                :label="t('components.adminUserFormDialog.chooseFile')"
                hide-bottom-space
                @update:model-value="onImageFileChange"
              >
                <template v-slot:prepend>
                  <q-icon name="photo_camera" />
                </template>
              </q-file>
            </div>
          </div>

          <!-- Full Name -->
          <div>
            <div class="text-subtitle2 text-grey-8 q-mb-xs">
              {{ t('components.adminUserFormDialog.fullName') }} <span class="text-negative">*</span>
            </div>
            <q-input
              v-model="localForm.fullName"
              outlined
              dense
              filled
              :rules="[(val) => !!val || t('components.adminUserFormDialog.fullNameRequired')]"
              hide-bottom-space
            />
          </div>

          <!-- Phone -->
          <div>
            <div class="text-subtitle2 text-grey-8 q-mb-xs">
              {{ t('components.adminUserFormDialog.phone') }} <span class="text-negative">*</span>
            </div>
            <q-input
              v-model="localForm.phoneNumber"
              outlined
              dense
              filled
              mask="###-###-####"
              :rules="[
                (val) => !!val || t('components.adminUserFormDialog.phoneRequired'),
                (val) => val.length === 12 || t('components.adminUserFormDialog.phoneInvalid'),
              ]"
              hide-bottom-space
            />
          </div>

          <!-- Email -->
          <div>
            <div class="text-subtitle2 text-grey-8 q-mb-xs">
              {{ t('components.adminUserFormDialog.email') }} <span class="text-negative">*</span>
            </div>
            <q-input
              v-model="localForm.email"
              type="email"
              outlined
              dense
              filled
              :rules="[(val) => !!val || t('components.adminUserFormDialog.emailRequired')]"
              hide-bottom-space
            />
          </div>

          <!-- Password -->
          <div v-if="!isEditing">
            <div class="text-subtitle2 text-grey-8 q-mb-xs">
              {{ t('components.adminUserFormDialog.password') }} <span class="text-negative">*</span>
            </div>
            <q-input
              v-model="localForm.password"
              type="password"
              outlined
              dense
              filled
              :rules="[(val) => !!val || t('components.adminUserFormDialog.passwordRequired')]"
              hide-bottom-space
            />
          </div>

          <!-- Line ID -->
          <div>
            <div class="text-subtitle2 text-grey-8 q-mb-xs">{{ t('components.adminUserFormDialog.lineId') }}</div>
            <q-input v-model="localForm.lineId" outlined dense filled hide-bottom-space />
          </div>

          <!-- Role -->
          <div>
            <div class="text-subtitle2 text-grey-8 q-mb-xs">
              {{ t('components.adminUserFormDialog.role') }} <span class="text-negative">*</span>
            </div>
            <q-select
              v-model="localForm.role"
              :options="roleOptions"
              outlined
              dense
              filled
              emit-value
              map-options
              hide-bottom-space
              :rules="[(val) => !!val || t('components.adminUserFormDialog.roleRequired')]"
            />
          </div>

          <!-- Team (Hidden if Admin) -->
          <div v-if="localForm.role !== 'admin'">
            <div class="text-subtitle2 text-grey-8 q-mb-xs">
              {{ t('components.adminUserFormDialog.team') }} <span class="text-negative">*</span>
            </div>
            <q-select
              v-model="localForm.teamId"
              :options="teamOptions"
              outlined
              dense
              filled
              emit-value
              map-options
              hide-bottom-space
              :rules="[(val) => !!val || t('components.adminUserFormDialog.teamRequired')]"
            />
          </div>
        </q-form>
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn
          :label="t('components.adminUserFormDialog.cancel')"
          color="grey-6"
          flat
          v-close-popup
          style="border-radius: 8px"
          class="q-px-md"
        />
        <q-btn
          :label="t('components.adminUserFormDialog.save')"
          color="primary"
          unelevated
          @click="onSave"
          style="border-radius: 8px"
          class="q-px-md"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Crop Dialog: shown right after picking a profile picture -->
  <q-dialog v-model="showCropDialog" persistent>
    <q-card style="width: 480px; max-width: 90vw; border-radius: 16px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 text-weight-bold">{{ t('components.adminUserFormDialog.cropTitle') }}</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="cancelCrop" />
      </q-card-section>
      <q-card-section class="q-pt-md">
        <div class="text-caption text-grey-7 q-mb-sm">{{ t('components.adminUserFormDialog.cropHint') }}</div>
        <cropper
          v-if="cropSourceUrl"
          ref="cropperRef"
          class="profile-cropper"
          :src="cropSourceUrl"
          :stencil-props="{ aspectRatio: 1 }"
        />
        <div class="row justify-end q-mt-md q-gutter-sm">
          <q-btn
            :label="t('components.adminUserFormDialog.cropCancel')"
            color="grey-6"
            flat
            @click="cancelCrop"
            style="border-radius: 8px"
          />
          <q-btn
            :label="t('components.adminUserFormDialog.cropConfirm')"
            color="primary"
            unelevated
            @click="confirmCrop"
            style="border-radius: 8px"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import type { User } from 'src/models';

const { t } = useI18n();

const getImageUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  return `${import.meta.env.VITE_API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

interface Option {
  label: string;
  value: string | number;
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  initialData: {
    type: Object as () => Partial<User>,
    default: () => ({}),
  },
  isEditing: {
    type: Boolean,
    default: false,
  },
  roleOptions: {
    type: Array as () => Option[],
    default: () => [],
  },
  teamOptions: {
    type: Array as () => Option[],
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue', 'save']);

const localForm = ref<Partial<User>>({});
const profileImageFile = ref<File | null>(null);

// ไฟล์ที่เพิ่งเลือกจากเครื่อง รอเข้ากระบวนการตัดกรอบ ก่อนกลายเป็น profileImageFile จริง
const pickedProfileImageFile = ref<File | null>(null);
const showCropDialog = ref(false);
const cropSourceUrl = ref('');
const cropperRef = ref<InstanceType<typeof Cropper> | null>(null);

const displayImageUrl = computed(() => {
  if (localForm.value.imageUrl && localForm.value.imageUrl.startsWith('blob:')) {
    return localForm.value.imageUrl;
  }
  if (localForm.value.imageUrl && !localForm.value.imageUrl.includes('unknown.jpg')) {
    return getImageUrl(localForm.value.imageUrl);
  }
  return null;
});

// Reset form when dialog opens
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      localForm.value = { ...props.initialData };
      profileImageFile.value = null;
      pickedProfileImageFile.value = null;
      if (props.isEditing) {
        localForm.value.password = ''; // empty password on edit by default
      }
    }
  },
);

// clear team_id if role changes to admin
watch(
  () => localForm.value.role,
  (newRole) => {
    if (newRole === 'admin') {
      localForm.value.teamId = undefined;
    }
  },
);

const onImageFileChange = (file: File | null) => {
  if (file) {
    cropSourceUrl.value = URL.createObjectURL(file);
    showCropDialog.value = true;
  } else {
    if (localForm.value.imageUrl && localForm.value.imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(localForm.value.imageUrl);
    }
    localForm.value.imageUrl = '';
    profileImageFile.value = null;
  }
};

const cancelCrop = () => {
  if (cropSourceUrl.value) {
    URL.revokeObjectURL(cropSourceUrl.value);
  }
  cropSourceUrl.value = '';
  pickedProfileImageFile.value = null;
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
    if (localForm.value.imageUrl && localForm.value.imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(localForm.value.imageUrl);
    }
    const croppedFile = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
    profileImageFile.value = croppedFile;
    localForm.value.imageUrl = URL.createObjectURL(croppedFile);

    URL.revokeObjectURL(cropSourceUrl.value);
    cropSourceUrl.value = '';
    pickedProfileImageFile.value = null;
    showCropDialog.value = false;
  }, 'image/jpeg', 0.92);
};

const onSave = () => {
  emit('save', {
    form: localForm.value,
    file: profileImageFile.value,
  });
};
</script>

<style scoped>
.profile-cropper {
  height: 320px;
  background: #ddd;
}
</style>
