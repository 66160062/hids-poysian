<script setup lang="ts">
import { ref } from 'vue';
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


const showBottomSheet = ref(false);
const currentItem = ref('');

const formData = ref({
  types: [],
  detail: ''
});

const openBottomSheet = (item: string) => {
  currentItem.value = item;

  formData.value = { types: [], detail: '' };

  showBottomSheet.value = true;
};

const saveForm = () => {
  $q.notify({
    type: 'positive',
    message: `บันทึกข้อมูล ${currentItem.value} สำเร็จ`,
    position: 'top'
  });
  showBottomSheet.value = false; 
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
        @click="openBottomSheet(item)"
      >
        <div class="text-grey-7 text-weight-medium" style="font-family: 'Inter', sans-serif; font-size: 14px;">
          {{ item }}
        </div>
        <div class="circle-icon outline-circle text-primary flex flex-center">
          <q-icon name="chevron_right" size="18px" />
        </div>
      </div>
    </div>

    <q-dialog v-model="showBottomSheet" position="bottom">
      <q-card class="bottom-sheet-card">

        <q-card-section class="row items-center justify-between q-pb-sm">
          <div class="text-primary text-weight-bold" style="font-family: 'Inter', sans-serif; font-size: 18px;">
            {{ currentItem }}
          </div>
          <q-btn icon="close" flat round dense color="grey-6" v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none">

          <div v-if="currentItem === 'โครงสร้างของบ้าน'">
            <div class="q-mb-xs text-dark" style="font-family: 'Inter', sans-serif; font-size: 14px;">
              รูปแบบโครงสร้าง
            </div>
            <q-checkbox
              v-model="formData.types"
              val="ผนังก่ออิฐฉาบปูน"
              label="ผนังก่ออิฐฉาบปูน"
              color="primary"
              class="text-grey-7 q-mb-sm custom-font"
            />

            <div class="q-mb-xs q-mt-sm text-dark" style="font-family: 'Inter', sans-serif; font-size: 14px;">
              รายละเอียด
            </div>
            <q-radio
              v-model="formData.detail"
              val="no_issue"
              label="ไม่พบปัญหาทางด้านโครงสร้าง"
              color="primary"
              class="text-grey-7 custom-font"
            />
          </div>

          <div v-else class="text-center text-grey-5 q-py-xl" style="font-family: 'Inter', sans-serif;">
            ฟอร์มสำหรับ {{ currentItem }}
          </div>

          <div class="q-mt-xl q-mb-md">
            <q-btn
              unelevated
              color="primary"
              label="บันทึก"
              class="full-width save-btn"
              no-caps
              @click="saveForm"
            />
          </div>

        </q-card-section>
      </q-card>
    </q-dialog>

  </q-card-section>
</template>

<style scoped>
/* แต่งวงกลมลูกศร */
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


.bottom-sheet-card {
  width: 100%;
  max-width: 430px;
  border-radius: 20px 20px 0 0;
  padding-bottom: 10px;
}

.save-btn {
  border-radius: 8px;
  height: 44px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 15px;
}

/* บังคับฟอนต์ให้ Checkbox / Radio ของ Quasar */
:deep(.custom-font .q-checkbox__label),
:deep(.custom-font .q-radio__label) {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
}
</style>
