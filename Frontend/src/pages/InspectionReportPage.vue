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
      message: `ยังไม่ได้กรอกข้อมูลอีก ${unanswered.length} รายการ`,
      caption: unanswered.map((t) => t.label).join(', '),
    });
    return;
  }

  // ถ้าตอบครบแล้ว เปิด Dialog ยืนยัน
  $q.dialog({
    title: 'ยืนยันการบันทึกรายงาน',
    message: 'ข้อมูลครบถ้วนและต้องการบันทึกสรุปรายงาน ?',
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
    // พอกดยืนยัน ค่อยเรียกฟังก์ชันบันทึก
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
</style>
