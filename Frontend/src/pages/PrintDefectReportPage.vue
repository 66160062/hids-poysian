<template>
  <div :data-report-ready="ready ? 'true' : 'false'">
    <DefectReport
      v-if="round"
      :round="round"
      :defects="defects"
      :summaryItems="summaryItems"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { api } from 'src/boot/axios';
import type { InspectionRound, Defect, InspectionSummaryItem } from 'src/models';
import DefectReport from 'src/components/DefectReport.vue';

// หน้านี้ไม่มี UI สำหรับผู้ใช้ทั่วไป — Puppeteer (backend/src/reports/reports.service.ts) เปิดหน้านี้
// headless แล้วรอ [data-report-ready="true"] ก่อน snapshot เป็น PDF, mount DefectReport.vue ตัวจริง
// เพื่อให้หน้าตาตรงกับตอนกด export ผ่าน window.print() แบบเดิมเป๊ะๆ

const route = useRoute();
const roundId = route.params.roundId as string;

const round = ref<InspectionRound | null>(null);
const defects = ref<Defect[]>([]);
const summaryItems = ref<InspectionSummaryItem[]>([]);
const ready = ref(false);

async function waitForImages() {
  const imgs = Array.from(document.querySelectorAll('img'));
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve());
            img.addEventListener('error', () => resolve());
          }),
    ),
  );
}

onMounted(async () => {
  const [roundRes, defectsRes, summaryRes] = await Promise.all([
    api.get(`/inspection-rounds/${roundId}`),
    api.get(`/defects/round/${roundId}`),
    api.get(`/inspection-summary-items/round/${roundId}`),
  ]);
  round.value = roundRes.data as InspectionRound;
  defects.value = defectsRes.data as Defect[];
  summaryItems.value = summaryRes.data as InspectionSummaryItem[];

  await nextTick();
  await waitForImages();
  ready.value = true;
});
</script>
