<template>
  <q-card flat bordered class="operational-pipeline-card bg-white shadow-1">
    <div class="q-pa-md">
      <!-- Header -->
      <div class="row items-center justify-between q-mb-md">
        <div class="row items-center">
          <q-avatar size="32px" class="bg-indigo-1 text-primary q-mr-sm" style="border-radius: 8px;">
            <q-icon name="account_tree" size="20px" />
          </q-avatar>
          <div>
            <div class="text-weight-bold text-dark" style="font-size: 15px;">
              {{ t('adminWork.dashboard.pipelineTitle') }}
            </div>
            <div class="text-caption text-grey-6">
              {{ t('adminWork.dashboard.pipelineSubtitle') }}
            </div>
          </div>
        </div>

        <q-badge color="blue-1" text-color="primary" class="q-px-sm q-py-xs text-caption text-weight-bold" style="border-radius: 6px;">
          {{ t('adminWork.dashboard.totalInPipeline', { count: totalCount }) }}
        </q-badge>
      </div>

      <!-- Pipeline Stepper / Stages Row -->
      <div class="row q-col-gutter-sm items-stretch">
        <div
          v-for="stage in stages"
          :key="stage.key"
          class="col-12 col-sm-6 col-md-3"
        >
          <div


































































































          
            class="pipeline-step-box column justify-between q-pa-sm"
            :style="{ borderLeft: `4px solid ${stage.color}` }"
          >
            <!-- Top: Icon + Label -->
            <div>
              <div class="row items-center justify-between no-wrap q-mb-xs">
                <div class="row items-center no-wrap">
                  <q-icon :name="stage.icon" :style="{ color: stage.color }" size="18px" class="q-mr-xs" />
                  <span class="text-caption text-weight-bold text-grey-9 ellipsis" style="max-width: 110px;">
                    {{ pickLocalized(stage.labelTh, stage.labelEn) }}
                  </span>
                </div>
                <span class="text-caption text-weight-bold" :style="{ color: stage.color }">
                  {{ stage.percentage }}%
                </span>
              </div>
              <div class="text-caption text-grey-5 ellipsis" style="font-size: 11px;">
                {{ stage.hint }}
              </div>
            </div>

            <!-- Bottom: Count & Progress bar -->
            <div class="q-mt-sm">
              <div class="row items-baseline justify-between q-mb-xs">
                <span class="text-h6 text-weight-bolder text-dark" style="line-height: 1;">
                  {{ stage.count }}
                </span>
                <span class="text-caption text-grey-6" style="font-size: 11px;">
                  {{ t('adminWork.dashboard.jobsUnit') }}
                </span>
              </div>
              <q-linear-progress
                :value="stage.percentage / 100"
                rounded
                size="5px"
                :style="{ color: stage.color }"
                track-color="grey-3"
              />
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
import type { OperationalPipeline } from 'src/types/dashboard';
import { useLocalizedField } from 'src/composables/useLocalizedField';

const props = defineProps<{
  pipeline?: OperationalPipeline | undefined;
}>();

const { t } = useI18n();
const { pickLocalized } = useLocalizedField();

const totalCount = computed(() => props.pipeline?.total || 0);
const stages = computed(() => props.pipeline?.stages || []);
</script>

<style scoped>
.operational-pipeline-card {
  border-radius: 16px;
}

.pipeline-step-box {
  background-color: #f8fafc;
  border-radius: 10px;
  min-height: 96px;
  transition: all 0.2s ease;
  border: 1px solid #f1f5f9;
}

.pipeline-step-box:hover {
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
</style>
