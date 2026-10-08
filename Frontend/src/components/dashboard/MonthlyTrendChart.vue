<template>
  <q-card flat bordered class="monthly-trend-card bg-white shadow-1">
    <div class="q-pa-md">
      <!-- Header -->
      <div class="row items-center justify-between q-mb-sm wrap q-gutter-y-xs">
        <div class="row items-center">
          <q-avatar size="32px" class="bg-blue-1 text-primary q-mr-sm" style="border-radius: 8px;">
            <q-icon name="bar_chart" size="20px" />
          </q-avatar>
          <div>
            <div class="text-weight-bold text-dark" style="font-size: 15px;">
              {{ t('adminWork.dashboard.monthlyTrendTitle') }}
            </div>
            <div class="text-caption text-grey-6">
              {{ t('adminWork.dashboard.monthlyTrendSubtitle') }}
            </div>
          </div>
        </div>

        <div class="row items-center q-gutter-sm">
          <!-- Timeframe Selector Toggle (Weekly / Monthly / Yearly) -->
          <q-btn-toggle
            v-model="timeframe"
            no-caps
            rounded
            unelevated
            dense
            toggle-color="primary"
            toggle-text-color="white"
            color="grey-2"
            text-color="grey-8"
            class="timeframe-toggle text-caption"
            :options="timeframeOptions"
          />

          <!-- Legends -->
          <div class="row items-center q-gutter-x-sm q-ml-sm">
            <div class="row items-center text-caption text-grey-7">
              <span class="legend-dot bg-primary q-mr-xs"></span>
              <span>{{ t('adminWork.main.homeInspectionJob') }}</span>
            </div>
            <div class="row items-center text-caption text-grey-7">
              <span class="legend-dot bg-orange-9 q-mr-xs"></span>
              <span>{{ t('adminWork.main.constructionJob') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart Container -->
      <div v-if="trendList.length > 0" class="chart-container relative-position q-mt-md">
        <div class="chart-grid">
          <!-- Y-Axis Guidelines -->
          <div class="grid-line" style="top: 0%"><span>{{ maxCount }}</span></div>
          <div class="grid-line" style="top: 33%"><span>{{ Math.round(maxCount * 0.66) }}</span></div>
          <div class="grid-line" style="top: 66%"><span>{{ Math.round(maxCount * 0.33) }}</span></div>
          <div class="grid-line" style="top: 100%"><span>0</span></div>

          <!-- Bars -->
          <div class="bars-container">
            <div
              v-for="(item, index) in trendList"
              :key="item.key || index"
              class="month-group"
            >
              <div class="bars-wrapper">
                <!-- Home Inspection Bar -->
                <div class="bar-col">
                  <span v-if="item.homeInspection > 0" class="bar-val text-primary">{{ item.homeInspection }}</span>
                  <div
                    class="bar bar-home"
                    :style="{ height: `${getBarHeight(item.homeInspection)}%` }"
                  >
                    <q-tooltip class="bg-dark text-white text-caption">
                      {{ item.label }}: {{ t('adminWork.main.homeInspectionJob') }} {{ item.homeInspection }} {{ t('adminWork.dashboard.jobsUnit') }}
                    </q-tooltip>
                  </div>
                </div>
                <!-- Construction Bar -->
                <div class="bar-col">
                  <span v-if="item.construction > 0" class="bar-val text-orange-9">{{ item.construction }}</span>
                  <div
                    class="bar bar-construction"
                    :style="{ height: `${getBarHeight(item.construction)}%` }"
                  >
                    <q-tooltip class="bg-dark text-white text-caption">
                      {{ item.label }}: {{ t('adminWork.main.constructionJob') }} {{ item.construction }} {{ t('adminWork.dashboard.jobsUnit') }}
                    </q-tooltip>
                  </div>
                </div>
              </div>
              <div class="month-label">{{ item.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center text-grey-5 q-pa-lg">
        <q-icon name="insights" size="36px" class="q-mb-xs" />
        <div class="text-caption">{{ t('adminWork.dashboard.noTrendData') }}</div>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { MonthlyTrendItem, BusinessTrendOverview, TrendItem } from 'src/types/dashboard';

const props = defineProps<{
  trends?: MonthlyTrendItem[] | BusinessTrendOverview | undefined;
}>();

const { t } = useI18n();

const timeframe = ref<'weekly' | 'monthly' | 'yearly'>('monthly');

const timeframeOptions = computed(() => [
  { label: t('adminWork.dashboard.timeframeWeekly'), value: 'weekly' },
  { label: t('adminWork.dashboard.timeframeMonthly'), value: 'monthly' },
  { label: t('adminWork.dashboard.timeframeYearly'), value: 'yearly' },
]);

const trendList = computed<TrendItem[]>(() => {
  if (!props.trends) return [];
  if (Array.isArray(props.trends)) {
    return props.trends.map((item) => ({
      key: item.monthKey,
      label: item.monthLabel,
      homeInspection: item.homeInspection,
      construction: item.construction,
      total: item.total,
    }));
  }

  const overview = props.trends;
  if (timeframe.value === 'weekly') return overview.weekly || [];
  if (timeframe.value === 'yearly') return overview.yearly || [];
  return overview.monthly || [];
});

const maxCount = computed(() => {
  if (!trendList.value.length) return 10;
  let max = 0;
  for (const item of trendList.value) {
    if (item.homeInspection > max) max = item.homeInspection;
    if (item.construction > max) max = item.construction;
  }
  return max > 0 ? Math.ceil(max * 1.3) : 5;
});

function getBarHeight(val: number): number {
  if (maxCount.value === 0) return 0;
  const pct = (val / maxCount.value) * 100;
  return Math.min(100, Math.max(val > 0 ? 6 : 0, pct));
}
</script>

<style scoped>
.monthly-trend-card {
  border-radius: 16px;
  min-height: 270px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  display: inline-block;
}

.timeframe-toggle {
  font-size: 11px;
  border-radius: 16px;
}

.chart-container {
  height: 190px;
  padding: 10px 0 24px 32px;
}

.chart-grid {
  position: relative;
  width: 100%;
  height: 100%;
}

.grid-line {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px dashed #e2e8f0;
  display: flex;
  align-items: center;
}

.grid-line span {
  position: absolute;
  left: -28px;
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

.bars-container {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
}

.month-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
  flex: 1;
}

.bars-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 100%;
}

.bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
}

.bar-val {
  font-size: 10px;
  font-weight: 700;
  margin-bottom: 2px;
  line-height: 1;
}

.bar {
  width: 14px;
  border-radius: 4px 4px 0 0;
  transition: height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s;
  cursor: pointer;
}

.bar:hover {
  opacity: 0.85;
  filter: brightness(1.05);
}

.bar-home {
  background: linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%);
}

.bar-construction {
  background: linear-gradient(180deg, #fb923c 0%, #ea580c 100%);
}

.month-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
  margin-top: 8px;
  white-space: nowrap;
}
</style>
