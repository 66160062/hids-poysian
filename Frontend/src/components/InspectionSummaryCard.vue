<template>
  <q-card flat bordered class="rounded-borders bg-white">
    <q-card-section class="q-pb-sm">
      <div class="row text-center">
        <div class="col">
          <div class="text-caption text-grey-7">จำนวนห้องทั้งหมด</div>
          <div class="text-h6 text-primary text-weight-bold">{{ data.totalRooms }}</div>
        </div>

        <div class="col">
          <div class="text-caption text-grey-7">ประเภทงานทั้งหมด</div>
          <div class="text-h6 text-primary text-weight-bold">{{ data.totalJobs }}</div>
        </div>

        <div class="col">
          <div class="text-caption text-grey-7">รายการทั้งหมด</div>
          <div class="text-h6 text-primary text-weight-bold">{{ data.totalItems }}</div>
        </div>
      </div>
    </q-card-section>

    <q-separator color="grey-3" inset />

    <q-card-section class="q-pt-sm">
      <div class="row text-center items-center justify-center text-subtitle2">
        <div class="col row items-center justify-center text-green">
          <q-icon name="check_circle" size="sm" class="q-mr-xs" />
          <span>ผ่าน </span>
          <span class="q-ml-sm text-weight-bold text-h6">{{ data.pass }}</span>
        </div>

        <div class="col row items-center justify-center text-red">
          <q-icon name="cancel" size="sm" class="q-mr-xs" />
          <span>ไม่ผ่าน </span>
          <span class="q-ml-sm text-weight-bold text-h6">{{ data.fail }}</span>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({
      totalRooms: 0,
      totalJobs: 0,
      totalItems: 0,
      pass: 0,
      fail: 0,
    }),
  },
});
</script>

<style scoped>
.rounded-borders {
  border-radius: 12px;
}
</style>
