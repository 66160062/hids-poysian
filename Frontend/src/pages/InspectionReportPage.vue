<template>
  <q-page class="bg-grey-1 row justify-center">
    <div class="bg-white relative-position detail-card">
      <!-- ปุ่มย้อนกลับ/หัวข้ออยู่ที่ layout แล้ว (InspectorScreen / AdminInspectionScreen) -->
      <div class="row items-center justify-between q-pb-md q-px-md relative-position"></div>

      <div class="q-px-lg q-pb-xl col column">
        <div class="row items-center justify-between q-mb-md">
          <div class="text-weight-bold" style="font-size: 18px">
            {{ answeredCount }}/{{ totalOptions }}
          </div>

          <div
            v-if="!isLocked"
            class="autosave"
            :class="`autosave--${autosaveState}`"
            role="status"
            aria-live="polite"
          >
            <q-spinner v-if="autosaveState === 'saving'" size="14px" />
            <q-icon v-else :name="autosaveState === 'error' ? 'cloud_off' : 'cloud_done'" size="16px" />
            <span>{{ autosaveLabel }}</span>
            <button
              v-if="autosaveState === 'error'"
              type="button"
              class="autosave__retry"
              @click="retryPendingSaves"
            >
              {{ t('inspection.report.retry') }}
            </button>
          </div>
        </div>

        <div class="q-gutter-y-md">
          <q-expansion-item
            v-for="(cat, index) in groupedTemplates"
            :key="index"
            class="custom-expansion"
            expand-icon-class="text-primary"
            expand-icon="expand_more"
          >
            <template v-slot:header>
              <q-item-section>
                <div class="text-primary text-weight-bold" style="font-size: 15px">
                  {{ cat.category }}
                </div>
              </q-item-section>
              <q-item-section side>
                <div class="row items-center q-gutter-x-xs category-photo-badge">
                  <!-- เปลี่ยนสีไอคอนเมื่ออัปโหลดครบ -->
                  <q-icon
                    name="photo_camera"
                    size="16px"
                    :color="isCategoryPhotoComplete(cat.templates) ? 'positive' : 'negative'"
                  />
                  <!-- เปลี่ยนสีข้อความเมื่ออัปโหลดครบ -->
                  <span
                    class="text-weight-bold"
                    :class="isCategoryPhotoComplete(cat.templates) ? 'text-positive' : 'text-negative'"
                    style="font-size: 13px"
                  >
                    {{ categoryPhotoStats(cat.templates).uploaded }}/{{
                      categoryPhotoStats(cat.templates).required
                    }}
                  </span>
                </div>
              </q-item-section>
            </template>

            <q-card flat>
              <q-card-section>
                <div v-for="template in cat.templates" :key="template.templateId" class="template-block">
                  <div class="row items-center no-wrap q-mb-sm" style="gap: 6px">
                    <q-icon
                      :name="isTemplateAnswered(template) ? 'check_circle' : 'radio_button_unchecked'"
                      :color="isTemplateAnswered(template) ? 'positive' : 'grey-5'"
                      size="18px"
                    />
                    <div class="text-weight-bold" style="font-size: 14px">
                      {{ template.label }}
                    </div>
                  </div>

                  <!-- Group options -->
                  <div
                    v-for="(options, groupName) in groupOptions(template.options)"
                    :key="groupName"
                    class="q-mb-sm"
                  >
                    <div class="text-grey-7 text-caption q-mb-xs">{{ groupName }}</div>

                    <!-- Checkbox -->
                    <div v-if="options[0]?.type === 'checkbox'" class="row q-gutter-sm">
                      <q-checkbox
                        v-for="opt in options"
                        :key="opt.optionId"
                        :label="opt.value"
                        :model-value="isSelected(template.templateId, opt.optionId)"
                        :disable="isLocked"
                        @update:model-value="toggleOption(template.templateId, opt.optionId)"
                      />
                    </div>

                    <!-- Radio -->
                    <q-option-group
                      v-else
                      :options="options.map((o) => ({ label: o.value, value: o.optionId }))"
                      :model-value="getSelected(template.templateId, groupName)"
                      type="radio"
                      :disable="isLocked"
                      @update:model-value="selectOption(template.templateId, $event, groupName)"
                    />
                  </div>

                  <!-- Detail Value -->
                  <q-input
                    v-model="detailValues[template.templateId]"
                    outlined
                    dense
                    :placeholder="t('inspection.report.additionalNote')"
                    class="q-mt-sm"
                    :disable="isLocked"
                    @update:model-value="scheduleAnswersSave(NOTE_SAVE_DELAY_MS)"
                  />

                  <!-- Photo Evidence -->
                  <section class="photo-slots">
                    <div class="photo-slots__head">
                      <span class="photo-slots__title">{{ t('inspection.report.photos') }}</span>
                      <span
                        class="photo-slots__count"
                        :class="{ 'is-complete': isPhotoComplete(template.templateId) }"
                      >
                        {{ photosOf(template.templateId).length }}/{{ MAX_PHOTOS }}
                      </span>
                    </div>

                    <div class="photo-slots__grid">
                      <div
                        v-for="photo in photosOf(template.templateId)"
                        :key="photo.key"
                        class="photo-slot"
                        :class="{ 'is-error': photo.status === 'error' }"
                      >
                        <button
                          type="button"
                          class="photo-slot__view"
                          :aria-label="t('inspection.report.viewPhoto')"
                          @click="openPhotoViewer(template.templateId, photo.key)"
                        >
                          <img :src="photo.url" alt="" class="photo-slot__img" />
                        </button>

                        <div v-if="photo.status === 'uploading'" class="photo-slot__overlay">
                          <q-spinner size="22px" />
                        </div>
                        <button
                          v-else-if="photo.status === 'error'"
                          type="button"
                          class="photo-slot__overlay photo-slot__overlay--error"
                          @click="uploadPhoto(template.templateId, photo)"
                        >
                          <q-icon name="refresh" size="20px" />
                          <span>{{ t('inspection.report.retry') }}</span>
                        </button>

                        <button
                          v-if="!isLocked && photo.status !== 'uploading'"
                          type="button"
                          class="photo-slot__remove"
                          :aria-label="t('inspection.report.removePhoto')"
                          @click="confirmRemovePhoto(template.templateId, photo)"
                        >
                          <q-icon name="close" size="16px" />
                        </button>
                      </div>

                      <button
                        v-if="!isLocked && !isPhotoLimitReached(template.templateId)"
                        type="button"
                        class="photo-slot photo-slot--add"
                      >
                        <q-icon name="add_a_photo" size="22px" />
                        <span>{{ t('inspection.report.addPhoto') }}</span>

                        <q-menu class="no-shadow photo-menu" anchor="bottom left" self="top left">
                          <q-list dense style="min-width: 180px">
                            <q-item
                              v-close-popup
                              clickable
                              @click="triggerFileInput(template.templateId, 'camera')"
                            >
                              <q-item-section avatar>
                                <q-icon name="photo_camera" size="20px" />
                              </q-item-section>
                              <q-item-section>{{ t('inspection.report.takePhoto') }}</q-item-section>
                            </q-item>
                            <q-item
                              v-close-popup
                              clickable
                              @click="triggerFileInput(template.templateId, 'gallery')"
                            >
                              <q-item-section avatar>
                                <q-icon name="photo_library" size="20px" />
                              </q-item-section>
                              <q-item-section>{{ t('inspection.report.chooseFromGallery') }}</q-item-section>
                            </q-item>
                          </q-list>
                        </q-menu>
                      </button>

                      <div
                        v-for="n in emptySlotCount(template.templateId)"
                        :key="`empty-${n}`"
                        class="photo-slot photo-slot--empty"
                        aria-hidden="true"
                      />
                    </div>

                    <!-- hidden native inputs -->
                    <input
                      :ref="(el) => setFileInputRef(el, template.templateId, 'camera')"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      capture="environment"
                      class="hidden-file-input"
                      @change="(e) => handleFileChange(template.templateId, e)"
                    />
                    <input
                      :ref="(el) => setFileInputRef(el, template.templateId, 'gallery')"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      class="hidden-file-input"
                      @change="(e) => handleFileChange(template.templateId, e)"
                    />
                  </section>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </div>
      </div>

      <div v-if="!isLocked" class="q-px-lg q-pb-xl">
        <q-btn
          unelevated
          color="primary"
          :label="t('inspection.report.saveReport')"
          :disable="!canSubmit"
          class="full-width q-py-md"
          style="border-radius: 12px; font-size: 16px"
          @click="saveAll"
        />
        <div v-if="submitBlockedReason" class="submit-hint">{{ submitBlockedReason }}</div>
      </div>
    </div>

    <q-dialog v-model="viewerOpen" maximized transition-show="fade" transition-hide="fade">
      <div class="photo-viewer">
        <div class="photo-viewer__bar">
          <span class="photo-viewer__count">{{ viewerIndex + 1 }}/{{ viewerPhotos.length }}</span>
          <q-btn
            v-close-popup
            flat
            round
            dense
            icon="close"
            color="white"
            :aria-label="t('inspection.report.closeViewer')"
          />
        </div>

        <q-carousel
          v-model="viewerSlide"
          swipeable
          animated
          :arrows="viewerPhotos.length > 1"
          control-color="white"
          transition-prev="slide-right"
          transition-next="slide-left"
          height="100%"
          class="photo-viewer__carousel"
        >
          <q-carousel-slide
            v-for="photo in viewerPhotos"
            :key="photo.key"
            :name="photo.key"
            class="photo-viewer__slide"
          >
            <img :src="photo.url" alt="" class="photo-viewer__img" />
          </q-carousel-slide>
        </q-carousel>
      </div>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { useRoundLock } from 'src/composables/useRoundLock';
import { createIconSpinner } from 'src/composables/useIconSpinner';
import ConfirmActionDialog from 'src/components/ConfirmActionDialog.vue';
import type { InspectionSummaryItem, SummaryTemplate, SummaryTemplateOption } from 'src/models';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const roundId = route.params.roundId as string;
const summaryReportSpinner = createIconSpinner('summarize');
const saveReportSpinner = createIconSpinner('cloud_upload');
const { isLocked, fetchLockState } = useRoundLock(roundId);

const templates = ref<SummaryTemplate[]>([]);
const selectedOptions = ref<Record<string, number[]>>({});
const detailValues = ref<Record<number, string>>({});

const ANSWER_SAVE_DELAY_MS = 400;
const NOTE_SAVE_DELAY_MS = 1000;

// --- Photo evidence ---
interface PhotoItem {
  key: string;
  id?: number; // มีค่า = อยู่บน server แล้ว
  file?: File; // เก็บไว้เพื่อ retry ถ้าอัปโหลดไม่สำเร็จ
  url: string;
  status: 'uploaded' | 'uploading' | 'error';
}
const photos = ref<Record<number, PhotoItem[]>>({});
const fileInputRefs: Record<string, HTMLInputElement | null> = {};
let localPhotoSeq = 0;

const MAX_PHOTOS = 3; // ต้องตรงกับ MAX_PHOTOS_PER_TEMPLATE ฝั่ง backend
const MIN_PHOTOS = 3;

function photosOf(templateId: number) {
  return photos.value[templateId] ?? [];
}

function uploadedCount(templateId: number) {
  return photosOf(templateId).filter((p) => p.status === 'uploaded').length;
}

function emptySlotCount(templateId: number) {
  const addSlot = !isLocked.value && !isPhotoLimitReached(templateId) ? 1 : 0;
  return Math.max(MAX_PHOTOS - photosOf(templateId).length - addSlot, 0);
}

function categoryPhotoStats(categoryTemplates: SummaryTemplate[]) {
  let uploaded = 0;
  let required = 0;

  for (const template of categoryTemplates) {
    required += MIN_PHOTOS;
    uploaded += Math.min(uploadedCount(template.templateId), MIN_PHOTOS);
  }

  return { uploaded, required };
}

function isCategoryPhotoComplete(categoryTemplates: SummaryTemplate[]) {
  const stats = categoryPhotoStats(categoryTemplates);
  return stats.required > 0 && stats.uploaded >= stats.required;
}

function setFileInputRef(el: unknown, templateId: number, type: 'camera' | 'gallery') {
  fileInputRefs[`${templateId}-${type}`] = el as HTMLInputElement | null;
}

function triggerFileInput(templateId: number, type: 'camera' | 'gallery') {
  fileInputRefs[`${templateId}-${type}`]?.click();
}

function isPhotoLimitReached(templateId: number) {
  return photosOf(templateId).length >= MAX_PHOTOS;
}

function isPhotoComplete(templateId: number) {
  return uploadedCount(templateId) >= MIN_PHOTOS;
}

async function handleFileChange(templateId: number, event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = ''; // allow selecting the same file again later
  if (files.length === 0) return;

  if (!photos.value[templateId]) photos.value[templateId] = [];
  const list = photos.value[templateId];

  const remaining = MAX_PHOTOS - list.length;
  if (remaining <= 0) {
    $q.notify({ type: 'warning', message: t('inspection.report.photoLimit', { max: MAX_PHOTOS }) });
    return;
  }
  if (files.length > remaining) {
    $q.notify({
      type: 'warning',
      message: t('inspection.report.photoLimitRemaining', { max: MAX_PHOTOS, remaining }),
    });
  }

  // push แล้วอ่านกลับจาก list เพื่อได้ reactive proxy — แก้ status ทีหลังแล้ว UI จะอัปเดต
  const added = files.slice(0, remaining).map((file) => {
    list.push({ key: `local-${++localPhotoSeq}`, file, url: URL.createObjectURL(file), status: 'uploading' });
    return list[list.length - 1]!;
  });

  // ทีละรูป: backend นับจำนวนก่อน insert ถ้ายิงพร้อมกันอาจหลุดเกิน limit ได้
  for (const photo of added) {
    await uploadPhoto(templateId, photo);
  }
}

async function uploadPhoto(templateId: number, photo: PhotoItem) {
  if (!photo.file) return;

  photo.status = 'uploading';
  const formData = new FormData();
  formData.append('file', photo.file);
  formData.append('roundId', roundId);
  formData.append('templateId', String(templateId));

  try {
    const { data } = await api.post<InspectionSummaryItem>('/inspection-summary-items/photo', formData);
    photo.id = data.itemId;
    photo.status = 'uploaded';
  } catch (error) {
    console.error('Upload photo error:', error);
    photo.status = 'error';
  }
}

const viewerOpen = ref(false);
const viewerTemplateId = ref<number | null>(null);
const viewerSlide = ref('');
const viewerPhotos = computed(() =>
  viewerTemplateId.value === null ? [] : photosOf(viewerTemplateId.value),
);
const viewerIndex = computed(() =>
  Math.max(viewerPhotos.value.findIndex((p) => p.key === viewerSlide.value), 0),
);

function openPhotoViewer(templateId: number, photoKey: string) {
  viewerTemplateId.value = templateId;
  viewerSlide.value = photoKey;
  viewerOpen.value = true;
}

function confirmRemovePhoto(templateId: number, photo: PhotoItem) {
  $q.dialog({
    component: ConfirmActionDialog,
    componentProps: {
      title: t('inspection.report.removePhotoTitle'),
      message: t('inspection.report.removePhotoMessage'),
      icon: '',
      color: 'negative',
      confirmLabel: t('inspection.report.removePhoto'),
      cancelLabel: t('inspection.report.cancel'),
    },
  }).onOk(() => {
    void removePhoto(templateId, photo);
  });
}

async function removePhoto(templateId: number, photo: PhotoItem) {
  if (photo.id) {
    try {
      await api.delete(`/inspection-summary-items/${photo.id}`);
    } catch (error) {
      console.error('Remove photo error:', error);
      $q.notify({ type: 'negative', message: t('inspection.report.removePhotoError') });
      return;
    }
  }

  if (photo.file) URL.revokeObjectURL(photo.url);
  const list = photos.value[templateId];
  const idx = list?.findIndex((p) => p.key === photo.key) ?? -1;
  if (idx >= 0) list?.splice(idx, 1);
}
// --- end photo evidence ---

async function fetchTemplates() {
  const res = await api.get('/summary-templates');
  templates.value = res.data;
}

async function fetchSummaryItems() {
  const res = await api.get(`/inspection-summary-items/round/${roundId}`);

  selectedOptions.value = {};
  detailValues.value = {};
  photos.value = {};

  res.data.forEach((item: InspectionSummaryItem) => {
    const opt = item.option;
    const templateId = item.template.templateId;

    if (item.photoUrl) {
      if (!photos.value[templateId]) photos.value[templateId] = [];
      photos.value[templateId]?.push({
        key: `server-${item.itemId}`,
        id: item.itemId,
        url: item.photoUrl,
        status: 'uploaded',
      });
      return;
    }
    if (!opt) return;

    if (opt.type === 'checkbox') {
      const key = String(templateId);
      if (!selectedOptions.value[key]) selectedOptions.value[key] = [];
      selectedOptions.value[key]?.push(opt.optionId);
    } else {
      // ต้องใช้ชื่อกลุ่มเดียวกับ groupOptions() ไม่งั้น option ที่ไม่มี group จะไม่แสดงว่าถูกเลือก
      const key = `${templateId}-${opt.group || t('inspection.report.generalGroup')}`;
      selectedOptions.value[key] = [opt.optionId];
    }

    if (item.detailValue) detailValues.value[templateId] = item.detailValue;
  });
}

const groupedTemplates = computed(() => {
  const groups: Record<string, { category: string; templates: SummaryTemplate[] }> = {};
  templates.value.forEach((t) => {
    if (!groups[t.category]) groups[t.category] = { category: t.category, templates: [] };
    groups[t.category]?.templates.push(t);
  });
  return Object.values(groups);
});

function groupOptions(options: SummaryTemplateOption[]) {
  const groups: Record<string, SummaryTemplateOption[]> = {};
  options.forEach((opt) => {
    const g = opt.group || t('inspection.report.generalGroup');
    if (!groups[g]) groups[g] = [];
    groups[g].push(opt);
  });
  return groups;
}

function isSelected(templateId: number, optionId: number) {
  return selectedOptions.value[templateId]?.includes(optionId) ?? false;
}

function getSelected(templateId: number, group: string) {
  const key = `${templateId}-${group}`;
  return selectedOptions.value[key]?.[0] ?? null;
}

// ครบ = ทุกกลุ่มในหัวข้อถูกติ้ก (radio เลือกแล้ว 1 ตัว, checkbox ติ้กอย่างน้อย 1 ตัวในกลุ่มนั้น)
function isTemplateAnswered(template: SummaryTemplate) {
  return Object.entries(groupOptions(template.options)).every(([groupName, options]) =>
    options[0]?.type === 'checkbox'
      ? options.some((o) => isSelected(template.templateId, o.optionId))
      : getSelected(template.templateId, groupName) !== null,
  );
}

const totalOptions = computed(() => templates.value.length);
const answeredCount = computed(() => templates.value.filter(isTemplateAnswered).length);

function toggleOption(templateId: number, optionId: number) {
  const key = String(templateId);
  if (!selectedOptions.value[key]) selectedOptions.value[key] = [];
  const idx = selectedOptions.value[key].indexOf(optionId);
  if (idx >= 0) selectedOptions.value[key].splice(idx, 1);
  else selectedOptions.value[key].push(optionId);
  scheduleAnswersSave();
}

function selectOption(templateId: number, optionId: number, group: string) {
  const key = `${templateId}-${group}`;
  selectedOptions.value[key] = [optionId];
  scheduleAnswersSave();
}

function buildAnswerItems() {
  return templates.value.flatMap((template) => {
    const allSelected = [
      ...(selectedOptions.value[String(template.templateId)] ?? []),
      ...Object.entries(selectedOptions.value)
        .filter(([k]) => k.startsWith(`${template.templateId}-`))
        .flatMap(([, v]) => v),
    ];

    return allSelected.map((optionId) => ({
      templateId: template.templateId,
      optionId,
      detailValue: detailValues.value[template.templateId] ?? '',
    }));
  });
}

// --- Autosave คำตอบ ---
// PUT แทนที่คำตอบทั้งรอบ (backend ทำใน transaction และไม่แตะแถวรูป) จึงยิงซ้ำได้ปลอดภัย
// แต่ต้องไม่ให้ 2 request วิ่งซ้อนกัน ไม่งั้นอันเก่าอาจเขียนทับอันใหม่
const answersDirty = ref(false);
const isSavingAnswers = ref(false);
const answersSaveFailed = ref(false);
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let answersSaveInFlight: Promise<void> | null = null;

function scheduleAnswersSave(delay = ANSWER_SAVE_DELAY_MS) {
  if (isLocked.value) return;
  answersDirty.value = true;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void flushAnswers();
  }, delay);
}

async function flushAnswers(): Promise<boolean> {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  while (answersSaveInFlight) await answersSaveInFlight;
  if (!answersDirty.value) return !answersSaveFailed.value;

  answersDirty.value = false;
  answersSaveFailed.value = false;
  isSavingAnswers.value = true;

  answersSaveInFlight = api
    .put(`/inspection-summary-items/round/${roundId}`, { items: buildAnswerItems() })
    .then(() => undefined)
    .catch((error) => {
      console.error('Autosave error:', error);
      answersDirty.value = true;
      answersSaveFailed.value = true;
    })
    .finally(() => {
      isSavingAnswers.value = false;
      answersSaveInFlight = null;
    });

  await answersSaveInFlight;
  return !answersSaveFailed.value;
}

const allPhotos = computed(() => Object.values(photos.value).flat());
const uploadingCount = computed(() => allPhotos.value.filter((p) => p.status === 'uploading').length);
const failedUploadCount = computed(() => allPhotos.value.filter((p) => p.status === 'error').length);

const autosaveState = computed<'saving' | 'error' | 'saved'>(() => {
  if (answersSaveFailed.value || failedUploadCount.value > 0) return 'error';
  if (isSavingAnswers.value || answersDirty.value || uploadingCount.value > 0) return 'saving';
  return 'saved';
});

const autosaveLabel = computed(() => {
  if (autosaveState.value === 'error') return t('inspection.report.autosaveFailed');
  if (autosaveState.value === 'saving') return t('inspection.report.autosaveSaving');
  return t('inspection.report.autosaveSaved');
});

function retryPendingSaves() {
  if (answersDirty.value) void flushAnswers();
  for (const [templateId, list] of Object.entries(photos.value)) {
    list.filter((p) => p.status === 'error').forEach((p) => void uploadPhoto(Number(templateId), p));
  }
}
// --- end autosave ---

const unansweredCount = computed(() => totalOptions.value - answeredCount.value);

const submitBlockedReason = computed(() => {
  if (templates.value.length === 0) return '';
  if (unansweredCount.value > 0) {
    return t('inspection.report.unansweredWarning', { count: unansweredCount.value });
  }
  if (uploadingCount.value > 0) return t('inspection.report.waitForUploads');
  if (failedUploadCount.value > 0) return t('inspection.report.fixFailedUploads');
  return '';
});

const canSubmit = computed(
  () => !isLocked.value && templates.value.length > 0 && submitBlockedReason.value === '',
);

async function executeSaveAll() {
  $q.loading.show({
    spinner: saveReportSpinner,
    spinnerColor: 'primary',
    spinnerSize: 70,
    backgroundColor: 'white',
  });

  try {
    answersDirty.value = true; // ส่งชุดล่าสุดอีกรอบก่อนยืนยัน เผื่อ autosave ครั้งก่อนพลาดไป
    const saved = await flushAnswers();
    if (!saved) throw new Error('Answers were not saved');

    await api.patch(`/inspection-rounds/${roundId}/confirm-summary`);

    $q.notify({ type: 'positive', message: t('inspection.report.saveSuccess'), position: 'top' });
    router.back();
  } catch (error) {
    console.error('Save error:', error);
    $q.notify({ type: 'negative', message: t('inspection.report.saveError') });
  } finally {
    $q.loading.hide();
  }
}

function saveAll() {
  if (!canSubmit.value) return;

  const missingPhotos = templates.value.filter((t) => !isPhotoComplete(t.templateId));
  if (missingPhotos.length > 0) {
    $q.notify({
      type: 'warning',
      message: t('inspection.report.missingPhotos', { min: MIN_PHOTOS, count: missingPhotos.length }),
      caption: missingPhotos.map((t) => t.label).join(', '),
    });
  }

  $q.dialog({
    component: ConfirmActionDialog,
    componentProps: {
      title: t('inspection.report.confirmSaveTitle'),
      message: t('inspection.report.confirmSaveMessage'),
      icon: '',
      color: 'primary',
      confirmLabel: t('inspection.report.confirm'),
      cancelLabel: t('inspection.report.cancel'),
    },
  }).onOk(() => {
    void executeSaveAll();
  });
}

onMounted(async () => {
  window.addEventListener('online', retryPendingSaves);

  $q.loading.show({
    spinner: summaryReportSpinner,
    spinnerColor: 'primary',
    spinnerSize: 70,
    backgroundColor: 'white',
  });
  try {
    await Promise.all([fetchTemplates(), fetchSummaryItems(), fetchLockState()]);
  } finally {
    $q.loading.hide();
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('online', retryPendingSaves);
  // ออกจากหน้าก่อน debounce ครบ: ยิงเลย ไม่งั้นติ้กสุดท้ายหาย
  if (saveTimer) void flushAnswers();
  allPhotos.value.forEach((p) => {
    if (p.file) URL.revokeObjectURL(p.url);
  });
});
</script>

<style scoped>
.detail-card {
  width: 100%;
  max-width: 480px;
  min-height: 100vh;
  border-left: 1px solid #e0e0e0;
  border-right: 1px solid #e0e0e0;
}
@media (min-width: 768px) {
  .detail-card {
    max-width: 720px;
  }
}
@media (min-width: 1024px) {
  .detail-card {
    max-width: 1100px;
  }
}
@media (min-width: 1440px) {
  .detail-card {
    max-width: 1280px;
  }
}

.custom-expansion {
  border: 1px solid #1975d2;
  border-radius: 8px;
  background-color: white;
}

.template-block + .template-block {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

/* ---------- autosave status ---------- */
.autosave {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}
.autosave--saved {
  color: #16a34a;
}
.autosave--error {
  color: #dc2626;
}
.autosave__retry {
  border: 0;
  padding: 0;
  background: none;
  font: inherit;
  font-weight: 600;
  color: #2563eb;
  text-decoration: underline;
  cursor: pointer;
}

/* ---------- photo slots ---------- */
.photo-slots {
  margin-top: 12px;
}

.photo-slots__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: calc(88px * 3 + 8px * 2);
  margin-bottom: 8px;
  font-size: 13px;
  color: #6b7280;
}

.photo-slots__count {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.photo-slots__count.is-complete {
  color: #16a34a;
}

.photo-slots__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 88px));
  gap: 8px;
}

.photo-slot {
  position: relative;
  aspect-ratio: 1 / 1;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f9fafb;
  font: inherit;
}
.photo-slot.is-error {
  border-color: #dc2626;
}

.photo-slot__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-slot__view {
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: none;
  cursor: zoom-in;
}
.photo-slot__view:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: -2px;
}

/* ---------- photo viewer ---------- */
.photo-viewer {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000000;
}

.photo-viewer__bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  color: #ffffff;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}

.photo-viewer__carousel {
  background: #000000;
}

.photo-viewer__slide {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 56px 0 24px;
}

.photo-viewer__img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.photo-slot--add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 1px dashed #93c5fd;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;
}
.photo-slot--add:hover {
  background: #dbeafe;
  border-color: #60a5fa;
}
.photo-slot--add:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.photo-slot--empty {
  border-style: dashed;
  background: transparent;
}

.photo-slot__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: 0;
  background: rgba(17, 24, 39, 0.45);
  color: #ffffff;
  font: inherit;
  font-size: 11px;
  font-weight: 600;
}
.photo-slot__overlay--error {
  background: rgba(220, 38, 38, 0.7);
  cursor: pointer;
}

.photo-slot__remove {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: rgba(17, 24, 39, 0.6);
  color: #ffffff;
  cursor: pointer;
}
.photo-slot__remove:hover {
  background: rgba(17, 24, 39, 0.8);
}
.photo-slot__remove:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: -4px;
}

.submit-hint {
  margin-top: 8px;
  text-align: center;
  font-size: 13px;
  color: #6b7280;
}

.hidden-file-input {
  display: none;
}
</style>

<style>
/* q-menu ถูก teleport ออกไปนอก component ทำให้ scoped style เข้าไม่ถึง */
.photo-menu {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}
</style>
