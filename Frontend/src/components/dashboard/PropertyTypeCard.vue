<template>
  <q-card flat bordered class="property-type-card bg-white shadow-1">
    <div class="q-pa-md">
      <div class="row items-center justify-between q-mb-sm">
        <div class="row items-center">
          <q-avatar size="32px" class="bg-teal-1 text-teal-9 q-mr-sm" style="border-radius: 8px;">
            <q-icon name="apartment" size="20px" />
          </q-avatar>
          <div>
            <div class="text-weight-bold text-dark" style="font-size: 15px;">
              {{ t('adminWork.dashboard.propertyTypeTitle') }}
            </div>
            <div class="text-caption text-grey-6">
              {{ t('adminWork.dashboard.propertyTypeSubtitle') }}
            </div>
          </div>
        </div>
      </div>

      <div class="row q-col-gutter-md items-center q-mt-xs">
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
                :stroke-dasharray="`${seg.length} ${100 - seg.length}`"
                :stroke-dashoffset="seg.offset"
                class="donut-segment"
              />
            </svg>
            <div class="donut-center-text">
              <div class="text-h6 text-weight-bold text-dark" style="line-height: 1;">
                {{ totalCount }}
              </div>
              <div class="text-caption text-grey-6" style="font-size: 10px;">{{ t('adminWork.workList.kpiTotalJobs') }}</div>
            </div>
          </div>
        </div>

        <!-- Legend List -->
        <div class="col-12 col-sm-7">
          <div class="q-gutter-y-xs">
            <div
              v-for="item in propertyTypes"
              :key="item.name"
              class="row items-center justify-between q-py-xs"
            >
              <div class="row items-center">
                <span class="type-dot q-mr-sm" :style="{ backgroundColor: item.color }"></span>
                <span class="text-caption text-grey-8">{{ item.name }}</span>
              </div>
              <div class="row items-center q-gutter-x-xs">
                <span class="text-caption text-weight-bold text-dark">{{ item.count }}</span>
                <span class="text-caption text-grey-6">({{ item.percentage }}%)</span>
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
import type { PropertyTypeItem } from 'src/types/dashboard';

const props = defineProps<{
  propertyTypes: PropertyTypeItem[];
}>();

const { t } = useI18n();

const totalCount = computed(() => {
  return props.propertyTypes.reduce((sum, item) => sum + (item.count || 0), 0);
});

const donutSegments = computed(() => {
  const circumference = 2 * Math.PI * 38; // ~238.76
  const total = totalCount.value || 1;

  let currentOffset = 0;
  return props.propertyTypes.map((item) => {
    const fraction = item.count / total;
    const length = fraction * circumference;
    const offset = -currentOffset;
    currentOffset += length;
    return {
      length,
      offset,
      color: item.color,
    };
  });
});
</script>

<style scoped>
.property-type-card {
  border-radius: 16px;
  min-height: 270px;
}

.donut-chart-wrapper {
  width: 120px;
  height: 120px;
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

.type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
</style>
