<template>
  <q-dialog :model-value="modelValue" position="bottom" @update:model-value="emit('update:modelValue', $event)">
    <q-card class="cr-sheet" role="dialog" aria-labelledby="cr-crew-sheet-title">
      <div class="cr-sheet__handle" aria-hidden="true" />
      <q-card-section class="row items-center q-pb-none">
        <h2 id="cr-crew-sheet-title" class="cr-sheet__title">
          {{ type === 'WORKER' ? t('construction.report.crew.pickWorker') : t('construction.report.crew.pickPersonnel') }}
        </h2>
        <q-space />
        <q-btn flat round icon="close" class="cr-tap" :aria-label="t('construction.report.crew.done')" v-close-popup />
      </q-card-section>
      <q-card-section class="q-pt-xs text-caption text-grey-8">{{ t('construction.report.crew.pickHint') }}</q-card-section>
      <q-card-section class="cr-sheet__body q-pt-none">
        <div class="cr-pick-grid">
          <button
            v-for="name in types"
            :key="name"
            type="button"
            class="cr-pick"
            :class="{ 'cr-pick--active': inList(name) }"
            :aria-pressed="inList(name)"
            @click="emit('toggle', name)"
          >
            <q-icon :name="inList(name) ? 'check_circle' : 'add_circle_outline'" size="20px" aria-hidden="true" />
            <span>{{ translatePersonnelType(name) }}</span>
          </button>
        </div>
      </q-card-section>
      <q-card-actions class="cr-sheet__actions">
        <q-btn unelevated no-caps color="primary" class="cr-primary-btn full-width" :label="t('construction.report.crew.done')" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePersonnelLabel } from 'src/composables/usePersonnelLabel';
import { PERSONNEL_TYPES, WORKER_TYPES } from 'src/composables/constructionReport/reportForm';
import type { CrewType } from 'src/composables/constructionReport/reportForm';

// เลือกตำแหน่งด้วยการกดครั้งเดียว (แทน dropdown + ปุ่มบันทึก) — กดซ้ำเพื่อเอาออก
const props = defineProps<{ modelValue: boolean; type: CrewType; selected: string[] }>();
const emit = defineEmits<{ 'update:modelValue': [open: boolean]; toggle: [name: string] }>();
const { t } = useI18n();
const { translatePersonnelType } = usePersonnelLabel();

const types = computed(() => (props.type === 'WORKER' ? WORKER_TYPES : PERSONNEL_TYPES));
function inList(name: string) {
  return props.selected.includes(name);
}
</script>

<style scoped>
.cr-pick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.cr-pick {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 52px;
  padding: 8px 10px;
  border: 1px solid #cfd8dc;
  border-radius: 10px;
  background: #fff;
  color: #37474f;
  font: inherit;
  font-size: 14px;
  line-height: 1.5;
  text-align: left;
  cursor: pointer;
}
.cr-pick:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}
.cr-pick--active {
  border: 2px solid var(--q-primary);
  background: #e3f2fd;
  color: var(--q-primary);
  font-weight: 600;
}
</style>
