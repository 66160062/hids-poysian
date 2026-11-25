<template>
  <div class="column q-gutter-y-md">
    <div v-if="isCarriedForward && pendingCount > 0" class="cr-banner cr-banner--warning" role="status">
      <q-icon name="history" size="20px" aria-hidden="true" />
      <span>{{ t('construction.report.work.carried', { count: pendingCount }) }}</span>
    </div>

    <div v-if="form.works.length === 0" class="cr-empty">
      <q-icon name="assignment" size="40px" color="grey-5" aria-hidden="true" />
      <div>{{ t('construction.report.work.empty') }}</div>
    </div>

    <article
      v-for="work in form.works"
      :key="work.id"
      class="cr-card"
      :class="{ 'cr-card--attention': work.needsUpdate }"
      :aria-labelledby="`cr-work-${work.id}`"
    >
      <div class="row items-start no-wrap">
        <div class="col">
          <h3 :id="`cr-work-${work.id}`" class="cr-card__title">{{ work.name }}</h3>
          <div v-if="work.location || work.unit" class="text-caption text-grey-8">
            {{ [work.location && roomLabel(work.location), work.unit && unitLabel(work.unit)].filter(Boolean).join(' · ') }}
          </div>
          <div class="row items-center q-gutter-x-sm q-mt-xs">
            <span v-if="work.needsUpdate" class="cr-tag cr-tag--warning">
              <q-icon name="error_outline" size="14px" aria-hidden="true" />
              {{ t('construction.report.work.needsUpdate') }}
            </span>
            <span v-if="work.previousPercent !== undefined" class="text-caption text-grey-8">
              {{ t('construction.report.work.previous', { percent: work.previousPercent }) }}
            </span>
          </div>
        </div>
        <q-btn flat round icon="edit" color="grey-8" class="cr-tap" :aria-label="t('construction.report.work.edit', { name: work.name })" @click="openEdit(work)" />
        <q-btn flat round icon="delete_outline" color="negative" class="cr-tap" :aria-label="t('construction.report.work.remove', { name: work.name })" @click="confirmRemove(work)" />
      </div>

      <div class="q-mt-sm">
        <div class="cr-label">{{ t('construction.report.work.progress') }}</div>
        <PercentQuickPick
          :model-value="work.actual"
          :previous="work.previousPercent"
          :label="t('construction.report.work.progressOf', { name: work.name })"
          @update:model-value="setPercent(work, $event)"
        />
      </div>

      <div class="row items-center no-wrap q-mt-md q-gutter-x-sm">
        <img v-if="photoForWork(work.id)" :src="photoForWork(work.id)!.preview" :alt="t('construction.report.photos.photoAlt', { name: work.name })" class="cr-thumb" />
        <q-btn
          outline
          no-caps
          color="primary"
          :icon="photoForWork(work.id) ? 'cameraswitch' : 'photo_camera'"
          :label="photoForWork(work.id) ? t('construction.report.work.retakePhoto') : t('construction.report.work.takePhoto')"
          :loading="busyWorkId === work.id"
          class="col cr-tap-btn"
          @click="capture(work.id, 'camera')"
        />
        <q-btn
          flat
          round
          icon="photo_library"
          color="primary"
          class="cr-tap"
          :aria-label="t('construction.report.photos.fromGallery')"
          :disable="busyWorkId === work.id"
          @click="capture(work.id, 'gallery')"
        />
      </div>
    </article>

    <q-btn unelevated no-caps color="primary" icon="add" :label="t('construction.report.work.add')" class="cr-primary-btn" @click="openAdd" />

    <WorkItemSheet v-model="sheetOpen" :work="editing" @save="saveWork" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import PercentQuickPick from './PercentQuickPick.vue';
import WorkItemSheet from './WorkItemSheet.vue';
import { useConstructionReport } from 'src/composables/constructionReport/useConstructionReport';
import { newId, ROOM_OPTION_KEYS, UNIT_OPTION_KEYS } from 'src/composables/constructionReport/reportForm';
import type { WorkEntry } from 'src/composables/constructionReport/reportForm';
import { usePhotoCapture } from 'src/composables/usePhotoCapture';
import type { PhotoSource } from 'src/composables/usePhotoCapture';

const $q = useQuasar();
const { t } = useI18n();
const { form, isCarriedForward, photoForWork, setWorkPhoto, removeWork } = useConstructionReport();
const { takePhoto } = usePhotoCapture();

const pendingCount = computed(() => form.value.works.filter((w) => w.needsUpdate).length);

function roomLabel(value: string): string {
  const key = ROOM_OPTION_KEYS[value];
  return key ? t(`construction.inspect.roomOptions.${key}`) : value;
}
function unitLabel(value: string): string {
  const key = UNIT_OPTION_KEYS[value];
  return key ? t(`construction.inspect.unitOptions.${key}`) : value;
}

function setPercent(work: WorkEntry, value: number) {
  work.actual = value;
  work.needsUpdate = false;
}

const sheetOpen = ref(false);
const editing = ref<WorkEntry | null>(null);
function openAdd() {
  editing.value = null;
  sheetOpen.value = true;
}
function openEdit(work: WorkEntry) {
  editing.value = work;
  sheetOpen.value = true;
}
function saveWork(value: { name: string; location: string; unit: string; actual: number | null }) {
  if (editing.value) {
    Object.assign(editing.value, value, { needsUpdate: false });
  } else {
    form.value.works.push({ id: newId(), ...value, needsUpdate: false });
  }
}

function confirmRemove(work: WorkEntry) {
  $q.dialog({
    title: t('construction.report.work.removeTitle', { name: work.name }),
    message: t('construction.report.work.removeMessage'),
    ok: { label: t('construction.report.work.removeConfirm'), color: 'negative', unelevated: true, noCaps: true },
    cancel: { label: t('construction.report.workSheet.cancel'), flat: true, noCaps: true, color: 'grey-8' },
  }).onOk(() => removeWork(work.id));
}

const busyWorkId = ref<string | null>(null);
async function capture(workId: string, source: PhotoSource) {
  try {
    const file = await takePhoto(source, () => (busyWorkId.value = workId));
    if (file) setWorkPhoto(workId, file);
  } finally {
    busyWorkId.value = null;
  }
}
</script>
