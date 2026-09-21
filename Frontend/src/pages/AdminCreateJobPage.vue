<template>
  <q-page class="bg-grey-1">
    <!-- Header -->
    <div
      class="header-container bg-white q-px-md q-py-sm row items-center justify-between sticky-top"
    >
      <q-btn
        flat
        no-caps
        color="primary"
        icon="arrow_back_ios_new"
        @click="handleBack"
      />
      <div class="text-subtitle1 text-weight-bold">
        {{ isEditMode ? t('adminWork.createJob.editTitle') : t('adminWork.createJob.createTitle') }}
      </div>
      <q-btn
        v-if="isEditMode"
        flat
        no-caps
        dense
        :label="t('adminWork.workList.deleteJob')"
        color="negative"
        :loading="isCancellingJob"
        @click="confirmCancelJob"
      />
      <div v-else style="width: 80px"></div>
    </div>

    <!-- ================================ -->
    <!-- FORM -->
    <!-- ================================ -->

    <div class="form-container q-pa-md q-gutter-y-lg pb-100">
      <q-card flat bordered class="card-rounded q-pa-md">
        <div class="row items-center q-mb-sm text-primary"><q-icon name="business" size="20px" class="q-mr-sm" /><div class="text-subtitle2 text-weight-bold">{{ t('adminWork.createJob.branchSectionTitle') }}</div></div>
        <q-select v-model="selectedBranchId" :options="branchOptions" emit-value map-options outlined class="custom-select" :label="t('adminWork.createJob.selectBranchLabel')" />
        <div v-if="!branchOptions.length" class="text-negative text-caption q-mt-sm">{{ t('adminWork.createJob.noBranchesHint') }}</div>
      </q-card>
      <!-- ข้อมูลลูกค้า -->
      <div class="text-caption text-primary q-mt-sm">{{ t('adminWork.createJob.branchTeamHint') }}</div>
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
                  v-else-if="phoneIdx > 0 && canEditCustomerContacts && !customerPhones[phoneIdx]"
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
                  v-else-if="emailIdx > 0 && canEditCustomerContacts && !customerEmails[emailIdx]"
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
            <q-select
              v-model="form.customerPreferredLocale"
              dense
              filled
              :options="customerLocaleOptions"
              :label="t('adminWork.createJob.customerLanguageLabel')"
              class="custom-select"
              emit-value
              map-options
              :readonly="!!selectedCustomer && !isEditMode"
            />
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
            @click="showMapPicker = true"
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
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  v-model="form.latitude"
                  dense
                  filled
                  clearable
                  inputmode="decimal"
                  :placeholder="t('adminWork.createJob.latitudePlaceholder')"
                  class="custom-input"
                  :rules="[
                    (val) =>
                      !val || !!toCoordinate(Number(val), 0) || t('adminWork.createJob.latitudeInvalid'),
                  ]"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model="form.longitude"
                  dense
                  filled
                  clearable
                  inputmode="decimal"
                  :placeholder="t('adminWork.createJob.longitudePlaceholder')"
                  class="custom-input"
                  :rules="[
                    (val) =>
                      !val || !!toCoordinate(0, Number(val)) || t('adminWork.createJob.longitudeInvalid'),
                  ]"
                />
              </div>
            </div>
          </div>
        </q-card>
      </div>

      <MapPickerDialog
        v-model="showMapPicker"
        :initial-coordinate="currentCoordinate"
        :search-query="mapSearchQuery"
        @confirm="onMapConfirmed"
      />

      <!-- รายละเอียดของโครงการ -->
      <div class="section">
        <div class="row items-center q-mb-sm text-primary">
          <q-icon name="home" size="20px" class="q-mr-sm" />
          <div class="text-subtitle2 text-weight-bold">{{ t('adminWork.createJob.projectDetails') }}</div>
        </div>
        <q-card flat bordered class="q-pa-md bg-white card-rounded">
          <div class="column input-group">
            <q-input
              ref="projectNameInput"
              v-model="form.projectName"
              dense
              filled
              clearable
              :placeholder="t('adminWork.createJob.projectNamePlaceholder')"
              class="custom-input"
              maxlength="60"
              counter
              :error="!!duplicateProjectName"
              :error-message="duplicateProjectName ? t('adminWork.createJob.projectNameDuplicate') : undefined"
              :rules="[(val) => !!val || t('adminWork.createJob.projectNameRequired')]"
            />
            <q-input
              v-model="form.projectNameEn"
              dense
              filled
              clearable
              :placeholder="t('adminWork.createJob.projectNameEnPlaceholder')"
              class="custom-input"
              maxlength="60"
              counter
            />
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
        </q-card>
      </div>

      <!-- รูปภาพแปลนบ้าน -->
      <div class="section">
        <div class="row items-center q-mb-sm text-primary">
          <q-icon name="photo_camera" size="20px" class="q-mr-sm" />
          <div class="text-subtitle2 text-weight-bold">{{ t('adminWork.createJob.housePlanPhoto') }}</div>
        </div>
        <div v-if="housePlans.length" class="row q-col-gutter-md">
          <div v-for="(plan, planIdx) in housePlans" :key="plan.planId ?? plan.url" class="col-6 col-sm-4">
            <q-card flat bordered class="upload-box relative-position">
              <q-img :src="plan.url" class="full-height full-width" fit="cover" />
              <q-badge v-if="plan.isUploading" color="primary" floating class="row items-center">
                <q-spinner size="14px" class="q-mr-xs" />{{ t('adminWork.createJob.uploading') }}
              </q-badge>
              <q-btn
                unelevated
                round
                dense
                color="negative"
                icon="close"
                class="plan-delete-btn"
                size="sm"
                :disable="plan.isUploading"
                @click.stop="removeHousePlan(planIdx)"
              />
            </q-card>
            <q-input
              v-model="plan.name"
              dense
              filled
              class="custom-input plan-name-field q-mt-xs"
              :disable="plan.isUploading"
              :placeholder="t('adminWork.createJob.planNamePlaceholder')"
              @blur="renameHousePlan(planIdx)"
              @keyup.enter="($event.target as HTMLInputElement).blur()"
            />
          </div>
        </div>

        <!-- ปุ่มเพิ่มรูปแปลน: แยกจากกริดรูปเดิม กันไม่ให้ปุ่มลบของรูปเก่าโดนบัง/ทับ -->
        <q-btn
          outline
          no-caps
          color="primary"
          icon="add_a_photo"
          :label="t('adminWork.createJob.clickToUpload')"
          class="full-width add-plan-btn"
          :class="{ 'q-mt-md': housePlans.length }"
          @click="triggerPlanUpload"
        />
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
      <input
        type="file"
        ref="planFileInput"
        style="display: none"
        accept="image/*"
        multiple
        @change="handlePlanFilesChange"
      />
    </div>

    <!-- ============================= -->
    <!-- FOOTER BUTTONS               -->
    <!-- ============================= -->
    <div class="submit-footer">
      <div v-if="showMissing && submitProblems.length" class="missing-panel q-mb-md" role="alert">
        <div class="row items-center text-negative text-weight-bold q-mb-xs">
          <q-icon name="warning" size="18px" class="q-mr-xs" />
          {{ t('adminWork.createJob.missingTitle') }}
        </div>
        <ul class="q-my-none q-pl-lg text-negative text-body2">
          <li v-for="problem in submitProblems" :key="problem">{{ problem }}</li>
        </ul>
      </div>
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
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useWorkListStore, type Work } from '../stores/useWorkList';
import { api } from 'src/boot/axios';
import { useCustomerStore, type Customer } from '../stores/useCustomer';
import { useAddressStore } from '../stores/useAddress';
import { useContractorStore } from '../stores/useContractor';
import { useHouseTypeStore } from '../stores/useHouseType';
import { useBranchStore } from '../stores/useBranch';
import { useThaiAddress, type ThaiAddress } from '../composables/useThaiAddress';
import { useLocalizedField } from 'src/composables/useLocalizedField';
import { defaultPlanNames } from 'src/composables/useDefaultPlanName';
import { createIconSpinner } from 'src/composables/useIconSpinner';
import type { HousePlan } from 'src/models';
import ConfirmActionDialog from '../components/ConfirmActionDialog.vue';
import MapPickerDialog from '../components/MapPickerDialog.vue';
import {
  formatCoordinate,
  parseCoordinate,
  toCoordinate,
  type Coordinate,
} from '../composables/useMapLocation';

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
const { pickLocalized } = useLocalizedField();
const workStore = useWorkListStore();
const customerStore = useCustomerStore();
const addressStore = useAddressStore();
const contractorStore = useContractorStore();
const houseTypeStore = useHouseTypeStore();
const branchStore = useBranchStore();
const thaiAddress = useThaiAddress();
const selectedBranchId = ref<number | undefined>();
const branchOptions = computed(() => branchStore.branchOptions);
const editSpinner = createIconSpinner('edit');
const saveSpinner = createIconSpinner('cloud_upload');

// ─── Edit mode ────────────────────────────────────────────────────────────
const editId = computed(() => {
  const val = route.query.editId;
  return val ? Number(val) : null;
});
const isEditMode = computed(() => editId.value !== null);
const editingJob = ref<Work | null>(null);

const handleBack = () => {
  router.back();
};

const isCancellingJob = ref(false);

// ใช้ dialog ชุดเดียวกับปุ่ม "ยกเลิกงาน" ในหน้ารายการงาน (AdminWorkListPage)
function confirmCancelJob() {
  if (!editId.value) return;

  $q.dialog({
    component: ConfirmActionDialog,
    componentProps: {
      title: t('adminWork.workList.deleteConfirmTitle'),
      message: t('adminWork.workList.deleteConfirmMessage', {
        title: pickLocalized(form.projectName, form.projectNameEn),
      }),
      icon: 'delete',
      color: 'negative',
      confirmLabel: t('adminWork.workList.deleteConfirmOk'),
      cancelLabel: t('adminWork.workList.deleteConfirmCancel'),
    },
  }).onOk(() => {
    void cancelJob();
  });
}

async function cancelJob() {
  if (!editId.value) return;

  isCancellingJob.value = true;
  try {
    await workStore.removeJob(editId.value);
    $q.notify({ type: 'positive', message: t('adminWork.workList.deleteSuccess') });
    await router.push('/admin/work');
  } catch (error) {
    console.error('Failed to cancel job:', error);
    $q.notify({ type: 'negative', message: t('adminWork.workList.deleteError') });
  } finally {
    isCancellingJob.value = false;
  }
}

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
  form.customerPreferredLocale = c.preferredLocale || 'th-TH';
  customerPhones.value = [c.phone, c.phone2, c.phone3].filter((p): p is string => !!p);
  if (customerPhones.value.length === 0) customerPhones.value = [''];
  customerEmails.value = [c.email, c.email2, c.email3].filter((e): e is string => !!e);
  if (customerEmails.value.length === 0) customerEmails.value = [''];
  customerSearch.value = '';
};

const clearSelectedCustomer = () => {
  selectedCustomer.value = null;
  form.customerName = '';
  form.customerPreferredLocale = 'th-TH';
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
  projectNameEn: '',
  customerPreferredLocale: 'th-TH',
  soi: '',
  houseNumber: '',
  floor: '',
  province: '',
  district: '',
  subDistrict: '',
  postalCode: '',
  latitude: '',
  longitude: '',
  usableArea: '',
  houseType: 1,
  projectImage: null as string | null,
  projectImageFile: null as File | null,
});

// ─── House plan photos (multi-image, backed by house_plans) ───────────────
interface HousePlanItem {
  planId?: number;
  url: string;
  file?: File;
  name: string;
  nameEn?: string;
  isUploading?: boolean;
}
const housePlans = ref<HousePlanItem[]>([]);
const planFileInput = ref<HTMLInputElement | null>(null);

const triggerPlanUpload = () => {
  planFileInput.value?.click();
};

const uploadHousePlan = async (jobId: number, file: File, name: string, nameEn?: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);
  if (nameEn) formData.append('nameEn', nameEn);
  formData.append('orderIndex', String(housePlans.value.length));
  const { data } = await api.post<HousePlan>(`/inspection-jobs/${jobId}/house-plans`, formData);
  return data;
};

const handlePlanFilesChange = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const files = target.files ? Array.from(target.files) : [];
  target.value = '';
  if (!files.length) return;

  if (isEditMode.value && editId.value) {
    const jobId = editId.value;
    for (const file of files) {
      const { th: name, en: nameEn } = defaultPlanNames(housePlans.value.length + 1);
      const item: HousePlanItem = { url: URL.createObjectURL(file), name, nameEn, isUploading: true };
      housePlans.value.push(item);
      try {
        const created = await uploadHousePlan(jobId, file, name, nameEn);
        item.planId = created.planId;
        item.url = getImageUrl(created.imageUrl) || item.url;
      } catch (error) {
        console.error('Failed to upload house plan', error);
        housePlans.value.splice(housePlans.value.indexOf(item), 1);
        $q.notify({ message: t('adminWork.createJob.saveError'), color: 'negative', position: 'top' });
      } finally {
        item.isUploading = false;
      }
    }
  } else {
    files.forEach((file) => {
      const { th: name, en: nameEn } = defaultPlanNames(housePlans.value.length + 1);
      housePlans.value.push({
        url: URL.createObjectURL(file),
        file,
        name,
        nameEn,
      });
    });
  }
};

const renameHousePlan = async (index: number) => {
  const plan = housePlans.value[index];
  if (!plan) return;

  const trimmed = plan.name.trim();
  if (!trimmed) {
    const defaults = defaultPlanNames(index + 1);
    plan.name = defaults.th;
    plan.nameEn = defaults.en;
  }
  if (!plan.planId) return;

  try {
    await api.patch(`/house-plans/${plan.planId}`, { name: plan.name, nameEn: plan.nameEn });
  } catch (error) {
    console.error('Failed to rename house plan', error);
    $q.notify({ message: t('adminWork.createJob.saveError'), color: 'negative', position: 'top' });
  }
};

const removeHousePlan = async (index: number) => {
  const plan = housePlans.value[index];
  if (!plan) return;
  if (plan.planId) {
    try {
      await api.delete(`/house-plans/${plan.planId}`);
    } catch (error) {
      console.error('Failed to delete house plan', error);
      $q.notify({ message: t('adminWork.createJob.saveError'), color: 'negative', position: 'top' });
      return;
    }
  }
  housePlans.value.splice(index, 1);
};

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

// ─── Map pin (Leaflet) ────────────────────────────────────────────────────
const showMapPicker = ref(false);

// ข้อความที่อยู่ที่กรอกไว้ ใช้ให้แผนที่เลื่อนไปยังบริเวณใกล้เคียงก่อนปักหมุด
const mapSearchQuery = computed(() =>
  [
    form.projectName,
    form.subDistrict ? `ต.${form.subDistrict}` : '',
    form.district ? `อ.${form.district}` : '',
    form.province ? `จ.${form.province}` : '',
    form.postalCode || '',
  ]
    .filter((part) => part)
    .join(' '),
);

const currentCoordinate = computed(() =>
  form.latitude.trim() && form.longitude.trim()
    ? toCoordinate(Number(form.latitude), Number(form.longitude))
    : null,
);

const coordinateError = computed(() => {
  const hasLat = !!form.latitude.trim();
  const hasLng = !!form.longitude.trim();
  if (!hasLat && !hasLng) return '';
  if (hasLat !== hasLng) return t('adminWork.createJob.coordinateIncomplete');
  if (!toCoordinate(Number(form.latitude), 0)) return t('adminWork.createJob.latitudeInvalid');
  if (!toCoordinate(0, Number(form.longitude))) return t('adminWork.createJob.longitudeInvalid');
  return '';
});

// ค่าที่ส่งไป backend: "lat,lng" หรือสตริงว่างถ้ายังไม่ได้ระบุพิกัด
const locationCoordinateValue = computed(() =>
  currentCoordinate.value ? formatCoordinate(currentCoordinate.value) : '',
);

const onMapConfirmed = ({
  coordinate,
  address,
}: {
  coordinate: Coordinate;
  address: ThaiAddress | null;
}) => {
  form.latitude = coordinate.lat.toFixed(6);
  form.longitude = coordinate.lng.toFixed(6);
  if (!address) return;

  // เติมเฉพาะช่องที่ว่าง และไม่เติมเลยถ้าช่องที่กรอกไว้แล้วขัดกับผลจากแผนที่
  const fields = [
    ['province', address.province],
    ['district', address.amphoe],
    ['subDistrict', address.district],
    ['postalCode', String(address.zipcode)],
  ] as const;
  const conflicts = fields.some(([key, value]) => form[key] && form[key] !== value);
  if (conflicts) return;

  let filled = false;
  for (const [key, value] of fields) {
    if (!form[key]) {
      form[key] = value;
      filled = true;
    }
  }
  if (filled) {
    $q.notify({
      message: t('adminWork.createJob.addressFilledFromMap'),
      color: 'positive',
      position: 'top',
      icon: 'check_circle',
    });
  }
};

const houseTypeOptions = computed(() =>
  houseTypeStore.houseTypes.map((ht) => ({
    label: pickLocalized(ht.name, ht.nameEn),
    value: ht.house_type_id,
  })),
);

const customerLocaleOptions = computed(() => [
  { label: t('adminWork.createJob.customerLanguageThai'), value: 'th-TH' },
  { label: t('adminWork.createJob.customerLanguageEnglish'), value: 'en-US' },
]);

const fileInput = ref<HTMLInputElement | null>(null);
const currentUploadType = ref<'projectPhoto' | null>(null);

onMounted(async () => {
  $q.loading.show({
    spinner: editSpinner,
    spinnerColor: 'primary',
    spinnerSize: 70,
    backgroundColor: 'white',
  });
  await Promise.all([customerStore.fetchCustomers(), branchStore.fetchBranches()]);
  await houseTypeStore.fetchHouseTypes();

  // Pre-select job type from route query if available
  if (route.query.type) {
    form.inspectionType = route.query.type === 'construction' ? 'ตรวจก่อสร้าง' : 'ตรวจ Defect';
  }

  if (!editId.value) {
    $q.loading.hide();
    return;
  }

  
  try {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const { data: existing } = await api.get<Work>(`/inspection-jobs/${editId.value}`);
    if (!existing) return;
    editingJob.value = existing;
    selectedBranchId.value = existing.branch?.branchId ?? undefined;

    form.projectName = existing.projectName || '';
    form.projectNameEn = existing.projectNameEn || '';
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
    const savedCoordinate = parseCoordinate(existing.locationCoordinate);
    form.latitude = savedCoordinate ? String(savedCoordinate.lat) : '';
    form.longitude = savedCoordinate ? String(savedCoordinate.lng) : '';
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
    form.customerPreferredLocale = existing.customer?.preferredLocale || 'th-TH';
    form.contractorFullName = existing.contractor?.fullName || '';
    form.contractorPhoneNumber = existing.contractor?.phoneNumber || '';
    form.contractorEmail = existing.contractor?.email || '';
    form.contractorCompanyName = existing.contractor?.companyName || '';
    form.projectImage = getImageUrl(existing.projectImageUrl);

    try {
      const { data: plans } = await api.get<HousePlan[]>(`/inspection-jobs/${editId.value}/house-plans`);
      housePlans.value = plans.map((p) => ({
        planId: p.planId,
        url: getImageUrl(p.imageUrl) || p.imageUrl,
        name: p.name,
      }));
    } catch (planError) {
      console.error('Failed to load house plans', planError);
    }
  } catch (error) {
    console.error('Failed to load job for edit', error);
    $q.notify({
      message: t('adminWork.createJob.jobNotFound'),
      color: 'negative',
      position: 'top',
      icon: 'warning',
    });
    $q.loading.hide();
  } finally {
    $q.loading.hide();
  }
});

const triggerUpload = (type: 'projectPhoto') => {
  currentUploadType.value = type;
  fileInput.value?.click();
};

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    form.projectImage = URL.createObjectURL(file);
    form.projectImageFile = file;
  }
  target.value = '';
};

// ─── Submit ────────────────────────────────────────────────────────────────
const isSubmitting = ref(false);
const projectNameInput = ref<unknown>(null);
const duplicateProjectName = ref('');
watch(
  () => form.projectName,
  () => {
    duplicateProjectName.value = '';
  },
);

// HIDS ปิด toast ทั้งระบบ จึงสรุปสิ่งที่ขาด/ผิดไว้เหนือปุ่มบันทึก (footer เป็น sticky เห็นตลอด)
// รายการจะอัปเดตสดตามที่กรอก และแสดงหลังกดบันทึกครั้งแรกเท่านั้น
const showMissing = ref(false);
const submitError = ref('');
const submitProblems = computed(() => {
  const problems: string[] = [];
  if (submitError.value) problems.push(submitError.value);
  const has = (v: string | number | null | undefined) => !!String(v ?? '').trim();
  const tc = (key: string) => t(`adminWork.createJob.${key}`);

  if (!selectedBranchId.value) problems.push(tc('missingBranch'));
  if (!has(form.projectName)) problems.push(tc('missingProjectName'));
  else if (duplicateProjectName.value)
    problems.push(t('adminWork.createJob.projectNameDuplicate'));
  if (!has(form.floor)) problems.push(tc('missingFloor'));
  if (!has(form.usableArea)) problems.push(tc('missingUsableArea'));
  if (coordinateError.value) problems.push(coordinateError.value);
  if (!has(form.customerName)) problems.push(tc('missingCustomerName'));
  if (!has(customerPhones.value[0])) problems.push(tc('missingCustomerPhone'));

  const hasContractorInfo =
    has(form.contractorFullName) ||
    has(form.contractorPhoneNumber) ||
    has(form.contractorEmail) ||
    has(form.contractorCompanyName);
  if (hasContractorInfo) {
    if (!has(form.contractorFullName)) problems.push(tc('missingContractorName'));
    if (!has(form.contractorPhoneNumber)) problems.push(tc('missingContractorPhone'));
  }
  return problems;
});

const onSubmit = async () => {
  showMissing.value = true;
  submitError.value = '';
  if (submitProblems.value.length) return;

  isSubmitting.value = true;
  $q.loading.show({
    spinner: saveSpinner,
    spinnerColor: 'primary',
    spinnerSize: 70,
    backgroundColor: 'white',
  });

  try {
    // เช็คชื่อซ้ำก่อนสร้างลูกค้า/ที่อยู่/ผู้รับเหมา จะได้ไม่เหลือข้อมูลค้างเมื่อชื่อซ้ำ
    if (await workStore.isProjectNameTaken(form.projectName, editId.value ?? undefined)) {
      duplicateProjectName.value = form.projectName.trim();
      const el = (projectNameInput.value as { $el?: HTMLElement } | null)?.$el;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const addressParts: string[] = [];
    if (form.houseNumber) addressParts.push(`${t('adminWork.createJob.houseNumberLabel')} ${form.houseNumber}`);
    if (form.soi && form.soi !== '-') addressParts.push(`${t('adminWork.createJob.soiLabel')} ${form.soi}`);
    if (form.subDistrict) addressParts.push(`ต.${form.subDistrict}`);
    if (form.district) addressParts.push(`อ.${form.district}`);
    if (form.province) addressParts.push(`จ.${form.province}`);
    if (form.postalCode) addressParts.push(`${form.postalCode}`);

    if (isEditMode.value && editId.value) {
      const existingJob = editingJob.value;

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
            preferredLocale: form.customerPreferredLocale,
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
        jobFormData.append('projectNameEn', form.projectNameEn);
        jobFormData.append('locationCoordinate', locationCoordinateValue.value);
        jobFormData.append('usableArea', String(parseFloat(form.usableArea) || 0));
        if (selectedBranchId.value) jobFormData.append('branchId', String(selectedBranchId.value));
        if (finalContractorId) jobFormData.append('contractorId', String(finalContractorId));
        if (form.projectImageFile) jobFormData.append('projectImageUrl', form.projectImageFile);
        else if (form.projectImage === null) jobFormData.append('projectImageUrl', '');

        await workStore.updateJob(editId.value, jobFormData);
      } else {
        $q.notify({
          message: t('adminWork.createJob.jobNotFound'),
          color: 'negative',
          position: 'top',
          icon: 'warning',
        });
        return;
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
          preferredLocale: form.customerPreferredLocale,
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
      if (form.projectNameEn) jobFormData.append('projectNameEn', form.projectNameEn);
      jobFormData.append('locationCoordinate', locationCoordinateValue.value);
      jobFormData.append('usableArea', String(parseFloat(form.usableArea) || 0));
      jobFormData.append('status', 'Draft');
      if (selectedBranchId.value) jobFormData.append('branchId', String(selectedBranchId.value));

      if (form.projectImageFile) {
        jobFormData.append('projectImageUrl', form.projectImageFile);
      }

      const createdJob = await workStore.createJob(jobFormData);

      const pendingPlans = housePlans.value.filter((p): p is HousePlanItem & { file: File } => !!p.file);
      for (const plan of pendingPlans) {
        try {
          await uploadHousePlan(createdJob.jobId, plan.file, plan.name, plan.nameEn);
        } catch (planError) {
          console.error('Failed to upload house plan', planError);
        }
      }

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
    const response = (error as { response?: { status?: number; data?: { message?: string | string[] } } }).response;
    if (response?.status === 409) {
      // backend ตอบ 409 เมื่อชื่อโครงการซ้ำ (ข้อความจาก server เป็นภาษาไทยอย่างเดียว จึงใช้ i18n แทน)
      duplicateProjectName.value = form.projectName.trim();
    } else {
      const serverMessage = response?.data?.message;
      submitError.value =
        (Array.isArray(serverMessage) ? serverMessage.join(', ') : serverMessage) ||
        t('adminWork.createJob.saveError');
    }
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

/* ปุ่มลบรูปแปลน: มินิมอล ไม่มีเงา วางไว้มุมขวาบนของการ์ดรูปเดิม */
.plan-delete-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
  box-shadow: none;
}

.add-plan-btn {
  border-radius: 12px;
  border-style: dashed;
  height: 44px;
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

.missing-panel {
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 12px;
  padding: 10px 14px;
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
