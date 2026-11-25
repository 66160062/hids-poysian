<template>
  <div class="column q-gutter-y-lg">
    <div v-if="previousCrewSummary" class="cr-card cr-card--info">
      <div class="row items-center no-wrap q-gutter-x-sm">
        <q-icon name="groups" size="28px" color="primary" aria-hidden="true" />
        <div class="col">
          <div class="text-weight-bold">{{ t('construction.report.crew.previousTitle') }}</div>
          <div class="text-caption text-grey-8">{{ t('construction.report.crew.previousSummary', previousCrewSummary) }}</div>
        </div>
      </div>
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="content_copy"
        :label="t('construction.report.crew.copyPrevious')"
        class="full-width q-mt-sm cr-tap-btn"
        @click="copyPrevious"
      />
    </div>

    <section v-for="group in groups" :key="group.type" :aria-labelledby="`cr-crew-${group.type}`">
      <div class="row items-baseline justify-between">
        <h2 :id="`cr-crew-${group.type}`" class="cr-section-title">{{ group.title }}</h2>
        <span v-if="group.items.length" class="text-caption text-grey-8">{{ t('construction.report.crew.total', { count: group.total }) }}</span>
      </div>
      <div v-if="group.items.length === 0" class="text-grey-7 q-mb-sm">{{ t('construction.report.crew.emptyPeople') }}</div>
      <div v-for="c in group.items" :key="c.id" class="cr-card q-mb-sm">
        <div class="row items-center no-wrap">
          <div class="col text-weight-bold cr-row-name">{{ translatePersonnelType(c.name) }}</div>
          <q-btn flat round icon="delete_outline" color="negative" class="cr-tap" :aria-label="t('construction.report.crew.removeRow', { name: translatePersonnelType(c.name) })" @click="removeCrew(c.id)" />
        </div>
        <div class="cr-counter-row">
          <span class="cr-label">{{ t('construction.report.crew.count') }}</span>
          <CountStepper v-model="c.count" compact :min="1" :label="`${t('construction.report.crew.count')} ${translatePersonnelType(c.name)}`" />
        </div>
        <div class="cr-counter-row">
          <span class="cr-label">{{ t('construction.report.crew.hours') }}</span>
          <CountStepper v-model="c.hours" compact :min="0" :max="24" :label="`${t('construction.report.crew.hours')} ${translatePersonnelType(c.name)}`" />
        </div>
      </div>
      <q-btn outline no-caps color="primary" icon="add" :label="group.addLabel" class="full-width cr-tap-btn" @click="openPicker(group.type)" />
    </section>

    <section aria-labelledby="cr-machines-title">
      <div class="row items-baseline justify-between">
        <h2 id="cr-machines-title" class="cr-section-title">{{ t('construction.report.crew.machinesTitle') }}</h2>
        <span v-if="form.machines.length" class="text-caption text-grey-8">{{ t('construction.report.crew.totalMachines', { count: machineTotal }) }}</span>
      </div>
      <div v-if="form.machines.length === 0" class="text-grey-7 q-mb-sm">{{ t('construction.report.crew.emptyMachines') }}</div>
      <div v-for="m in form.machines" :key="m.id" class="cr-card q-mb-sm">
        <div class="row items-center no-wrap">
          <div class="col">
            <div class="text-weight-bold cr-row-name">{{ m.name || t('construction.report.crew.machineUnnamed') }}</div>
            <div v-if="m.size" class="text-caption text-grey-8">{{ m.size }}</div>
          </div>
          <q-btn flat round icon="delete_outline" color="negative" class="cr-tap" :aria-label="t('construction.report.crew.removeRow', { name: m.name || t('construction.report.crew.machineUnnamed') })" @click="removeMachine(m.id)" />
        </div>
        <div class="cr-counter-row">
          <span class="cr-label">{{ t('construction.report.crew.quantity') }}</span>
          <CountStepper v-model="m.quantity" compact :min="1" :label="`${t('construction.report.crew.quantity')} ${m.name}`" />
        </div>
        <div class="cr-counter-row">
          <span class="cr-label">{{ t('construction.report.crew.machineHours') }}</span>
          <CountStepper v-model="m.hours" compact :min="0" :max="24" :label="`${t('construction.report.crew.machineHours')} ${m.name}`" />
        </div>
      </div>
      <q-btn outline no-caps color="primary" icon="add" :label="t('construction.report.crew.addMachine')" class="full-width cr-tap-btn" @click="machineSheetOpen = true" />
    </section>

    <CrewPickerSheet v-model="pickerOpen" :type="pickerType" :selected="selectedNames" @toggle="toggleCrew" />
    <MachineSheet v-model="machineSheetOpen" @save="addMachine" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import CountStepper from './CountStepper.vue';
import CrewPickerSheet from './CrewPickerSheet.vue';
import MachineSheet from './MachineSheet.vue';
import { usePersonnelLabel } from 'src/composables/usePersonnelLabel';
import { useConstructionReport } from 'src/composables/constructionReport/useConstructionReport';
import { DEFAULT_HOURS, newId } from 'src/composables/constructionReport/reportForm';
import type { CrewType } from 'src/composables/constructionReport/reportForm';

const $q = useQuasar();
const { t } = useI18n();
const { translatePersonnelType } = usePersonnelLabel();
const { form, previousCrewSummary, copyPreviousCrew } = useConstructionReport();

const groups = computed(() =>
  (['PERSONNEL', 'WORKER'] as const).map((type) => {
    const items = form.value.crew.filter((c) => c.type === type);
    return {
      type,
      items,
      total: items.reduce((sum, c) => sum + c.count, 0),
      title: type === 'WORKER' ? t('construction.report.crew.workerTitle') : t('construction.report.crew.personnelTitle'),
      addLabel: type === 'WORKER' ? t('construction.report.crew.addWorker') : t('construction.report.crew.addPersonnel'),
    };
  }),
);
const machineTotal = computed(() => form.value.machines.reduce((sum, m) => sum + m.quantity, 0));

const pickerOpen = ref(false);
const pickerType = ref<CrewType>('PERSONNEL');
const selectedNames = computed(() => form.value.crew.filter((c) => c.type === pickerType.value).map((c) => c.name));
function openPicker(type: CrewType) {
  pickerType.value = type;
  pickerOpen.value = true;
}
function toggleCrew(name: string) {
  const existing = form.value.crew.find((c) => c.type === pickerType.value && c.name === name);
  if (existing) {
    removeCrew(existing.id);
  } else {
    form.value.crew.push({ id: newId(), name, type: pickerType.value, count: 1, hours: DEFAULT_HOURS });
  }
}
function removeCrew(id: string) {
  form.value.crew = form.value.crew.filter((c) => c.id !== id);
}

const machineSheetOpen = ref(false);
function addMachine(value: { name: string; size: string }) {
  form.value.machines.push({ id: newId(), ...value, quantity: 1, hours: DEFAULT_HOURS });
}
function removeMachine(id: string) {
  form.value.machines = form.value.machines.filter((m) => m.id !== id);
}

function copyPrevious() {
  const apply = () => {
    copyPreviousCrew();
    $q.notify({ message: t('construction.report.crew.copied'), color: 'positive', icon: 'check_circle' });
  };
  if (form.value.crew.length === 0 && form.value.machines.length === 0) {
    apply();
    return;
  }
  $q.dialog({
    title: t('construction.report.crew.copyConfirmTitle'),
    message: t('construction.report.crew.copyConfirmMessage'),
    ok: { label: t('construction.report.crew.copyPrevious'), color: 'primary', unelevated: true, noCaps: true },
    cancel: { label: t('construction.report.workSheet.cancel'), flat: true, noCaps: true, color: 'grey-8' },
  }).onOk(apply);
}
</script>

<style scoped>
.cr-row-name {
  line-height: 1.5;
}
.cr-counter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
}
.cr-counter-row .cr-label {
  margin: 0;
}
</style>
