<template>
  <div :class="horizontal ? 'row no-wrap items-start q-col-gutter-sm' : 'column q-gutter-y-sm'">
    <div :class="horizontal ? 'col' : ''">
      <div v-if="thLabel" class="dialog-field-label">{{ thLabel }}</div>
      <q-input
        :model-value="th"
        :placeholder="thPlaceholder"
        v-bind="inputProps"
        :rules="[(val: string) => !!val?.trim() || thRequiredMessage]"
        @update:model-value="onInput('th', $event)"
      />
    </div>

    <!-- ปุ่มแปลตรงกลาง: ลูกศรบอกทิศทางที่จะแปล (พิมพ์ไทย → ใส่ช่องอังกฤษ / พิมพ์อังกฤษ → ใส่ช่องไทย) -->
    <div :class="horizontal ? 'col-auto self-start' : 'self-center'">
      <q-btn
        unelevated
        rounded
        dense
        no-caps
        color="primary"
        class="q-px-md"
        :icon="arrowIcon"
        :label="t('adminManage.masterData.translateBtn')"
        :loading="translating"
        @click="translate"
      >
        <q-tooltip>
          {{
            direction === 'th'
              ? t('adminManage.masterData.translateTooltipToTh')
              : t('adminManage.masterData.translateTooltipToEn')
          }}
        </q-tooltip>
      </q-btn>
    </div>

    <div :class="horizontal ? 'col' : ''">
      <div v-if="enLabel" class="dialog-field-label">{{ enLabel }}</div>
      <q-input
        :model-value="en"
        :placeholder="enPlaceholder"
        v-bind="inputProps"
        :rules="[(val: string) => !!val?.trim() || t('adminManage.masterData.nameEnRequired')]"
        @update:model-value="onInput('en', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { api } from 'src/boot/axios';

// ช่องชื่อไทย + อังกฤษของ master data (ทั้งสองบังคับกรอก) พร้อมปุ่มแปลสองทางตรงกลาง
// ทิศทางตามช่องที่ผู้ใช้พิมพ์ล่าสุด: พิมพ์ช่องไทย → แปลใส่ช่องอังกฤษ, พิมพ์ช่องอังกฤษ → แปลใส่ช่องไทย
// ผลแปลเป็นแค่ค่าเริ่มต้น แอดมินแก้ต่อได้ก่อนบันทึก
type Field = 'th' | 'en';

const props = defineProps<{
  th: string;
  en: string;
  thRequiredMessage: string;
  thLabel?: string;
  enLabel?: string;
  thPlaceholder?: string;
  enPlaceholder?: string;
  horizontal?: boolean;
  dense?: boolean;
  filled?: boolean;
  bgColor?: string;
}>();

const emit = defineEmits<{
  (e: 'update:th', value: string): void;
  (e: 'update:en', value: string): void;
}>();

const { t } = useI18n({ useScope: 'global' });
const $q = useQuasar();
const translating = ref(false);
const lastEdited = ref<Field | null>(null);

const inputProps = computed(() => ({
  outlined: true,
  hideBottomSpace: true,
  dense: props.dense ?? false,
  filled: props.filled ?? false,
  bgColor: props.bgColor,
}));

function setField(field: Field, value: string) {
  if (field === 'th') emit('update:th', value);
  else emit('update:en', value);
}

function onInput(field: Field, value: string | number | null) {
  lastEdited.value = field;
  setField(field, String(value ?? ''));
}

// ช่องที่จะเป็นต้นทางของการแปล: ช่องที่พิมพ์ล่าสุดถ้ามีข้อความ ไม่งั้นช่องที่มีข้อความอยู่
// (เปิดแก้ record เดิมที่มีครบสองช่อง และยังไม่ได้พิมพ์อะไร → ถือไทยเป็นต้นทาง)
const direction = computed<Field>(() => {
  const hasTh = props.th.trim() !== '';
  const hasEn = props.en.trim() !== '';
  if (lastEdited.value === 'en' && hasEn) return 'th';
  if (lastEdited.value === 'th' && hasTh) return 'en';
  if (hasEn && !hasTh) return 'th';
  return 'en';
});

// direction = ช่องปลายทาง
const arrowIcon = computed(() => {
  if (props.horizontal) return direction.value === 'en' ? 'arrow_forward' : 'arrow_back';
  return direction.value === 'en' ? 'arrow_downward' : 'arrow_upward';
});

async function translate() {
  const target = direction.value;
  const text = (target === 'en' ? props.th : props.en).trim();
  if (!text) {
    $q.notify({ type: 'warning', message: t('adminManage.masterData.translateNeedText') });
    return;
  }

  translating.value = true;
  try {
    const res = await api.post<{ text: string }>('/translate', { text, target });
    setField(target, res.data.text);
  } catch {
    $q.notify({ type: 'negative', message: t('adminManage.masterData.translateFailed') });
  } finally {
    translating.value = false;
  }
}
</script>
