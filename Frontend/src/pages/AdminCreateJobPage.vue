<template>
  <q-page class="bg-grey-1">
    <!-- Header -->
    <div class="header-container bg-white q-px-md q-py-sm row items-center justify-between shadow-1 sticky-top">
      <q-btn flat no-caps :label="currentStep === 1 ? 'ยกเลิก' : 'ย้อนกลับ'" color="primary"
        :icon="currentStep === 2 ? 'arrow_back_ios_new' : undefined" @click="handleBack" />
      <div class="text-subtitle1 text-weight-bold">
        {{ isEditMode ? 'แก้ไขงาน' : 'สร้างงานใหม่' }}
      </div>
      <div style="width: 80px"></div>
    </div>

    <!-- Step Indicator -->
    <div v-if="!isEditMode" class="step-indicator bg-white q-px-lg q-py-sm shadow-1">
      <div class="row items-center justify-center q-gutter-x-sm">
        <!-- Step 1 -->
        <div class="step-item row items-center q-gutter-x-xs">
          <div class="step-circle" :class="currentStep >= 1 ? 'step-active' : 'step-inactive'">
            <q-icon v-if="currentStep > 1" name="check" size="14px" />
            <span v-else class="text-caption text-weight-bold">1</span>
          </div>
          <span class="text-caption" :class="currentStep >= 1 ? 'text-primary text-weight-bold' : 'text-grey-5'">
            เลือกลูกค้า
          </span>
        </div>
        <!-- Divider -->
        <div class="step-line" :class="currentStep >= 2 ? 'step-line-active' : ''"></div>
        <!-- Step 2 -->
        <div class="step-item row items-center q-gutter-x-xs">
          <div class="step-circle" :class="currentStep >= 2 ? 'step-active' : 'step-inactive'">
            <span class="text-caption text-weight-bold">2</span>
          </div>
          <span class="text-caption" :class="currentStep >= 2 ? 'text-primary text-weight-bold' : 'text-grey-5'">
            รายละเอียดงาน
          </span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center q-py-xl absolute-center full-width">
      <q-spinner color="primary" size="3em" />
      <div class="text-grey-6 q-mt-md">กำลังโหลดข้อมูล...</div>
    </div>

    <!-- ============================= -->
    <!-- STEP 1: เลือก / สร้างลูกค้า -->
    <!-- ============================= -->
    <div v-else-if="currentStep === 1 && !isEditMode" class="form-container q-pa-md q-gutter-y-md pb-100">
      <!-- Header Card -->
      <div class="customer-step-header q-pa-md">
        <div class="row items-center q-gutter-x-sm q-mb-xs">
          <q-icon name="person_search" size="22px" color="primary" />
          <div class="text-subtitle1 text-weight-bold text-grey-9">ค้นหาหรือสร้างลูกค้าใหม่</div>
        </div>
        <div class="text-caption text-grey-5">ค้นหาลูกค้าที่มีในระบบ หรือเพิ่มลูกค้าใหม่เพื่อสร้างงาน</div>
      </div>

      <!-- Search Bar -->
      <q-input v-model="customerSearch" dense filled placeholder="ค้นหาชื่อหรือเบอร์โทรลูกค้า..." class="custom-input"
        clearable @clear="customerSearch = ''">
        <template #prepend>
          <q-icon name="search" color="grey-5" />
        </template>
      </q-input>

      <!-- Customer List -->
      <div class="text-caption text-grey-5 q-mb-xs">ลูกค้าที่มีในระบบ</div>

      <div v-if="filteredCustomers.length === 0" class="text-center q-py-xl">
        <q-icon name="person_off" size="48px" color="grey-4" />
        <div class="text-grey-5 q-mt-sm">ไม่พบลูกค้าที่ค้นหา</div>
        <div class="text-caption text-grey-4">ลองค้นหาด้วยชื่อหรือเบอร์โทรศัพท์</div>
      </div>

      <q-card v-for="customer in filteredCustomers" :key="customer.id" flat bordered class="customer-card cursor-pointer"
        :class="{ 'customer-card-selected': selectedCustomer?.id === customer.id }"
        @click="selectCustomer(customer)">
        <q-card-section class="row items-center q-pa-md q-gutter-x-md">
          <q-avatar size="44px" :color="getAvatarColor(customer.id)" text-color="white" class="text-weight-bold">
            {{ customer.name.charAt(0) }}
          </q-avatar>
          <div class="col">
            <div class="text-subtitle2 text-weight-bold text-grey-9">{{ customer.name }}</div>
            <div class="text-caption text-grey-5">
              <q-icon name="phone" size="12px" class="q-mr-xs" />{{ customer.phone }}
            </div>
            <div v-if="customer.email" class="text-caption text-grey-5">
              <q-icon name="email" size="12px" class="q-mr-xs" />{{ customer.email }}
            </div>
          </div>
          <q-icon v-if="selectedCustomer?.id === customer.id" name="check_circle" color="primary" size="24px" />
          <q-icon v-else name="radio_button_unchecked" color="grey-4" size="24px" />
        </q-card-section>
      </q-card>

      <!-- Add New Customer Button -->
      <q-card flat bordered class="customer-card-new cursor-pointer" @click="showNewCustomerDialog = true">
        <q-card-section class="row items-center q-pa-md q-gutter-x-md">
          <q-avatar size="44px" color="primary" text-color="white">
            <q-icon name="person_add" size="22px" />
          </q-avatar>
          <div class="col">
            <div class="text-subtitle2 text-weight-bold text-primary">เพิ่มลูกค้าใหม่</div>
            <div class="text-caption text-grey-5">สร้างโปรไฟล์ลูกค้าใหม่ในระบบ</div>
          </div>
          <q-icon name="chevron_right" color="grey-4" size="24px" />
        </q-card-section>
      </q-card>
    </div>

    <!-- ================================ -->
    <!-- STEP 2: รายละเอียดงาน (and Edit) -->
    <!-- ================================ -->
    <div v-else-if="!isLoading" class="form-container q-pa-md q-gutter-y-lg pb-100">

      <!-- Selected Customer Card (create mode only) -->
      <div v-if="!isEditMode && selectedCustomer" class="selected-customer-banner q-pa-md">
        <div class="row items-center q-gutter-x-sm">
          <q-avatar size="36px" :color="getAvatarColor(selectedCustomer.id)" text-color="white"
            class="text-weight-bold text-caption">
            {{ selectedCustomer.name.charAt(0) }}
          </q-avatar>
          <div class="col">
            <div class="text-caption text-grey-5">ลูกค้าที่เลือก</div>
            <div class="text-subtitle2 text-weight-bold text-grey-9">{{ selectedCustomer.name }}</div>
            <div class="text-caption text-grey-5">{{ selectedCustomer.phone }}</div>
          </div>
          <q-btn flat round dense icon="edit" color="primary" size="sm" @click="currentStep = 1">
            <q-tooltip>เปลี่ยนลูกค้า</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- ข้อมูลลูกค้า (Edit Mode) -->
      <div v-if="isEditMode" class="section">
        <div class="row items-center q-mb-sm text-primary">
          <q-icon name="person_outline" size="20px" class="q-mr-sm" />
          <div class="text-subtitle2 text-weight-bold">ข้อมูลลูกค้า</div>
        </div>
        <q-card flat bordered class="q-pa-md bg-white card-rounded">
          <div class="column input-group">
            <q-input v-model="form.customerName" dense filled placeholder="ชื่อ-นามสกุล" class="custom-input"
              :rules="[(val) => !!val || 'กรุณากรอกชื่อลูกค้า']" />
            <q-input v-model="form.customerPhone" dense filled placeholder="เบอร์โทรศัพท์" class="custom-input"
              mask="###-###-####" :rules="[
                (val) => !!val || 'กรุณากรอกเบอร์โทรศัพท์',
                (val) => val.length === 12 || 'กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก',
              ]" />
            <q-input v-model="form.customerEmail" dense filled placeholder="อีเมล" class="custom-input" />
          </div>
        </q-card>
      </div>

      <!-- ข้อมูลผู้รับเหมา -->
      <div class="section">
        <div class="row items-center q-mb-sm text-primary">
          <q-icon name="contacts" size="20px" class="q-mr-sm" />
          <div class="text-subtitle2 text-weight-bold">ข้อมูลผู้รับเหมา</div>
        </div>
        <q-card flat bordered class="q-pa-md bg-white card-rounded">
          <div class="column input-group">
            <q-input v-model="form.coordName" dense filled placeholder="ชื่อ-นามสกุล" class="custom-input" />
            <q-input v-model="form.coordPhone" dense filled placeholder="เบอร์โทรศัพท์" class="custom-input"
              mask="###-###-####" :rules="[
                (val) => !val || val.length === 12 || 'กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก',
              ]" />
            <q-input v-model="form.coordEmail" dense filled placeholder="อีเมล" class="custom-input" />
            <q-input v-model="form.coordidLine" dense filled placeholder="ไอดีไลน์" class="custom-input" />
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
            <q-input v-model="form.projectName" dense filled placeholder="ชื่อโครงการ" class="custom-input"
              :rules="[(val) => !!val || 'กรุณากรอกชื่อโครงการ']" />
            <q-input v-model="form.roomNumber" dense filled placeholder="เลขที่ห้อง/บ้านเลขที่" class="custom-input" />
            <q-input v-model="form.floor" dense filled placeholder="ชั้น/ซอย" class="custom-input" />
            <q-input v-model="form.province" dense filled placeholder="จังหวัด" class="custom-input" />
            <q-input v-model="form.district" dense filled placeholder="เขต/อำเภอ" class="custom-input" />
            <q-input v-model="form.subdistrict" dense filled placeholder="แขวง/ตำบล" class="custom-input" />
            <q-input v-model="form.postalCode" dense filled placeholder="รหัสไปรษณีย์" class="custom-input" />

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input v-model="form.usableArea" dense filled placeholder="ขนาดพื้นที่(ตารางเมตร)"
                  class="custom-input" type="number" />
              </div>
              <div class="col-6">
                <q-select v-model="form.houseType" dense filled :options="houseTypeOptions" label="ประเภทบ้าน"
                  class="custom-select" emit-value map-options dropdown-icon="expand_more" hide-bottom-space />
              </div>
            </div>
          </div>
        </q-card>
      </div>

      <!-- รูปภาพแปลนบ้าน -->
      <div class="section">
        <div class="row items-center q-mb-sm text-primary">
          <q-icon name="photo_camera" size="20px" class="q-mr-sm" />
          <div class="text-subtitle2 text-weight-bold">รูปภาพแปลนบ้าน (House Plan Photo)</div>
        </div>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-card flat bordered class="upload-box flex flex-center cursor-pointer relative-position"
              @click="triggerUpload('housePlan')">
              <div v-if="!form.housePlanImage" class="column items-center">
                <q-icon name="add_a_photo" size="32px" color="grey-5" />
                <div class="text-caption text-grey-6 q-mt-xs">คลิกเพื่ออัปโหลดรูปภาพ</div>
              </div>
              <template v-else>
                <q-img :src="form.housePlanImage" class="full-height full-width" fit="cover" />
                <q-btn round dense color="negative" icon="close" class="absolute-top-right q-ma-xs shadow-2" size="sm"
                  @click.stop="form.housePlanImage = null" />
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

      <!-- รูปภาพโครงการ -->
      <div class="section">
        <div class="row items-center q-mb-sm text-primary">
          <q-icon name="photo" size="20px" class="q-mr-sm" />
          <div class="text-subtitle2 text-weight-bold">รูปภาพโครงการ (Project Photo)</div>
        </div>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-card flat bordered class="upload-box flex flex-center cursor-pointer relative-position"
              @click="triggerUpload('projectPhoto')">
              <div v-if="!form.projectImage" class="column items-center">
                <q-icon name="add_a_photo" size="32px" color="grey-5" />
                <div class="text-caption text-grey-6 q-mt-xs">คลิกเพื่ออัปโหลดรูปภาพ</div>
              </div>
              <template v-else>
                <q-img :src="form.projectImage" class="full-height full-width" fit="cover" />
                <q-btn round dense color="negative" icon="close" class="absolute-top-right q-ma-xs shadow-2" size="sm"
                  @click.stop="form.projectImage = null" />
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

      <!-- Hidden File Input -->
      <input type="file" ref="fileInput" style="display: none" accept="image/*" @change="handleFileChange" />
    </div>

    <!-- ============================= -->
    <!-- FOOTER BUTTONS               -->
    <!-- ============================= -->
    <div class="submit-footer" v-if="!isLoading">
      <!-- Step 1: Next Button -->
      <q-btn v-if="currentStep === 1 && !isEditMode" unelevated label="ถัดไป → กรอกรายละเอียดงาน" color="primary"
        class="full-width text-weight-bold submit-btn custom-button" no-caps :disable="!selectedCustomer"
        @click="proceedToStep2" />

      <!-- Step 2: Submit Button -->
      <q-btn v-else unelevated :label="isEditMode ? 'บันทึก' : 'สร้างงานใหม่'" color="primary"
        class="full-width text-weight-bold submit-btn custom-button" no-caps @click="onSubmit" />
    </div>

    <!-- =============================== -->
    <!-- DIALOG: สร้างลูกค้าใหม่         -->
    <!-- =============================== -->
    <q-dialog v-model="showNewCustomerDialog" persistent position="bottom">
      <q-card class="new-customer-dialog">
        <!-- Dialog Header -->
        <div class="row items-center justify-between q-pa-md q-pb-sm">
          <div class="text-subtitle1 text-weight-bold">เพิ่มลูกค้าใหม่</div>
          <q-btn flat round dense icon="close" color="grey-6" @click="closeNewCustomerDialog" />
        </div>
        <q-separator />

        <!-- Dialog Form -->
        <q-card-section class="q-gutter-y-sm q-pt-md">
          <q-input v-model="newCustomerForm.name" dense filled placeholder="ชื่อ-นามสกุล *" class="custom-input"
            :error="newCustomerFormError.name" error-message="กรุณากรอกชื่อลูกค้า" />
          <q-input v-model="newCustomerForm.phone" dense filled placeholder="เบอร์โทรศัพท์ *" class="custom-input"
            mask="###-###-####" :error="newCustomerFormError.phone" error-message="กรุณากรอกเบอร์โทรให้ครบ 10 หลัก" />
          <q-input v-model="newCustomerForm.email" dense filled placeholder="อีเมล (ไม่บังคับ)" class="custom-input" />
        </q-card-section>

        <q-card-actions class="q-px-md q-pb-md q-pt-sm">
          <q-btn unelevated label="สร้างลูกค้า" color="primary" class="full-width text-weight-bold dialog-btn"
            no-caps :loading="isCreatingCustomer" @click="createNewCustomer" />
        </q-card-actions>
      </q-card>
    </q-dialog>
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

// ─── Edit mode ────────────────────────────────────────────────────────────
const editId = computed(() => {
  const val = route.query.editId;
  return val ? Number(val) : null;
});
const isEditMode = computed(() => editId.value !== null);

// ─── Step management ──────────────────────────────────────────────────────
// Step 1 = เลือกลูกค้า, Step 2 = รายละเอียดงาน
const currentStep = ref(1);

const handleBack = () => {
  if (isEditMode.value || currentStep.value === 1) {
    router.back();
  } else {
    currentStep.value = 1;
  }
};

// ─── Customer Selection (Step 1) ─────────────────────────────────────────
interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

// Mock customer list – replace with real API call
const mockCustomers: Customer[] = [
  { id: 1, name: 'สมชาย ใจดี', phone: '081-234-5678', email: 'somchai@email.com' },
  { id: 2, name: 'มานี รักบ้าน', phone: '062-111-2222', email: 'manee@gmail.com' },
  { id: 3, name: 'นิภา สุขสวัสดิ์', phone: '083-555-6666', email: 'nipha@hotmail.com' },
  { id: 4, name: 'ชยันต์ วรรณโชติ', phone: '064-999-0000', email: 'chayan@company.com' },
  { id: 5, name: 'อรุณี ธรรมศิริ', phone: '087-456-7890', email: 'arunee@gmail.com' },
];

const customers = ref<Customer[]>(mockCustomers);
const customerSearch = ref('');
const selectedCustomer = ref<Customer | null>(null);

const filteredCustomers = computed(() => {
  const q = customerSearch.value.toLowerCase().trim();
  if (!q) return customers.value;
  return customers.value.filter(
    (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q),
  );
});

const avatarColors = ['primary', 'teal', 'deep-purple', 'orange', 'pink', 'cyan', 'indigo'];
const getAvatarColor = (id: number) => avatarColors[id % avatarColors.length] ?? 'primary';

const selectCustomer = (c: Customer) => {
  selectedCustomer.value = c;
};

const proceedToStep2 = () => {
  if (!selectedCustomer.value) return;
  currentStep.value = 2;
};

// ─── New Customer Dialog ──────────────────────────────────────────────────
const showNewCustomerDialog = ref(false);
const isCreatingCustomer = ref(false);
const newCustomerForm = reactive({ name: '', phone: '', email: '' });
const newCustomerFormError = reactive({ name: false, phone: false });

const closeNewCustomerDialog = () => {
  showNewCustomerDialog.value = false;
  newCustomerForm.name = '';
  newCustomerForm.phone = '';
  newCustomerForm.email = '';
  newCustomerFormError.name = false;
  newCustomerFormError.phone = false;
};

const createNewCustomer = async () => {
  // Validate
  newCustomerFormError.name = !newCustomerForm.name.trim();
  newCustomerFormError.phone = !newCustomerForm.phone || newCustomerForm.phone.length !== 12;

  if (newCustomerFormError.name || newCustomerFormError.phone) return;

  isCreatingCustomer.value = true;
  try {
    // TODO: Replace with real API → await api.post('/customers', newCustomerForm)
    await new Promise((resolve) => setTimeout(resolve, 700));

    const newId = Date.now();
    const created: Customer = {
      id: newId,
      name: newCustomerForm.name.trim(),
      phone: newCustomerForm.phone,
      email: newCustomerForm.email.trim() ,
    };

    customers.value.unshift(created);
    selectedCustomer.value = created;

    $q.notify({
      message: `สร้างลูกค้า "${created.name}" สำเร็จ`,
      color: 'positive',
      position: 'top',
      icon: 'check_circle',
    });

    closeNewCustomerDialog();
    // Auto-proceed to step 2
    currentStep.value = 2;
  } catch {
    $q.notify({ message: 'เกิดข้อผิดพลาดในการสร้างลูกค้า', color: 'negative', position: 'top' });
  } finally {
    isCreatingCustomer.value = false;
  }
};

// ─── Job Form ─────────────────────────────────────────────────────────────
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
    await new Promise((resolve) => setTimeout(resolve, 600));

    const existing = workStore.works.find((w) => w.id === editId.value);
    if (!existing) return;

    form.projectName = existing.title;
    form.houseType = existing.type;
    form.usableArea = existing.area.replace(' ตร.ม.', '');
    form.roomNumber = existing.roomNumber ?? '';
    form.floor = existing.floor ?? '';
    form.district = existing.district ?? '';
    form.subdistrict = existing.subdistrict ?? '';
    form.postalCode = existing.postalCode ?? '';
    form.province = existing.province ?? '';
    form.customerName = existing.customerName ?? '';
    form.customerPhone = existing.customerPhone ?? '';
    form.customerEmail = existing.customerEmail ?? '';
    form.coordName = existing.coordName ?? '';
    form.coordPhone = existing.coordPhone ?? '';
    form.coordEmail = existing.coordEmail ?? '';
    form.coordidLine = existing.coordLine ?? '';
    form.housePlanImage = existing.housePlanImage ?? null;
    form.projectImage = existing.projectImage ?? null;
  } finally {
    isLoading.value = false;
  }
});

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

// ─── Mock API ──────────────────────────────────────────────────────────────
const createCustomerAPI = async (data: Record<string, unknown>) => {
  console.log('Mock POST /customers', data);
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { id: Math.floor(Math.random() * 1000) };
};

const createJobAPI = async (customerId: number, data: Record<string, unknown>) => {
  console.log('Mock POST /jobs with customerId:', customerId, data);
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { id: Math.floor(Math.random() * 1000) };
};

const updateJobAPI = async (jobId: number, data: Record<string, unknown>) => {
  console.log('Mock PUT /jobs/', jobId, data);
  await new Promise((resolve) => setTimeout(resolve, 500));
  return true;
};

// ─── Submit ────────────────────────────────────────────────────────────────
const isSubmitting = ref(false);

const onSubmit = async () => {
  // Validate project name always required
  if (!form.projectName) {
    $q.notify({
      message: 'กรุณากรอกชื่อโครงการ',
      color: 'negative',
      position: 'top',
      icon: 'warning',
    });
    return;
  }

  // In create mode, customer must be selected
  if (!isEditMode.value && !selectedCustomer.value) {
    $q.notify({
      message: 'กรุณาเลือกลูกค้าก่อนสร้างงาน',
      color: 'negative',
      position: 'top',
      icon: 'warning',
    });
    currentStep.value = 1;
    return;
  }

  // In edit mode, customer name/phone are required
  if (isEditMode.value && (!form.customerName || !form.customerPhone)) {
    $q.notify({
      message: 'กรุณากรอกชื่อลูกค้าและเบอร์โทรศัพท์',
      color: 'negative',
      position: 'top',
      icon: 'warning',
    });
    return;
  }

  isSubmitting.value = true;
  $q.loading.show({ message: 'กำลังบันทึกข้อมูล...' });

  try {
    const displayDate = 'ยังไม่กำหนด';
    const displayArea = form.usableArea ? `${form.usableArea} ตร.ม.` : '-';

    const addressParts: string[] = [];
    if (form.roomNumber) addressParts.push(`เลขที่ ${form.roomNumber}`);
    if (form.floor && form.floor !== '-') addressParts.push(`ชั้น ${form.floor}`);
    if (form.subdistrict) addressParts.push(`ข./ต.${form.subdistrict}`);
    if (form.district) addressParts.push(`ข./อ.${form.district}`);
    if (form.province) addressParts.push(`จ.${form.province}`);
    if (form.postalCode) addressParts.push(`${form.postalCode}`);
    const fullAddress = addressParts.join(' ') || '-';

    if (isEditMode.value && editId.value) {
      // Update
      await updateJobAPI(editId.value, { ...form, displayDate, displayArea, fullAddress });

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
      // Create: use selectedCustomer
      const cust = selectedCustomer.value!;

      // 1. Call customer API (already exists – skip in real flow if customer was pre-existing)
      const customerMockResponse = await createCustomerAPI({
        name: cust.name,
        phone: cust.phone,
        email: cust.email,
      });
      const customerId = customerMockResponse.id;

      // 2. Create job
      await createJobAPI(customerId, {
        projectName: form.projectName,
        houseType: form.houseType,
        appointmentDate: displayDate,
      });

      // 3. Update local store
      workStore.addWork({
        title: form.projectName,
        type: form.houseType,
        area: displayArea,
        inspector: '-',
        date: displayDate,
        status: 'รอดำเนินการ',
        statusKey: 'waiting',
        customerName: cust.name,
        customerPhone: cust.phone,
        customerEmail: cust.email ?? '',
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

/* ─── Step Indicator ─────────────────────────────────────── */
.step-indicator {
  position: sticky;
  top: 48px;
  z-index: 999;
}

.step-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  transition: all 0.3s ease;
}

.step-active {
  background: #1976d2;
  color: white;
}

.step-inactive {
  background: #e0e0e0;
  color: #9e9e9e;
}

.step-line {
  height: 2px;
  width: 48px;
  background: #e0e0e0;
  border-radius: 2px;
  transition: background 0.3s ease;
}

.step-line-active {
  background: #1976d2;
}

/* ─── Customer Step Header ───────────────────────────────── */
.customer-step-header {
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  border-radius: 16px;
}

/* ─── Customer Cards ─────────────────────────────────────── */
.customer-card {
  border-radius: 16px;
  border-color: #f0f0f0;
  transition: all 0.2s ease;
}

.customer-card:hover {
  border-color: #1976d2;
  box-shadow: 0 2px 12px rgba(25, 118, 210, 0.12);
}

.customer-card-selected {
  border-color: #1976d2 !important;
  background-color: #e8f4fd !important;
  box-shadow: 0 2px 12px rgba(25, 118, 210, 0.18) !important;
}

.customer-card-new {
  border-radius: 16px;
  border: 2px dashed #1976d2;
  background: #f0f7ff;
  transition: all 0.2s ease;
}

.customer-card-new:hover {
  background: #e3f2fd;
  box-shadow: 0 2px 12px rgba(25, 118, 210, 0.15);
}

/* ─── Selected Customer Banner ───────────────────────────── */
.selected-customer-banner {
  background: linear-gradient(135deg, #e8f4fd 0%, #f3e5f5 100%);
  border-radius: 16px;
  border: 1.5px solid #90caf9;
}

/* ─── Form Cards ─────────────────────────────────────────── */
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

/* ─── Upload Box ─────────────────────────────────────────── */
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

/* ─── Layout ─────────────────────────────────────────────── */
@media (min-width: 600px) {
  .form-container {
    max-width: 600px;
    margin: 0 auto;
  }
}

/* ─── Submit Footer ──────────────────────────────────────── */
.submit-footer {
  padding: 20px 16px;
  background-color: white;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.submit-btn {
  background: #1976d2 !important;
  border-radius: 30px !important;
  height: 54px;
  font-size: 1.05rem;
  box-shadow: 0 4px 15px rgba(25, 118, 210, 0.3) !important;
  transition: all 0.3s ease;
}

.submit-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2) !important;
}

.submit-btn:disabled,
.submit-btn[disabled] {
  background: #bdbdbd !important;
  box-shadow: none !important;
}

/* ─── Dialog ─────────────────────────────────────────────── */
.new-customer-dialog {
  border-radius: 24px 24px 0 0;
  width: 100%;
  max-width: 600px;
}

.dialog-btn {
  background: #1976d2 !important;
  border-radius: 30px !important;
  height: 50px;
  font-size: 1rem;
  box-shadow: 0 4px 15px rgba(25, 118, 210, 0.3) !important;
}

/* ─── Select ─────────────────────────────────────────────── */
.custom-select :deep(.q-field__control) {
  background: #f5f5f5 !important;
  border-radius: 8px !important;
  padding: 0 12px;
}

.custom-select :deep(.q-field__control:before) {
  border-bottom: none !important;
}

.custom-select :deep(.q-field__control:after) {
  border-bottom: none !important;
}

.custom-select :deep(.q-select__dropdown-icon) {
  color: #757575;
  font-size: 24px;
}
</style>
