<template>
  <div class="column q-gutter-y-md">
    <div v-if="blocking.length === 0" class="cr-banner cr-banner--ok" role="status">
      <q-icon name="check_circle" size="22px" aria-hidden="true" />
      <span>{{ t('construction.report.review.ready') }}</span>
    </div>

    <section v-if="blocking.length" class="cr-card cr-card--error" aria-labelledby="cr-review-blocking">
      <h2 id="cr-review-blocking" class="cr-section-title text-negative">
        <q-icon name="error" size="20px" aria-hidden="true" />
        {{ t('construction.report.review.fixFirst', { count: blocking.length }) }}
      </h2>
      <ul class="cr-problem-list">
        <li v-for="p in blocking" :key="p.key">
          <span class="col">{{ t(`construction.report.problems.${p.key}`, p.params ?? {}) }}</span>
          <q-btn flat no-caps dense color="negative" class="cr-fix-btn" :label="t('construction.report.review.fix')" @click="go(p.step)" />
        </li>
      </ul>
    </section>

    <section v-if="warnings.length" class="cr-card cr-card--warning" aria-labelledby="cr-review-warn">
      <h2 id="cr-review-warn" class="cr-section-title text-warning-dark">
        <q-icon name="info" size="20px" aria-hidden="true" />
        {{ t('construction.report.review.warnings') }}
      </h2>
      <ul class="cr-problem-list">
        <li v-for="p in warnings" :key="p.key">
          <span class="col">{{ t(`construction.report.problems.${p.key}`, p.params ?? {}) }}</span>
          <q-btn flat no-caps dense color="primary" class="cr-fix-btn" :label="t('construction.report.review.fix')" @click="go(p.step)" />
        </li>
      </ul>
    </section>

    <dl class="cr-summary">
      <div v-for="row in rows" :key="row.label" class="cr-summary__row">
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
        <q-btn
          flat
          round
          icon="edit"
          color="grey-8"
          class="cr-tap"
          :aria-label="t('construction.report.review.edit', { section: row.label })"
          @click="go(row.step)"
        />
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { STEP_KEYS, useConstructionReport } from 'src/composables/constructionReport/useConstructionReport';
import type { StepKey } from 'src/composables/constructionReport/reportForm';

const emit = defineEmits<{ go: [index: number] }>();
const { t } = useI18n();
const { form, panorama, photos, problems } = useConstructionReport();

const blocking = computed(() => problems.value.filter((p) => p.level === 'blocking'));
const warnings = computed(() => problems.value.filter((p) => p.level === 'warning'));

function go(step: StepKey) {
  emit('go', STEP_KEYS.indexOf(step));
}

const WEATHER_KEYS: Record<string, string> = {
  Sunny: 'weatherSunny',
  Cloudy: 'weatherCloudy',
  Rainy: 'weatherRainy',
  Stormy: 'weatherStormy',
};

const rows = computed(() => {
  const f = form.value;
  const personnel = f.crew.filter((c) => c.type === 'PERSONNEL').reduce((s, c) => s + c.count, 0);
  const workers = f.crew.filter((c) => c.type === 'WORKER').reduce((s, c) => s + c.count, 0);
  const weatherKey = WEATHER_KEYS[f.weather];
  const none = t('construction.report.review.none');
  const workPhotoCount = photos.value.filter((p) => f.works.some((w) => w.id === p.workId)).length;
  return [
    {
      step: 'general' as const,
      label: t('construction.report.review.time'),
      value: f.startTime && f.endTime ? t('construction.report.review.timeValue', { start: f.startTime, end: f.endTime }) : '-',
    },
    {
      step: 'general' as const,
      label: t('construction.report.review.weather'),
      value: weatherKey ? t(`construction.inspect.${weatherKey}`) : f.weather || '-',
    },
    { step: 'work' as const, label: t('construction.report.review.works'), value: t('construction.report.review.worksValue', { count: f.works.length }) },
    { step: 'crew' as const, label: t('construction.report.review.crew'), value: t('construction.report.review.crewValue', { personnel, workers }) },
    {
      step: 'crew' as const,
      label: t('construction.report.review.machines'),
      value: f.machines.length ? t('construction.report.review.countItems', { count: f.machines.length }) : none,
    },
    {
      step: 'safety' as const,
      label: t('construction.report.review.accidents'),
      value: f.accidentCount > 0 ? t('construction.report.review.accidentsValue', { count: f.accidentCount }) : none,
    },
    {
      step: 'safety' as const,
      label: t('construction.report.review.issues'),
      value: f.issues.length ? t('construction.report.review.countItems', { count: f.issues.length }) : none,
    },
    {
      step: 'photos' as const,
      label: t('construction.report.review.photos'),
      value: t('construction.report.review.photosValue', {
        panorama: panorama.value ? t('construction.report.review.hasPanorama') : t('construction.report.review.noPanorama'),
        count: workPhotoCount,
      }),
    },
  ];
});
</script>

<style scoped>
.cr-problem-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.cr-problem-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  line-height: 1.5;
}
.cr-fix-btn {
  min-height: 44px;
  padding: 0 12px;
}
.text-warning-dark {
  color: #8a5a00;
}
.cr-summary {
  margin: 0;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
}
.cr-summary__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 4px 4px 14px;
  border-bottom: 1px solid #eceff1;
}
.cr-summary__row:last-child {
  border-bottom: 0;
}
.cr-summary__row dt {
  width: 34%;
  color: #546e7a;
  font-size: 14px;
  line-height: 1.5;
}
.cr-summary__row dd {
  flex: 1;
  margin: 0;
  font-weight: 600;
  line-height: 1.5;
}
</style>
