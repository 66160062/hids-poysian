<template>
  <q-card flat bordered class="defect-category-card bg-white shadow-1">
    <div class="q-pa-md">
      <div class="row items-center justify-between q-mb-sm">
        <div class="row items-center">
          <q-avatar size="32px" class="bg-orange-1 text-orange-9 q-mr-sm" style="border-radius: 8px;">
            <q-icon name="pie_chart" size="20px" />
          </q-avatar>
          <div>
            <div class="text-weight-bold text-dark" style="font-size: 15px;">
              {{ t('adminWork.dashboard.defectCategoryTitle') }}
            </div>
            <div class="text-caption text-grey-6">
              {{ t('adminWork.dashboard.defectCategorySubtitle') }}
            </div>
          </div>
        </div>
      </div>

      <!-- No Data State -->
      <div v-if="!categories || categories.length === 0" class="flex flex-center q-pa-lg text-grey-6">
        <div class="text-center">
          <q-icon name="check_circle_outline" size="40px" color="positive" class="q-mb-xs" />
          <div class="text-caption">{{ t('adminWork.dashboard.noDefectsRecorded') }}</div>
        </div>
      </div>

      <!-- Chart & Legend -->
      <div v-else class="row q-col-gutter-md items-center q-mt-xs">
        <!-- Donut Chart -->
        <div class="col-12 col-sm-5 flex flex-center">
          <div class="donut-chart-wrapper relative-position">
            <svg viewBox="0 0 100 100" class="donut-svg">
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#f1f5f9"
                stroke-width="14"
              />
              <circle
                v-for="(seg, i) in donutSegments"
                :key="i"
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                :stroke="seg.color"
                stroke-width="14"
                :stroke-dasharray="`${seg.length} ${circumference - seg.length}`"
                :stroke-dashoffset="seg.offset"
                class="donut-segment"
              />
            </svg>
            <div class="donut-center-text">
              <div class="text-h6 text-weight-bold text-dark" style="line-height: 1;">
                {{ totalDefectsCount }}
              </div>
              <div class="text-caption text-grey-6" style="font-size: 10px;">
                {{ t('adminWork.dashboard.pointsUnit') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Legend List -->
        <div class="col-12 col-sm-7">
          <div class="q-gutter-y-xs">
            <div
              v-for="cat in categories"
              :key="cat.categoryId"
              class="row items-center justify-between q-py-xs"
            >
              <div class="row items-center no-wrap">
                <span class="cat-dot q-mr-sm" :style="{ backgroundColor: cat.color || '#F97316' }"></span>
                <span class="text-caption text-grey-8 ellipsis" style="max-width: 140px;">
                  {{ cat.categoryName }}
                </span>
              </div>
              <div class="row items-center q-gutter-x-xs no-wrap">
                <span class="text-caption text-weight-bold text-dark">{{ cat.count }}</span>
                <span class="text-caption text-grey-6">({{ cat.percentage }}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { JobDefectCategoryItem } from 'src/types/dashboard';

const props = defineProps<{
  categories?: JobDefectCategoryItem[] | undefined;
}>();

const { t } = useI18n();

const circumference = 2 * Math.PI * 38; // ~238.76

const items = computed(() => props.categories || []);

const totalDefectsCount = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.count || 0), 0);
});

const donutSegments = computed(() => {
  const total = totalDefectsCount.value || 1;
  let currentOffset = 0;

  return items.value.map((item) => {
    const fraction = item.count / total;
    const length = fraction * circumference;
    const offset = -currentOffset;
    currentOffset += length;
    return {
      length,
      offset,
      color: item.color || '#F97316',
    };
  });
});
</script>

<style scoped>
.defect-category-card {
  border-radius: 16px;
  min-height: 270px;
}

.donut-chart-wrapper {
  width: 130px;
  height: 130px;
}

.donut-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.donut-segment {
  transition: stroke-dasharray 0.5s ease;
}

.donut-center-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.cat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
</style>
