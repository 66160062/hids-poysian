<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const selectedDirection = ref<string | null>(null);

const directions = [
  'ทิศเหนือ',
  'ทิศตะวันออกเฉียงเหนือ',
  'ทิศตะวันออก',
  'ทิศตะวันออกเฉียงใต้',
  'ทิศใต้',
  'ทิศตะวันตกเฉียงใต้',
  'ทิศตะวันตก',
  'ทิศตะวันตกเฉียงเหนือ',
];

const saveDirection = () => {
  if (selectedDirection.value) {
    $q.notify({
      type: 'positive',
      message: `บันทึกข้อมูล: ${selectedDirection.value}`,
      position: 'top'
    });
  } else {
    $q.notify({
      type: 'warning',
      message: 'กรุณาเลือกทิศทางก่อนบันทึก',
      position: 'top'
    });
  }
};
</script>

<template>
  <q-card-section class="q-pt-sm q-pb-lg">
    <q-separator color="primary" style="opacity: 0.5; height: 1px;" class="q-mb-md" />

    <div class="text-grey-5 q-mb-md" style="font-family: 'Inter', sans-serif; font-size: 12px;">
      กรุณาระบุทิศทางของบ้าน
    </div>

    <div class="column q-gutter-y-sm">
      <div
        v-for="dir in directions"
        :key="dir"
        class="row justify-between items-center cursor-pointer direction-option"
        :class="selectedDirection === dir ? 'bg-blue-1' : 'bg-white'"
        @click="selectedDirection = dir"
      >
        <div class="text-primary text-weight-bold" style="font-family: 'Inter', sans-serif; font-size: 13px;">
          {{ dir }}
        </div>
        <q-icon
          :name="selectedDirection === dir ? 'radio_button_checked' : 'radio_button_unchecked'"
          color="primary"
          size="20px"
        />
      </div>
    </div>

    <div class="row justify-center q-mt-lg">
      <q-btn
        unelevated
        color="primary"
        label="บันทึก"
        class="save-btn"
        no-caps
        @click="saveDirection"
      />
    </div>
  </q-card-section>
</template>

<style scoped>
.direction-option {
  border: 1px solid #1975d2;
  border-radius: 20px;
  padding: 10px 16px;
  transition: all 0.2s ease;
}

.save-btn {
  border-radius: 20px;
  width: 120px;
  height: 36px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 14px;
}
</style>
