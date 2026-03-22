<template>
  <q-page class="bg-grey-1">
    <!-- Header -->
    <div
      class="header-container bg-white q-px-md q-py-sm row items-center justify-between shadow-1 sticky-top"
    >
      <q-btn flat no-caps label="ยกเลิก" color="primary" @click="goBack" />
      <div class="text-subtitle1 text-weight-bold">
        {{ isEditMode ? 'แก้ไขงาน' : 'สร้างงานใหม่' }}
      </div>
      <div style="width: 60px"></div>
      <!-- Spacer for centering -->
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center q-py-xl absolute-center full-width">
      <q-spinner color="primary" size="3em" />
      <div class="text-grey-6 q-mt-md">กำลังโหลดข้อมูล...</div>
    </div>

    <div v-else class="form-container q-pa-md q-gutter-y-lg pb-100">
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
              :rules="[
                (val) => !!val || 'กรุณากรอกเบอร์โทรศัพท์',
                (val) => val.length === 12 || 'กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก',
              ]"
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
              :rules="[
                (val) => !val || val.length === 12 || 'กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก',
              ]"
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
              class="upload-box flex flex-center cursor-pointer relative-position"
              @click="triggerUpload('housePlan')"
            >
              <div v-if="!form.housePlanImage" class="column items-center">
                <q-icon name="add_a_photo" size="32px" color="grey-5" />
                <div class="text-caption text-grey-6 q-mt-xs">คลิกเพื่ออัปโหลดรูปภาพ</div>
              </div>
              <template v-else>
                <q-img :src="form.housePlanImage" class="full-height full-width" fit="cover" />
                <q-btn
                  round
                  dense
                  color="negative"
                  icon="close"
                  class="absolute-top-right q-ma-xs shadow-2"
                  size="sm"
                  @click.stop="form.housePlanImage = null"
                />
              </template>
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
              class="upload-box flex flex-center cursor-pointer relative-position"
              @click="triggerUpload('projectPhoto')"
            >
              <div v-if="!form.projectImage" class="column items-center">
                <q-icon name="add_a_photo" size="32px" color="grey-5" />
                <div class="text-caption text-grey-6 q-mt-xs">คลิกเพื่ออัปโหลดรูปภาพ</div>
              </div>
              <template v-else>
                <q-img :src="form.projectImage" class="full-height full-width" fit="cover" />
                <q-btn
                  round
                  dense
                  color="negative"
                  icon="close"
                  class="absolute-top-right q-ma-xs shadow-2"
                  size="sm"
                  @click.stop="form.projectImage = null"
                />
              </template>
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

    <div class="submit-footer" v-if="!isLoading">
      <q-btn
        unelevated
        :label="isEditMode ? 'บันทึก' : 'สร้างงานใหม่'"
        color="primary"
        class="full-width text-weight-bold submit-btn custom-button"
        no-caps
        @click="onSubmit"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useWorkListStore } from '../stores/useWorkList';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const workStore = useWorkListStore();

// Edit mode: detect ?editId=X in query
const editId = computed(() => {
  const val = route.query.editId;
  return val ? Number(val) : null;
});
const isEditMode = computed(() => editId.value !== null);

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
  housePlanImage: null as string | null,
  projectImage: null as string | null,
});

const houseTypeOptions = ['บ้านเดี่ยว', 'คอนโด', 'ทาวน์เฮาส์'];

const fileInput = ref<HTMLInputElement | null>(null);
const currentUploadType = ref<'housePlan' | 'projectPhoto' | null>(null);

const isLoading = ref(false);

// Pre-fill form on edit mode
onMounted(async () => {
  if (!editId.value) return;

  isLoading.value = true;
  try {
    // Simulate Backend API fetch
    await new Promise((resolve) => setTimeout(resolve, 600));

    const existing = workStore.works.find((w) => w.id === editId.value);
    if (!existing) return;

    // Project Info
    form.projectName = existing.title;
    form.houseType = existing.type;
    form.usableArea = existing.area.replace(' ตร.ม.', '');
    form.roomNumber = existing.roomNumber ?? '';
    form.floor = existing.floor ?? '';
    form.district = existing.district ?? '';
    form.subdistrict = existing.subdistrict ?? '';
    form.postalCode = existing.postalCode ?? '';
    form.province = existing.province ?? '';

    // Customer Info
    form.customerName = existing.customerName ?? '';
    form.customerPhone = existing.customerPhone ?? '';
    form.customerEmail = existing.customerEmail ?? '';

    // Coordinator Info
    form.coordName = existing.coordName ?? '';
    form.coordPhone = existing.coordPhone ?? '';
    form.coordEmail = existing.coordEmail ?? '';
    form.coordidLine = existing.coordLine ?? '';

    // Location
    form.province = existing.province ?? '';

    // Images
    form.housePlanImage = existing.housePlanImage ?? null;
    form.projectImage = existing.projectImage ?? null;
  } finally {
    isLoading.value = false;
  }
});

const goBack = () => {
  router.back();
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

/* =========================================
   BACKEND API MOCKS
   ========================================= */
const createCustomerAPI = async (data: Record<string, unknown>) => {
  // TODO: Replace with real API e.g. await axios.post('/api/customers', data)
  console.log('Mock POST /customers', data);
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { id: Math.floor(Math.random() * 1000) };
};

const createJobAPI = async (customerId: number, data: Record<string, unknown>) => {
  // TODO: Replace with real API e.g. await axios.post('/api/jobs', { ...data, customer_id: customerId })
  console.log('Mock POST /jobs with customerId:', customerId, data);
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { id: Math.floor(Math.random() * 1000) };
};

const updateJobAPI = async (jobId: number, data: Record<string, unknown>) => {
  // TODO: Replace with real API e.g. await axios.put(`/api/jobs/${jobId}`, data)
  console.log('Mock PUT /jobs/', jobId, data);
  await new Promise((resolve) => setTimeout(resolve, 500));
  return true;
};

const isSubmitting = ref(false);

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

  isSubmitting.value = true;
  $q.loading.show({ message: 'กำลังบันทึกข้อมูล...' });

  try {
    // Format date for display
    const displayDate = 'ยังไม่กำหนด';

    // Format area
    const displayArea = form.usableArea ? `${form.usableArea} ตร.ม.` : '-';

    // Format full address
    const addressParts = [];
    if (form.roomNumber) addressParts.push(`เลขที่ ${form.roomNumber}`);
    if (form.floor && form.floor !== '-') addressParts.push(`ชั้น ${form.floor}`);
    if (form.subdistrict) addressParts.push(`ข./ต.${form.subdistrict}`);
    if (form.district) addressParts.push(`ข./อ.${form.district}`);
    if (form.province) addressParts.push(`จ.${form.province}`);
    if (form.postalCode) addressParts.push(`${form.postalCode}`);
    const fullAddress = addressParts.join(' ') || '-';

    if (isEditMode.value && editId.value) {
      // 1. Update backend via Mock API
      await updateJobAPI(editId.value, { ...form, displayDate, displayArea, fullAddress });

      // 2. Update local mock store for UI
      const idx = workStore.works.findIndex((w) => w.id === editId.value);
      if (idx !== -1) {
        const original = workStore.works[idx]!;
        workStore.works[idx] = {
          ...original,
          title: form.projectName,
          type: form.houseType,
          area: displayArea,
          date: displayDate,
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerEmail: form.customerEmail,
          coordName: form.coordName,
          coordPhone: form.coordPhone,
          coordEmail: form.coordEmail,
          coordLine: form.coordidLine,
          roomNumber: form.roomNumber,
          floor: form.floor,
          district: form.district,
          subdistrict: form.subdistrict,
          postalCode: form.postalCode,
          province: form.province,
          address: fullAddress,
          housePlanImage: form.housePlanImage,
          projectImage: form.projectImage,
        };
      }
      $q.notify({
        message: `แก้ไขงาน "${form.projectName}" สำเร็จ!`,
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
      });
      await router.push(`/admin/work/${editId.value}`);
    } else {
      // 1. Create Customer via Mock API
      const customerMockResponse = await createCustomerAPI({
        name: form.customerName,
        phone: form.customerPhone,
        email: form.customerEmail,
      });
      const customerId = customerMockResponse.id;

      // 2. Create Job linking to Customer via Mock API
      await createJobAPI(customerId, {
        projectName: form.projectName,
        houseType: form.houseType,
        appointmentDate: displayDate,
        // Insert more form fields here...
      });
      // (Used jobMockResponse.id if we need to redirect to new item ID)

      // 3. Update local mock store for UI
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
        customerEmail: form.customerEmail,
        coordName: form.coordName,
        coordPhone: form.coordPhone,
        coordEmail: form.coordEmail,
        coordLine: form.coordidLine,
        roomNumber: form.roomNumber,
        floor: form.floor,
        district: form.district,
        subdistrict: form.subdistrict,
        postalCode: form.postalCode,
        province: form.province,
        address: fullAddress,
        housePlanImage: form.housePlanImage,
        projectImage: form.projectImage,
      });
      $q.notify({
        message: `สร้างงาน "${form.projectName}" สำเร็จ!`,
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
      });
      await router.push('/admin/work');
    }
  } catch (error) {
    console.error('Submit Failed', error);
    $q.notify({ message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', color: 'negative', position: 'top' });
  } finally {
    $q.loading.hide();
    isSubmitting.value = false;
  }
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
