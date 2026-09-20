<template>
  <q-page class="admin-master-data-page bg-grey-1 q-pb-xl">
    <!-- Header Section -->
    <div class="q-pa-md text-dark header-bg">
      <div class="q-mb-md">
        <div class="text-h6 text-weight-bold text-dark">
          {{ t('adminManage.masterData.title') }}
        </div>
        <div class="text-caption text-grey-7">
          {{ t('adminManage.masterData.subtitle') }}
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-6 col-sm-3">
          <q-card flat bordered class="kpi-card bg-white shadow-1">
            <q-card-section class="q-pa-sm row items-center no-wrap">
              <q-avatar color="blue-1" text-color="primary" icon="meeting_room" size="40px" />
              <div class="q-ml-sm">
                <div class="text-caption text-grey-7">{{ t('adminManage.masterData.kpiMainRooms') }}</div>
                <div class="text-h6 text-weight-bold text-dark">{{ store.rooms.length }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-sm-3">
          <q-card flat bordered class="kpi-card bg-white shadow-1">
            <q-card-section class="q-pa-sm row items-center no-wrap">
              <q-avatar color="teal-1" text-color="teal-9" icon="sensor_door" size="40px" />
              <div class="q-ml-sm">
                <div class="text-caption text-grey-7">{{ t('adminManage.masterData.kpiSubRooms') }}</div>
                <div class="text-h6 text-weight-bold text-dark">{{ store.subRooms.length }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-sm-3">
          <q-card flat bordered class="kpi-card bg-white shadow-1">
            <q-card-section class="q-pa-sm row items-center no-wrap">
              <q-avatar color="deep-purple-1" text-color="deep-purple-9" icon="category" size="40px" />
              <div class="q-ml-sm">
                <div class="text-caption text-grey-7">{{ t('adminManage.masterData.kpiCategories') }}</div>
                <div class="text-h6 text-weight-bold text-dark">{{ store.defectCategories.length }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-sm-3">
          <q-card flat bordered class="kpi-card bg-white shadow-1">
            <q-card-section class="q-pa-sm row items-center no-wrap">
              <q-avatar color="orange-1" text-color="orange-9" icon="format_list_bulleted" size="40px" />
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

        <q-btn
          unelevated
          rounded
          color="primary"
          icon="add"
          :label="t('adminManage.masterData.addNew')"
          class="q-px-md"
          @click="handleAddNew"
        />
      </div>

      <!-- Segment Filter Pills (Mobile Optimized) -->
      <div class="row q-gutter-x-xs no-wrap overflow-auto hide-scrollbar q-py-sm q-mt-xs scroll-container">
        <q-btn
          v-for="tab in tabOptions"
          :key="tab.value"
          unelevated
          rounded
          :color="activeTab === tab.value ? 'primary' : 'white'"
          :text-color="activeTab === tab.value ? 'white' : 'grey-8'"
          class="filter-chip shadow-1 shrink-0"
          no-caps
          @click="activeTab = tab.value"
        >
          <q-icon :name="tab.icon" size="18px" class="q-mr-xs" />
          <span class="text-weight-medium filter-text">{{ tab.label }}</span>
          <q-badge
            :color="activeTab === tab.value ? 'white' : 'blue-1'"
            :text-color="'primary'"
            rounded
            class="q-ml-xs text-bold"
          >
            {{ tab.count }}
          </q-badge>
        </q-btn>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="q-pa-md">
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
            <!-- Entire Card Clickable -->
            <q-card
              flat
              bordered
              class="category-card shadow-1 bg-white cursor-pointer ripple"
              @click="openCategoryDrillDown(cat)"
            >
              <q-card-section class="row items-center justify-between q-pb-xs">
                <div class="row items-center no-wrap col">
                  <q-avatar color="deep-purple-1" text-color="deep-purple-9" icon="folder" size="42px" />
                  <div class="q-ml-sm ellipsis">
                    <div class="text-subtitle1 text-weight-bold text-dark ellipsis">{{ cat.name }}</div>
                    <div class="text-caption text-grey-6 ellipsis">{{ cat.nameEn || '-' }}</div>
                  </div>
                </div>

                <div class="row items-center">
                  <q-btn
                    flat
                    round
                    dense
                    color="blue"
                    icon="edit"
                    @click.stop="openCategoryModal(cat)"
                  />
                  <q-btn
                    flat
                    round
                    dense
                    color="negative"
                    icon="delete"
                    @click.stop="confirmDelete('category', cat.categoryId, cat.name)"
                  />
                </div>
              </q-card-section>

              <q-separator class="q-my-xs" />

              <q-card-actions align="between" class="q-px-md q-py-sm">
                <q-chip color="teal-1" text-color="teal-9" dense class="text-weight-bold">
                  {{ t('adminManage.masterData.defectsCount', { count: getSubCategoriesCount(cat.categoryId) }) }}
                </q-chip>

                <div class="row items-center text-primary text-weight-bold text-caption">
                  {{ t('adminManage.masterData.tapToViewDefects') }}
                  <q-icon name="chevron_right" size="20px" />
                </div>
              </q-card-actions>
            </q-card>
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

        <div v-else class="row q-col-gutter-sm">
          <div
            v-for="room in paginatedRooms"
            :key="room.roomId"
            class="col-12 col-sm-6 col-md-4"
          >
            <q-card flat bordered class="data-item-card bg-white shadow-1">
              <q-item>
                <q-item-section avatar>
                  <q-avatar color="blue-1" text-color="primary" icon="meeting_room" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold text-dark">{{ room.roomName }}</q-item-label>
                  <q-item-label caption>{{ room.roomNameEn || '-' }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row items-center">
                    <q-btn flat round dense color="blue" icon="edit" @click="openRoomModal(room)" />
                    <q-btn flat round dense color="negative" icon="delete" @click="confirmDelete('room', room.roomId, room.roomName)" />
                  </div>
                </q-item-section>
              </q-item>
            </q-card>
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

        <div v-else class="row q-col-gutter-sm">
          <div
            v-for="subRoom in paginatedSubRooms"
            :key="subRoom.subRoomId"
            class="col-12 col-sm-6 col-md-4"
          >
            <q-card flat bordered class="data-item-card bg-white shadow-1">
              <q-item>
                <q-item-section avatar>
                  <q-avatar color="teal-1" text-color="teal-9" icon="sensor_door" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold text-dark">{{ subRoom.roomName }}</q-item-label>
                  <q-item-label caption>{{ subRoom.roomNameEn || '-' }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row items-center">
                    <q-btn flat round dense color="blue" icon="edit" @click="openSubRoomModal(subRoom)" />
                    <q-btn flat round dense color="negative" icon="delete" @click="confirmDelete('subRoom', subRoom.subRoomId, subRoom.roomName)" />
                  </div>
                </q-item-section>
              </q-item>
            </q-card>
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
        <!-- Filter Dropdown for Category -->
        <div class="row items-center justify-between q-mb-md">
          <q-select
            v-model="selectedCategoryFilter"
            :options="categoryOptionsWithAll"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            dense
            outlined
            rounded
            :label="t('adminManage.masterData.filterCategory')"
            bg-color="white"
            style="min-width: 220px"
          />
        </div>

        <div v-if="filteredSubCategories.length === 0" class="text-center q-py-xl text-grey-6">
          <q-icon name="format_list_bulleted" size="64px" class="q-mb-md" />
          <div>{{ t('adminManage.masterData.noSubCategoriesFound') }}</div>
        </div>

        <div v-else class="row q-col-gutter-sm">
          <div
            v-for="subCat in paginatedSubCategories"
            :key="subCat.subCategoryId"
            class="col-12 col-sm-6 col-md-4"
          >
            <q-card flat bordered class="data-item-card bg-white shadow-1">
              <q-item>
                <q-item-section avatar>
                  <q-avatar color="orange-1" text-color="orange-9" icon="report_problem" />
                </q-item-section>
                <q-item-section>
                  <!-- Soft Highlight Tag for Category Name -->
                  <div class="q-mb-xs">
                    <div class="category-highlight-tag row items-center no-wrap">
                      <q-icon name="folder" size="14px" class="q-mr-xs text-indigo-7" />
                      <span class="text-weight-bold text-indigo-9 ellipsis">
                        {{ subCat.category?.name || getCategoryName(subCat.category?.categoryId) || '-' }}
                      </span>
                    </div>
                  </div>

                  <q-item-label class="text-weight-bold text-dark">{{ subCat.name }}</q-item-label>
                  <q-item-label caption>{{ subCat.nameEn || '-' }}</q-item-label>
                </q-item-section>

                <q-item-section side>
                  <div class="row items-center">
                    <q-btn flat round dense color="blue" icon="edit" @click="openSubCategoryModal(subCat)" />
                    <q-btn flat round dense color="negative" icon="delete" @click="confirmDelete('subCategory', subCat.subCategoryId, subCat.name)" />
                  </div>
                </q-item-section>
              </q-item>
            </q-card>
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
    <q-dialog v-model="showRoomModal" persistent>
      <q-card style="min-width: 320px; max-width: 420px; width: 100%; border-radius: 16px">
        <q-card-section class="row items-center bg-primary text-white">
          <div class="text-subtitle1 text-weight-bold">
            {{ isEdit ? t('adminManage.masterData.editRoomTitle') : t('adminManage.masterData.addRoomTitle') }}
          </div>
          <q-space />
          <q-btn v-close-popup icon="close" flat round dense />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-form @submit="saveRoom">
            <q-input
              v-model="roomForm.roomName"
              :label="t('adminManage.masterData.roomNameThLabel')"
              outlined
              dense
              class="q-mb-md"
              :rules="[(val) => !!val || t('adminManage.masterData.roomNameRequired')]"
            />
            <q-input
              v-model="roomForm.roomNameEn"
              :label="t('adminManage.masterData.roomNameEnLabel')"
              outlined
              dense
              class="q-mb-md"
            />

            <div class="row justify-end gap-sm">
              <q-btn v-close-popup flat :label="t('adminManage.masterData.cancel')" color="grey" />
              <q-btn type="submit" :label="t('adminManage.masterData.save')" color="primary" unelevated :loading="saving" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Dialog 2: SubRoom Dialog -->
    <q-dialog v-model="showSubRoomModal" persistent>
      <q-card style="min-width: 320px; max-width: 420px; width: 100%; border-radius: 16px">
        <q-card-section class="row items-center bg-primary text-white">
          <div class="text-subtitle1 text-weight-bold">
            {{ isEdit ? t('adminManage.masterData.editSubRoomTitle') : t('adminManage.masterData.addSubRoomTitle') }}
          </div>
          <q-space />
          <q-btn v-close-popup icon="close" flat round dense />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-form @submit="saveSubRoom">
            <q-input
              v-model="subRoomForm.roomName"
              :label="t('adminManage.masterData.subRoomNameThLabel')"
              outlined
              dense
              class="q-mb-md"
              :rules="[(val) => !!val || t('adminManage.masterData.subRoomNameRequired')]"
            />
            <q-input
              v-model="subRoomForm.roomNameEn"
              :label="t('adminManage.masterData.subRoomNameEnLabel')"
              outlined
              dense
              class="q-mb-md"
            />

            <div class="row justify-end gap-sm">
              <q-btn v-close-popup flat :label="t('adminManage.masterData.cancel')" color="grey" />
              <q-btn type="submit" :label="t('adminManage.masterData.save')" color="primary" unelevated :loading="saving" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Dialog 3: Category Dialog -->
    <q-dialog v-model="showCategoryModal" persistent>
      <q-card style="min-width: 320px; max-width: 420px; width: 100%; border-radius: 16px">
        <q-card-section class="row items-center bg-primary text-white">
          <div class="text-subtitle1 text-weight-bold">
            {{ isEdit ? t('adminManage.masterData.editCategoryTitle') : t('adminManage.masterData.addCategoryTitle') }}
          </div>
          <q-space />
          <q-btn v-close-popup icon="close" flat round dense />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-form @submit="saveCategory">
            <q-input
              v-model="categoryForm.name"
              :label="t('adminManage.masterData.categoryNameThLabel')"
              outlined
              dense
              class="q-mb-md"
              :rules="[(val) => !!val || t('adminManage.masterData.categoryNameRequired')]"
            />
            <q-input
              v-model="categoryForm.nameEn"
              :label="t('adminManage.masterData.categoryNameEnLabel')"
              outlined
              dense
              class="q-mb-md"
            />

            <div class="row justify-end gap-sm">
              <q-btn v-close-popup flat :label="t('adminManage.masterData.cancel')" color="grey" />
              <q-btn type="submit" :label="t('adminManage.masterData.save')" color="primary" unelevated :loading="saving" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Dialog 4: SubCategory Dialog -->
    <q-dialog v-model="showSubCategoryModal" persistent>
      <q-card style="min-width: 320px; max-width: 420px; width: 100%; border-radius: 16px">
        <q-card-section class="row items-center bg-primary text-white">
          <div class="text-subtitle1 text-weight-bold">
            {{ isEdit ? t('adminManage.masterData.editSubCategoryTitle') : t('adminManage.masterData.addSubCategoryTitle') }}
          </div>
          <q-space />
          <q-btn v-close-popup icon="close" flat round dense />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-form @submit="saveSubCategory">
            <q-select
              v-model="subCategoryForm.categoryId"
              :options="categoryOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              :label="t('adminManage.masterData.parentCategoryLabel')"
              outlined
              dense
              class="q-mb-md"
              :rules="[(val) => !!val || t('adminManage.masterData.parentCategoryRequired')]"
            />

            <q-input
              v-model="subCategoryForm.name"
              :label="t('adminManage.masterData.subCategoryNameThLabel')"
              outlined
              dense
              class="q-mb-md"
              :rules="[(val) => !!val || t('adminManage.masterData.subCategoryNameRequired')]"
            />

            <q-input
              v-model="subCategoryForm.nameEn"
              :label="t('adminManage.masterData.subCategoryNameEnLabel')"
              outlined
              dense
              class="q-mb-md"
            />

            <div class="row justify-end gap-sm">
              <q-btn v-close-popup flat :label="t('adminManage.masterData.cancel')" color="grey" />
              <q-btn type="submit" :label="t('adminManage.masterData.save')" color="primary" unelevated :loading="saving" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
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
const isEdit = ref(false);
const editId = ref<number | null>(null);

// Pagination States
const itemsPerPage = 9;
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

onMounted(() => {
  void store.fetchAll();
});

// Reset pagination pages on search or tab change
watch([searchQuery, activeTab, selectedCategoryFilter], () => {
  pageCategories.value = 1;
  pageRooms.value = 1;
  pageSubRooms.value = 1;
  pageSubCategories.value = 1;
});

const tabOptions = computed<{ value: TabType; label: string; icon: string; count: number }[]>(() => {
  void locale.value;
  return [
    { value: 'defectCategories', label: t('adminManage.masterData.tabCategories'), icon: 'category', count: store.defectCategories.length },
    { value: 'rooms', label: t('adminManage.masterData.tabRooms'), icon: 'meeting_room', count: store.rooms.length },
    { value: 'subRooms', label: t('adminManage.masterData.tabSubRooms'), icon: 'sensor_door', count: store.subRooms.length },
    { value: 'defectSubCategories', label: t('adminManage.masterData.tabAllSubCategories'), icon: 'format_list_bulleted', count: store.defectSubCategories.length },
  ];
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

.kpi-card {
  border-radius: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
}

.search-input {
  background: #ffffff;
  border-radius: 24px;
  padding: 4px 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.scroll-container {
  max-width: 100%;
}

.filter-chip {
  min-height: 42px;
  padding: 6px 14px;
  border-radius: 21px;
  white-space: nowrap;
  font-size: 13px;
  transition: all 0.2s ease;
}

.filter-text {
  white-space: nowrap;
}

.shrink-0 {
  flex-shrink: 0;
}

.category-card {
  border-radius: 20px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.category-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1) !important;
}

.data-item-card {
  border-radius: 16px;
}

.category-highlight-tag {
  background-color: #eef2ff;
  color: #3730a3;
  border-radius: 8px;
  padding: 2px 8px;
  font-size: 12px;
  display: inline-flex;
  max-width: 100%;
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

.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
