<template>
  <div class="column q-gutter-y-lg">
    <section aria-labelledby="cr-pano-title">
      <h2 id="cr-pano-title" class="cr-section-title">{{ t('construction.report.photos.panoramaTitle') }}</h2>
      <div class="text-caption text-grey-8 q-mb-sm">{{ t('construction.report.photos.panoramaHint') }}</div>

      <div v-if="panorama" class="cr-pano">
        <img :src="panorama.preview" :alt="t('construction.report.photos.panoramaAlt')" class="cr-pano__img" />
      </div>
      <div class="row no-wrap q-gutter-x-sm q-mt-sm">
        <q-btn
          :unelevated="!panorama"
          :outline="!!panorama"
          no-caps
          color="primary"
          :icon="panorama ? 'cameraswitch' : 'photo_camera'"
          :label="panorama ? t('construction.report.photos.retake') : t('construction.report.photos.takePanorama')"
          :loading="busy === 'panorama'"
          class="col cr-tap-btn"
          @click="capturePanorama('camera')"
        />
        <q-btn flat round icon="photo_library" color="primary" class="cr-tap" :aria-label="t('construction.report.photos.fromGallery')" @click="capturePanorama('gallery')" />
        <q-btn v-if="panorama" flat round icon="delete_outline" color="negative" class="cr-tap" :aria-label="t('construction.report.photos.remove')" @click="removePanorama" />
      </div>
    </section>

    <section aria-labelledby="cr-workphotos-title">
      <div class="row items-baseline justify-between">
        <h2 id="cr-workphotos-title" class="cr-section-title">{{ t('construction.report.photos.workPhotosTitle') }}</h2>
        <span class="text-caption text-grey-8">{{ t('construction.report.photos.workPhotosHint') }}</span>
      </div>
      <div v-if="form.works.length === 0" class="text-grey-7">{{ t('construction.report.photos.noWorks') }}</div>
      <div class="cr-photo-grid">
        <div v-for="work in form.works" :key="work.id" class="cr-photo-tile">
          <button
            type="button"
            class="cr-photo-tile__btn"
            :aria-label="photoForWork(work.id) ? `${t('construction.report.work.retakePhoto')} ${work.name}` : `${t('construction.report.work.takePhoto')} ${work.name}`"
            @click="captureWork(work.id)"
          >
            <img v-if="photoForWork(work.id)" :src="photoForWork(work.id)!.preview" :alt="t('construction.report.photos.photoAlt', { name: work.name })" />
            <span v-else class="column items-center text-primary">
              <q-spinner v-if="busy === work.id" size="28px" />
              <q-icon v-else name="add_a_photo" size="28px" aria-hidden="true" />
            </span>
          </button>
          <div class="cr-photo-tile__name">{{ work.name }}</div>
          <q-btn
            v-if="photoForWork(work.id)"
            round
            dense
            color="negative"
            icon="close"
            size="sm"
            class="cr-photo-tile__remove"
            :aria-label="`${t('construction.report.photos.remove')} ${work.name}`"
            @click="removePhoto(photoForWork(work.id)!.id)"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useConstructionReport } from 'src/composables/constructionReport/useConstructionReport';
import { usePhotoCapture } from 'src/composables/usePhotoCapture';
import type { PhotoSource } from 'src/composables/usePhotoCapture';

const { t } = useI18n();
const { form, panorama, setPanorama, removePanorama, photoForWork, setWorkPhoto, removePhoto } = useConstructionReport();
const { takePhoto } = usePhotoCapture();

const busy = ref<string | null>(null);

async function capturePanorama(source: PhotoSource) {
  try {
    const file = await takePhoto(source, () => (busy.value = 'panorama'));
    if (file) setPanorama(file);
  } finally {
    busy.value = null;
  }
}
async function captureWork(workId: string) {
  try {
    const file = await takePhoto('camera', () => (busy.value = workId));
    if (file) setWorkPhoto(workId, file);
  } finally {
    busy.value = null;
  }
}
</script>

<style scoped>
.cr-pano {
  border-radius: 12px;
  overflow: hidden;
  background: #eceff1;
}
.cr-pano__img {
  display: block;
  width: 100%;
  max-height: 220px;
  object-fit: cover;
}
.cr-photo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.cr-photo-tile {
  position: relative;
}
.cr-photo-tile__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 4 / 3;
  padding: 0;
  border: 2px dashed #90caf9;
  border-radius: 12px;
  background: #f5f9ff;
  overflow: hidden;
  cursor: pointer;
}
.cr-photo-tile__btn:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}
.cr-photo-tile__btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cr-photo-tile__name {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cr-photo-tile__remove {
  position: absolute;
  top: 6px;
  right: 6px;
  min-width: 32px;
  min-height: 32px;
}
</style>
