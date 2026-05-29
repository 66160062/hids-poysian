<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    persistent
  >
    <q-card style="min-width: 350px; border-radius: 16px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 text-weight-bold">
          {{ isEditing ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่' }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <q-form @submit="onSave" class="q-gutter-md">
          <!-- Profile Image (Mock Upload) -->
          <div class="row items-center q-mb-md">
            <q-avatar size="64px" class="q-mr-md bg-grey-3">
              <img :src="localForm.imageUrl && localForm.imageUrl.startsWith('blob:') ? localForm.imageUrl : getImageUrl(localForm.imageUrl) || '/project-images/unknown.jpg'" />
            </q-avatar>
            <div class="col">
              <div class="text-subtitle2 text-grey-8 q-mb-xs">
                รูปโปรไฟล์ <span class="text-grey-5">(ตัวเลือก)</span>
              </div>
              <q-file
                v-model="profileImageFile"
                outlined
                dense
                filled
                clearable
                accept="image/*"
                label="เลือกไฟล์..."
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
              ชื่อ-นามสกุล <span class="text-negative">*</span>
            </div>
            <q-input
              v-model="localForm.fullName"
              outlined
              dense
              filled
              :rules="[(val) => !!val || 'กรุณาระบุชื่อ']"
              hide-bottom-space
            />
          </div>

          <!-- Phone -->
          <div>
            <div class="text-subtitle2 text-grey-8 q-mb-xs">
              เบอร์โทรศัพท์ <span class="text-negative">*</span>
            </div>
            <q-input
              v-model="localForm.phoneNumber"
              outlined
              dense
              filled
              mask="###-###-####"
              :rules="[
                (val) => !!val || 'กรุณาระบุเบอร์โทร',
                (val) => val.length === 12 || 'กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก',
              ]"
              hide-bottom-space
            />
          </div>

          <!-- Email -->
          <div>
            <div class="text-subtitle2 text-grey-8 q-mb-xs">
              อีเมล <span class="text-negative">*</span>
            </div>
            <q-input
              v-model="localForm.email"
              type="email"
              outlined
              dense
              filled
              :rules="[(val) => !!val || 'กรุณาระบุอีเมล']"
              hide-bottom-space
            />
          </div>

          <!-- Password -->
          <div v-if="!isEditing">
            <div class="text-subtitle2 text-grey-8 q-mb-xs">
              รหัสผ่าน <span class="text-negative">*</span>
            </div>
            <q-input
              v-model="localForm.password"
              type="password"
              outlined
              dense
              filled
              :rules="[(val) => !!val || 'กรุณาระบุรหัสผ่าน']"
              hide-bottom-space
            />
          </div>

          <!-- Line ID -->
          <div>
            <div class="text-subtitle2 text-grey-8 q-mb-xs">ไอดีไลน์</div>
            <q-input v-model="localForm.lineId" outlined dense filled hide-bottom-space />
          </div>

          <!-- Role -->
          <div>
            <div class="text-subtitle2 text-grey-8 q-mb-xs">
              ตำแหน่ง <span class="text-negative">*</span>
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
              :rules="[(val) => !!val || 'กรุณาเลือกตำแหน่ง']"
            />
          </div>

          <!-- Team (Hidden if Admin) -->
          <div v-if="localForm.role !== 'admin'">
            <div class="text-subtitle2 text-grey-8 q-mb-xs">
              ทีม <span class="text-negative">*</span>
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
              :rules="[(val) => !!val || 'กรุณาเลือกทีม']"
            />
          </div>
        </q-form>
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn
          label="ยกเลิก"
          color="grey-6"
          flat
          v-close-popup
          style="border-radius: 8px"
          class="q-px-md"
        />
        <q-btn
          label="บันทึก"
          color="primary"
          unelevated
          @click="onSave"
          style="border-radius: 8px"
          class="q-px-md"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { User } from 'src/models';

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

// Reset form when dialog opens
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      localForm.value = { ...props.initialData };
      profileImageFile.value = null;
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
    if (localForm.value.imageUrl && localForm.value.imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(localForm.value.imageUrl);
    }
    localForm.value.imageUrl = URL.createObjectURL(file);
  } else {
    localForm.value.imageUrl = '';
  }
};

const onSave = () => {
  emit('save', {
    form: localForm.value,
    file: profileImageFile.value,
  });
};
</script>
