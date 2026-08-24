<template>
  <q-page class="bg-grey-3 row justify-center">
    <div
      class="bg-white relative-position"
      :style="{
        width: '100%',
        maxWidth: isMobile ? '430px' : '800px',
        minHeight: '100vh',
        boxShadow: '0 0 20px rgba(0,0,0,0.1)',
      }"
    >
      <div
        v-if="route.path.includes('/admin')"
        class="row items-center q-pt-md q-pb-sm q-px-md relative-position"
      >
        <q-btn flat round dense icon="arrow_back_ios_new" color="primary" @click="router.back()" />
        <div class="text-h6 text-weight-bold q-ml-sm text-primary">สรุปรายงานการตรวจ</div>
      </div>
      <div v-else class="row items-center justify-between q-pb-md q-px-md relative-position"></div>

      <div class="q-px-lg q-pb-xl col column">
        <div class="text-weight-bold q-mb-md" style="font-size: 18px">
          {{ answeredCount }}/{{ totalOptions }}
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

            <q-card>
              <q-card-section>
                <div v-for="template in cat.templates" :key="template.templateId" class="q-mb-md">
                  <div class="text-weight-bold q-mb-sm" style="font-size: 14px">
                    {{ template.label }}
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
                        @update:model-value="toggleOption(template.templateId, opt.optionId)"
                      />
                    </div>

                    <!-- Radio -->
                    <q-option-group
                      v-else
                      :options="options.map((o) => ({ label: o.value, value: o.optionId }))"
                      :model-value="getSelected(template.templateId, groupName)"
                      type="radio"
                      @update:model-value="selectOption(template.templateId, $event, groupName)"
                    />
                  </div>

                  <!-- Detail Value -->
                  <q-input
                    v-model="detailValues[template.templateId]"
                    outlined
                    dense
                    placeholder="หมายเหตุเพิ่มเติม"
                    class="q-mt-sm"
                  />

                  <!-- Photo Evidence -->
                  <div class="q-mt-sm photo-evidence-box q-pa-sm">
                    <div class="row items-center justify-between q-mb-sm">
                      <div class="row items-center q-gutter-x-xs">
                        <q-icon name="photo_camera" size="18px" color="grey-7" />
                        <span class="text-caption text-grey-7">รูปหลักฐาน</span>
                      </div>
                      <div class="row items-center q-gutter-x-xs">
                        <span class="text-caption text-grey-6"
                          >{{ photos[template.templateId]?.length ?? 0 }}/{{ MAX_PHOTOS }}</span
                        >
                        <q-badge
                          :color="isPhotoComplete(template.templateId) ? 'positive' : 'negative'"
                          :label="isPhotoComplete(template.templateId) ? 'ครบแล้ว' : 'รูปยังไม่ครบ'"
                          rounded
                        />
                      </div>
                    </div>

                    <div class="row q-gutter-sm items-start photo-row">
                      <!-- Camera / Gallery: ซ่อนเมื่อครบ MAX_PHOTOS แล้ว -->
                      <template v-if="!isPhotoLimitReached(template.templateId)">
                        <q-btn
                          outline
                          color="grey-6"
                          icon="photo_camera"
                          class="photo-add-btn"
                          @click="triggerFileInput(template.templateId, 'camera')"
                        />
                        <q-btn
                          outline
                          color="grey-6"
                          icon="image"
                          class="photo-add-btn"
                          @click="triggerFileInput(template.templateId, 'gallery')"
                        />
                      </template>

                      <!-- Thumbnails -->
                      <div
                        v-for="(photo, idx) in photos[template.templateId]"
                        :key="idx"
                        class="relative-position photo-thumb-wrap"
                      >
                        <q-img :src="photo.url" class="photo-thumb" ratio="1" />
                        <q-btn
                          round
                          dense
                          size="xs"
                          color="negative"
                          icon="close"
                          class="absolute-top-right photo-remove-btn"
                          @click="() => void removePhoto(template.templateId, idx)"
                        />
                      </div>
                    </div>

                    <!-- hidden native inputs -->
                    <input
                      :ref="(el) => setFileInputRef(el, template.templateId, 'camera')"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      class="hidden-file-input"
                      @change="(e) => handleFileChange(template.templateId, e)"
                    />
                    <input
                      :ref="(el) => setFileInputRef(el, template.templateId, 'gallery')"
                      type="file"
                      accept="image/*"
                      multiple
                      class="hidden-file-input"
                      @change="(e) => handleFileChange(template.templateId, e)"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </div>
      </div>

      <div class="q-px-lg q-pb-xl">
        <q-btn
          color="primary"
          label="บันทึกรายงาน"
          class="full-width q-py-md"
          style="border-radius: 12px; font-size: 16px"
          @click="saveAll"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import type { InspectionSummaryItem, SummaryTemplate, SummaryTemplateOption } from 'src/models';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const isMobile = computed(() => $q.screen.lt.md);
const roundId = route.params.roundId as string;
const loading = ref(true);

const templates = ref<SummaryTemplate[]>([]);
const summaryItems = ref<InspectionSummaryItem[]>([]);
const selectedOptions = ref<Record<string, number[]>>({});
const detailValues = ref<Record<number, string>>({});

// --- Photo evidence: รองรับทั้งรูปที่มีอยู่แล้วบน server (id + url) และรูปที่เพิ่งเลือกในเครื่อง (file + url) ---
interface PhotoItem {
  id?: number; // มีค่า = item ที่ save ไว้แล้วบน server, ไม่มี = ยังไม่ได้ upload
  file?: File; // มีค่าเฉพาะรูปที่เพิ่งเลือกในเซสชันนี้ ยังไม่ได้ upload
  url: string; // preview (local) หรือ URL เต็มจาก server
}
const photos = ref<Record<number, PhotoItem[]>>({});
const fileInputRefs: Record<string, HTMLInputElement | null> = {};
const apiBaseUrl = (import.meta.env.VITE_API_URL as string) ?? '';

const MAX_PHOTOS = 3; // จำกัดสูงสุด 3 รูปต่อจุด (ตาม mockup)
const MIN_PHOTOS = 3; // ต้องมีอย่างน้อย 3 รูปต่อจุดที่ "ต้องมีรูป" เท่านั้น

// template บางอันอาจไม่มีช่องอัปโหลดรูปเลย (ไม่มี option ประเภท photo)
// เช่นนั้นไม่ต้องบังคับ MIN_PHOTOS กับ template นั้น
function photoOptionOf(templateId: number) {
  const template = templates.value.find((t) => t.templateId === templateId);
  return template?.options.find((o) => o.type === 'photo');
}

function requiresPhoto(templateId: number) {
  return photoOptionOf(templateId) !== undefined;
}

// นับ "อัปโหลดแล้ว/ต้องถ่ายทั้งหมด" ของทั้งหมวด (รวมทุก template ในหมวดที่ต้องมีรูป)
// ใช้กับ badge บนหัวข้อ accordion ที่ยังไม่ได้กาง เช่น "5/18"
function categoryPhotoStats(categoryTemplates: SummaryTemplate[]) {
  let uploaded = 0;
  let required = 0;

  for (const template of categoryTemplates) {
    if (!requiresPhoto(template.templateId)) continue;
    required += MIN_PHOTOS;
    uploaded += Math.min(photos.value[template.templateId]?.length ?? 0, MIN_PHOTOS);
  }

  return { uploaded, required };
}

// ฟังก์ชันสำหรับเช็คว่าหมวดหมู่นั้นอัปโหลดรูปครบหรือยัง (เพื่อเปลี่ยนเป็นสีเขียว)
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
  return (photos.value[templateId]?.length ?? 0) >= MAX_PHOTOS;
}

function handleFileChange(templateId: number, event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  if (!photos.value[templateId]) photos.value[templateId] = [];

  const currentCount = photos.value[templateId]?.length ?? 0;
  const remaining = MAX_PHOTOS - currentCount;

  if (remaining <= 0) {
    $q.notify({ type: 'warning', message: `เพิ่มรูปได้สูงสุด ${MAX_PHOTOS} รูปต่อจุด` });
    input.value = '';
    return;
  }

  const filesToAdd = Array.from(input.files).slice(0, remaining);
  if (input.files.length > remaining) {
    $q.notify({ type: 'warning', message: `เพิ่มรูปได้สูงสุด ${MAX_PHOTOS} รูปต่อจุด เลือกได้อีก ${remaining} รูป` });
  }

  filesToAdd.forEach((file) => {
    const url = URL.createObjectURL(file);
    photos.value[templateId]?.push({ file, url });
  });

  input.value = ''; // allow selecting the same file again later
}

async function removePhoto(templateId: number, idx: number) {
  const item = photos.value[templateId]?.[idx];
  if (!item) return;

  if (item.id) {
    // รูปนี้ save ไว้บน server แล้ว ต้องลบจริงผ่าน API ไม่ใช่แค่เอาออกจาก array ในเครื่อง
    try {
      await api.delete(`/inspection-summary-items/${item.id}`);
    } catch (error) {
      console.error('Remove photo error:', error);
      $q.notify({ type: 'negative', message: 'ลบรูปไม่สำเร็จ' });
      return; // ลบไม่สำเร็จ อย่าเพิ่งเอาออกจาก UI
    }
  } else if (item.file) {
    URL.revokeObjectURL(item.url); // local preview เท่านั้นที่ต้อง revoke
  }

  photos.value[templateId]?.splice(idx, 1);
}

function isPhotoComplete(templateId: number) {
  if (!requiresPhoto(templateId)) return true;
  return (photos.value[templateId]?.length ?? 0) >= MIN_PHOTOS;
}
// --- end photo evidence ---

async function fetchTemplates() {
  const res = await api.get('/summary-templates');
  templates.value = res.data;
}

async function fetchSummaryItems() {
  const res = await api.get(`/inspection-summary-items/round/${roundId}`);
  summaryItems.value = res.data;

  // reset ก่อน
  selectedOptions.value = {};
  detailValues.value = {};
  photos.value = {};

  res.data.forEach((item: InspectionSummaryItem) => {
    const opt = item.option;
    const templateId = item.template.templateId;

    // รูปหลักฐาน: แยกไปที่ photos state ไม่ปนกับคำตอบ radio/checkbox หรือ note
    if (opt.type === 'photo') {
      if (!photos.value[templateId]) photos.value[templateId] = [];
      photos.value[templateId]?.push({
        id: item.itemId,
        url: `${apiBaseUrl}${item.detailValue}`,
      });
      return;
    }

    if (opt.type === 'checkbox') {
      const key = String(templateId);
      if (!selectedOptions.value[key]) selectedOptions.value[key] = [];
      selectedOptions.value[key]?.push(opt.optionId);
    } else {
      const key = `${templateId}-${opt.group}`;
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

const totalOptions = computed(() => templates.value.length);

const answeredCount = computed(() => {
  return templates.value.filter((t) => {
    const key = String(t.templateId);
    const hasCheckbox = (selectedOptions.value[key]?.length ?? 0) > 0;
    const hasRadio = Object.keys(selectedOptions.value)
      .filter((k) => k.startsWith(`${t.templateId}-`))
      .some((k) => (selectedOptions.value[k]?.length ?? 0) > 0);
    return hasCheckbox || hasRadio;
  }).length;
});

function groupOptions(options: SummaryTemplateOption[]) {
  const groups: Record<string, SummaryTemplateOption[]> = {};
  options
    .filter((opt) => opt.type !== 'photo') // option ประเภท photo แสดงในกล่อง "รูปหลักฐาน" แยกต่างหากอยู่แล้ว
    .forEach((opt) => {
      const g = opt.group || 'ทั่วไป';
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

function toggleOption(templateId: number, optionId: number) {
  const key = String(templateId);
  if (!selectedOptions.value[key]) selectedOptions.value[key] = [];
  const idx = selectedOptions.value[key].indexOf(optionId);
  if (idx >= 0) selectedOptions.value[key].splice(idx, 1);
  else selectedOptions.value[key].push(optionId);
}

function selectOption(templateId: number, optionId: number, group: string) {
  const key = `${templateId}-${group}`;
  selectedOptions.value[key] = [optionId];
}

async function executeSaveAll() {
  $q.loading.show();

  try {
    await api.delete(`/inspection-summary-items/round/${roundId}`);

    for (const template of templates.value) {
      const allSelected = [
        ...(selectedOptions.value[String(template.templateId)] ?? []),
        ...Object.entries(selectedOptions.value)
          .filter(([k]) => k.startsWith(`${template.templateId}-`))
          .flatMap(([, v]) => v),
      ];

      for (const optionId of allSelected) {
        await api.post('/inspection-summary-items', {
          roundId: Number(roundId),
          templateId: template.templateId,
          optionId,
          detailValue: detailValues.value[template.templateId] ?? '',
        });
      }
    }

    for (const [templateIdStr, items] of Object.entries(photos.value)) {
      const templateId = Number(templateIdStr);
      const photoOption = photoOptionOf(templateId);
      if (!photoOption) continue; // template นี้ไม่มีช่องรูป ข้ามไป

      for (const photo of items) {
        if (!photo.file) continue; // มี id แปลว่า save ไว้บน server แล้ว ไม่ต้อง upload ซ้ำ

        const formData = new FormData();
        formData.append('file', photo.file);
        formData.append('roundId', roundId);
        formData.append('templateId', templateIdStr);
        formData.append('optionId', String(photoOption.optionId));
        await api.post('/inspection-summary-items/photo', formData);
      }
    }

    await api.patch(`/inspection-rounds/${roundId}/confirm-summary`);

    $q.notify({ type: 'positive', message: 'บันทึกสำเร็จ', position: 'top' });
    router.back();
  } catch (error) {
    console.error('Save error:', error);
    $q.notify({ type: 'negative', message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
  } finally {
    $q.loading.hide();
  }
}

function saveAll() {
  // เช็ครูปหลักฐาน: ถ้ายังไม่ครบ แจ้งเตือนไว้ก่อน แต่ไม่บล็อกการ save
  // (ให้ save เป็น draft แล้วมาถ่ายรูปต่อทีหลังได้)
  const missingPhotos = templates.value.filter((t) => !isPhotoComplete(t.templateId));

  if (missingPhotos.length > 0) {
    $q.notify({
      type: 'warning',
      message: `ยังมีรูปหลักฐานไม่ครบ ${MIN_PHOTOS} รูป อีก ${missingPhotos.length} รายการ`,
      caption: missingPhotos.map((t) => t.label).join(', '),
    });
  }

  $q.dialog({
    title: 'ยืนยันการบันทึกรายงาน',
    message: 'ต้องการบันทึกข้อมูลรายงานใช่หรือไม่ ? (สามารถบันทึกเพื่อกลับมาทำต่อภายหลังได้)',
    ok: {
      label: 'ยืนยัน',
      color: 'primary',
    },
    cancel: {
      label: 'ยกเลิก',
      color: 'grey-7',
      flat: true,
    },
    persistent: true,
  }).onOk(() => {
    void executeSaveAll();
  });
}

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([fetchTemplates(), fetchSummaryItems()]);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.custom-expansion {
  border: 1px solid #1975d2;
  border-radius: 8px;
  background-color: white;
}

.photo-evidence-box {
  border: 1px dashed #ccc;
  border-radius: 8px;
  background-color: #fafafa;
}

.photo-row {
  flex-wrap: nowrap;
}

.photo-add-btn {
  flex: 1 1 0;
  aspect-ratio: 1 / 1;
  height: auto;
  min-width: 0;
  border-radius: 8px;
}

.photo-thumb-wrap {
  flex: 1 1 0;
  min-width: 0;
}

.photo-thumb {
  width: 100%;
  border-radius: 8px;
  object-fit: cover;
}

.photo-remove-btn {
  position: absolute;
  top: -6px;
  right: -6px;
}

.hidden-file-input {
  display: none;
}
</style>
