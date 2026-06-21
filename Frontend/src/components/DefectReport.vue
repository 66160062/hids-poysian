<template>
  <div style="overflow: hidden; width: 100%">
    <div
      ref="reportRef"
      class="pdf-wrapper"
      :style="`transform: scale(${pageScale}); transform-origin: top left; width: 794px;`"
    >
      <!-- หน้า 1: ข้อมูล -->
      <div class="pdf-page">
        <div class="row justify-between items-center q-px-md q-pt-sm q-pb-xs header-line">
          <div class="text-caption text-grey-7">
            {{ round.job.projectName }}, ครั้งที่ {{ round.roundNumber }},
            {{ formatDate(round.scheduledDate) }}
          </div>
          <div class="text-caption text-grey-7">หน้า | 1 / {{ totalPages }}</div>
        </div>

        <div class="row justify-center q-py-sm">
          <img loading="eager" :src="PoysianLogo" style="height: 100px; object-fit: contain" />
        </div>

        <div class="row justify-center q-mb-md">
          <img
            loading="eager"
            :src="
              round.job.projectImageUrl
                ? `${apiUrl}${round.job.projectImageUrl}`
                : 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600'
            "
            style="
              width: 95%;
              max-height: 200px;
              object-fit: cover;
              border-radius: 8px;
              margin-bottom: 16px;
            "
          />
        </div>

        <div class="row q-col-gutter-md q-px-md q-mb-md">
          <div class="col-6">
            <div class="section-title q-mb-xs">1. ข้อมูลโครงการ</div>
            <div class="info-box q-pa-sm">
              <div class="row q-mb-xs">
                <div class="col-6">
                  <div class="text-caption text-grey-7">ชื่อโครงการ TH</div>
                  <div class="text-caption text-bold">{{ round.job.projectName }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">จังหวัด</div>
                  <div class="text-caption text-bold">{{ round.job.address?.province }}</div>
                </div>
              </div>
              <div class="row q-mb-xs">
                <div class="col-6">
                  <div class="text-caption text-grey-7">เขต/อำเภอ</div>
                  <div class="text-caption text-bold">{{ round.job.address?.district }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">แขวง/ตำบล</div>
                  <div class="text-caption text-bold">{{ round.job.address?.subDistrict }}</div>
                </div>
              </div>
              <div class="row">
                <div class="col-6">
                  <div class="text-caption text-grey-7">ประเภท</div>
                  <div class="text-caption text-bold">
                    {{ round.job.houseType?.name }} {{ round.job.address?.floor }} ชั้น
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">พื้นที่</div>
                  <div class="text-caption text-bold">{{ round.job.usableArea }} ตร.ม.</div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-6">
            <div class="section-title q-mb-xs">2. ข้อมูลลูกค้า</div>
            <div class="info-box q-pa-sm">
              <div class="row q-mb-xs">
                <div class="col-6">
                  <div class="text-caption text-grey-7">ชื่อลูกค้า</div>
                  <div class="text-caption text-bold">{{ round.job.customer?.fullName }}</div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">เบอร์โทรศัพท์</div>
                  <div class="text-caption text-bold">{{ round.job.customer?.phoneNumber }}</div>
                </div>
              </div>
              <div class="text-caption text-grey-7">อีเมล</div>
              <div class="text-caption text-description-header text-bold">
                {{ round.job.customer.email }}
              </div>
              <div class="row q-mt-xs">
                <div class="col-6">
                  <div class="text-caption text-grey-7">ผู้ประสานงาน</div>
                  <div class="text-caption text-bold">
                    {{ round.teamMember?.inspector?.team?.teamName || '-' }}
                  </div>
                </div>
                <div class="col-6">
                  <div class="text-caption text-grey-7">เบอร์ผู้ประสานงาน</div>
                  <div class="text-caption text-bold">
                    {{ round.teamMember?.inspector?.team?.contactInfo || '-' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row q-col-gutter-sm q-px-md q-mb-md">
          <div v-for="stat in summaryStats" :key="stat.label" class="col-2">
            <div class="text-center q-pa-sm stat-card">
              <div class="text-caption" style="font-size: 10px">
                {{ stat.label }}
              </div>
              <div :class="`text-h6 text-bold ${stat.color}`">{{ stat.value }}</div>
              <div class="text-caption" style="font-size: 10px">รายการ</div>
            </div>
          </div>
        </div>
        <div class="pdf-footer">
          <span>© 2026, POYSIAN</span>
          <div class="footer-contacts">
            <img loading="eager" :src="LineLogo" style="height: 16px" />
            <span>@poysian,</span>
            <img loading="eager" :src="FacebookLogo" style="height: 16px" />
            <span>Poysian รับตรวจบ้าน ตรวจคอนโด,</span>
            <img loading="eager" :src="CallLogo" style="height: 16px" />
            <span>098-765-4321,</span>
            <img loading="eager" :src="GmailLogo" style="height: 12px" />
            <span>poysian@gmail.com</span>
          </div>
        </div>
      </div>

      <!-- หน้า Major Defects -->
      <div v-for="(chunk, pageIndex) in majorChunks" :key="`major-${pageIndex}`" class="pdf-page">
        <div class="row justify-between items-center q-px-md q-pt-sm q-pb-xs header-line">
          <div class="text-caption text-grey-7">
            {{ round.job.projectName }}, ครั้งที่ {{ round.roundNumber }},
            {{ formatDate(round.scheduledDate) }}
          </div>
          <div class="text-caption text-grey-7">หน้า | {{ pageIndex + 2 }} / {{ totalPages }}</div>
        </div>

        <div class="text-center text-bold q-py-sm" style="font-size: 16px; color: #ef4444">
          Main Defects
        </div>

        <div class="defects-grid">
          <div v-for="defect in chunk" :key="defect.defectId" class="defect-card">
            <div class="badge-id">#{{ defect.defectId }}</div>
            <div class="badge-main" style="background: #ef4444">{{ defect.severity }}</div>
            <img loading="eager" :src="defect.imageUrl ? `${apiUrl}${defect.imageUrl}` : 'https://via.placeholder.com/400x300?text=No+Image'" class="defect-img" />
            <div class="card-body">
              <div class="room-title">{{ getRoomShortName(defect) }}</div>
              <div class="info-row">
                <span class="label">ประเภทงาน:</span>
                {{ defect.subCategories?.[0]?.category?.name }}
              </div>
              <div class="info-row">
                <span class="label">รายการ:</span>
                {{ defect.subCategories?.map((s) => s.name).join(', ') }}
              </div>
              <div class="info-row">
                <span class="label">หมายเหตุ:</span> {{ defect.description }}
              </div>
              <div class="info-row">
                <span class="label">สถานะ:</span>
                {{
                  defect.status === 'PENDING_REPAIR'
                    ? 'กำลังรอซ่อม'
                    : defect.status === 'REJECTED'
                      ? 'ซ่อมไม่ผ่าน'
                      : defect.status === 'CLOSED'
                        ? 'ซ่อมผ่านแล้ว'
                        : defect.status
                }}
              </div>
              <img loading="eager" :src="PoysianLogo" class="card-logo-watermark-img" />
            </div>
          </div>
        </div>
        <div class="pdf-footer">
          <span>© 2026, POYSIAN</span>
          <div class="footer-contacts">
            <img loading="eager" :src="LineLogo" style="height: 16px" />
            <span>@poysian,</span>
            <img loading="eager" :src="FacebookLogo" style="height: 16px" />
            <span>Poysian รับตรวจบ้าน ตรวจคอนโด,</span>
            <img loading="eager" :src="CallLogo" style="height: 16px" />
            <span>098-765-4321,</span>
            <img loading="eager" :src="GmailLogo" style="height: 12px" />
            <span>poysian@gmail.com</span>
          </div>
        </div>
      </div>

      <!-- หน้า All Defects -->
      <div v-for="(page, pageIndex) in allDefectChunks" :key="`all-${pageIndex}`" class="pdf-page">
        <div class="row justify-between items-center q-px-md q-pt-sm q-pb-xs header-line">
          <div class="text-caption text-grey-7">
            {{ round.job.projectName }}, ครั้งที่ {{ round.roundNumber }},
            {{ formatDate(round.scheduledDate) }}
          </div>
          <div class="text-caption text-grey-7">
            หน้า | {{ 1 + majorChunks.length + pageIndex + 1 }} / {{ totalPages }}
          </div>
        </div>

        <div class="text-center text-bold q-py-sm" style="font-size: 16px; color: #1976d2">
          Defect List
        </div>

        <div v-for="group in page" :key="group.roomName" class="q-mb-sm">
          <div
            class="text-center text-bold q-py-xs q-mb-sm"
            style="background: #e3f2fd; border-radius: 8px; font-size: 13px"
          >
            {{ group.roomName }}
          </div>
          <div class="defects-grid">
            <div v-for="defect in group.defects" :key="defect.defectId" class="defect-card">
              <div class="badge-id">#{{ defect.defectId }}</div>
              <div
                class="badge-main"
                :style="defect.severity === 'MAJOR' ? 'background: #ef4444' : 'background: #fb8c00'"
              >
                {{ defect.severity }}
              </div>
              <img loading="eager" :src="defect.imageUrl ? `${apiUrl}${defect.imageUrl}` : 'https://via.placeholder.com/400x300?text=No+Image'" class="defect-img" />
              <div class="card-body">
                <div class="info-row">
                  <span class="label">ประเภทงาน:</span>
                  {{ defect.subCategories?.[0]?.category?.name }}
                </div>
                <div class="info-row">
                  <span class="label">รายการ:</span>
                  {{ defect.subCategories?.map((s) => s.name).join(', ') }}
                </div>
                <div class="info-row">
                  <span class="label">หมายเหตุ:</span> {{ defect.description }}
                </div>
                <div class="info-row">
                  <span class="label">สถานะ:</span>
                  {{ defect.status === 'PENDING_REPAIR' ? 'กำลังรอซ่อม' : defect.status }}
                </div>
                <img loading="eager" :src="PoysianLogo" class="card-logo-watermark-img" />
              </div>
            </div>
          </div>
        </div>

        <!-- ลายเซ็นหน้าสุดท้าย -->
        <!-- <div v-if="pageIndex === allDefectChunks.length - 1" class="row q-mt-auto q-pb-lg">
          <div class="col-6 text-center">
            <div class="signature-line">
              <div class="text-caption">ลายเซ็นผู้ตรวจ</div>
              <div class="text-caption text-grey-7">
                {{ round.teamMember?.inspector?.team?.teamName }}
              </div>
            </div>
          </div>
          <div class="col-6 text-center">
            <div class="signature-line">
              <div class="text-caption">ลายเซ็นลูกค้า</div>
              <div class="text-caption text-grey-7">{{ round.job.customer?.fullName }}</div>
            </div>
          </div>
        </div> -->
        <div class="pdf-footer">
          <span>© 2026, POYSIAN</span>
          <div class="footer-contacts">
            <img loading="eager" :src="LineLogo" style="height: 16px" />
            <span>@poysian,</span>
            <img loading="eager" :src="FacebookLogo" style="height: 16px" />
            <span>Poysian รับตรวจบ้าน ตรวจคอนโด,</span>
            <img loading="eager" :src="CallLogo" style="height: 16px" />
            <span>098-765-4321,</span>
            <img loading="eager" :src="GmailLogo" style="height: 12px" />
            <span>poysian@gmail.com</span>
          </div>
        </div>
      </div>
      <!-- หน้า Summary -->
      <div
        v-for="(categoryGroup, pageIndex) in summaryChunks"
        :key="`summary-${pageIndex}`"
        class="pdf-page"
      >
        <div class="row justify-between items-center q-px-md q-pt-sm q-pb-xs header-line">
          <div class="text-caption text-grey-7">
            {{ round.job.projectName }}, ครั้งที่ {{ round.roundNumber }},
            {{ formatDate(round.scheduledDate) }}
          </div>
          <div class="text-caption text-grey-7">
            หน้า | {{ 1 + majorChunks.length + allDefectChunks.length + pageIndex + 1 }} /
            {{ totalPages }}
          </div>
        </div>

        <div class="text-center text-bold q-py-sm" style="font-size: 16px; color: #1976d2">
          สรุปผลการตรวจ
        </div>

        <div v-for="(labelGroup, category) in categoryGroup" :key="category" class="q-mb-sm">
          <div
            class="text-center text-bold q-py-xs"
            style="
              background: #1976d2;
              color: white;
              border-radius: 4px;
              font-size: 13px;
              margin-bottom: 8px;
            "
          >
            {{ category }}
          </div>

          <div
            v-for="(items, label) in labelGroup"
            :key="label"
            class="q-mb-xs"
            style="border-bottom: 1px solid #eee; padding-bottom: 4px"
          >
            <div class="text-caption text-weight-bold">{{ label }}</div>
            <div v-for="item in items" :key="item.itemId">
              <div class="text-caption text-grey-8">• {{ item.option?.value ?? '-' }}</div>
              <div v-if="item.detailValue" class="text-caption text-grey-7">
                <span class="label">รายละเอียด:</span> {{ item.detailValue }}
              </div>
            </div>
          </div>
        </div>
        <div class="pdf-footer">
          <span>© 2026, POYSIAN</span>
          <div class="footer-contacts">
            <img loading="eager" :src="LineLogo" style="height: 16px" />
            <span>@poysian,</span>
            <img loading="eager" :src="FacebookLogo" style="height: 16px" />
            <span>Poysian รับตรวจบ้าน ตรวจคอนโด,</span>
            <img loading="eager" :src="CallLogo" style="height: 16px" />
            <span>098-765-4321,</span>
            <img loading="eager" :src="GmailLogo" style="height: 12px" />
            <span>poysian@gmail.com</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { InspectionRound, Defect, InspectionSummaryItem } from 'src/models';
import PoysianLogo from 'src/assets/Logos/Poysian.png';
import LineLogo from 'src/assets/Logos/LINE.png';
import FacebookLogo from 'src/assets/Logos/Facebook.png';
import CallLogo from 'src/assets/Logos/Call.png';
import GmailLogo from 'src/assets/Logos/Gmail.png';
const apiUrl = import.meta.env.VITE_API_URL;

const props = defineProps<{
  round: InspectionRound;
  defects: Defect[];
  summaryItems: InspectionSummaryItem[];
}>();

const pageScale = ref(1);
onMounted(() => {
  const pageWidthPx = 794; // 210mm ≈ 794px
  const screenWidth = window.innerWidth - 32;
  pageScale.value = Math.min(1, screenWidth / pageWidthPx);
});

const reportRef = ref<HTMLElement | null>(null);

const summaryStats = computed(() => [
  { label: 'Total Defects', value: props.defects.length, color: 'text-primary' },
  {
    label: 'Major',
    value: props.defects.filter((d) => d.severity === 'Major').length,
    color: 'text-negative',
  },
  {
    label: 'Minor',
    value: props.defects.filter((d) => d.severity === 'Minor').length,
    color: 'text-amber',
  },
  {
    label: 'กำลังรอซ่อม',
    value: props.defects.filter((d) => d.status === 'PENDING_REPAIR').length,
    color: 'text-orange',
  },
  {
    label: 'ซ่อมไม่ผ่าน',
    value: props.defects.filter((d) => d.status === 'REJECTED').length,
    color: 'text-negative',
  },
  {
    label: 'ซ่อมผ่านแล้ว',
    value: props.defects.filter((d) => d.status === 'CLOSED').length,
    color: 'text-positive',
  },
]);

const majorDefects = computed(() => props.defects.filter((d) => d.severity === 'Major'));

const majorChunks = computed(() => {
  const chunks: Defect[][] = [];
  for (let i = 0; i < majorDefects.value.length; i += 6) {
    chunks.push(majorDefects.value.slice(i, i + 6));
  }
  return chunks;
});

const allDefectGroups = computed(() => {
  const groups: Record<string, Defect[]> = {};
  props.defects.forEach((defect) => {
    const key = `${defect.room?.roomName ?? '-'}, ${defect.subRoom?.roomName ?? '-'}, ${defect.floor?.label}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(defect);
  });
  return groups;
});

const allDefectChunks = computed(() => {
  const pages: { roomName: string; defects: Defect[] }[][] = [];

  Object.entries(allDefectGroups.value).forEach(([roomName, defects]) => {
    for (let i = 0; i < defects.length; i += 6) {
      const chunk = defects.slice(i, i + 6);
      pages.push([{ roomName, defects: chunk }]);
    }
  });

  return pages;
});

// const totalPages = computed(() => 1 + majorChunks.value.length + allDefectChunks.value.length);
const totalPages = computed(
  () => 1 + majorChunks.value.length + allDefectChunks.value.length + summaryChunks.value.length,
);

function getRoomShortName(defect: Defect) {
  return `${defect.room?.roomName ?? '-'}, ${defect.subRoom?.roomName ?? '-'}, ${defect.floor?.label ?? '-'}`;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function exportPdf() {
  if (!reportRef.value) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const allStyles = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((r) => r.cssText)
          .join('');
      } catch {
        return '';
      }
    })
    .join('');

  const html = `
    <html>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;700&display=swap">
        <style>
          ${allStyles}
          /* --- เพิ่มจุดที่ 1: บังคับให้พิมพ์สีพื้นหลัง (แก้ปัญหาสีหาย) --- */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body { margin: 0; padding: 0; font-family: 'Sarabun', sans-serif !important; background: #ccc; }
          .pdf-wrapper { background: #ccc; padding: 0; }

          /* --- เพิ่มจุดที่ 2: แก้ไขความสูงหน้ากระดาษ (แก้ปัญหาหน้ายาวว่างเปล่า) --- */
          .pdf-page {
            width: 210mm;
            min-height: 297mm; /* ใช้ min-height เพื่อให้หดได้ถ้าเนื้อหาน้อย */
            padding: 10mm;
            margin: 10mm auto;
            background: white;
            display: flex;
            flex-direction: column;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
            page-break-after: always;
            position: relative;
          }

          @media print {
            body { background: none; }
            .pdf-page {
              margin: 0;
              box-shadow: none;
              height: 297mm; /* ตอนพิมพ์จริงค่อยล็อคให้เต็มหน้า A4 */
            }
            @page { size: A4; margin: 0; }
          }
          /* -------------------------------------------------- */

          .defects-grid { display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr); gap: 10px; flex: 1; }
          .defect-card { display: flex; flex-direction: column; border: 1px solid #f48fb1; border-radius: 8px; background: #fff5f7; position: relative; overflow: hidden; height: 100mm; }
          .defect-img { width: 100%; height: 55mm; object-fit: cover; }
          .badge-id { position: absolute; top: 5px; left: 5px; background: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; border: 1px solid #ddd; z-index: 10; }
          .badge-main { position: absolute; top: 5px; right: 5px; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; z-index: 10; }
          .card-body { padding: 8px; font-size: 11px; position: relative; flex: 1; overflow: visible; }
          .room-title { font-weight: bold; text-align: center; margin-bottom: 5px; border-bottom: 1px solid #fecaca; }
          .header-line { border-bottom: 1px solid #ccc; margin-bottom: 8px; }
          .section-title { border-left: 4px solid #1976d2; padding-left: 8px; font-weight: bold; font-size: 12px; }
          .info-box { border: 1px solid #e0e0e0; border-radius: 4px; background: #fafafa; min-height: 85px; padding: 8px; }
          .label { font-weight: bold; }
          .info-row { margin-bottom: 2px; font-size: 10px; }
          .card-logo-watermark-img { position: absolute; bottom: 0px; right: 10px; opacity: 0.3; width: 60px; object-fit: contain; }
          .pdf-footer { border-top: 1px solid #ccc; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #555; margin-top: auto; }
          .footer-contacts { display: flex; align-items: center; gap: 6px; font-size: 10px; }
        </style>
      </head>
      <body>
        ${reportRef.value.innerHTML}
      </body>
    </html>`;

  const script =
    '<script>window.onload = () => { setTimeout(() => window.print(), 1000); }</s' + 'cript>';
  const finalHtml = html.replace('</body>', script + '</body>');

  printWindow.document.open();
  printWindow.document.write(finalHtml);
  printWindow.document.close();
}

defineExpose({ exportPdf });

const summaryGroups = computed(() => {
  const groups: Record<string, Record<string, InspectionSummaryItem[]>> = {};
  props.summaryItems.forEach((item) => {
    const cat = item.template.category;
    const label = item.template.label;
    if (!groups[cat]) groups[cat] = {};
    if (!groups[cat][label]) groups[cat][label] = [];
    groups[cat][label].push(item);
  });
  return groups;
});

const summaryChunks = computed(() => {
  const chunks: Record<string, Record<string, InspectionSummaryItem[]>>[] = [];
  const entries = Object.entries(summaryGroups.value);
  for (let i = 0; i < entries.length; i += 3) {
    const chunk = Object.fromEntries(entries.slice(i, i + 3));
    chunks.push(chunk);
  }
  return chunks;
});
</script>

<style scoped>
.pdf-wrapper {
  background: #eee;
  padding: 20px 0;
  transform-origin: top left;
}
.pdf-page {
  width: 210mm;
  height: 297mm;
  background: white;
  margin: 0 auto 20px auto;
  padding: 10mm;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}
.header-line {
  border-bottom: 1px solid #ccc;
  margin-bottom: 8px;
}
.section-title {
  border-left: 4px solid #1976d2;
  padding-left: 8px;
  font-weight: bold;
  font-size: 12px;
}
.info-box {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: #fafafa;
  min-height: 85px;
}
.stat-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}
.defects-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 10px;
  flex: 1;
}
.defect-card {
  display: flex;
  flex-direction: column;
  border: 1px solid #f48fb1;
  border-radius: 8px;
  background: #fff5f7;
  position: relative;
  overflow: hidden;
  height: 100mm; /* ลดลงมา */
}
.defect-img {
  width: 100%;
  height: 55mm; /* ลดลงตาม */
  object-fit: cover;
}
.badge-id {
  position: absolute;
  top: 6px;
  left: 6px;
  background: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  border: 1px solid #ddd;
  z-index: 10;
}
.badge-main {
  position: absolute;
  top: 6px;
  right: 6px;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  z-index: 10;
}
.card-body {
  padding: 8px;
  font-size: 11px;
  position: relative;
  flex: 1;
  overflow: visible;
}
.room-title {
  font-weight: bold;
  text-align: center;
  margin-bottom: 5px;
  border-bottom: 1px solid #fecaca;
}
.signature-line {
  border-top: 1px solid #000;
  margin: 0 40px;
  padding-top: 4px;
}
.card-logo-watermark {
  position: absolute;
  bottom: 5px;
  right: 8px;
  opacity: 0.2;
  font-weight: bold;
  font-size: 14px;
  color: #1976d2;
}
.info-row {
  margin-bottom: 2px;
  font-size: 10px;
}
.label {
  font-weight: bold;
}
.text-description-header {
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-logo-watermark-img {
  position: absolute;
  bottom: 0px;
  right: 10px;
  opacity: 0.3;
  width: 60px;
  object-fit: contain;
}

.pdf-footer {
  border-top: 1px solid #ccc;
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  color: #555;
  margin-top: auto;
}

.footer-contacts {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
}

.page-content {
  flex: 1;
}
</style>
