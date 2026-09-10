<template>
  <q-page class="bg-grey-1 row justify-center">
    <div
      class="bg-white relative-position detail-card"
      :style="{
        width: '100%',
        maxWidth: isMobile ? '430px' : '800px',
        minHeight: '100vh',
      }"
    >
      <!-- ปุ่มย้อนกลับ/หัวข้ออยู่ที่ layout แล้ว (InspectorScreen / AdminInspectionScreen) -->
      <div class="row items-center justify-between q-pb-md q-px-md relative-position"></div>

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
                  />
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </div>
      </div>

      <div v-if="!isLocked" class="q-px-lg q-pb-xl">
        <q-btn
          color="primary"
          :label="t('inspection.report.saveReport')"
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
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { useRoundLock } from 'src/composables/useRoundLock';
import type { InspectionSummaryItem, SummaryTemplate, SummaryTemplateOption } from 'src/models';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const isMobile = computed(() => $q.screen.lt.md);
const roundId = route.params.roundId as string;
const { isLocked, fetchLockState } = useRoundLock(roundId);

const templates = ref<SummaryTemplate[]>([]);
const summaryItems = ref<InspectionSummaryItem[]>([]);
const selectedOptions = ref<Record<string, number[]>>({});
const detailValues = ref<Record<number, string>>({});

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

  res.data.forEach((item: InspectionSummaryItem) => {
    const opt = item.option;

    if (opt.type === 'checkbox') {
      const key = String(item.template.templateId);
      if (!selectedOptions.value[key]) selectedOptions.value[key] = [];
      selectedOptions.value[key]?.push(opt.optionId);
    } else {
      const key = `${item.template.templateId}-${opt.group}`;
      selectedOptions.value[key] = [opt.optionId];
    }

    if (item.detailValue) detailValues.value[item.template.templateId] = item.detailValue;
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
    const items = templates.value.flatMap((template) => {
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

    await api.put(`/inspection-summary-items/round/${roundId}`, { items });
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
  const unanswered = templates.value.filter((t) => {
    const groups = [...new Set(t.options.map((o) => o.group))];
    const allGroupsAnswered = groups.every((group) => {
      const groupOptions = t.options.filter((o) => o.group === group);
      if (groupOptions[0]?.type === 'checkbox') {
        return (selectedOptions.value[String(t.templateId)]?.length ?? 0) > 0;
      } else {
        const key = `${t.templateId}-${group}`;
        return (selectedOptions.value[key]?.length ?? 0) > 0;
      }
    });
    return !allGroupsAnswered;
  });

  // ถ้ายังมีข้อที่ไม่ได้ตอบ ให้แจ้งเตือนแล้วหยุดทำงานเลย (ไม่เปิด Dialog)
  if (unanswered.length > 0) {
    $q.notify({
      type: 'warning',
      message: t('inspection.report.unansweredWarning', { count: unanswered.length }),
      caption: unanswered.map((tpl) => tpl.label).join(', '),
    });
    return;
  }

  // ถ้าตอบครบแล้ว เปิด Dialog ยืนยัน
  $q.dialog({
    title: t('inspection.report.confirmSaveTitle'),
    message: t('inspection.report.confirmSaveMessage'),
    ok: {
      label: t('inspection.report.confirm'),
      color: 'primary',
    },
    cancel: {
      label: t('inspection.report.cancel'),
      color: 'grey-7',
      flat: true,
    },
    persistent: true,
  }).onOk(() => {
    // พอกดยืนยัน ค่อยเรียกฟังก์ชันบันทึก
    void executeSaveAll();
  });
}

onMounted(async () => {
  $q.loading.show();
  try {
    await Promise.all([fetchTemplates(), fetchSummaryItems(), fetchLockState()]);
  } finally {
    $q.loading.hide();
  }
});
</script>

<style scoped>
.detail-card {
  border-left: 1px solid #e0e0e0;
  border-right: 1px solid #e0e0e0;
}

.custom-expansion {
  border: 1px solid #1975d2;
  border-radius: 8px;
  background-color: white;
}
</style>
