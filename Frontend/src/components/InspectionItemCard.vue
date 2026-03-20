<template>
  <q-card flat bordered class="rounded-borders bg-white q-mb-sm">
    <q-card-section class="q-pb-none">
      <div class="row items-start justify-between">
        <div class="row items-baseline q-gutter-x-xs">
          <div class="text-subtitle1 text-weight-bold text-primary">
            {{ groupedData.roomName }}
          </div>
          <div class="text-body2 text-primary">({{ groupedData.totalItems }} รายการ)</div>
        </div>

        <q-badge outline color="grey-5" class="text-grey-8 q-py-xs q-px-sm rounded-borders">
          ชั้นที่ {{ groupedData.floor }}
        </q-badge>
      </div>
    </q-card-section>

    <q-card-section class="q-py-sm">
      <div class="row items-center justify-between text-caption">
        <div class="text-grey-8">
          {{ groupedData.subRoomName }}
        </div>

        <div class="row items-center q-gutter-x-sm">
          <div class="row items-center text-green">
            <q-icon name="check_circle" size="14px" class="q-mr-xs" />
            <span>ผ่าน</span>
          </div>
          <div class="row items-center text-red">
            <q-icon name="cancel" size="14px" class="q-mr-xs" />
            <span>ไม่ผ่าน</span>
          </div>
        </div>
      </div>
    </q-card-section>

    <q-card-section class="q-pt-none">
      <div class="custom-progress-bar">
        <div
          v-if="groupedData.passCount > 0"
          class="bar-pass"
          :style="{ width: passPercentage + '%' }"
        >
          <span class="text-weight-bold">{{ groupedData.passCount }}</span>
        </div>

        <div
          v-if="groupedData.failCount > 0"
          class="bar-fail"
          :style="{ width: failPercentage + '%' }"
        >
          <span class="text-weight-bold">{{ groupedData.failCount }}</span>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  groupedData: {
    type: Object,
    required: true,
    default: () => ({
      roomName: 'ไม่ระบุ',
      totalItems: 0,
      floor: 1,
      subRoomName: '-',
      passCount: 0,
      failCount: 0,
    }),
  },
});

const passPercentage = computed(() => {
  const total = props.groupedData.passCount + props.groupedData.failCount;
  if (total === 0) return 0;
  return (props.groupedData.passCount / total) * 100;
});

const failPercentage = computed(() => {
  const total = props.groupedData.passCount + props.groupedData.failCount;
  if (total === 0) return 0;
  return (props.groupedData.failCount / total) * 100;
});
</script>

<style scoped>
.rounded-borders {
  border-radius: 8px;
}

.custom-progress-bar {
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 32px;
  background-color: #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
}

.bar-pass {
  background-color: #4caf50;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 12px;
  color: white;
  transition: width 0.3s ease;
}

.bar-fail {
  background-color: #f44336;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 12px;
  color: white;
  transition: width 0.3s ease;
}
</style>
