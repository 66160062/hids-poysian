<template>
  <q-card flat bordered class="team-workload-card bg-white shadow-1">
    <div class="q-pa-md">
      <div class="row items-center justify-between q-mb-md">
        <div class="row items-center">
          <q-avatar size="32px" class="bg-purple-1 text-purple-9 q-mr-sm" style="border-radius: 8px;">
            <q-icon name="groups" size="20px" />
          </q-avatar>
          <div>
            <div class="text-weight-bold text-dark" style="font-size: 15px;">
              {{ t('adminWork.dashboard.teamWorkloadTitle') }}
            </div>
            <div class="text-caption text-grey-6">
              {{ t('adminWork.dashboard.teamWorkloadSubtitle') }}
            </div>
          </div>
        </div>

        <div class="row items-center q-gutter-x-sm">
          <div class="row items-center text-caption text-grey-7">
            <span class="legend-dot legend-dot-scheduled q-mr-xs"></span>
            <span>{{ t('adminWork.dashboard.teamScheduledLabel') }}</span>
          </div>
          <div class="row items-center text-caption text-grey-7">
            <span class="legend-dot legend-dot-in-progress q-mr-xs"></span>
            <span>{{ t('adminWork.dashboard.teamInProgressLabel') }}</span>
          </div>
          <div class="row items-center text-caption text-grey-7">
            <span class="legend-dot legend-dot-pending-approval q-mr-xs"></span>
            <span>{{ t('adminWork.dashboard.teamPendingApprovalLabel') }}</span>
          </div>
          <div class="row items-center text-caption text-grey-7">
            <span class="legend-dot legend-dot-completed q-mr-xs"></span>
            <span>{{ t('adminWork.dashboard.teamCompletedLabel') }}</span>
          </div>
        </div>
      </div>

      <div v-if="teamList.length > 0" class="team-list q-gutter-y-sm">
        <div
          v-for="team in teamList"
          :key="team.teamId"
          class="team-row q-pa-sm bg-grey-1"
          style="border-radius: 12px;"
        >
          <div class="row items-center justify-between q-mb-xs">
            <div class="row items-center">
              <q-avatar size="24px" class="bg-indigo-1 text-primary q-mr-xs font-weight-bold" style="border-radius: 6px; font-size: 11px;">
                {{ team.teamName.charAt(0).toUpperCase() }}
              </q-avatar>
              <span class="text-weight-bold text-dark text-caption ellipsis" style="max-width: 140px;">{{ team.teamName }}</span>
            </div>
            <div class="row items-center q-gutter-x-xs text-caption">
              <span class="text-grey-7 text-weight-medium">{{ team.scheduledCount || 0 }} {{ t('adminWork.dashboard.teamScheduledLabel') }}</span>
              <span class="text-grey-4">|</span>
              <span class="text-primary text-weight-medium">{{ team.inProgressCount || 0 }} {{ t('adminWork.dashboard.teamInProgressLabel') }}</span>
              <span class="text-grey-4">|</span>
              <span class="text-purple-8 text-weight-medium">{{ team.pendingApprovalCount || 0 }} {{ t('adminWork.dashboard.teamPendingApprovalLabel') }}</span>
              <span class="text-grey-4">|</span>
              <span class="text-positive text-weight-medium">{{ team.completedCount || 0 }} {{ t('adminWork.dashboard.teamCompletedLabel') }}</span>
              <span class="text-grey-4">|</span>
              <span class="text-weight-bold text-dark">{{ team.totalCount }} {{ t('adminWork.dashboard.teamTotalLabel') }}</span>
            </div>
          </div>

          <!-- 4-segment Progress Bar -->
          <div class="quad-progress-bar">
            <div
              v-if="(team.scheduledCount || 0) > 0"
              class="bar-scheduled"
              :style="{ width: `${getBarWidth(team.scheduledCount, maxTeamTotal)}%` }"
              :title="t('adminWork.dashboard.teamScheduledLabel')"
            />
            <div
              v-if="(team.inProgressCount || 0) > 0"
              class="bar-in-progress"
              :style="{ width: `${getBarWidth(team.inProgressCount, maxTeamTotal)}%` }"
              :title="t('adminWork.dashboard.teamInProgressLabel')"
            />
            <div
              v-if="(team.pendingApprovalCount || 0) > 0"
              class="bar-pending-approval"
              :style="{ width: `${getBarWidth(team.pendingApprovalCount, maxTeamTotal)}%` }"
              :title="t('adminWork.dashboard.teamPendingApprovalLabel')"
            />
            <div
              v-if="(team.completedCount || 0) > 0"
              class="bar-completed"
              :style="{ width: `${getBarWidth(team.completedCount, maxTeamTotal)}%` }"
              :title="t('adminWork.dashboard.teamCompletedLabel')"
            />
          </div>
        </div>
      </div>

      <div v-else class="text-center text-grey-5 q-pa-lg">
        <q-icon name="group_off" size="36px" class="q-mb-xs" />
        <div class="text-caption">{{ t('adminWork.dashboard.noTeamData') }}</div>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TeamWorkloadItem } from 'src/types/dashboard';

const props = defineProps<{
  teamWorkloads?: TeamWorkloadItem[] | undefined;
}>();

const { t } = useI18n();

const teamList = computed(() => props.teamWorkloads || []);

const maxTeamTotal = computed(() => {
  if (!teamList.value.length) return 10;
  let max = 0;
  for (const team of teamList.value) {
    if (team.totalCount > max) max = team.totalCount;
  }
  return max > 0 ? max : 10;
});

function getBarWidth(count: number, max: number): number {
  if (max === 0) return 0;
  return Math.min(100, Math.round((count / max) * 100));
}
</script>

<style scoped>
.team-workload-card {
  border-radius: 16px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  display: inline-block;
}

.legend-dot-scheduled {
  background-color: #94a3b8;
}

.legend-dot-in-progress {
  background-color: #3b82f6;
}

.legend-dot-pending-approval {
  background-color: #8b5cf6;
}

.legend-dot-completed {
  background-color: #10b981;
}

.quad-progress-bar {
  height: 8px;
  border-radius: 4px;
  background-color: #e2e8f0;
  overflow: hidden;
  display: flex;
  gap: 2px;
}

.bar-scheduled {
  height: 100%;
  background: linear-gradient(90deg, #94a3b8 0%, #64748b 100%);
  border-radius: 4px;
  transition: width 0.4s ease;
}

.bar-in-progress {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 4px;
  transition: width 0.4s ease;
}

.bar-pending-approval {
  height: 100%;
  background: linear-gradient(90deg, #a855f7 0%, #7e22ce 100%);
  border-radius: 4px;
  transition: width 0.4s ease;
}

.bar-completed {
  height: 100%;
  background: linear-gradient(90deg, #22c55e 0%, #15803d 100%);
  border-radius: 4px;
  transition: width 0.4s ease;
}
</style>
