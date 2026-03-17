<script setup lang="ts">
import { useQuasar } from 'quasar';

const $q = useQuasar();

// รายการย่อยในหมวดงานโครงสร้าง
const structureItems = [
  'โครงสร้างของบ้าน',
  'ลานซักล้าง',
  'ฐานราก',
  'โครงสร้างของหลังคา',
  'บันได,ราวบันได'
];

const goToDetail = (item: string) => {
  $q.notify({
    type: 'info',
    message: `กำลังไปหน้า: ${item}`,
    position: 'top',
    timeout: 1000
  });
};
</script>

<template>
  <q-card-section class="q-pt-sm q-pb-md">
    <q-separator color="primary" style="opacity: 0.5; height: 1px;" class="q-mb-md" />

    <div class="column q-gutter-y-md">
      <div
        v-for="(item, index) in structureItems"
        :key="index"
        class="row items-center justify-between cursor-pointer item-row"
        @click="goToDetail(item)"
      >
        <div class="text-grey-7 text-weight-medium" style="font-family: 'Inter', sans-serif; font-size: 14px;">
          {{ item }}
        </div>

        <div class="circle-icon outline-circle text-primary flex flex-center">
          <q-icon name="chevron_right" size="18px" />
        </div>
      </div>
    </div>
  </q-card-section>
</template>

<style scoped>
.circle-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
}

.outline-circle {
  border: 1.5px solid #1975d2;
}

.item-row {
  padding: 4px 0;
  transition: opacity 0.2s ease;
}

.item-row:active {
  opacity: 0.5;
}
</style>
