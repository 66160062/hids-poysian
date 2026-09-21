<template>
  <q-page class="admin-master-data-page bg-grey-1 q-pb-xl relative-position">
    <!-- Loading Indicator -->
    <q-inner-loading :showing="initialLoading" style="z-index: 100">
      <IconBounceSpinner icon="dashboard_customize" size="64px" color="primary" />
    </q-inner-loading>

    <!-- Header Section -->
    <div class="q-px-md q-pt-md q-pb-sm text-dark header-bg">
      <div class="q-mb-md">
        <!-- <div class="text-h6 text-weight-bold text-dark">
          {{ t('adminManage.masterData.title') }}
        </div> -->
        <div class="text-caption text-weight">
          {{ t('adminManage.masterData.subtitle') }}
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="kpi-row row no-wrap q-col-gutter-sm q-mb-md">
        <div class="kpi-col col">
          <q-card
            flat
            bordered
            class="kpi-card theme-rooms shadow-1 cursor-pointer"
            :class="{ 'kpi-card--active': activeTab === 'rooms' }"
            v-ripple
            tabindex="0"
            role="button"
            @click="activeTab = 'rooms'"
            @keyup.enter="activeTab = 'rooms'"
          >
            <q-card-section class="q-pa-sm row items-center no-wrap">
              <q-avatar class="tone-avatar" icon="meeting_room" size="40px" />
              <div class="q-ml-sm">
                <div class="text-caption text-grey-7">{{ t('adminManage.masterData.kpiMainRooms') }}</div>
                <div class="text-h6 text-weight-bold text-dark">{{ store.rooms.length }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="kpi-col col">
          <q-card
            flat
            bordered
            class="kpi-card theme-subrooms shadow-1 cursor-pointer"
            :class="{ 'kpi-card--active': activeTab === 'subRooms' }"
            v-ripple
            tabindex="0"
            role="button"
            @click="activeTab = 'subRooms'"
            @keyup.enter="activeTab = 'subRooms'"
          >
            <q-card-section class="q-pa-sm row items-center no-wrap">
              <q-avatar class="tone-avatar" icon="sensor_door" size="40px" />
              <div class="q-ml-sm">
                <div class="text-caption text-grey-7">{{ t('adminManage.masterData.kpiSubRooms') }}</div>
                <div class="text-h6 text-weight-bold text-dark">{{ store.subRooms.length }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="kpi-col col">
          <q-card
            flat
            bordered
            class="kpi-card theme-categories shadow-1 cursor-pointer"
            :class="{ 'kpi-card--active': activeTab === 'defectCategories' }"
            v-ripple
            tabindex="0"
            role="button"
            @click="activeTab = 'defectCategories'"
            @keyup.enter="activeTab = 'defectCategories'"
          >
            <q-card-section class="q-pa-sm row items-center no-wrap">
              <q-avatar class="tone-avatar" icon="category" size="40px" />
              <div class="q-ml-sm">
                <div class="text-caption text-grey-7">{{ t('adminManage.masterData.kpiCategories') }}</div>
                <div class="text-h6 text-weight-bold text-dark">{{ store.defectCategories.length }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="kpi-col col">
          <q-card
            flat
            bordered
            class="kpi-card theme-subcats shadow-1 cursor-pointer"
            :class="{ 'kpi-card--active': activeTab === 'defectSubCategories' }"
            v-ripple
            tabindex="0"
            role="button"
            @click="activeTab = 'defectSubCategories'"
            @keyup.enter="activeTab = 'defectSubCategories'"
          >
            <q-card-section class="q-pa-sm row items-center no-wrap">
              <q-avatar class="tone-avatar" icon="format_list_bulleted" size="40px" />
              <div class="q-ml-sm">
                <div class="text-caption text-grey-7">{{ t('adminManage.masterData.kpiSubCategories') }}</div>
                <div class="text-h6 text-weight-bold text-dark">{{ store.defectSubCategories.length }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="row q-gutter-x-sm no-wrap items-center">
        <q-input
          v-model="searchQuery"
          dense
          borderless
          rounded
          :placeholder="t('adminManage.masterData.searchPlaceholder')"
          class="search-input col"
          hide-bottom-space
        >
          <template #prepend>
            <q-icon name="search" color="grey-7" />
          </template>
          <template #append v-if="searchQuery">
            <q-icon name="close" class="cursor-pointer" @click="searchQuery = ''" />
          </template>
        </q-input>

        <!-- Round Tune Filter Button (หมวดตำหนิ — เฉพาะแท็บประเภทตำหนิย่อย) -->
        <q-btn
          v-if="activeTab === 'defectSubCategories'"
          round
          unelevated
          :color="selectedCategoryFilter !== 'ALL' ? 'primary' : 'white'"
          :text-color="selectedCategoryFilter !== 'ALL' ? 'white' : 'primary'"
          icon="tune"
          class="shadow-1 shrink-0"
          style="height: 44px; width: 44px; min-height: 44px; min-width: 44px"
        >
          <q-badge
            v-if="selectedCategoryFilter !== 'ALL'"
            color="red"
            floating
            rounded
            style="top: 2px; right: 2px"
          >
            1
          </q-badge>

          <q-menu anchor="bottom right" self="top right" :offset="[0, 8]" class="rounded-borders shadow-3">
            <q-list style="min-width: 230px" class="q-py-xs">
              <q-item-label header class="text-caption text-weight-bold text-grey-7">
                {{ t('adminManage.masterData.filterCategory') }}
              </q-item-label>
              <q-item
                v-for="opt in categoryOptionsWithAll"
                :key="String(opt.value)"
                clickable
                v-close-popup
                :active="selectedCategoryFilter === opt.value"
                active-class="bg-blue-1 text-primary text-weight-bold"
                @click="selectedCategoryFilter = opt.value"
              >
                <q-item-section>
                  <q-item-label>{{ opt.label }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>

      <!-- Action Buttons Row -->
      <div class="row items-center justify-end q-mt-sm">
        <div class="col-12 col-sm-auto">
          <q-btn
            unelevated
            color="primary"
            icon="add"
            :label="t('adminManage.masterData.addNew')"
            class="full-width action-btn-primary shadow-1"
            no-caps
            @click="handleAddNew"
          />
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="q-px-md q-pt-sm q-pb-md">
      <!-- 1. ประเภทงาน (Defect Categories) View with Entire Clickable Card -->
      <div v-if="activeTab === 'defectCategories'">
        <div v-if="filteredCategories.length === 0" class="text-center q-py-xl text-grey-6">
          <q-icon name="folder_off" size="64px" class="q-mb-md" />
          <div>{{ t('adminManage.masterData.noCategoriesFound') }}</div>
        </div>

        <div v-else class="row q-col-gutter-md">
          <div
            v-for="cat in paginatedCategories"
            :key="cat.categoryId"
            class="col-12 col-sm-6 col-md-4"
          >
            <AdminMasterDataCard
              class="theme-categories"
              :title="cat.name"
              :subtitle="cat.nameEn"
              :id="cat.categoryId"
              @open="openCategoryDrillDown(cat)"
              @edit="openCategoryModal(cat)"
              @delete="confirmDelete('category', cat.categoryId, cat.name)"
            >
              <template #tags>
                <q-badge color="orange-1" text-color="orange-9" class="tag-badge">
                  <q-icon name="report_problem" size="14px" class="q-mr-xs" />
                  {{ t('adminManage.masterData.defectsCount', { count: getSubCategoriesCount(cat.categoryId) }) }}
                </q-badge>
              </template>
              <template #action>
                <div class="row items-center tone-text text-weight-bold text-caption">
                  {{ t('adminManage.masterData.tapToViewDefects') }}
                  <q-icon name="chevron_right" size="20px" />
                </div>
              </template>
            </AdminMasterDataCard>
          </div>
        </div>

        <!-- Pagination Controls -->
        <div v-if="maxPageCategories > 1" class="row justify-center q-mt-lg">
          <q-pagination
            v-model="pageCategories"
            :max="maxPageCategories"
            :max-pages="5"
            direction-links
            boundary-links
            color="primary"
            active-color="primary"
            active-text-color="white"
          />
        </div>
      </div>

      <!-- 2. ประเภทห้องหลัก (Rooms) View -->
      <div v-else-if="activeTab === 'rooms'">
        <div v-if="filteredRooms.length === 0" class="text-center q-py-xl text-grey-6">
          <q-icon name="meeting_room" size="64px" class="q-mb-md" />
          <div>{{ t('adminManage.masterData.noRoomsFound') }}</div>
        </div>

        <div v-else class="row q-col-gutter-md">
          <div
            v-for="room in paginatedRooms"
            :key="room.roomId"
            class="col-12 col-sm-6 col-md-4"
          >
            <AdminMasterDataCard
              class="theme-rooms"
              :title="room.roomName"
              :subtitle="room.roomNameEn"
              :id="room.roomId"
              @open="openRoomModal(room)"
              @edit="openRoomModal(room)"
              @delete="confirmDelete('room', room.roomId, room.roomName)"
            />
          </div>
        </div>

        <!-- Pagination Controls -->
        <div v-if="maxPageRooms > 1" class="row justify-center q-mt-lg">
          <q-pagination
            v-model="pageRooms"
            :max="maxPageRooms"
            :max-pages="5"
            direction-links
            boundary-links
            color="primary"
            active-color="primary"
            active-text-color="white"
          />
        </div>
      </div>

      <!-- 3. ห้องย่อย (SubRooms) View -->
      <div v-else-if="activeTab === 'subRooms'">
        <div v-if="filteredSubRooms.length === 0" class="text-center q-py-xl text-grey-6">
          <q-icon name="sensor_door" size="64px" class="q-mb-md" />
          <div>{{ t('adminManage.masterData.noSubRoomsFound') }}</div>
        </div>

        <div v-else class="row q-col-gutter-md">
          <div
            v-for="subRoom in paginatedSubRooms"
            :key="subRoom.subRoomId"
            class="col-12 col-sm-6 col-md-4"
          >
            <AdminMasterDataCard
              class="theme-subrooms"
              :title="subRoom.roomName"
              :subtitle="subRoom.roomNameEn"
              :id="subRoom.subRoomId"
              @open="openSubRoomModal(subRoom)"
              @edit="openSubRoomModal(subRoom)"
              @delete="confirmDelete('subRoom', subRoom.subRoomId, subRoom.roomName)"
            />
          </div>
        </div>

        <!-- Pagination Controls -->
        <div v-if="maxPageSubRooms > 1" class="row justify-center q-mt-lg">
          <q-pagination
            v-model="pageSubRooms"
            :max="maxPageSubRooms"
            :max-pages="5"
            direction-links
            boundary-links
            color="primary"
            active-color="primary"
            active-text-color="white"
          />
        </div>
      </div>

      <!-- 4. ประเภทตำหนิย่อยทั้งหมด (Defect Sub-Categories) View -->
      <div v-else-if="activeTab === 'defectSubCategories'">
        <div v-if="filteredSubCategories.length === 0" class="text-center q-py-xl text-grey-6">
          <q-icon name="format_list_bulleted" size="64px" class="q-mb-md" />
          <div>{{ t('adminManage.masterData.noSubCategoriesFound') }}</div>
        </div>

        <div v-else class="row q-col-gutter-md">
          <div
            v-for="subCat in paginatedSubCategories"
            :key="subCat.subCategoryId"
            class="col-12 col-sm-6 col-md-4"
          >
            <AdminMasterDataCard
              class="theme-subcats"
              :title="subCat.name"
              :subtitle="subCat.nameEn"
              :id="subCat.subCategoryId"
              :badge="subCat.category?.name || getCategoryName(subCat.category?.categoryId) || '-'"
              badge-class="bg-deep-purple-1 text-deep-purple-9"
              @open="openSubCategoryModal(subCat)"
              @edit="openSubCategoryModal(subCat)"
              @delete="confirmDelete('subCategory', subCat.subCategoryId, subCat.name)"
            />
          </div>
        </div>

        <!-- Pagination Controls -->
        <div v-if="maxPageSubCategories > 1" class="row justify-center q-mt-lg">
          <q-pagination
            v-model="pageSubCategories"
            :max="maxPageSubCategories"
            :max-pages="5"
            direction-links
            boundary-links
            color="primary"
            active-color="primary"
            active-text-color="white"
          />
        </div>
      </div>
    </div>

    <!-- Category Drill-Down Dialog (ดูตำหนิในหมวดงานนี้ + เพิ่มตำหนิ Inline ในตัว) -->
    <q-dialog
      v-model="showCategoryDrillDownDialog"
      position="bottom"
      transition-show="sheet-in"
      transition-hide="sheet-out"
    >
      <q-card style="width: 100%; max-width: 650px; border-radius: 28px 28px 0 0" class="q-pa-lg">
        <div class="sheet-handle q-mb-sm" />
        
        <!-- Header -->
        <div class="row items-center justify-between q-mb-md">
          <div class="row items-center">
            <q-avatar color="deep-purple-1" text-color="deep-purple-9" icon="folder" size="40px" class="q-mr-sm" />
            <div>
              <div class="text-h6 text-weight-bold text-dark">{{ selectedCategoryForDrillDown?.name }}</div>
              <div class="text-caption text-grey-7">
                {{ t('adminManage.masterData.drillDownSubtitle', { count: categoryDrillDownItems.length }) }}
              </div>
            </div>
          </div>
          <q-btn flat round dense icon="close" color="grey-6" v-close-popup />
        </div>

        <q-separator class="q-mb-md" />

        <!-- Inline Add Sub-Category Form inside Dialog -->
        <q-card flat class="bg-blue-1 rounded-borders q-pa-md q-mb-md">
          <div class="text-subtitle2 text-weight-bold text-primary q-mb-xs row items-center">
            <q-icon name="add_circle" class="q-mr-xs" />
            {{ t('adminManage.masterData.inlineFormTitle') }}
          </div>
          <q-form class="row q-col-gutter-sm items-center" @submit="handleInlineAddSubCategory">
            <div class="col-12 col-sm-5">
              <q-input
                v-model="inlineSubCategoryForm.name"
                dense
                outlined
                bg-color="white"
                :placeholder="t('adminManage.masterData.inlineFormNameTh')"
                hide-bottom-space
                :rules="[(val) => !!val || t('adminManage.masterData.subCategoryNameRequired')]"
              />
            </div>
            <div class="col-12 col-sm-5">
              <q-input
                v-model="inlineSubCategoryForm.nameEn"
                dense
                outlined
                bg-color="white"
                :placeholder="t('adminManage.masterData.inlineFormNameEn')"
                hide-bottom-space
              />
            </div>
            <div class="col-12 col-sm-2 text-right">
              <q-btn
                type="submit"
                color="primary"
                icon="add"
                :label="t('adminManage.masterData.inlineFormAdd')"
                unelevated
                class="full-width text-weight-bold"
                :loading="saving"
              />
            </div>
          </q-form>
        </q-card>

        <!-- Sub-Categories Scrollable List -->
        <div style="max-height: 320px; overflow-y: auto" class="q-pr-xs">
          <div v-if="categoryDrillDownItems.length === 0" class="text-center q-py-lg text-grey-6">
            <q-icon name="info" size="48px" class="q-mb-xs" />
            <div>{{ t('adminManage.masterData.noSubDefectsInCat') }}</div>
          </div>

          <q-list v-else separator rounded>
            <q-item v-for="item in categoryDrillDownItems" :key="item.subCategoryId" class="q-py-sm">
              <q-item-section avatar>
                <q-icon name="report_problem" color="orange-8" size="24px" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold text-dark">{{ item.name }}</q-item-label>
                <q-item-label caption>{{ item.nameEn || '-' }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row items-center">
                  <q-btn flat round dense color="blue" icon="edit" @click="openSubCategoryModal(item)" />
                  <q-btn flat round dense color="negative" icon="delete" @click="confirmDelete('subCategory', item.subCategoryId, item.name)" />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card>
    </q-dialog>

    <!-- Standard Creation/Edit Dialogs -->

    <!-- Dialog 1: Room Dialog -->
    <AdminMasterDataFormDialog
      v-model="showRoomModal"
      form-id="room-form"
      icon="meeting_room"
      :is-editing="isEdit"
      :saving="saving"
      :title="isEdit ? t('adminManage.masterData.editRoomTitle') : t('adminManage.masterData.addRoomTitle')"
      @submit="saveRoom"
    >
      <div>
        <div class="dialog-field-label">{{ t('adminManage.masterData.roomNameThLabel') }}</div>
        <q-input
          v-model="roomForm.roomName"
          outlined
          dense
          filled
          hide-bottom-space
          :rules="[(val) => !!val || t('adminManage.masterData.roomNameRequired')]"
        />
      </div>
      <div>
        <div class="dialog-field-label">{{ t('adminManage.masterData.roomNameEnLabel') }}</div>
        <q-input v-model="roomForm.roomNameEn" outlined dense filled hide-bottom-space />
      </div>
    </AdminMasterDataFormDialog>

    <!-- Dialog 2: SubRoom Dialog -->
    <AdminMasterDataFormDialog
      v-model="showSubRoomModal"
      form-id="sub-room-form"
      icon="sensor_door"
      :is-editing="isEdit"
      :saving="saving"
      :title="isEdit ? t('adminManage.masterData.editSubRoomTitle') : t('adminManage.masterData.addSubRoomTitle')"
      @submit="saveSubRoom"
    >
      <div>
        <div class="dialog-field-label">{{ t('adminManage.masterData.subRoomNameThLabel') }}</div>
        <q-input
          v-model="subRoomForm.roomName"
          outlined
          dense
          filled
          hide-bottom-space
          :rules="[(val) => !!val || t('adminManage.masterData.subRoomNameRequired')]"
        />
      </div>
      <div>
        <div class="dialog-field-label">{{ t('adminManage.masterData.subRoomNameEnLabel') }}</div>
        <q-input v-model="subRoomForm.roomNameEn" outlined dense filled hide-bottom-space />
      </div>
    </AdminMasterDataFormDialog>

    <!-- Dialog 3: Category Dialog -->
    <AdminMasterDataFormDialog
      v-model="showCategoryModal"
      form-id="category-form"
      icon="folder"
      :is-editing="isEdit"
      :saving="saving"
      :title="isEdit ? t('adminManage.masterData.editCategoryTitle') : t('adminManage.masterData.addCategoryTitle')"
      @submit="saveCategory"
    >
      <div>
        <div class="dialog-field-label">{{ t('adminManage.masterData.categoryNameThLabel') }}</div>
        <q-input
          v-model="categoryForm.name"
          outlined
          dense
          filled
          hide-bottom-space
          :rules="[(val) => !!val || t('adminManage.masterData.categoryNameRequired')]"
        />
      </div>
      <div>
        <div class="dialog-field-label">{{ t('adminManage.masterData.categoryNameEnLabel') }}</div>
        <q-input v-model="categoryForm.nameEn" outlined dense filled hide-bottom-space />
      </div>
    </AdminMasterDataFormDialog>

    <!-- Dialog 4: SubCategory Dialog -->
    <AdminMasterDataFormDialog
      v-model="showSubCategoryModal"
      form-id="sub-category-form"
      icon="report_problem"
      :is-editing="isEdit"
      :saving="saving"
      :title="isEdit ? t('adminManage.masterData.editSubCategoryTitle') : t('adminManage.masterData.addSubCategoryTitle')"
      @submit="saveSubCategory"
    >
      <div>
        <div class="dialog-field-label">{{ t('adminManage.masterData.parentCategoryLabel') }}</div>
        <q-select
          v-model="subCategoryForm.categoryId"
          :options="categoryOptions"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          outlined
          dense
          filled
          hide-bottom-space
          :rules="[(val) => !!val || t('adminManage.masterData.parentCategoryRequired')]"
        />
      </div>
      <div>
        <div class="dialog-field-label">{{ t('adminManage.masterData.subCategoryNameThLabel') }}</div>
        <q-input
          v-model="subCategoryForm.name"
          outlined
          dense
          filled
          hide-bottom-space
          :rules="[(val) => !!val || t('adminManage.masterData.subCategoryNameRequired')]"
        />
      </div>
      <div>
        <div class="dialog-field-label">{{ t('adminManage.masterData.subCategoryNameEnLabel') }}</div>
        <q-input v-model="subCategoryForm.nameEn" outlined dense filled hide-bottom-space />
      </div>
    </AdminMasterDataFormDialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import IconBounceSpinner from 'src/components/IconBounceSpinner.vue';
import AdminMasterDataCard from 'src/components/AdminMasterDataCard.vue';
import AdminMasterDataFormDialog from 'src/components/AdminMasterDataFormDialog.vue';
import { useMasterDataStore } from 'src/stores/useMasterData';
import type {
  Room,
  SubRoom,
  DefectCategory,
  DefectSubCategory,
} from 'src/types/master-data';

const { t, locale } = useI18n({ useScope: 'global' });
const $q = useQuasar();
const store = useMasterDataStore();

type TabType = 'defectCategories' | 'rooms' | 'subRooms' | 'defectSubCategories';

const activeTab = ref<TabType>('defectCategories');
const searchQuery = ref('');
const selectedCategoryFilter = ref<number | 'ALL'>('ALL');
const saving = ref(false);
const initialLoading = ref(true);
const isEdit = ref(false);
const editId = ref<number | null>(null);

// Pagination States
const itemsPerPage = 25;
const pageCategories = ref(1);
const pageRooms = ref(1);
const pageSubRooms = ref(1);
const pageSubCategories = ref(1);

// Drill-down dialog state
const showCategoryDrillDownDialog = ref(false);
const selectedCategoryForDrillDown = ref<DefectCategory | null>(null);
const inlineSubCategoryForm = ref({ name: '', nameEn: '' });

// Standard Modals
const showRoomModal = ref(false);
const showSubRoomModal = ref(false);
const showCategoryModal = ref(false);
const showSubCategoryModal = ref(false);

// Forms
const roomForm = ref({ roomName: '', roomNameEn: '' });
const subRoomForm = ref({ roomName: '', roomNameEn: '' });
const categoryForm = ref({ name: '', nameEn: '' });
const subCategoryForm = ref({ name: '', nameEn: '', categoryId: null as number | null });

onMounted(async () => {
  try {
    await store.fetchAll();
  } finally {
    initialLoading.value = false;
  }
});

// Reset pagination pages on search or tab change
watch([searchQuery, activeTab, selectedCategoryFilter], () => {
  pageCategories.value = 1;
  pageRooms.value = 1;
  pageSubRooms.value = 1;
  pageSubCategories.value = 1;
});

const categoryOptions = computed(() => {
  return store.defectCategories.map((cat) => ({
    label: cat.name + (cat.nameEn ? ` (${cat.nameEn})` : ''),
    value: cat.categoryId,
  }));
});

const categoryOptionsWithAll = computed(() => {
  void locale.value;
  return [
    { label: t('adminManage.masterData.allCategories'), value: 'ALL' as const },
    ...categoryOptions.value,
  ];
});

// Filtered Lists
const filteredCategories = computed(() => {
  if (!searchQuery.value) return store.defectCategories;
  const q = searchQuery.value.toLowerCase();
  return store.defectCategories.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (c.nameEn && c.nameEn.toLowerCase().includes(q))
  );
});

const filteredRooms = computed(() => {
  if (!searchQuery.value) return store.rooms;
  const q = searchQuery.value.toLowerCase();
  return store.rooms.filter(
    (r) =>
      r.roomName.toLowerCase().includes(q) ||
      (r.roomNameEn && r.roomNameEn.toLowerCase().includes(q))
  );
});

const filteredSubRooms = computed(() => {
  if (!searchQuery.value) return store.subRooms;
  const q = searchQuery.value.toLowerCase();
  return store.subRooms.filter(
    (sr) =>
      sr.roomName.toLowerCase().includes(q) ||
      (sr.roomNameEn && sr.roomNameEn.toLowerCase().includes(q))
  );
});

const filteredSubCategories = computed(() => {
  let list = store.defectSubCategories;

  if (selectedCategoryFilter.value !== 'ALL') {
    list = list.filter(
      (sc) => sc.category?.categoryId === selectedCategoryFilter.value
    );
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(
      (sc) =>
        sc.name.toLowerCase().includes(q) ||
        (sc.nameEn && sc.nameEn.toLowerCase().includes(q)) ||
        (sc.category?.name && sc.category.name.toLowerCase().includes(q))
    );
  }

  return list;
});

// Paginated Lists & Max Pages
const maxPageCategories = computed(() => Math.ceil(filteredCategories.value.length / itemsPerPage) || 1);
const paginatedCategories = computed(() => {
  const start = (pageCategories.value - 1) * itemsPerPage;
  return filteredCategories.value.slice(start, start + itemsPerPage);
});

const maxPageRooms = computed(() => Math.ceil(filteredRooms.value.length / itemsPerPage) || 1);
const paginatedRooms = computed(() => {
  const start = (pageRooms.value - 1) * itemsPerPage;
  return filteredRooms.value.slice(start, start + itemsPerPage);
});

const maxPageSubRooms = computed(() => Math.ceil(filteredSubRooms.value.length / itemsPerPage) || 1);
const paginatedSubRooms = computed(() => {
  const start = (pageSubRooms.value - 1) * itemsPerPage;
  return filteredSubRooms.value.slice(start, start + itemsPerPage);
});

const maxPageSubCategories = computed(() => Math.ceil(filteredSubCategories.value.length / itemsPerPage) || 1);
const paginatedSubCategories = computed(() => {
  const start = (pageSubCategories.value - 1) * itemsPerPage;
  return filteredSubCategories.value.slice(start, start + itemsPerPage);
});

// Category Drilldown Items
const categoryDrillDownItems = computed(() => {
  if (!selectedCategoryForDrillDown.value) return [];
  return store.defectSubCategories.filter(
    (sc) => sc.category?.categoryId === selectedCategoryForDrillDown.value?.categoryId
  );
});

function getSubCategoriesCount(categoryId: number) {
  return store.defectSubCategories.filter(
    (sc) => sc.category?.categoryId === categoryId
  ).length;
}

function getCategoryName(categoryId?: number) {
  if (!categoryId) return '';
  const found = store.defectCategories.find((c) => c.categoryId === categoryId);
  return found?.name || '';
}

// Top "+ เพิ่มข้อมูล" Handler based on active tab
function handleAddNew() {
  if (activeTab.value === 'rooms') openRoomModal();
  else if (activeTab.value === 'subRooms') openSubRoomModal();
  else if (activeTab.value === 'defectCategories') openCategoryModal();
  else if (activeTab.value === 'defectSubCategories') openSubCategoryModal();
}

// Open Category Drill Down Dialog
function openCategoryDrillDown(cat: DefectCategory) {
  selectedCategoryForDrillDown.value = cat;
  inlineSubCategoryForm.value = { name: '', nameEn: '' };
  showCategoryDrillDownDialog.value = true;
}

// Inline Add Sub Category inside Drill Down Dialog
async function handleInlineAddSubCategory() {
  if (!selectedCategoryForDrillDown.value) return;
  saving.value = true;
  try {
    await store.createDefectSubCategory({
      name: inlineSubCategoryForm.value.name,
      nameEn: inlineSubCategoryForm.value.nameEn,
      categoryId: selectedCategoryForDrillDown.value.categoryId,
    });
    inlineSubCategoryForm.value = { name: '', nameEn: '' };
    $q.notify({ type: 'positive', message: t('adminManage.masterData.notifyInlineAddSuccess') });
  } catch (err: unknown) {
    console.error(err);
    $q.notify({ type: 'negative', message: t('adminManage.masterData.notifySaveError') });
  } finally {
    saving.value = false;
  }
}

// 1. Rooms Dialog
function openRoomModal(row?: Room) {
  if (row) {
    isEdit.value = true;
    editId.value = row.roomId;
    roomForm.value = { roomName: row.roomName, roomNameEn: row.roomNameEn || '' };
  } else {
    isEdit.value = false;
    editId.value = null;
    roomForm.value = { roomName: '', roomNameEn: '' };
  }
  showRoomModal.value = true;
}

async function saveRoom() {
  saving.value = true;
  try {
    if (isEdit.value && editId.value) {
      await store.updateRoom(editId.value, roomForm.value);
      $q.notify({ type: 'positive', message: t('adminManage.masterData.notifySaveRoomSuccessEdit') });
    } else {
      await store.createRoom(roomForm.value);
      $q.notify({ type: 'positive', message: t('adminManage.masterData.notifySaveRoomSuccessAdd') });
    }
    showRoomModal.value = false;
  } catch (err: unknown) {
    console.error(err);
    $q.notify({ type: 'negative', message: t('adminManage.masterData.notifySaveError') });
  } finally {
    saving.value = false;
  }
}

// 2. SubRooms Dialog
function openSubRoomModal(row?: SubRoom) {
  if (row) {
    isEdit.value = true;
    editId.value = row.subRoomId;
    subRoomForm.value = { roomName: row.roomName, roomNameEn: row.roomNameEn || '' };
  } else {
    isEdit.value = false;
    editId.value = null;
    subRoomForm.value = { roomName: '', roomNameEn: '' };
  }
  showSubRoomModal.value = true;
}

async function saveSubRoom() {
  saving.value = true;
  try {
    if (isEdit.value && editId.value) {
      await store.updateSubRoom(editId.value, subRoomForm.value);
      $q.notify({ type: 'positive', message: t('adminManage.masterData.notifySaveSubRoomSuccessEdit') });
    } else {
      await store.createSubRoom(subRoomForm.value);
      $q.notify({ type: 'positive', message: t('adminManage.masterData.notifySaveSubRoomSuccessAdd') });
    }
    showSubRoomModal.value = false;
  } catch (err: unknown) {
    console.error(err);
    $q.notify({ type: 'negative', message: t('adminManage.masterData.notifySaveError') });
  } finally {
    saving.value = false;
  }
}

// 3. Category Dialog
function openCategoryModal(row?: DefectCategory) {
  if (row) {
    isEdit.value = true;
    editId.value = row.categoryId;
    categoryForm.value = { name: row.name, nameEn: row.nameEn || '' };
  } else {
    isEdit.value = false;
    editId.value = null;
    categoryForm.value = { name: '', nameEn: '' };
  }
  showCategoryModal.value = true;
}

async function saveCategory() {
  saving.value = true;
  try {
    if (isEdit.value && editId.value) {
      await store.updateDefectCategory(editId.value, categoryForm.value);
      $q.notify({ type: 'positive', message: t('adminManage.masterData.notifySaveCatSuccessEdit') });
    } else {
      await store.createDefectCategory(categoryForm.value);
      $q.notify({ type: 'positive', message: t('adminManage.masterData.notifySaveCatSuccessAdd') });
    }
    showCategoryModal.value = false;
  } catch (err: unknown) {
    console.error(err);
    $q.notify({ type: 'negative', message: t('adminManage.masterData.notifySaveError') });
  } finally {
    saving.value = false;
  }
}

// 4. SubCategory Dialog
function openSubCategoryModal(row?: DefectSubCategory) {
  if (row) {
    isEdit.value = true;
    editId.value = row.subCategoryId;
    subCategoryForm.value = {
      name: row.name,
      nameEn: row.nameEn || '',
      categoryId: row.category?.categoryId || null,
    };
  } else {
    isEdit.value = false;
    editId.value = null;
    subCategoryForm.value = {
      name: '',
      nameEn: '',
      categoryId: store.defectCategories[0]?.categoryId || null,
    };
  }
  showSubCategoryModal.value = true;
}

async function saveSubCategory() {
  if (!subCategoryForm.value.categoryId) {
    $q.notify({ type: 'warning', message: t('adminManage.masterData.parentCategoryRequired') });
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value && editId.value) {
      await store.updateDefectSubCategory(editId.value, {
        name: subCategoryForm.value.name,
        nameEn: subCategoryForm.value.nameEn,
        categoryId: subCategoryForm.value.categoryId,
      });
      $q.notify({ type: 'positive', message: t('adminManage.masterData.notifySaveSubCatSuccessEdit') });
    } else {
      await store.createDefectSubCategory({
        name: subCategoryForm.value.name,
        nameEn: subCategoryForm.value.nameEn,
        categoryId: subCategoryForm.value.categoryId,
      });
      $q.notify({ type: 'positive', message: t('adminManage.masterData.notifySaveSubCatSuccessAdd') });
    }
    showSubCategoryModal.value = false;
  } catch (err: unknown) {
    console.error(err);
    $q.notify({ type: 'negative', message: t('adminManage.masterData.notifySaveError') });
  } finally {
    saving.value = false;
  }
}

// Delete Confirmation
function confirmDelete(type: 'room' | 'subRoom' | 'category' | 'subCategory', id: number, name: string) {
  $q.dialog({
    title: t('adminManage.masterData.confirmDeleteTitle'),
    message: t('adminManage.masterData.confirmDeleteMsg', { name }),
    cancel: true,
    persistent: true,
    ok: { label: t('adminManage.masterData.confirmDeleteBtn'), color: 'negative', flat: true },
  }).onOk(() => {
    void (async () => {
      try {
        if (type === 'room') await store.deleteRoom(id);
        else if (type === 'subRoom') await store.deleteSubRoom(id);
        else if (type === 'category') await store.deleteDefectCategory(id);
        else if (type === 'subCategory') await store.deleteDefectSubCategory(id);

        $q.notify({ type: 'positive', message: t('adminManage.masterData.notifyDeleteSuccess') });
      } catch (err: unknown) {
        console.error(err);
        $q.notify({ type: 'negative', message: t('adminManage.masterData.notifyDeleteError') });
      }
    })();
  });
}
</script>

<style scoped>
.admin-master-data-page {
  max-width: 1200px;
  margin: 0 auto;
}

.header-bg {
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
}

.action-btn-primary {
  height: 42px;
  border-radius: 14px;
  font-weight: 600;
  font-size: 13px;
}

/* ธีมสีต่อหมวด: ห้องหลัก=ฟ้า, ห้องย่อย=เขียวเทอร์คอยส์, ประเภทงาน=ม่วง, ตำหนิย่อย=ส้ม */
.theme-rooms {
  --tone: #1976d2;
  --tone-soft: #e3f2fd;
  --tone-dark: #0d47a1;
}

.theme-subrooms {
  --tone: #00897b;
  --tone-soft: #e0f2f1;
  --tone-dark: #00695c;
}

.theme-categories {
  --tone: #5e35b1;
  --tone-soft: #ede7f6;
  --tone-dark: #4527a0;
}

.theme-subcats {
  --tone: #ef6c00;
  --tone-soft: #fff3e0;
  --tone-dark: #e65100;
}

.tone-avatar {
  background: var(--tone-soft);
  color: var(--tone);
}

.tone-btn {
  color: var(--tone);
}

.tone-text {
  color: var(--tone-dark);
}

.kpi-card {
  height: 100%;
  background: #ffffff;
  border-radius: 16px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
}

.kpi-col {
  min-width: 0;
}

/* มือถือ: การ์ด KPI ทั้งหมดอยู่แถวเดียวกัน จัดเนื้อหาเป็นแนวตั้งให้พอดีความกว้าง */
@media (max-width: 599.98px) {
  .kpi-row {
    --kpi-gap: 6px;
    margin-left: calc(-1 * var(--kpi-gap));
  }
  .kpi-row > .kpi-col {
    padding-left: var(--kpi-gap);
  }
  .kpi-row .q-card__section {
    flex-direction: column;
    justify-content: center;
    text-align: center;
    padding: 8px 2px;
  }
  .kpi-row .q-avatar {
    font-size: 30px !important;
  }
  .kpi-row .q-card__section > div:not(.q-avatar) {
    margin-left: 0;
    margin-top: 4px;
    min-width: 0;
    width: 100%;
  }
  .kpi-row .text-caption {
    font-size: 10px;
    line-height: 1.25;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .kpi-row .text-h6 {
    font-size: 1rem;
    line-height: 1.3;
  }
}

.kpi-card.kpi-card--active {
  outline: 2px solid var(--tone);
  outline-offset: -1px;
  background: var(--tone-soft);
}

.kpi-card.kpi-card--active .tone-avatar {
  background: #ffffff;
}

.kpi-card:focus-visible {
  outline: 2px solid var(--tone);
  outline-offset: 2px;
}

.kpi-card.cursor-pointer {
  user-select: none;
  -webkit-user-select: none;
  caret-color: transparent;
  -webkit-tap-highlight-color: transparent;
}

.search-input {
  background: #ffffff;
  border-radius: 24px;
  padding: 4px 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.shrink-0 {
  flex-shrink: 0;
}

.tag-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 6px;
  font-variant-numeric: tabular-nums;
}

.sheet-handle {
  width: 40px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  margin: 0 auto 12px;
}

.gap-xs {
  gap: 4px;
}

.gap-sm {
  gap: 8px;
}
</style>
