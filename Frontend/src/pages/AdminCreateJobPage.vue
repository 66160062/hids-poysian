<template>
  <q-page class="bg-grey-1">
    <!-- Header -->
    <div
      class="header-container bg-white q-px-md q-py-sm row items-center justify-between sticky-top"
    >
      <q-btn
        flat
        no-caps
        :label="t('adminWork.createJob.back')"
        color="primary"
        icon="arrow_back_ios_new"
        @click="handleBack"
      />
      <div class="text-subtitle1 text-weight-bold">
        {{ isEditMode ? t('adminWork.createJob.editTitle') : t('adminWork.createJob.createTitle') }}
      </div>
      <div style="width: 80px"></div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center q-py-xl absolute-center full-width">
      <q-spinner color="primary" size="3em" />
      <div class="text-grey-6 q-mt-md">{{ t('adminWork.createJob.loading') }}</div>
    </div>

    <!-- ================================ -->
    <!-- FORM -->
    <!-- ================================ -->

    <div v-else-if="!isLoading" class="form-container q-pa-md q-gutter-y-lg pb-100">
      <q-card flat bordered class="card-rounded q-pa-md">
        <div class="row items-center q-mb-sm text-primary"><q-icon name="business" size="20px" class="q-mr-sm" /><div class="text-subtitle2 text-weight-bold">บริษัท / สาขาที่เปิดเล่ม</div></div>
        <q-select v-model="selectedBranchId" :options="branchOptions" emit-value map-options outlined class="custom-select" label="เลือกบริษัทหรือสาขา" />
        <div v-if="!branchOptions.length" class="text-negative text-caption q-mt-sm">ยังไม่มีบริษัทหรือสาขา กรุณาเพิ่มที่ /admin/branches</div>
      </q-card>
      <!-- ข้อมูลลูกค้า -->
      <div class="text-caption text-primary q-mt-sm">ทีมตรวจที่เลือกคือ Branch ของงานนี้</div>
      <div class="section">
        <div class="row items-center q-mb-sm text-primary justify-between">
          <div class="row items-center">
            <q-icon name="person_outline" size="20px" class="q-mr-sm" />
            <div class="text-subtitle2 text-weight-bold">{{ t('adminWork.createJob.customerInfo') }}</div>
          </div>
          <q-btn
            v-if="!isEditMode && selectedCustomer"
            flat
            dense
            color="negative"
            size="sm"
            icon="close"
            :label="t('adminWork.createJob.deselect')"
            @click="clearSelectedCustomer"
          />
        </div>

        <!-- ค้นหาลูกค้า -->
        <div v-if="!isEditMode && !selectedCustomer" class="q-mb-md relative-position">
          <q-input
            v-model="customerSearch"
            dense
            filled
            :placeholder="t('adminWork.createJob.searchCustomerPlaceholder')"
            class="custom-input"
            clearable
            @clear="customerSearch = ''"
          >
            <template #prepend>
              <q-icon name="search" color="grey-5" />
            </template>
          </q-input>

          <!-- รายการลูกค้าที่ค้นพบ -->
          <q-list
            v-if="customerSearch && filteredCustomers.length > 0"
            bordered
            separator
            class="bg-white q-mt-xs"
            style="
              border-radius: 8px;
              max-height: 200px;
              overflow-y: auto;
              position: absolute;
              z-index: 10;
              width: 100%;
            "
          >
            <q-item
              v-for="customer in filteredCustomers"
              :key="customer.id"
              clickable
              v-ripple
              @click="selectCustomer(customer)"
            >
              <q-item-section avatar>
                <q-avatar size="32px" :color="getAvatarColor(customer.id)" text-color="white">{{
                  customer.name.charAt(0)
                }}</q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ customer.name }}</q-item-label>
                <q-item-label caption>{{ customer.phone }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
          <div
            v-else-if="customerSearch && filteredCustomers.length === 0"
            class="text-center q-pa-sm text-grey-5 bg-white q-mt-xs"
            style="
              border-radius: 8px;
              border: 1px solid rgba(0, 0, 0, 0.12);
              position: absolute;
              z-index: 10;
              width: 100%;
            "
          >
            {{ t('adminWork.createJob.customerNotFound') }}
          </div>
          <div class="row items-center justify-center q-my-sm">
            <span class="text-grey-5 text-caption">{{ t('adminWork.createJob.orEnterNewCustomer') }}</span>
          </div>
        </div>

        <q-card
          flat
          bordered
          class="q-pa-md bg-white card-rounded"
          :class="{ 'bg-grey-1': selectedCustomer && !isEditMode }"
        >
          <div class="column input-group">
            <q-input
              v-model="form.customerName"
              dense
              filled
              clearable
              :placeholder="t('adminWork.createJob.fullNamePlaceholder')"
              class="custom-input"
              :rules="[(val) => !!val || t('adminWork.createJob.customerNameRequired')]"
              :readonly="!!selectedCustomer && !isEditMode"
            />
            <q-input
              v-for="(phone, phoneIdx) in customerPhones"
              :key="'customer-phone-' + phoneIdx"
              v-model="customerPhones[phoneIdx]"
              dense
              filled
              clearable
              :placeholder="
                phoneIdx === 0
                  ? t('adminWork.createJob.phonePlaceholder')
                  : t('adminWork.createJob.additionalPhonePlaceholder')
              "
              class="custom-input"
              mask="###-###-####"
              lazy-rules="ondemand"
              :rules="
                phoneIdx === 0
                  ? [
                      (val) => !!val || t('adminWork.createJob.phoneRequired'),
                      (val) => val.length === 12 || t('adminWork.createJob.phoneLengthRequired'),
                    ]
                  : [(val) => !val || val.length === 12 || t('adminWork.createJob.phoneLengthRequired')]
              "
              :readonly="!!selectedCustomer && !isEditMode"
            >
              <template #append>
                <q-btn
                  v-if="phoneIdx === 0 && customerPhones.length < 3 && canEditCustomerContacts"
                  round
                  dense
                  flat
                  size="sm"
                  icon="add"
                  color="primary"
                  :aria-label="t('adminWork.createJob.addPhoneNumber')"
                  @click="addCustomerPhone"
                />
                <q-btn
                  v-else-if="phoneIdx > 0 && canEditCustomerContacts"
                  round
                  dense
                  flat
                  size="sm"
                  icon="close"
                  color="negative"
                  :aria-label="t('adminWork.createJob.removePhoneNumber')"
                  @click="removeCustomerPhone(phoneIdx)"
                />
              </template>
            </q-input>
            <q-input
              v-for="(email, emailIdx) in customerEmails"
              :key="'customer-email-' + emailIdx"
              v-model="customerEmails[emailIdx]"
              dense
              filled
              clearable
              :placeholder="
                emailIdx === 0
                  ? t('adminWork.createJob.emailOptionalPlaceholder')
                  : t('adminWork.createJob.additionalEmailPlaceholder')
              "
              class="custom-input"
              :readonly="!!selectedCustomer && !isEditMode"
            >
              <template #append>
                <q-btn
                  v-if="emailIdx === 0 && customerEmails.length < 3 && canEditCustomerContacts"
                  round
                  dense
                  flat
                  size="sm"
                  icon="add"
                  color="primary"
                  :aria-label="t('adminWork.createJob.addEmail')"
                  @click="addCustomerEmail"
                />
                <q-btn
                  v-else-if="emailIdx > 0 && canEditCustomerContacts"
                  round
                  dense
                  flat
                  size="sm"
                  icon="close"
                  color="negative"
                  :aria-label="t('adminWork.createJob.removeEmail')"
                  @click="removeCustomerEmail(emailIdx)"
                />
              </template>
            </q-input>
          </div>
        </q-card>
      </div>

      <!-- ข้อมูลผู้รับเหมา -->
      <div class="section">
        <div class="row items-center q-mb-sm text-primary">
          <q-icon name="contacts" size="20px" class="q-mr-sm" />
          <div class="text-subtitle2 text-weight-bold">{{ t('adminWork.createJob.contractorInfo') }}</div>
        </div>
        <q-card flat bordered class="q-pa-md bg-white card-rounded">
          <div class="column input-group">
            <q-input
              v-model="form.contractorFullName"
              dense
              filled
              clearable
              :placeholder="t('adminWork.createJob.fullNamePlaceholder')"
              class="custom-input"
            />
            <q-input
              v-model="form.contractorPhoneNumber"
              dense
              filled
              clearable
              :placeholder="t('adminWork.createJob.phonePlaceholder')"
              class="custom-input"
              mask="###-###-####"
              :rules="[
                (val) => !val || val.length === 12 || t('adminWork.createJob.phoneLengthRequired'),
              ]"
            />
            <q-input
              v-model="form.contractorEmail"
              dense
              filled
              clearable
              :placeholder="t('adminWork.createJob.emailPlaceholder')"
              class="custom-input"
            />
            <q-input
              v-model="form.contractorCompanyName"
              dense
              filled
              clearable
              :placeholder="t('adminWork.createJob.lineOrCompanyPlaceholder')"
              class="custom-input"
            />
          </div>
        </q-card>
      </div>

      <!-- ข้อมูลที่อยู่โครงการ -->
      <div class="section">
        <div class="row items-center justify-between q-mb-sm text-primary">
          <div class="row items-center">
            <q-icon name="location_on" size="20px" class="q-mr-sm" />
            <div class="text-subtitle2 text-weight-bold">{{ t('adminWork.createJob.projectAddressInfo') }}</div>
          </div>
          <q-btn
            outline
            color="primary"
            size="sm"
            icon="map"
            :label="t('adminWork.createJob.searchGoogleMaps')"
            @click="openGoogleMaps"
            class="bg-white"
          />
        </div>
        <q-card flat bordered class="q-pa-md bg-white card-rounded">
          <div class="column input-group">
            <q-input
              v-model="form.houseNumber"
              dense
              filled
              clearable
              :placeholder="t('adminWork.createJob.houseNumberPlaceholder')"
              class="custom-input"
            />
            <q-input
              v-model="form.soi"
              dense
              filled
              clearable
              :placeholder="t('adminWork.createJob.soiPlaceholder')"
              class="custom-input"
            />
            <q-input
              v-model="form.subDistrict"
              dense
              filled
              clearable
              :placeholder="t('adminWork.createJob.subDistrictPlaceholder')"
              class="custom-input"
              @update:model-value="(val) => handleAddressInput(val, 'subDistrict')"
            >
              <q-menu fit no-focus no-refocus v-model="showMenu.subDistrict" no-parent-event>
                <q-list style="max-height: 250px" v-if="addressOptions.length > 0">
                  <q-item
                    v-for="(opt, index) in addressOptions"
                    :key="index"
                    clickable
                    v-close-popup
                    @click="onAddressSelected(opt)"
                  >
                    <q-item-section>
                      <q-item-label>{{ opt.district }}</q-item-label>
                      <q-item-label caption
                        >{{ opt.amphoe }} » {{ opt.province }} » {{ opt.zipcode }}</q-item-label
                      >
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-input>
            <q-input
              v-model="form.district"
              dense
              filled
              clearable
              :placeholder="t('adminWork.createJob.districtPlaceholder')"
              class="custom-input"
              @update:model-value="(val) => handleAddressInput(val, 'district')"
            >
              <q-menu fit no-focus no-refocus v-model="showMenu.district" no-parent-event>
                <q-list style="max-height: 250px" v-if="addressOptions.length > 0">
                  <q-item
                    v-for="(opt, index) in addressOptions"
                    :key="index"
                    clickable
                    v-close-popup
                    @click="onAddressSelected(opt)"
                  >
                    <q-item-section>
                      <q-item-label>{{ opt.amphoe }}</q-item-label>
                      <q-item-label caption
                        >{{ opt.district }} » {{ opt.province }} » {{ opt.zipcode }}</q-item-label
                      >
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-input>
            <q-input
              v-model="form.province"
              dense
              filled
              clearable
              :placeholder="t('adminWork.createJob.provincePlaceholder')"
              class="custom-input"
              @update:model-value="(val) => handleAddressInput(val, 'province')"
            >
              <q-menu fit no-focus no-refocus v-model="showMenu.province" no-parent-event>
                <q-list style="max-height: 250px" v-if="addressOptions.length > 0">
                  <q-item
                    v-for="(opt, index) in addressOptions"
                    :key="index"
                    clickable
                    v-close-popup
                    @click="onAddressSelected(opt)"
                  >
                    <q-item-section>
                      <q-item-label>{{ opt.province }}</q-item-label>
                      <q-item-label caption
                        >{{ opt.district }} » {{ opt.amphoe }} » {{ opt.zipcode }}</q-item-label
                      >
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-input>
            <q-input
              v-model="form.postalCode"
              dense
              filled
              clearable
              :placeholder="t('adminWork.createJob.postalCodePlaceholder')"
              class="custom-input"
              @update:model-value="(val) => handleAddressInput(val, 'postalCode')"
            >
              <q-menu fit no-focus no-refocus v-model="showMenu.postalCode" no-parent-event>
                <q-list style="max-height: 250px" v-if="addressOptions.length > 0">
                  <q-item
                    v-for="(opt, index) in addressOptions"
                    :key="index"
                    clickable
                    v-close-popup
                    @click="onAddressSelected(opt)"
                  >
                    <q-item-section>
                      <q-item-label>{{ opt.zipcode }}</q-item-label>
                      <q-item-label caption
                        >{{ opt.district }} » {{ opt.amphoe }} » {{ opt.province }}</q-item-label
                      >
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-input>
          </div>
        </q-card>
      </div>

      <!-- รายละเอียดของโครงการ -->
      <div class="section">
        <div class="row items-center q-mb-sm text-primary">
          <q-icon name="home" size="20px" class="q-mr-sm" />
          <div class="text-subtitle2 text-weight-bold">{{ t('adminWork.createJob.projectDetails') }}</div>
        </div>
        <q-card flat bordered class="q-pa-md bg-white card-rounded">
          <div class="column input-group">
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  v-model="form.projectName"
                  dense
                  filled
                  clearable
                  :placeholder="t('adminWork.createJob.projectNamePlaceholder')"
                  class="custom-input"
                  maxlength="60"
                  counter
                  :rules="[(val) => !!val || t('adminWork.createJob.projectNameRequired')]"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="form.floor"
                  dense
                  filled
                  clearable
                  :placeholder="t('adminWork.createJob.floorPlaceholder')"
                  class="custom-input"
                  type="number"
                  :rules="[(val) => !!val || t('adminWork.createJob.floorRequired')]"
                />
              </div>
            </div>
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  v-model="form.usableArea"
                  dense
                  filled
                  clearable
                  :placeholder="t('adminWork.createJob.usableAreaPlaceholder')"
                  class="custom-input"
                  type="number"
                  :rules="[(val) => !!val || t('adminWork.createJob.usableAreaRequired')]"
                />
              </div>
              <div class="col-6">
                <q-select
                  v-model="form.houseType"
                  dense
                  filled
                  :options="houseTypeOptions"
                  :label="t('adminWork.createJob.houseTypeLabel')"
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

      <!-- รูปภาพแปลนบ้าน -->
      <div class="section">
        <div class="row items-center q-mb-sm text-primary">
          <q-icon name="photo_camera" size="20px" class="q-mr-sm" />
          <div class="text-subtitle2 text-weight-bold">{{ t('adminWork.createJob.housePlanPhoto') }}</div>
        </div>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-card
              flat
              bordered
              class="upload-box flex flex-center cursor-pointer relative-position"
              @click="triggerUpload('housePlan')"
            >
              <div v-if="!form.housePlanImage" class="column items-center">
                <q-icon name="add_a_photo" size="32px" color="grey-5" />
                <div class="text-caption text-grey-6 q-mt-xs">{{ t('adminWork.createJob.clickToUpload') }}</div>
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
                  @click.stop="
                    () => {
                      form.housePlanImage = null;
                      form.housePlanImageFile = null;
                    }
                  "
                />
              </template>
            </q-card>
          </div>
        </div>
      </div>

      <!-- รูปภาพโครงการ -->
      <div class="section">
        <div class="row items-center q-mb-sm text-primary">
          <q-icon name="photo" size="20px" class="q-mr-sm" />
          <div class="text-subtitle2 text-weight-bold">{{ t('adminWork.createJob.projectPhoto') }}</div>
        </div>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-card
              flat
              bordered
              class="upload-box flex flex-center cursor-pointer relative-position"
              @click="triggerUpload('projectPhoto')"
            >
              <div v-if="!form.projectImage" class="column items-center">
                <q-icon name="add_a_photo" size="32px" color="grey-5" />
                <div class="text-caption text-grey-6 q-mt-xs">{{ t('adminWork.createJob.clickToUpload') }}</div>
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
                  @click.stop="
                    () => {
                      form.projectImage = null;
                      form.projectImageFile = null;
                    }
                  "
                />
              </template>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Hidden File Input -->
      <input
        type="file"
        ref="fileInput"
        style="display: none"
        accept="image/*"
        @change="handleFileChange"
      />
    </div>

    <!-- ============================= -->
    <!-- FOOTER BUTTONS               -->
    <!-- ============================= -->
    <div class="submit-footer" v-if="!isLoading">
      <q-btn
        unelevated
        :label="isEditMode ? t('adminWork.createJob.save') : t('adminWork.createJob.createNew')"
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
import { useI18n } from 'vue-i18n';
import { useWorkListStore } from '../stores/useWorkList';
import { useCustomerStore, type Customer } from '../stores/useCustomer';
import { useAddressStore } from '../stores/useAddress';
import { useContractorStore } from '../stores/useContractor';
import { useHouseTypeStore } from '../stores/useHouseType';
import { useTeamStore } from '../stores/useTeam';
import { useThaiAddress, type ThaiAddress } from '../composables/useThaiAddress';

const API_BASE_URL = import.meta.env.VITE_API_URL as string;
const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  return `${API_BASE_URL}${path}`;
};

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();
const workStore = useWorkListStore();
const customerStore = useCustomerStore();
const addressStore = useAddressStore();
const contractorStore = useContractorStore();
const houseTypeStore = useHouseTypeStore();
const teamStore = useTeamStore();
const thaiAddress = useThaiAddress();
const selectedBranchId = ref<number | undefined>();
const branchOptions = computed(() => teamStore.teamOptions);

// ─── Edit mode ────────────────────────────────────────────────────────────
const editId = computed(() => {
  const val = route.query.editId;
  return val ? Number(val) : null;
});
const isEditMode = computed(() => editId.value !== null);

const handleBack = () => {
  router.back();
};

const customerSearch = ref('');
const selectedCustomer = ref<Customer | null>(null);

const filteredCustomers = computed(() => {
  const q = customerSearch.value.toLowerCase().trim();
  if (!q) return customerStore.customers;
  return customerStore.customers.filter(
    (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q),
  );
});

const avatarColors = ['primary', 'teal', 'deep-purple', 'orange', 'pink', 'cyan', 'indigo'];
const getAvatarColor = (id: number) => avatarColors[id % avatarColors.length] ?? 'primary';

// ─── Customer contacts (up to 3 phone numbers / 3 emails) ─────────────────
const customerPhones = ref<string[]>(['']);
const customerEmails = ref<string[]>(['']);
const canEditCustomerContacts = computed(() => !selectedCustomer.value || isEditMode.value);

const addCustomerPhone = () => {
  if (customerPhones.value.length < 3) customerPhones.value.push('');
};
const removeCustomerPhone = (idx: number) => {
  customerPhones.value.splice(idx, 1);
};
const addCustomerEmail = () => {
  if (customerEmails.value.length < 3) customerEmails.value.push('');
};
const removeCustomerEmail = (idx: number) => {
  customerEmails.value.splice(idx, 1);
};

const selectCustomer = (c: Customer) => {
  selectedCustomer.value = c;
  form.customerName = c.name;
  customerPhones.value = [c.phone, c.phone2, c.phone3].filter((p): p is string => !!p);
  if (customerPhones.value.length === 0) customerPhones.value = [''];
  customerEmails.value = [c.email, c.email2, c.email3].filter((e): e is string => !!e);
  if (customerEmails.value.length === 0) customerEmails.value = [''];
  customerSearch.value = '';
};

const clearSelectedCustomer = () => {
  selectedCustomer.value = null;
  form.customerName = '';
  customerPhones.value = [''];
  customerEmails.value = [''];
};

// ─── Job Form ─────────────────────────────────────────────────────────────
const form = reactive({
  inspectionType: 'ตรวจ Defect',
  customerName: '',
  contractorFullName: '',
  contractorPhoneNumber: '',
  contractorEmail: '',
  contractorCompanyName: '',
  projectName: '',
  soi: '',
  houseNumber: '',
  floor: '',
  province: '',
  district: '',
  subDistrict: '',
  postalCode: '',
  usableArea: '',
  houseType: 1,
  housePlanImage: null as string | null,
  projectImage: null as string | null,
  housePlanImageFile: null as File | null,
  projectImageFile: null as File | null,
});

// ─── Thai Address Auto-fill ────────────────────────────────────────────────
const addressOptions = ref<ThaiAddress[]>([]);
const showMenu = reactive({
  province: false,
  district: false,
  subDistrict: false,
  postalCode: false,
});

const handleAddressInput = (
  val: string | number | null,
  field: 'province' | 'district' | 'subDistrict' | 'postalCode',
) => {
  // Close all menus first
  Object.keys(showMenu).forEach((k) => (showMenu[k as keyof typeof showMenu] = false));

  if (val) {
    addressOptions.value = thaiAddress.filterAddresses(String(val));
    showMenu[field] = addressOptions.value.length > 0;
  } else {
    addressOptions.value = [];
  }
};

const onAddressSelected = (address: ThaiAddress) => {
  form.province = address.province;
  form.district = address.amphoe;
  form.subDistrict = address.district;
  form.postalCode = address.zipcode.toString();
  addressOptions.value = [];
  Object.keys(showMenu).forEach((k) => (showMenu[k as keyof typeof showMenu] = false));
};

// ─── Google Maps ──────────────────────────────────────────────────────────
const openGoogleMaps = () => {
  const addressParts = [
    form.projectName,
    form.houseNumber ? `${t('adminWork.createJob.houseNumberLabel')} ${form.houseNumber}` : '',
    form.soi && form.soi !== '-' ? `${t('adminWork.createJob.soiLabel')} ${form.soi}` : '',
    form.subDistrict ? `ต.${form.subDistrict}` : '',
    form.district ? `อ.${form.district}` : '',
    form.province ? `จ.${form.province}` : '',
    form.postalCode || '',
  ];

  const searchQuery = addressParts.filter((part) => part).join(' ');

  if (searchQuery.trim() && (form.projectName || form.province)) {
    const encodedQuery = encodeURIComponent(searchQuery);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
    window.open(mapsUrl, '_blank');
  } else {
    $q.notify({
      message: t('adminWork.createJob.enterProjectOrAddressFirst'),
      color: 'warning',
      position: 'top',
      icon: 'warning',
    });
  }
};

const houseTypeOptions = computed(() =>
  houseTypeStore.houseTypes.map((ht) => ({
    label: ht.name,
    value: ht.house_type_id,
  })),
);

const fileInput = ref<HTMLInputElement | null>(null);
const currentUploadType = ref<'housePlan' | 'projectPhoto' | null>(null);

const isLoading = ref(false);

onMounted(async () => {
  await Promise.all([customerStore.fetchCustomers(), teamStore.fetchTeams()]);
  await houseTypeStore.fetchHouseTypes();

  // Pre-select job type from route query if available
  if (route.query.type) {
    form.inspectionType = route.query.type === 'construction' ? 'ตรวจก่อสร้าง' : 'ตรวจ Defect';
  }

  if (!editId.value) return;

  isLoading.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const existing = workStore.works.find((w) => w.jobId === editId.value);
    if (!existing) return;
    selectedBranchId.value = existing.branch?.teamId ?? undefined;

    form.projectName = existing.projectName || '';
    form.inspectionType =
      existing.inspectionType === 'CONSTRUCTION_INSPECTION' ||
      existing.inspectionType === 'Construction' ||
      existing.inspectionType === 'ตรวจก่อสร้าง'
        ? 'ตรวจก่อสร้าง'
        : 'ตรวจ Defect';
    form.houseType = existing.houseType?.house_type_id || 1;
    form.usableArea = existing.usableArea?.toString() || '';
    form.houseNumber = existing.address?.houseNumber || '';
    form.floor = existing.address?.floor || '';
    form.soi = existing.address?.soi || '';
    form.province = existing.address?.province || '';
    form.district = existing.address?.district || '';
    form.subDistrict = existing.address?.subDistrict || '';
    form.postalCode = existing.address?.postalCode || '';
    form.customerName = existing.customer?.fullName || '';
    customerPhones.value = [
      existing.customer?.phoneNumber,
      existing.customer?.phoneNumber2,
      existing.customer?.phoneNumber3,
    ].filter((p): p is string => !!p);
    if (customerPhones.value.length === 0) customerPhones.value = [''];
    customerEmails.value = [
      existing.customer?.email,
      existing.customer?.email2,
      existing.customer?.email3,
    ].filter((e): e is string => !!e);
    if (customerEmails.value.length === 0) customerEmails.value = [''];
    form.contractorFullName = existing.contractor?.fullName || '';
    form.contractorPhoneNumber = existing.contractor?.phoneNumber || '';
    form.contractorEmail = existing.contractor?.email || '';
    form.contractorCompanyName = existing.contractor?.companyName || '';
    form.housePlanImage = getImageUrl(existing.housePlanUrl);
    form.projectImage = getImageUrl(existing.projectImageUrl);
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
      form.housePlanImageFile = file;
    } else {
      form.projectImage = url;
      form.projectImageFile = file;
    }
  }
  target.value = '';
};

// ─── Submit ────────────────────────────────────────────────────────────────
const isSubmitting = ref(false);

const onSubmit = async () => {
  if (!selectedBranchId.value) {
    $q.notify({ message: 'กรุณาเลือกบริษัทหรือสาขาก่อนเปิดเล่ม', color: 'negative', position: 'top' });
    return;
  }
  // Validate project name always required
  if (!form.projectName) {
    $q.notify({
      message: t('adminWork.createJob.projectNameRequired'),
      color: 'negative',
      position: 'top',
      icon: 'warning',
    });
    return;
  }

  if (!form.customerName || !customerPhones.value[0]) {
    $q.notify({
      message: t('adminWork.createJob.customerNameAndPhoneRequired'),
      color: 'negative',
      position: 'top',
      icon: 'warning',
    });
    return;
  }

  if (
    form.contractorFullName ||
    form.contractorPhoneNumber ||
    form.contractorEmail ||
    form.contractorCompanyName
  ) {
    if (!form.contractorFullName || !form.contractorPhoneNumber) {
      $q.notify({
        message: t('adminWork.createJob.contractorNameAndPhoneRequired'),
        color: 'negative',
        position: 'top',
        icon: 'warning',
      });
      return;
    }
  }

  isSubmitting.value = true;
  $q.loading.show({ message: t('adminWork.createJob.saving') });

  try {
    const addressParts: string[] = [];
    if (form.houseNumber) addressParts.push(`${t('adminWork.createJob.houseNumberLabel')} ${form.houseNumber}`);
    if (form.soi && form.soi !== '-') addressParts.push(`${t('adminWork.createJob.soiLabel')} ${form.soi}`);
    if (form.subDistrict) addressParts.push(`ต.${form.subDistrict}`);
    if (form.district) addressParts.push(`อ.${form.district}`);
    if (form.province) addressParts.push(`จ.${form.province}`);
    if (form.postalCode) addressParts.push(`${form.postalCode}`);

    if (isEditMode.value && editId.value) {
      const existingJob = workStore.works.find((w) => w.jobId === editId.value);

      if (existingJob) {
        if (existingJob.customer) {
          await customerStore.updateCustomer(existingJob.customer.customerId, {
            name: form.customerName,
            phone: customerPhones.value[0] || '',
            phone2: customerPhones.value[1] || '',
            phone3: customerPhones.value[2] || '',
            email: customerEmails.value[0] || '',
            email2: customerEmails.value[1] || '',
            email3: customerEmails.value[2] || '',
          });
        }

        if (existingJob.address) {
          await addressStore.updateAddress(existingJob.address.addressId, {
            houseNumber: form.houseNumber,
            floor: form.floor,
            soi: form.soi,
            province: form.province,
            district: form.district,
            subDistrict: form.subDistrict,
            postalCode: form.postalCode,
          });
        }

        let finalContractorId: number | null = existingJob.contractor?.contractorId || null;
        if (form.contractorFullName && form.contractorPhoneNumber) {
          if (finalContractorId) {
            await contractorStore.updateContractor(finalContractorId, {
              fullName: form.contractorFullName,
              phoneNumber: form.contractorPhoneNumber,
              email: form.contractorEmail,
              companyName: form.contractorCompanyName,
            });
          } else {
            const newContractor = await contractorStore.createContractor({
              fullName: form.contractorFullName,
              phoneNumber: form.contractorPhoneNumber,
              email: form.contractorEmail,
              companyName: form.contractorCompanyName,
            });
            finalContractorId = newContractor.contractorId;
          }
        }

        const jobFormData = new FormData();
        const inspectionTypeStr =
          form.inspectionType === 'ตรวจก่อสร้าง' ? 'CONSTRUCTION_INSPECTION' : 'DEFECT_INSPECTION';
        jobFormData.append('inspectionType', inspectionTypeStr);
        jobFormData.append('houseTypeId', String(form.houseType));
        jobFormData.append('projectName', form.projectName);
        jobFormData.append('locationCoordinate', '');
        jobFormData.append('usableArea', String(parseFloat(form.usableArea) || 0));
        if (selectedBranchId.value) jobFormData.append('teamId', String(selectedBranchId.value));
        if (finalContractorId) jobFormData.append('contractorId', String(finalContractorId));
        if (form.projectImageFile) jobFormData.append('projectImageUrl', form.projectImageFile);
        else if (form.projectImage === null) jobFormData.append('projectImageUrl', '');

        if (form.housePlanImageFile) jobFormData.append('housePlanUrl', form.housePlanImageFile);
        else if (form.housePlanImage === null) jobFormData.append('housePlanUrl', '');

        await workStore.updateJob(editId.value, jobFormData);
      }
      await workStore.fetchJobs();

      $q.notify({
        message: t('adminWork.createJob.editSuccess', { name: form.projectName }),
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
      });
      const redirectPath =
        form.inspectionType === 'ตรวจก่อสร้าง'
          ? `/admin/work/cons/${editId.value}`
          : `/admin/work/ins/${editId.value}`;
      await router.push(redirectPath);
    } else {
      // 1. Create or Get Customer
      let customerId: number;
      if (selectedCustomer.value) {
        customerId = selectedCustomer.value.id;
      } else {
        const newCust = await customerStore.createCustomer({
          name: form.customerName,
          phone: customerPhones.value[0] || '',
          phone2: customerPhones.value[1],
          phone3: customerPhones.value[2],
          email: customerEmails.value[0] || '',
          email2: customerEmails.value[1],
          email3: customerEmails.value[2],
          lineId: '',
        });
        customerId = newCust.id;
      }

      // 2. Create Address
      const addressId = await addressStore.createAddress({
        houseNumber: form.houseNumber,
        floor: form.floor,
        soi: form.soi,
        province: form.province,
        district: form.district,
        subDistrict: form.subDistrict,
        postalCode: form.postalCode,
      });

      let finalContractorId: number | null = null;
      if (form.contractorFullName && form.contractorPhoneNumber) {
        const newContractor = await contractorStore.createContractor({
          fullName: form.contractorFullName,
          phoneNumber: form.contractorPhoneNumber,
          email: form.contractorEmail,
          companyName: form.contractorCompanyName,
        });
        finalContractorId = newContractor.contractorId;
      }

      // 3. Create Job
      const jobFormData = new FormData();
      jobFormData.append('customerId', String(customerId));
      jobFormData.append('addressId', String(addressId));
      if (finalContractorId) jobFormData.append('contractorId', String(finalContractorId));
      const inspectionTypeStr =
        form.inspectionType === 'ตรวจก่อสร้าง' ? 'CONSTRUCTION_INSPECTION' : 'DEFECT_INSPECTION';
      jobFormData.append('inspectionType', inspectionTypeStr);
      jobFormData.append('houseTypeId', String(form.houseType));
      jobFormData.append('projectName', form.projectName);
      jobFormData.append('locationCoordinate', '');
      jobFormData.append('usableArea', String(parseFloat(form.usableArea) || 0));
      jobFormData.append('status', 'Draft');
      if (selectedBranchId.value) jobFormData.append('teamId', String(selectedBranchId.value));

      if (form.projectImageFile) {
        jobFormData.append('projectImageUrl', form.projectImageFile);
      }
      if (form.housePlanImageFile) {
        jobFormData.append('housePlanUrl', form.housePlanImageFile);
      }

      await workStore.createJob(jobFormData);
      await workStore.fetchJobs();

      $q.notify({
        message: t('adminWork.createJob.createSuccess', { name: form.projectName }),
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
      });
      await router.push({
        path: '/admin/work',
        query: selectedBranchId.value ? { branchId: selectedBranchId.value } : {},
      });
    }
  } catch (error) {
    console.error('Submit Failed', error);
    $q.notify({ message: t('adminWork.createJob.saveError'), color: 'negative', position: 'top' });
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
  border: 1px solid #90caf9;
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
  aspect-ratio: 16/9;
  min-height: 160px;
  max-height: 250px;
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
