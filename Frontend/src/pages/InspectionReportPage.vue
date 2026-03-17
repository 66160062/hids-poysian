<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import DirectionReport from '../components/reportcomponents/DirectionReport.vue';
import StructureReport from '../components/reportcomponents/StructureReport.vue';

const router = useRouter();
const $q = useQuasar();

const isMobile = computed(() => $q.screen.lt.md);

const goBack = () => {
  router.back();
};

const categories = ref([
  { title: 'ทิศทางของบ้าน', id: 'direction' },
  { title: 'งานโครงสร้าง', id: 'structure' },
  { title: 'งานประปาและสุขาภิบาล', id: 'plumbing' },
  { title: 'งานระบบไฟฟ้า', id: 'electrical' },
  { title: 'งานอื่นๆ', id: 'others' },
  { title: 'ความสะอาดและความเรียบร้อย', id: 'cleanliness' },
]);
</script>

<template>
  <q-page class="bg-grey-3 row justify-center">
    <div
      class="bg-white relative-position column"
      :style="{
        width: '100%',
        maxWidth: isMobile ? '430px' : '800px',
        minHeight: '100vh',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
      }"
    >
      <div class="row items-center justify-between q-pt-xl q-pb-md q-px-md relative-position" style="margin-top: 20px">
        <div style="width: 40px; z-index: 1">
          <q-icon name="arrow_back_ios_new" size="24px" color="primary" class="cursor-pointer text-weight-bold" @click="goBack" />
        </div>
        <div class="absolute-center text-weight-bold text-dark" style="font-size: 24px; margin-top: 20px">
          สรุปรายงาน
        </div>
        <div style="width: 40px"></div>
      </div>

      <div class="q-px-lg q-pb-xl col column">
        <div class="text-weight-bold q-mb-md" style="font-size: 18px; font-family: 'Inter', sans-serif;">
          0/19
        </div>

        <div class="q-gutter-y-md">
          <q-expansion-item
            v-for="(cat, index) in categories"
            :key="index"
            class="custom-expansion"
            expand-icon-class="text-primary"
            expand-icon="expand_more"
          >
            <template v-slot:header>
              <q-item-section>
                <div class="text-primary text-weight-bold" style="font-family: 'Inter', sans-serif; font-size: 15px;">
                  {{ cat.title }}
                </div>
              </q-item-section>
            </template>

            <q-card>
              <DirectionReport v-if="cat.id === 'direction'" />

              <StructureReport v-else-if="cat.id === 'structure'" />

              <q-card-section v-else class="text-grey-7" style="font-family: 'Inter', sans-serif; font-size: 14px;">
                ไม่มีข้อมูลของหมวดหมู่ {{ cat.title }} ในขณะนี้
              </q-card-section>
            </q-card>

          </q-expansion-item>
        </div>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.custom-expansion {
  border: 1px solid #1975d2;
  border-radius: 8px;
  background-color: white;
}
</style>
