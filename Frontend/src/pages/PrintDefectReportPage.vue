<template>
  <div
    :data-report-ready="ready ? 'true' : 'false'"
    :data-report-error="loadError || undefined"
  >
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
import { useI18n } from 'vue-i18n';
import { api } from 'src/boot/axios';
import type { InspectionRound, Defect, InspectionSummaryItem } from 'src/models';
import { isSupportedLocale } from 'src/boot/i18n';
import DefectReport from 'src/components/DefectReport.vue';

// หน้านี้ไม่มี UI สำหรับผู้ใช้ทั่วไป — Puppeteer (backend/src/reports/reports.service.ts) เปิดหน้านี้
// headless แล้วรอ [data-report-ready="true"] ก่อน snapshot เป็น PDF, mount DefectReport.vue ตัวจริง
// เพื่อให้หน้าตาตรงกับตอนกด export ผ่าน window.print() แบบเดิมเป๊ะๆ
//
// headless browser ของ Puppeteer ไม่มี localStorage เดิม (เห็นแค่ token ที่ backend ฉีดให้) เลยอ่าน
// locale จาก ?lang= query แทน — override ทับค่า default ก่อน mount DefectReport เพื่อให้ PDF ออกมา
// เป็นภาษาที่ backend ขอ (ดู renderReportPdf ใน reports.service.ts)
const { locale } = useI18n({ useScope: 'global' });
const route = useRoute();
const roundId = route.params.roundId as string;
const requestedLang = route.query.lang;
if (typeof requestedLang === 'string' && isSupportedLocale(requestedLang)) {
  locale.value = requestedLang;
}

const round = ref<InspectionRound | null>(null);
const defects = ref<Defect[]>([]);
const summaryItems = ref<InspectionSummaryItem[]>([]);
const ready = ref(false);
const loadError = ref('');

// รอรูปโหลดครบก่อนให้ Puppeteer จับภาพ แต่ต้องมีเพดานต่อใบ — รูปที่ค้างไม่ยิงทั้ง load และ error
// (เช่น endpoint รูปย่อไม่ตอบ) จะทำให้หน้านี้ไม่มีวันพร้อม แล้ว backend ไปรอจนครบ timeout
// โดยไม่รู้สาเหตุ ปล่อยให้ใบที่ค้างเป็นรูปเสียดีกว่าทำให้ทั้งเล่มสร้างไม่ได้
const IMAGE_TIMEOUT_MS = 15000;

async function waitForImages() {
  const imgs = Array.from(document.querySelectorAll('img'));
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            const done = () => resolve();
            img.addEventListener('load', done);
            img.addEventListener('error', done);
            setTimeout(done, IMAGE_TIMEOUT_MS);
          }),
    ),
  );
}

onMounted(async () => {
  try {
    const [roundRes, defectsRes, summaryRes] = await Promise.all([
      api.get(`/inspection-rounds/${roundId}`),
      api.get(`/defects/round/${roundId}`),
      api.get(`/inspection-summary-items/round/${roundId}`),
    ]);
    const roundData = roundRes.data as InspectionRound;
    // เวลาที่ประทับในเล่มส่งมาทาง query โดย backend (ดู renderReportPdf ใน reports.service.ts) แทนที่จะ
    // อ่านจาก DB เพราะตอน render ค่ายังไม่ถูกเซฟ (backend เซฟหลัง render สำเร็จเท่านั้น เพื่อไม่ให้ไฟล์เก่า
    // ติดป้ายเวลาใหม่เวลา render พัง) และคอลัมน์ใน DB ยังแยกไทย/อังกฤษ ขณะที่ DefectReport.vue อ่านฝั่งไทยตัวเดียว
    const stampedAt = route.query.generatedAt;
    if (typeof stampedAt === 'string' && stampedAt) {
      roundData.lastPdfGeneratedAt = stampedAt;
    }
    round.value = roundData;
    defects.value = defectsRes.data as Defect[];
    summaryItems.value = summaryRes.data as InspectionSummaryItem[];

    await nextTick();
    await waitForImages();
    ready.value = true;
  } catch (error) {
    // บอก Puppeteer ว่าพังเพราะอะไร ผ่าน attribute บน DOM — ไม่งั้น backend จะได้แค่
    // "รอ selector ไม่เจอ" ตอนครบ 120 วิ ซึ่งไล่ต้นเหตุต่อไม่ได้เลย (ดู renderReportPdf)
    loadError.value =
      error instanceof Error ? error.message : 'unknown error';
  }
});
</script>
