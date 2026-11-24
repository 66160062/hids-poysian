<template>
  <div class="column q-gutter-y-lg">
    <section aria-labelledby="cr-time-title">
      <h2 id="cr-time-title" class="cr-section-title">{{ t('construction.report.general.timeTitle') }}</h2>
      <div class="row q-col-gutter-sm">
        <div v-for="field in timeFields" :key="field.key" class="col-6">
          <label :for="`cr-${field.key}`" class="cr-label">{{ field.label }}</label>
          <input :id="`cr-${field.key}`" v-model="form[field.key]" type="time" class="cr-time-input" />
          <q-btn
            flat
            no-caps
            dense
            color="primary"
            icon="schedule"
            :label="t('construction.report.general.now')"
            class="full-width q-mt-xs cr-now-btn"
            :aria-label="t('construction.report.general.setNow', { label: field.label })"
            @click="setNow(field.key)"
          />
        </div>
      </div>
    </section>

    <section aria-labelledby="cr-weather-title">
      <h2 id="cr-weather-title" class="cr-section-title">{{ t('construction.report.general.weatherTitle') }}</h2>
      <div class="cr-weather-grid">
        <button
          v-for="w in weatherOptions"
          :key="w.value"
          type="button"
          class="cr-weather"
          :class="{ 'cr-weather--active': form.weather === w.value }"
          :aria-pressed="form.weather === w.value"
          @click="form.weather = w.value"
        >
          <q-icon :name="w.icon" size="28px" />
          <span>{{ w.label }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useConstructionReport } from 'src/composables/constructionReport/useConstructionReport';

const { t } = useI18n();
const { form: formRef } = useConstructionReport();
const form = computed(() => formRef.value);

const timeFields = computed(() => [
  { key: 'startTime' as const, label: t('construction.report.general.start') },
  { key: 'endTime' as const, label: t('construction.report.general.end') },
]);

const weatherOptions = computed(() => [
  { value: 'Sunny', icon: 'wb_sunny', label: t('construction.inspect.weatherSunny') },
  { value: 'Cloudy', icon: 'cloud', label: t('construction.inspect.weatherCloudy') },
  { value: 'Rainy', icon: 'water_drop', label: t('construction.inspect.weatherRainy') },
  { value: 'Stormy', icon: 'thunderstorm', label: t('construction.inspect.weatherStormy') },
]);

function setNow(key: 'startTime' | 'endTime') {
  const now = new Date();
  form.value[key] = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}
</script>

<style scoped>
.cr-time-input {
  width: 100%;
  height: 56px;
  padding: 0 8px;
  border: 1px solid #b0bec5;
  border-radius: 10px;
  font: inherit;
  font-size: 18px;
  font-weight: 600;
  background: #fff;
  color: #212121;
}
.cr-time-input:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 1px;
}
.cr-now-btn {
  min-height: 44px;
}
.cr-weather-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.cr-weather {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 64px;
  border: 1px solid #cfd8dc;
  border-radius: 12px;
  background: #fff;
  color: #455a64;
  font: inherit;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.cr-weather:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}
.cr-weather--active {
  border: 2px solid var(--q-primary);
  background: #e3f2fd;
  color: var(--q-primary);
}
</style>
