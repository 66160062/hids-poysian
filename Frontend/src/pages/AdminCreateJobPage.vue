<template>
  <q-page class="bg-grey-1">
    <!-- Header -->
    <div
      class="header-container bg-white q-px-md q-py-sm row items-center justify-between shadow-1 sticky-top"
    >
      <q-btn flat no-caps label="ยกเลิก" color="primary" @click="goBack" />
      <div class="text-subtitle1 text-weight-bold">สร้างงานใหม่</div>
      <div style="width: 60px"></div>
      <!-- Spacer for centering -->
    </div>

    <div class="form-container q-pa-md q-gutter-y-lg pb-100">
      <!-- ข้อมูลลูกค้า -->
      <div class="section">
        <div class="row items-center q-mb-sm text-primary">
          <q-icon name="person_outline" size="20px" class="q-mr-sm" />
          <div class="text-subtitle2 text-weight-bold">ข้อมูลลูกค้า</div>
        </div>
        <q-card flat bordered class="q-pa-md bg-white card-rounded">
          <div class="column input-group">
            <q-input
              v-model="form.customerName"
              dense
              filled
              placeholder="ชื่อ-นามสกุล"
              class="custom-input"
              :rules="[(val) => !!val || 'กรุณากรอกชื่อลูกค้า']"
            />
            <q-input
              v-model="form.customerPhone"
              dense
              filled
              placeholder="เบอร์โทรศัพท์"
              class="custom-input"
              mask="###-###-####"
              :rules="[(val) => !!val || 'กรุณากรอกเบอร์โทรศัพท์']"
            />
            <q-input
              v-model="form.customerEmail"
              dense
              filled
              placeholder="อีเมล"
              class="custom-input"
            />
          </div>
        </q-card>
      </div>

      <!-- ข้อมูลผู้ประสานงาน -->
      <div class="section">
        <div class="row items-center q-mb-sm text-primary">
          <q-icon name="contacts" size="20px" class="q-mr-sm" />
          <div class="text-subtitle2 text-weight-bold">ข้อมูลผรับเหมา</div>
        </div>
        <q-card flat bordered class="q-pa-md bg-white card-rounded">
          <div class="column input-group">
            <q-input
              v-model="form.coordName"
              dense
              filled
              placeholder="ชื่อ-นามสกุล"
              class="custom-input"
            />
            <q-input
              v-model="form.coordPhone"
              dense
              filled
              placeholder="เบอร์โทรศัพท์"
              class="custom-input"
              mask="###-###-####"
            />
            <q-input
              v-model="form.coordEmail"
              dense
              filled
              placeholder="อีเมล"
              class="custom-input"
            />
            <q-input
              v-model="form.coordidLine"
              dense
              filled
              placeholder="ไอดีไลน์"
              class="custom-input"
            />
          </div>
        </q-card>
      </div>

      <!-- รายละเอียดของโครงการ -->
      <div class="section">
        <div class="row items-center q-mb-sm text-primary">
          <q-icon name="home" size="20px" class="q-mr-sm" />
          <div class="text-subtitle2 text-weight-bold">รายละเอียดของโครงการ</div>
        </div>
        <q-card flat bordered class="q-pa-md bg-white card-rounded">
          <div class="column input-group">
            <q-input
              v-model="form.projectName"
              dense
              filled
              placeholder="ชื่อโครงการ"
              class="custom-input"
              :rules="[(val) => !!val || 'กรุณากรอกชื่อโครงการ']"
            />
            <q-input
              v-model="form.roomNumber"
              dense
              filled
              placeholder="เลขที่ห้อง/บ้านเลขที่"
              class="custom-input"
            />
            <q-input
              v-model="form.floor"
              dense
              filled
              placeholder="ชั้น/ซอย"
              class="custom-input"
            />
            <q-input
              v-model="form.province"
              dense
              filled
              placeholder="จังหวัด"
              class="custom-input"
            />
            <q-input
              v-model="form.district"
              dense
              filled
              placeholder="เขต/อำเภอ"
              class="custom-input"
            />
            <q-input
              v-model="form.subdistrict"
              dense
              filled
              placeholder="แขวง/ตำบล"
              class="custom-input"
            />
            <q-input
              v-model="form.postalCode"
              dense
              filled
              placeholder="รหัสไปรษณีย์"
              class="custom-input"
            />

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  v-model="form.usableArea"
                  dense
                  filled
                  placeholder="ขนาดพื้นที่(ตารางเมตร)"
                  class="custom-input"
                  type="number"
                />
              </div>
              <div class="col-6">
                <q-select
                  v-model="form.houseType"
                  dense
                  filled
                  :options="houseTypeOptions"
                  label="ประเภทบ้าน"
                  class="custom-select"
                  emit-value
                  map-options
                  dropdown-icon="expand_more"
                  hide-bottom-space
                />
              </div>
            </div>

            <!-- เพิ่ม Appointment Date & Assign Inspector ตาม Prompt -->
            <q-input
              v-model="form.appointmentDate"
              filled
              dense
              label="วันที่นัดหมาย"
              class="custom-input"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="form.appointmentDate" mask="YYYY-MM-DD HH:mm">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
                <q-icon name="access_time" class="cursor-pointer q-ml-sm">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time v-model="form.appointmentDate" mask="YYYY-MM-DD HH:mm" format24h>
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-time>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </q-card>
      </div>

      <!-- รูปภาพ -->
      <div class="section">
        <div class="row items-center q-mb-sm text-primary">
          <q-icon name="photo_camera" size="20px" class="q-mr-sm" />
          <div class="text-subtitle2 text-weight-bold">รูปภาพแปลนบ้าน (House Plan Photo)</div>
        </div>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-card
              flat
              bordered
              class="upload-box flex flex-center cursor-pointer"
              @click="triggerUpload('housePlan')"
            >
              <div v-if="!form.housePlanImage" class="column items-center">
                <q-icon name="add_a_photo" size="32px" color="grey-5" />
                <div class="text-caption text-grey-6 q-mt-xs">คลิกเพื่ออัปโหลดรูปภาพ</div>
              </div>
              <q-img v-else :src="form.housePlanImage" class="full-height full-width" fit="cover" />
            </q-card>
          </div>
          <div class="col-6">
            <q-card flat bordered class="upload-box flex flex-center bg-grey-2">
              <q-icon name="image" size="32px" color="grey-4" />
            </q-card>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="row items-center q-mb-sm text-primary">
          <q-icon name="photo" size="20px" class="q-mr-sm" />
          <div class="text-subtitle2 text-weight-bold">รูปภาพโครงการ (Project Photo)</div>
        </div>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-card
              flat
              bordered
              class="upload-box flex flex-center cursor-pointer"
              @click="triggerUpload('projectPhoto')"
            >
              <div v-if="!form.projectImage" class="column items-center">
                <q-icon name="add_a_photo" size="32px" color="grey-5" />
                <div class="text-caption text-grey-6 q-mt-xs">คลิกเพื่ออัปโหลดรูปภาพ</div>
              </div>
              <q-img v-else :src="form.projectImage" class="full-height full-width" fit="cover" />
            </q-card>
          </div>
          <div class="col-6">
            <q-card flat bordered class="upload-box flex flex-center bg-grey-2">
              <q-icon name="image" size="32px" color="grey-4" />
            </q-card>
          </div>
        </div>
      </div>

      <!-- Hidden File Inputs -->
      <input
        type="file"
        ref="fileInput"
        style="display: none"
        accept="image/*"
        @change="handleFileChange"
      />

      <!-- Submit Button (Fixed Bottom) -->
    </div>

    <div class="submit-footer">
      <q-btn
        label="สร้างงานใหม่"
        color="primary"
        class="full-width text-weight-bold submit-btn custom-button"
        @click="onSubmit"
        no-caps
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useWorkListStore } from '../stores/useWorkList';

const router = useRouter();
const $q = useQuasar();
const workStore = useWorkListStore();

const form = reactive({
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  coordName: '',
  coordPhone: '',
  coordEmail: '',
  coordidLine: '',
  projectName: '',
  roomNumber: '',
  floor: '',
  province: '',
  district: '',
  subdistrict: '',
  postalCode: '',
  usableArea: '',
  houseType: 'บ้านเดี่ยว',
  appointmentDate: '',
  housePlanImage: null as string | null,
  projectImage: null as string | null,
});

const houseTypeOptions = ['บ้านเดี่ยว', 'คอนโด', 'ทาวน์เฮาส์'];

const fileInput = ref<HTMLInputElement | null>(null);
const currentUploadType = ref<'housePlan' | 'projectPhoto' | null>(null);

const goBack = async () => {
  await router.push('/admin/work');
};

const triggerUpload = (type: 'housePlan' | 'projectPhoto') => {
  currentUploadType.value = type;
  fileInput.value?.click();
};

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    const url = URL.createObjectURL(file);
    if (currentUploadType.value === 'housePlan') {
      form.housePlanImage = url;
    } else {
      form.projectImage = url;
    }
  }
};

const onSubmit = async () => {
  // Basic Validation
  if (!form.projectName || !form.customerName || !form.customerPhone) {
    $q.notify({
      message: 'กรุณากรอกข้อมูลที่สำคัญให้ครบถ้วน (ชื่อโครงการ, ชื่อลูกค้า, เบอร์โทร)',
      color: 'negative',
      position: 'top',
      icon: 'warning',
    });
    return;
  }

  // Format date for display
  const displayDate = form.appointmentDate
    ? form.appointmentDate.replace(/^(\d{4})-(\d{2})-(\d{2}).*/, '$3/$2/$1')
    : 'ยังไม่กำหนด';

  // Format area
  const displayArea = form.usableArea ? `${form.usableArea} ตร.ม.` : '-';

  // Add to store
  workStore.addWork({
    title: form.projectName,
    type: form.houseType,
    area: displayArea,
    inspector: '-',
    date: displayDate,
    status: 'รอดำเนินการ',
    statusKey: 'waiting',
    customerName: form.customerName,
    customerPhone: form.customerPhone,
    province: form.province,
  });

  $q.notify({
    message: `สร้างงาน "${form.projectName}" สำเร็จ!`,
    color: 'positive',
    icon: 'check_circle',
    position: 'top',
  });

  await router.push('/admin/work');
};
</script>

<style scoped>
.sticky-top {
  position: sticky;
  top: 0;
  z-index: 1000;
}

.pb-100 {
  padding-bottom: 120px;
}

.card-rounded {
  border-radius: 16px;
  border-color: #f0f0f0;
}

.custom-input :deep(.q-field__control) {
  border-radius: 12px;
  background-color: #f8fafc;
}

.custom-input :deep(.q-field__control:before) {
  border-bottom: none;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upload-box {
  background-color: #fcfdfe;
  border: 2px dashed #e2e8f0;
  border-radius: 16px;
  height: 120px;
  transition: all 0.2s ease;
}

.upload-box:hover {
  border-color: var(--q-primary);
  background-color: #f0f7ff;
}

.fixed-bottom {
  max-width: 600px;
  margin: 0 auto;
}

@media (min-width: 600px) {
  .form-container {
    max-width: 600px;
    margin: 0 auto;
  }
}

/* กำหนดสี Primary ใหม่ให้เป็นน้ำเงินสด (ถ้ายังไม่ได้ตั้งใน quasar.config) */
.submit-btn {
  /* ปรับแต่งปุ่ม */
  background: #1976d2 !important; /* สีน้ำเงินสว่าง */
  border-radius: 30px !important; /* ทำมุมโค้งมนแบบ Pill */
  height: 54px; /* กำหนดความสูงให้ดูเต็ม */
  font-size: 1.1rem;

  /* เพิ่มเงา (Drop Shadow) */
  box-shadow: 0 4px 15px rgba(25, 118, 210, 0.3) !important;
  transition: all 0.3s ease;
}

/* เอฟเฟกต์ตอนกด (Hover/Active) */
.submit-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2) !important;
}

/* จัดตำแหน่ง Footer ให้ลอยหรือเว้นระยะตามรูป */
.submit-footer {
  padding: 20px 16px;
  background-color: white;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

/* ปรับแต่ง q-select ให้มีความมนและสีพื้นหลังตามรูป */
.custom-select :deep(.q-field__control) {
  background: #f5f5f5 !important; /* สีเทาอ่อน */
  border-radius: 8px !important; /* ความมนของมุม */
  padding: 0 12px;
}

/* เอาเส้นขีดด้านล่างออก (ถ้าเป็นแบบ filled) */
.custom-select :deep(.q-field__control:before) {
  border-bottom: none !important;
}

.custom-select :deep(.q-field__control:after) {
  border-bottom: none !important;
}

/* ปรับสี Icon ลูกศรให้ดูซอฟต์ลง */
.custom-select :deep(.q-select__dropdown-icon) {
  color: #757575;
  font-size: 24px;
}
</style>
