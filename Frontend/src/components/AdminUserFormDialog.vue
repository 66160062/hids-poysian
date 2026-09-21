<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    persistent
  >
    <q-card class="dialog-card">
      <q-card-section class="dialog-header row items-center no-wrap">
        <div class="dialog-header-icon">
          <q-icon :name="isEditing ? 'edit' : 'person_add'" size="24px" />
        </div>
        <div class="col q-ml-md">
          <div class="dialog-title text-weight-bold text-dark">
            {{ isEditing ? t('components.adminUserFormDialog.editTitle') : t('components.adminUserFormDialog.addTitle') }}
          </div>
        </div>
        <q-btn icon="close" flat round dense class="dialog-close-btn" v-close-popup />
      </q-card-section>
      <q-separator />

      <q-card-section class="dialog-body">
        <q-form @submit="onSave" class="q-gutter-md">
          <!-- Profile Image (Mock Upload) -->
          <div class="upload-zone row items-center">
            <q-avatar size="64px" class="q-mr-md" :class="displayImageUrl ? 'bg-grey-3' : 'bg-primary text-white'">
              <img v-if="displayImageUrl" :src="displayImageUrl" />
              <span v-else class="text-h4">{{ localForm.fullName?.charAt(0).toUpperCase() || 'A' }}</span>
            </q-avatar>
            <div class="col">
              <div class="dialog-field-label">
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
            <div class="dialog-field-label">
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
            <div class="dialog-field-label">
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
            <div class="dialog-field-label">
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
            <div class="dialog-field-label">
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
            <div class="dialog-field-label">{{ t('components.adminUserFormDialog.lineId') }}</div>
            <q-input v-model="localForm.lineId" outlined dense filled hide-bottom-space />
          </div>

          <!-- Role -->
          <div>
            <div class="dialog-field-label">
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

          <!-- Branch Selection -->
          <div v-if="localForm.role !== 'admin'">
            <div class="dialog-field-label">
              {{ t('adminManage.teamManagement.branchLabel') || 'บริษัท / สาขา' }} <span class="text-negative">*</span>
            </div>
            <q-select
              v-model="localForm.branchId"
              :options="branchOptions"
              outlined
              dense
              filled
              emit-value
              map-options
              :rules="[(val) => !!val || t('adminManage.userManagement.branchRequired') || 'กรุณาเลือกสาขา']"
              hide-bottom-space
            />
            <div
              v-if="isEditing && !!currentTeamName"
              class="text-caption text-grey-6 q-mt-xs row items-center no-wrap"
            >
              <q-icon name="info" size="14px" class="q-mr-xs" />
              {{ t('components.adminUserFormDialog.branchChangeClearsTeam') }}
            </div>
          </div>

          <!-- Team Selection (Editing only) -->
          <div v-if="localForm.role !== 'admin' && isEditing">
            <div class="dialog-field-label">
              {{ t('components.adminUserFormDialog.team') || 'ทีม' }}
              <span class="text-grey-5">({{ t('components.adminUserFormDialog.optional') }})</span>
            </div>
            <q-select
              v-model="localForm.teamId"
              :options="availableTeamOptions"
              outlined
              dense
              filled
              emit-value
              map-options
              :disable="!localForm.branchId"
              hide-bottom-space
            >
              <template v-slot:prepend>
                <q-icon name="groups" />
              </template>
            </q-select>
            <div
              v-if="!localForm.branchId"
              class="text-caption text-grey-6 q-mt-xs row items-center no-wrap"
            >
              <q-icon name="info" size="14px" class="q-mr-xs" />
              {{ t('components.adminUserFormDialog.teamSelectBranchFirst') }}
            </div>
            <div
              v-else-if="teamChangeHint"
              class="text-caption text-primary q-mt-xs row items-center no-wrap"
            >
              <q-icon name="swap_horiz" size="14px" class="q-mr-xs" />
              {{ teamChangeHint }}
            </div>
            <div
              v-else-if="availableTeamOptions.length <= 1"
              class="text-caption text-grey-6 q-mt-xs row items-center no-wrap"
            >
              <q-icon name="info" size="14px" class="q-mr-xs" />
              {{ t('components.adminUserFormDialog.teamNoOptions') }}
            </div>
          </div>
        </q-form>
      </q-card-section>

      <q-separator />
      <q-card-actions class="dialog-footer q-gutter-sm">
        <q-btn
          :label="t('components.adminUserFormDialog.cancel')"
          color="grey-8"
          flat
          no-caps
          v-close-popup
          class="col dialog-btn dialog-btn--cancel"
        />
        <q-btn
          :label="t('components.adminUserFormDialog.save')"
          color="primary"
          unelevated
          no-caps
          @click="onSave"
          class="col dialog-btn"
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
import { ref, watch, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import type { User } from 'src/models';

const { t } = useI18n();

// backend ตีความ teamId = 0 ว่า "ไม่สังกัดทีม" (multipart ส่ง null ตรงๆ ไม่ได้)
const NO_TEAM_ID = 0;

const getImageUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  return `${import.meta.env.VITE_API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

interface Option {
  label: string;
  value: string | number | null;
  branchId?: number | null | undefined;
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
  branchOptions: {
    type: Array as () => Option[],
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue', 'save']);

const localForm = ref<Partial<User>>({});
const profileImageFile = ref<File | null>(null);
// กันไม่ให้ watcher ของสาขาไปล้างทีมตอนเปิด dialog (ค่ายังไหลเข้าฟอร์มอยู่)
const isHydrating = ref(false);

const currentTeamName = computed(() => props.initialData.team?.team_name || '');
const initialTeamId = computed(
  () => props.initialData.teamId ?? props.initialData.team?.team_Id ?? NO_TEAM_ID,
);

// ทีมผูกกับสาขา จึงให้เลือกได้เฉพาะทีมในสาขาที่เลือกอยู่ (ทีมที่ยังไม่สังกัดสาขาเลือกได้เสมอ)
const availableTeamOptions = computed<Option[]>(() => {
  const branchId = localForm.value.branchId ?? null;
  const teams = props.teamOptions.filter(
    (opt) =>
      opt.value !== NO_TEAM_ID &&
      (opt.branchId == null || branchId == null || opt.branchId === branchId),
  );
  // ทีมปัจจุบันของผู้ใช้ต้องอยู่ในลิสต์เสมอ กันกรณีข้อมูลสาขาไม่ตรงกัน
  const currentId = localForm.value.teamId;
  if (currentId && !teams.some((opt) => opt.value === currentId)) {
    const current = props.teamOptions.find((opt) => opt.value === currentId);
    if (current) teams.unshift(current);
  }
  return [{ label: t('components.adminUserFormDialog.noTeam'), value: NO_TEAM_ID }, ...teams];
});

const teamChangeHint = computed(() => {
  if (!props.isEditing) return '';
  const selectedId = localForm.value.teamId ?? NO_TEAM_ID;
  if (selectedId === initialTeamId.value) return '';
  if (selectedId === NO_TEAM_ID) {
    return t('components.adminUserFormDialog.teamRemoveHint', { team: currentTeamName.value });
  }
  const target = props.teamOptions.find((opt) => opt.value === selectedId);
  return t('components.adminUserFormDialog.teamMoveHint', { team: target?.label || '' });
});

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
      isHydrating.value = true;
      if (props.isEditing) {
        const initialBranchId = props.initialData.branchId ?? props.initialData.team?.branchId ?? null;
        localForm.value = {
          ...props.initialData,
          branchId: initialBranchId,
          teamId: initialTeamId.value,
          password: '',
        };
      } else {
        localForm.value = {
          fullName: '',
          phoneNumber: '',
          email: '',
          password: '',
          lineId: '',
          role: 'inspector',
          branchId: null,
          imageUrl: '',
        };
      }
      profileImageFile.value = null;
      pickedProfileImageFile.value = null;
      void nextTick(() => {
        isHydrating.value = false;
      });
    }
  },
);

// clear team_id if role changes to admin
watch(
  () => localForm.value.role,
  (newRole) => {
    if (newRole === 'admin') {
      localForm.value.teamId = NO_TEAM_ID;
    }
  },
);

// ย้ายสาขาแล้วทีมเดิมของสาขาก่อนหน้าใช้ไม่ได้ ต้องถอดออกให้เลือกทีมใหม่
watch(
  () => localForm.value.branchId,
  (newBranchId, oldBranchId) => {
    if (isHydrating.value || newBranchId === oldBranchId) return;
    const selectedId = localForm.value.teamId;
    if (!selectedId) return;
    const selected = props.teamOptions.find((opt) => opt.value === selectedId);
    if (selected && selected.branchId != null && selected.branchId !== newBranchId) {
      localForm.value.teamId = NO_TEAM_ID;
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
